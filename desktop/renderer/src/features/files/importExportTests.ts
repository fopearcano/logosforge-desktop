/**
 * Import/Export format tests. Pure — no Electron/DOM/network. Runs headlessly
 * (esbuild + node): `npm run test:import-export`. Throws (non-zero) on failure.
 */

import type { WhiteboardBlock } from '../whiteboard/types';
import {
  ImportError,
  LOGOSFORGE_FORMAT,
  buildExport,
  buildLogosforgeEnvelope,
  looksBinary,
  parseFdx,
  parseImport,
  parseLogosforge,
  suggestedExportName,
  type ExportPayload,
} from './importExportFormats';

let passed = 0;
const failures: string[] = [];
function check(label: string, cond: boolean) {
  if (cond) passed += 1;
  else failures.push(label);
}
function throws(label: string, fn: () => unknown) {
  try {
    fn();
    failures.push(label + ' (expected throw)');
  } catch {
    passed += 1;
  }
}

const texts = (blocks: WhiteboardBlock[]) => blocks.map((b) => b.text);
const sampleSettings = {
  sceneHeadingStyle: 'bold',
  blankLinesBeforeScene: 1,
  includeOutline: false,
  typeface: 'courier-prime',
  showInvisibles: true,
} as ExportPayload['settings'];

const payload = (over: Partial<ExportPayload> = {}): ExportPayload => ({
  title: 'My Script',
  mode: 'screenplay',
  blocks: [
    { id: 'b0', type: 'heading', text: 'Act One', level: 1 },
    { id: 'b1', type: 'paragraph', text: 'INT. HOUSE - DAY' },
    { id: 'b2', type: 'paragraph', text: 'She opens the door.' },
  ],
  settings: sampleSettings,
  outline: [],
  ...over,
});

// 1. Import TXT / MD: lines → blocks, `#` → heading; markdown bullets preserved.
{
  const r = parseImport('txt', '# Title\nA line\n- bullet one\n- bullet two');
  check('txt heading', r.blocks[0].type === 'heading' && r.blocks[0].text === 'Title');
  check('txt paragraph', r.blocks[1].text === 'A line');
  check('md bullet preserved verbatim', texts(parseImport('md', '- a\n- b').blocks).join('|') === '- a|- b');
  check('txt does not force a mode', r.mode === undefined);
}

// 2. Import Fountain forces Screenplay mode.
{
  const r = parseImport('fountain', 'INT. HOUSE - DAY\n\nAction here.');
  check('fountain forces screenplay', r.mode === 'screenplay');
  check('fountain keeps text', texts(r.blocks).includes('INT. HOUSE - DAY'));
}

// 3. Binary detection → friendly error.
check('looksBinary true on NUL', looksBinary('abc\u0000def'));
check('looksBinary false on text', !looksBinary('plain text'));
throws('binary import rejected', () => parseImport('txt', 'PNG\u0000binary'));

// 4. FDX import foundation.
{
  const fdx = `<?xml version="1.0" encoding="UTF-8"?>
<FinalDraft DocumentType="Script" Version="1"><Content>
<Paragraph Type="Scene Heading"><Text>INT. HOUSE - DAY</Text></Paragraph>
<Paragraph Type="Action"><Text>She enters &amp; sits.</Text></Paragraph>
<Paragraph Type="Character"><Text>JANE</Text></Paragraph>
<Paragraph Type="Parenthetical"><Text>quietly</Text></Paragraph>
<Paragraph Type="Dialogue"><Text>Hello there.</Text></Paragraph>
<Paragraph Type="Transition"><Text>CUT TO:</Text></Paragraph>
</Content></FinalDraft>`;
  const r = parseFdx(fdx);
  const t = texts(r.blocks);
  check('fdx → screenplay', r.mode === 'screenplay');
  check('fdx scene heading', t.includes('INT. HOUSE - DAY'));
  check('fdx action + entity decode', t.includes('She enters & sits.'));
  check('fdx character', t.includes('JANE'));
  check('fdx parenthetical wrapped', t.includes('(quietly)'));
  check('fdx dialogue', t.includes('Hello there.'));
  check('fdx transition', t.includes('CUT TO:'));
  // forced scene heading when not already a slug
  check('fdx forces non-slug scene', texts(parseFdx('<Paragraph Type="Scene Heading"><Text>The Beach</Text></Paragraph>').blocks).includes('.THE BEACH'));
  throws('fdx invalid rejected', () => parseFdx('just some plain text, not xml'));
}

