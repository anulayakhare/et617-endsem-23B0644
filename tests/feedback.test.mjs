import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import test from 'node:test';
import handler from '../api/feedback.mjs';
import { feedbackEvidence, validateEvidence } from '../feedback-evidence.mjs';
import { generateFeedback } from '../server/gemini.mjs';
import { controls, draftFeedback, simulate } from '../lab.mjs';
import { teacherAuthorization, teacherSecretIssue } from '../teacher-access.mjs';

function submission(misconception) {
  const pair = ['Aluminium', 'Steel'].map(material => simulate(material, 50));
  return {
    predict: { material: misconception ? 'Steel' : 'Aluminium', reason: 'A synthetic explanation about heat.' },
    pair, fixed: controls, retest: pair,
    revise: { first: 'Aluminium', second: 'Steel', third: 'Dry wood', handle: 'Dry wood',
      decision: misconception ? 'Revised' : 'Kept', reason: '6 W and 3 W at the same warm-end temperature.',
      wood: simulate('Dry wood', 50) },
    investigation: misconception ? 'steel' : 'both', history: misconception ? ['steel'] : ['both'],
    transfer: { feels: 'steel', temperature: misconception ? 'steel' : 'same', direction: 'out',
      reason: misconception ? 'It felt colder.' : 'Steel takes energy from my hand faster.' },
  };
}

test('structured evidence excludes written answers and recomputes rates', () => {
  const work = submission(false);
  work.predict.reason += ' PrivateName';
  const input = feedbackEvidence(work);
  assert.equal(JSON.stringify(input).includes('PrivateName'), false);
  assert.equal(input.matchedReadingsMentioned, 2);
  assert.equal(input.explanationMentionsRate, true);
  const evidence = validateEvidence({ ...input, arbitrary: 'PrivateName' });
  assert.equal(JSON.stringify(evidence).includes('PrivateName'), false);
  assert.equal(evidence.fairTestReadings[0].rate, 6);
  assert.throws(() => validateEvidence({ ...input, spoonFeels: 'PrivateName' }), TypeError);
});

test('local fallback distinguishes correct answers from both misconceptions', () => {
  assert.match(draftFeedback(submission(false)), /Both spoons start at 25/);
  assert.match(draftFeedback(submission(true)), /thermometer readings/);
  assert.match(draftFeedback(submission(true)), /shared warm-end/);
});

test('rejects invalid Gemini output and invented readings', async () => {
  const evidence = validateEvidence(feedbackEvidence(submission(false)));
  const mock = result => async () => Response.json({ candidates: [
    { finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(result) }] } },
  ] });
  const draft = { investigation: 'You recorded 6 W for aluminium.', spoon: 'Both started at 25 °C.', nextStep: 'Explain what changed.' };
  assert.match(await generateFeedback(evidence, 'unused', mock(draft)), /6 W/);
  await assert.rejects(generateFeedback(evidence, 'unused', mock({ ...draft, investigation: 'Steel transferred 999 W.' })), /Unsupported rate/);
  await assert.rejects(generateFeedback(evidence, 'unused', mock({ ...draft, spoon: '<script>bad</script>' })), /Invalid AI draft/);
});

test('teacher access code encoding supports printable Unicode and spaces without changing the value', () => {
  const code = ' Synthetic café 🔬 phrase  ';
  const header = new Headers({ Authorization: teacherAuthorization(code) }).get('authorization');
  assert.match(header, /^Bearer [A-Za-z0-9_-]+$/);
  assert.equal(Buffer.from(header.slice(7), 'base64url').toString('utf8'), code);
  assert.equal(teacherSecretIssue(code), null);
  assert.equal(teacherSecretIssue(undefined), 'TEACHER_ACCESS_CODE_MISSING');
  assert.equal(teacherSecretIssue(' short code    '), 'TEACHER_ACCESS_CODE_TOO_SHORT');
  assert.equal(teacherSecretIssue('long code with\na newline'), 'TEACHER_ACCESS_CODE_CONTROL_CHARACTER');
  assert.equal(teacherSecretIssue('x'.repeat(257)), 'TEACHER_ACCESS_CODE_TOO_LONG');
});

test('HTTP handler validates access, size, rate limit and optional real Gemini generation', async t => {
  const originalKey = process.env.GEMINI_API_KEY;
  const originalCode = process.env.TEACHER_ACCESS_CODE;
  const originalEnvironment = process.env.VERCEL_ENV;
  const originalFetch = globalThis.fetch;
  const warning = t.mock.method(console, 'warn', () => {});
  const code = ' ' + randomBytes(18).toString('hex') + ' café 🔬 ';
  const real = process.env.RUN_LIVE_GEMINI === '1';
  if (real) assert.ok(originalKey, 'GEMINI_API_KEY is required for the live test');
  process.env.TEACHER_ACCESS_CODE = code;
  delete process.env.GEMINI_API_KEY;
  const server = createServer(handler).listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const url = 'http://127.0.0.1:' + server.address().port + '/api/feedback';
    const send = (body, auth = code) => fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: teacherAuthorization(auth) },
      body: JSON.stringify(body),
    });
    const input = feedbackEvidence(submission(false));
    assert.equal((await fetch(url)).status, 405);
    delete process.env.VERCEL_ENV;
    const unconfigured = await send(input);
    assert.equal(unconfigured.status, 503);
    assert.deepEqual(await unconfigured.json(), { error: 'unavailable' });
    assert.deepEqual(warning.mock.calls[0].arguments, [
      '[feedback] Configuration unavailable:', 'VERCEL_ENV_MISSING, GEMINI_API_KEY_MISSING',
    ]);
    assert.equal((await send('x'.repeat(2048))).status, 413);
    process.env.GEMINI_API_KEY = real ? originalKey : 'fixture-configured';
    process.env.VERCEL_ENV = 'production';
    assert.equal((await send(input)).status, 503);
    assert.equal(warning.mock.callCount(), 1);
    process.env.VERCEL_ENV = 'preview';
    process.env.TEACHER_ACCESS_CODE = 'short';
    assert.equal((await send(input)).status, 503);
    assert.deepEqual(warning.mock.calls[1].arguments, [
      '[feedback] Configuration unavailable:', 'TEACHER_ACCESS_CODE_TOO_SHORT',
    ]);
    process.env.TEACHER_ACCESS_CODE = code;
    assert.equal((await send(input, code.trim())).status, 401);
    assert.equal((await send({})).status, 400);
    if (!real) {
      globalThis.fetch = (url, options) => {
        if (!String(url).startsWith('https://generativelanguage.googleapis.com/')) return originalFetch(url, options);
        return Promise.resolve(Response.json({ candidates: [{
          finishReason: 'STOP',
          content: { parts: [{ text: JSON.stringify({
            investigation: 'You measured 6 W for aluminium.', spoon: 'Check both thermometers.', nextStep: 'Explain what changed.',
          }) }] },
        }] }));
      };
    }
    for (const work of [submission(false), submission(true)]) {
      const response = await send(feedbackEvidence(work));
      assert.equal(response.status, 200, 'Gemini endpoint generation failed');
      const data = await response.json();
      assert.equal(data.source, 'gemini');
      assert.equal(data.model, 'gemini-3.1-flash-lite');
      assert.ok(data.draft.length >= 36);
    }
    assert.equal((await send(input)).status, 429);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    if (originalCode === undefined) delete process.env.TEACHER_ACCESS_CODE;
    else process.env.TEACHER_ACCESS_CODE = originalCode;
    if (originalEnvironment === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = originalEnvironment;
    server.close();
  }
});
