/**
 * LittleBoy pure helper tests (context bounding, mode labels, Logos action
 * registry + apply-mode logic). No React/DOM/network. Runs headlessly
 * (esbuild + node): `npm run test:littleboy`. Throws (non-zero) on failure.
 */

import { boundedContext, clamp, contextPreview } from './context/selectionContext';
import {
  contextLabel,
  isScreenplayMode,
  modeLabel,
  screenplayElementLabel,
} from './context/writingModeContext';
import {
  LOGOS_ACTIONS,
  LOGOS_TRANSFORM_ACTIONS,
  applyModeFor,
  isTransformAction,
} from './logos/logosTypes';

let passed = 0;
const failures: string[] = [];
function check(label: string, cond: boolean) {
  if (cond) passed += 1;
  else failures.push(label);
}

// 1. clamp
check('clamp keeps short text', clamp('hello', 10) === 'hello');
check('clamp truncates with ellipsis', clamp('hello world', 5) === 'hell…');
check('clamp handles empty', clamp('', 5) === '');

// 2. boundedContext
check('boundedContext collapses blank runs', boundedContext('a\n\n\n\nb') === 'a\n\nb');
check('boundedContext trims', boundedContext('   x   ') === 'x');
check('boundedContext bounds length', boundedContext('a'.repeat(5000), 100).length === 100);

// 3. contextPreview
check('preview prefers selection', contextPreview('  the   sea  ', 'block text') === 'the sea');
check('preview falls back to block', contextPreview('', 'the block text') === 'the block text');
check('preview clamps', contextPreview('x'.repeat(500), '', 20).length === 20);

// 4. writing-mode labels
check('modeLabel screenplay', modeLabel('screenplay') === 'Screenplay');
check('modeLabel novel', modeLabel('novel') === 'Novel');
check('modeLabel unknown capitalizes', modeLabel('foo') === 'Foo');
check('modeLabel null default', modeLabel(null) === 'Novel');
check('isScreenplayMode true', isScreenplayMode('screenplay'));
check('isScreenplayMode false', !isScreenplayMode('novel'));
check('screenplayElementLabel maps', screenplayElementLabel('scene_heading') === 'Scene Heading');
check('screenplayElementLabel empty', screenplayElementLabel(null) === '');
check('contextLabel screenplay + element', contextLabel('screenplay', 'character') === 'Screenplay · Character');
check('contextLabel ignores element off-screenplay', contextLabel('novel', 'character') === 'Novel');

// 5. Logos action registry
check('nine default actions', LOGOS_ACTIONS.length === 9);
{
  const ids = LOGOS_ACTIONS.map((a) => a.id);
  for (const expected of [
    'rewrite', 'expand', 'compress', 'make_more_visual', 'improve_dialogue',
    'improve_action', 'explain', 'summarize', 'connect_to_psyke',
  ]) {
    check(`action present: ${expected}`, ids.includes(expected as (typeof ids)[number]));
  }
}
check('six transform actions', LOGOS_TRANSFORM_ACTIONS.length === 6);
check('isTransformAction rewrite', isTransformAction('rewrite'));
check('isTransformAction explain false', !isTransformAction('explain'));
check('isTransformAction connect false', !isTransformAction('connect_to_psyke'));

// 6. applyModeFor (Apply only with a replacement AND a selection)
check('apply when replacement + selection', applyModeFor({ suggested_replacement: 'x' }, true) === 'apply');
check('insert when replacement but no selection', applyModeFor({ suggested_replacement: 'x' }, false) === 'insert');
check('insert when no replacement', applyModeFor({ suggested_replacement: null }, true) === 'insert');
check('insert when empty replacement', applyModeFor({ suggested_replacement: '' }, true) === 'insert');

// --- report ---
console.log(`LittleBoy tests: ${passed} passed, ${failures.length} failed`);
for (const f of failures) console.log('  FAIL: ' + f);
if (failures.length) throw new Error(`${failures.length} littleboy test(s) failed`);
console.log('LITTLEBOY TESTS: PASS');
