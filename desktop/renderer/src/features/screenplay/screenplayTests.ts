/**
 * Screenplay parser/classifier tests. Pure — no editor/DOM. Runnable headlessly
 * (esbuild + node): `npm run test:screenplay`. Throws (non-zero exit) on failure.
 */

import { deriveOutline } from '../outline/deriveOutline';
import { parseEmphasis } from './fountainParser';
import type { FountainBlock } from './fountainTypes';
import { computeSuggestions, filterSuggestions } from './screenplayAutocomplete';
import { detectBoneyard } from './screenplayBoneyard';
import { classify } from './screenplayClassifier';
import { stripForExport } from './screenplayExport';
import { sectionShiftTabLevel, sectionTabLevel } from './screenplaySections';
import { parseTitlePage } from './screenplayTitlePage';

let passed = 0;
const failures: string[] = [];

function check(label: string, cond: boolean) {
  if (cond) passed += 1;
  else failures.push(label);
}

const line = (text: string): FountainBlock => ({ text, isHeading: false });
const lines = (...texts: string[]): FountainBlock[] => texts.map(line);

function eqTypes(label: string, blocks: FountainBlock[], want: string[]) {
  const got = classify(blocks);
  check(`${label} (got ${JSON.stringify(got)})`, JSON.stringify(got) === JSON.stringify(want));
}

const classesOf = (text: string) => parseEmphasis(text).map((r) => r.className);
const json = (v: unknown) => JSON.stringify(v);

// 1. Scene headings
eqTypes('scene INT.', lines('INT. HOUSE - NIGHT'), ['scene_heading']);
eqTypes('scene EXT.', lines('EXT. ROAD - DAY'), ['scene_heading']);
eqTypes('scene INT./EXT.', lines('INT./EXT. CAR - DAY'), ['scene_heading']);
eqTypes('scene I/E.', lines('I/E. CAR'), ['scene_heading']);
eqTypes('scene EST.', lines('EST. CITY - DAWN'), ['scene_heading']);

// 2. Forced scene heading / not-forced
eqTypes('forced scene .X', lines('.STRANGE DREAM SPACE'), ['scene_heading']);
eqTypes('not forced ..', lines('..ellipsis is action'), ['action']);

// 3. Action
eqTypes('action prose', lines('He walks across the room.'), ['action']);

// 4. Character + dialogue
eqTypes('character+dialogue', lines('JOHN', 'Hello there.'), ['character', 'dialogue']);
eqTypes('OLD MAN', lines('OLD MAN', 'Get off my lawn.'), ['character', 'dialogue']);

// 5. Parenthetical
eqTypes(
  'parenthetical',
  lines('JOHN', 'Hi.', '(quietly)', 'Bye.'),
  ['character', 'dialogue', 'parenthetical', 'dialogue'],
);

// 6. Transition
eqTypes('transition CUT TO:', lines('CUT TO:'), ['transition']);
eqTypes('transition FADE TO:', lines('FADE TO:'), ['transition']);

// 7. Forced transition
eqTypes('forced transition >', lines('> SMASH CUT:'), ['transition']);

// 8. Centered
eqTypes('centered', lines('> This is centered <'), ['centered']);

// 9. Sections
eqTypes('section #', lines('# Act One'), ['section']);
eqTypes('section ##', lines('## Sequence One'), ['section']);
eqTypes('section heading node', [{ text: 'Act One', isHeading: true, level: 1 }], ['section']);

// 10. Synopsis
eqTypes('synopsis', lines('= This is a synopsis'), ['synopsis']);

// 11. Note
eqTypes('note', lines('[[This is a note]]'), ['note']);

// 12. Page break
eqTypes('page break ===', lines('==='), ['page_break']);
eqTypes('page break =====', lines('====='), ['page_break']);

// 13. Emphasis
check('emph bold', json(classesOf('**bold**')) === json(['sp-emph-marker', 'sp-bold', 'sp-emph-marker']));
check('emph italic', json(classesOf('*italic*')) === json(['sp-emph-marker', 'sp-italic', 'sp-emph-marker']));
check('emph bold-italic', json(classesOf('***bi***')) === json(['sp-emph-marker', 'sp-bold-italic', 'sp-emph-marker']));
check('emph underline', json(classesOf('_u_')) === json(['sp-emph-marker', 'sp-underline', 'sp-emph-marker']));
check('emph mixed', classesOf('a **b** c *d*').includes('sp-bold') && classesOf('a **b** c *d*').includes('sp-italic'));
const range = parseEmphasis('**bold**');
check('emph content range', range[1]?.from === 2 && range[1]?.to === 6);

