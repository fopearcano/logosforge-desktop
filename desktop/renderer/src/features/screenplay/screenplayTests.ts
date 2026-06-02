/**
 * Screenplay parser/classifier tests. Pure — no editor/DOM. Runnable headlessly
 * (esbuild + node): `npm run test:screenplay`. Throws (non-zero exit) on failure.
 */

import { parseEmphasis } from './fountainParser';
import type { FountainBlock } from './fountainTypes';
import { classify } from './screenplayClassifier';

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

// --- report ---
console.log(`Screenplay parser tests: ${passed} passed, ${failures.length} failed`);
for (const f of failures) console.log('  FAIL: ' + f);
if (failures.length) throw new Error(`${failures.length} screenplay test(s) failed`);
console.log('SCREENPLAY TESTS: PASS');