// 5. LogosForge envelope round-trip (content + mode + settings + title).
{
  const env = buildLogosforgeEnvelope(payload({ outline: [{ id: 'n1', parentId: null, type: 'act', title: 'Act One', notes: '', order: 0, collapsed: false, createdAt: 't', updatedAt: 't' }] }));
  check('envelope format', env.format === LOGOSFORGE_FORMAT);
  check('envelope version', env.version === '1.0');
  const json = JSON.stringify(env);
  check('envelope embeds no file paths', !json.includes('filePath') && !json.includes('/home') && !json.includes('\\Users'));
  const r = parseLogosforge(json);
  check('envelope round-trips mode', r.mode === 'screenplay');
  check('envelope round-trips title', r.title === 'My Script');
  check('envelope round-trips content', texts(r.blocks).includes('INT. HOUSE - DAY'));
  check('envelope round-trips settings', r.settings?.typeface === 'courier-prime');
  check('envelope round-trips outline', (r.outline?.length ?? 0) === 1 && r.outline?.[0].title === 'Act One');
}

// 6. LogosForge tolerates the raw JSON export shape ({title, mode, blocks}).
{
  const raw = buildExport('json', payload());
  const obj = JSON.parse(raw) as { title: string; mode: string; blocks: unknown[] };
  check('json export shape', obj.title === 'My Script' && obj.mode === 'screenplay' && obj.blocks.length === 3);
  const r = parseLogosforge(raw);
  check('raw json imports blocks', texts(r.blocks).includes('She opens the door.'));
  check('raw json imports mode', r.mode === 'screenplay');
}

// 7. LogosForge validation errors.
throws('invalid JSON rejected', () => parseLogosforge('{not json'));
throws('wrong format rejected', () => parseLogosforge('{"format":"something-else","document":{"content":"x"}}'));
throws('no content rejected', () => parseLogosforge('{"format":"logosforge-whiteboard","document":{}}'));

// 8. Text/MD/Fountain export = the shared serialization (# headings preserved).
{
  const txt = buildExport('txt', payload());
  check('export txt has heading', txt.includes('# Act One'));
  check('export fountain equals txt serialization', buildExport('fountain', payload()) === txt);
  check('export md equals txt serialization', buildExport('md', payload()) === txt);
}

// 9. HTML export: headings + paragraphs, escaped, titled.
{
  const html = buildExport('html', payload({ blocks: [{ id: 'h', type: 'heading', text: 'A & B', level: 2 }, { id: 'p', type: 'paragraph', text: '<script>x</script>' }] }));
  check('html h2', html.includes('<h2>A &amp; B</h2>'));
  check('html escapes paragraph', html.includes('&lt;script&gt;x&lt;/script&gt;') && !html.includes('<script>x'));
  check('html has title', html.includes('<title>My Script</title>'));
}

// 10. Suggested export filename swaps the extension.
check('suggested swaps ext', suggestedExportName('script.fountain', 'logosforge') === 'script.logosforge');
check('suggested untitled fallback', suggestedExportName('', 'txt') === 'untitled.txt');
check('suggested no-ext stem', suggestedExportName('notes', 'md') === 'notes.md');

// 11. ImportError type is thrown for friendly failures.
{
  let isImportError = false;
  try {
    parseLogosforge('nope');
  } catch (e) {
    isImportError = e instanceof ImportError;
  }
  check('parse failures are ImportError', isImportError);
}

// --- report ---
console.log(`Import/Export tests: ${passed} passed, ${failures.length} failed`);
for (const f of failures) console.log('  FAIL: ' + f);
if (failures.length) throw new Error(`${failures.length} import/export test(s) failed`);
console.log('IMPORT/EXPORT TESTS: PASS');