// 14. Autocomplete filtering
check(
  'filter by E',
  json(filterSuggestions(['EXT. ', 'EXT. HOUSE - NIGHT', 'ELENA', 'INT. '], 'E')) ===
    json(['EXT. ', 'EXT. HOUSE - NIGHT', 'ELENA']),
);
check('filter empty returns all', filterSuggestions(['A', 'B'], '').length === 2);

// 15. Suggestion extraction + context ordering
const spDoc = lines('INT. HOUSE - DAY', '', 'JOHN', 'Hello.', '', 'CUT TO:');
check('suggest has character', computeSuggestions(spDoc, false).includes('JOHN'));
check('suggest has scene', computeSuggestions(spDoc, false).includes('INT. HOUSE - DAY'));
check('suggest has transition', computeSuggestions(spDoc, false).includes('CUT TO:'));
check('static slugs first by default', computeSuggestions(spDoc, false)[0] === 'INT. ');
check('characters first when flagged', computeSuggestions(spDoc, true)[0] === 'JOHN');

// 16. Section indent/outdent math
check('sectionTab 1->2', sectionTabLevel(1) === 2);
check('sectionTab caps at 3', sectionTabLevel(3) === 3);
check('sectionShiftTab 2->1', sectionShiftTabLevel(2) === 1);
check('sectionShiftTab 1->paragraph', sectionShiftTabLevel(1) === 0);

// 17. Boneyard / omitted text
check('boneyard multi-block', json(detectBoneyard(lines('/*', 'omitted', '*/'))) === json([true, true, true]));
check('boneyard single line', json(detectBoneyard(lines('action', '/* x */', 'more'))) === json([false, true, false]));
check('boneyard spanning', json(detectBoneyard(lines('/* a', 'b', 'c */', 'd'))) === json([true, true, true, false]));

// 18. Title page fields
{
  const tp = parseTitlePage(lines('Title: My Movie', 'Author: Me', '', 'INT. HOUSE - DAY'));
  check('title parsed', tp.fields.title === 'My Movie');
  check('author parsed', tp.fields.author === 'Me');
  check('title page endIndex', tp.endIndex === 3);
  check('no title page', parseTitlePage(lines('INT. HOUSE - DAY', 'Action.')).endIndex === 0);
  check('multi-line value', parseTitlePage(lines('Title:', '   My Movie', '   Subtitle', '')).fields.title === 'My Movie\nSubtitle');
}

// 19. Strip notes + boneyard for export
{
  const out = stripForExport('Hello [[a note]] and /* omitted */ world');
  check('export strips note', !out.includes('[['));
  check('export strips boneyard', !out.includes('/*'));
  check('export keeps text', out.includes('Hello') && out.includes('world'));
}

// 20. Outline extraction + section hierarchy
{
  const ob = (type: string, text: string, level?: number) => ({ id: text, type, text, level });
  const doc = [
    ob('heading', 'Act One', 1),
    ob('heading', 'Sequence One', 2),
    ob('paragraph', '= Opening image'),
    ob('paragraph', '[[Need stronger hook]]'),
    ob('paragraph', 'INT. HOUSE - DAY'),
    ob('paragraph', 'Action.'),
  ];
  const ol = deriveOutline(doc as never, 'screenplay');
  check('outline kinds', json(ol.map((o) => o.kind)) === json(['section', 'section', 'synopsis', 'note', 'scene']));
  check('outline section levels', ol[0].level === 1 && ol[1].level === 2);
  check(
    'novel outline = headings only',
    json(deriveOutline(doc as never, 'novel').map((o) => o.kind)) === json(['section', 'section']),
  );
}

// 21. Filter ordering, note label, page-break boundary
check(
  'filter prefix before substring',
  json(filterSuggestions(['SMASH CUT:', 'CUT TO:', 'DISSOLVE TO:'], 'C')) === json(['CUT TO:', 'SMASH CUT:']),
);
{
  const ol = deriveOutline([{ id: 'n', type: 'paragraph', text: '[[Need stronger hook]]' }] as never, 'screenplay');
  check('outline note label strips brackets', ol[0]?.label === 'Need stronger hook');
}
eqTypes('== is synopsis, not page break', lines('=='), ['synopsis']);

// --- report ---
console.log(`Screenplay parser tests: ${passed} passed, ${failures.length} failed`);
for (const f of failures) console.log('  FAIL: ' + f);
if (failures.length) throw new Error(`${failures.length} screenplay test(s) failed`);
console.log('SCREENPLAY TESTS: PASS');
