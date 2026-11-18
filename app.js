import { materials, settings, cool, simulate, watts, sample, controls, compare, draftFeedback } from './lab.mjs';
import { feedbackEvidence } from './feedback-evidence.mjs';

const key = 'et617-conduction-v1';
const steps = { predict: 'Predict', experiment: 'Run tests', investigate: 'Investigate', revise: 'Revise claim', transfer: 'Explain', notebook: 'Notebook' };
const fresh = () => ({ section: 'predict', drafts: {}, runs: [], hints: {}, history: [], reviews: [], done: {} });
let state = fresh();
let storageError = false;
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved) state = saved;
} catch {
  storageError = true;
}

const app = document.querySelector('#app');
let message = '';
let active = '';
const teacherDrafts = new Map();
let pendingDraft;
let nextRequest = 0;
const geminiDemo = document.querySelector('meta[name="gemini-demo"]')?.content === 'enabled';
if (!location.hash) history.replaceState(null, '', '#' + state.section);

function save() {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    storageError = true;
  }
}

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const button = label => `<button>${label}</button>`;
const link = (route, label) => `<a class="button secondary" href="#${route}">${label}</a>`;
const actions = (...items) => `<div class="actions">${items.join('')}</div>`;
const note = (content, type = '') => `<p class="notice ${type}">${escape(content)}</p>`;
const panel = (title, content) => `<section class="panel"><h2>${title}</h2>${content}</section>`;
const heading = (title, intro) => `<h1 tabindex="-1">${title}</h1><p>${intro}</p>`;
const form = (id, content) => `<form data-form="${id}">${content}</form>`;
const options = Object.keys(materials).map(name => [name, name]);
const getDraft = id => state.drafts[id] ?? {};

function select(label, name, choices, value = '') {
  return `<label>${label}<select name="${name}" required>
    <option value="">Choose one</option>
    ${choices.map(([id, text]) => `<option value="${escape(id)}" ${String(id) === value ? 'selected' : ''}>${escape(text)}</option>`).join('')}
    </select></label>`;
}

function writing(label, name, value, placeholder = '') {
  return `<label>${label}<textarea name="${name}" maxlength="1500" required placeholder="${escape(placeholder)}">${escape(value)}</textarea></label>`;
}

function table(runs, caption, highlightWarm = false) {
  if (!runs.length) return '<p class="muted">Your readings will appear here after a run.</p>';
  return `<div class="table-wrap"><table><caption>${caption}</caption><thead><tr>
    <th scope="col">Run</th><th scope="col">Material</th><th scope="col">Warm</th><th scope="col">Cool</th><th scope="col">Rate</th>
    </tr></thead><tbody>${runs.map(run => `<tr>
    <td>${run.id ?? 'Sample'}</td><td>${run.material}</td><td>${highlightWarm ? '<mark>' : ''}${run.warm} °C${highlightWarm ? '</mark>' : ''}</td><td>${run.cool} °C</td><td>${watts(run)}</td>
    </tr>`).join('')}</tbody></table></div>`;
}

function chart(runs, title) {
  if (!runs.length) return '';
  return `<figure class="rate-chart">
    <figcaption>${title} <small>Heat-transfer rate · 0–10 W</small></figcaption>
    <ol role="list">${runs.map(run => `<li>
      <span>${run.id ? 'Run ' + run.id + ' · ' : ''}${run.material} · ${run.warm} °C</span>
      <strong>${watts(run)}</strong>
      <div aria-hidden="true" class="rate-track"><div style="width:${run.rate * 10}%"></div></div>
    </li>`).join('')}</ol>
  </figure>`;
}

const runOptions = () => state.runs.map(run => [run.id, `Run ${run.id} · ${run.material} at ${run.warm} °C`]);
const findRun = id => state.runs.find(run => String(run.id) === id);
const hintButton = id => `<button type="button" class="secondary" data-hint="${id}">Show a hint</button>`;
const hints = {
  pair: ['Read the two rows side by side. Which settings changed?', 'Compare the warm-end temperatures. Try keeping one run and matching its warm-end temperature in a new run with a different material.'],
  investigate: ['Read the material and warm-end temperature in each row of the sample.', 'Look at 70 °C and 40 °C. Choose one shared warm-end setting, then run steel and aluminium at that setting.'],
  transfer: ['Check both thermometer readings before touch. What do they show?', 'Imagine an arrow from the warmer hand to each cooler spoon. Which spoon might draw energy from your hand faster?'],
};

function showHints(id) {
  return hints[id].slice(0, state.hints[id] ?? 0).map(text => note(text, 'hint')).join('');
}

function rig(id) {
  const draft = getDraft(id);
  const warm = draft.warm || '50';
  return form(id, `
    ${select('Rod material', 'material', options, draft.material || 'Aluminium')}
    ${select('Warm-end temperature', 'warm', settings.map(value => [value, value + ' °C']), warm)}
    <div class="rod" aria-label="Energy flows from the warm end to the cool end">
      <strong class="warm">Warm end · <span data-warm>${warm}</span> °C</strong><strong class="cool">Cool end · ${cool} °C</strong>
      <div class="rod-track">Energy moves through the rod →</div>
    </div>
    <small>All rods have the same length and thickness.</small>
    ${actions(button('Run and record'))}`);
}

const screens = {
  predict() {
    const draft = getDraft('predict');
    return heading('Make a prediction', 'Which material should cover the part of a hot-pan handle you hold? Let’s test some ideas.')
      + note('Take your time. You can test your idea and change your mind after you see the readings.')
      + form('predict', select('Which rod will transfer energy fastest when all settings match?', 'material', options, draft.material)
        + writing('Why do you think so?', 'reason', draft.reason, 'I predict … because …')
        + actions(button('Save prediction and start lab')));
  },
  experiment() {
    const draft = getDraft('pair');
    return heading('Run a fair test', 'Run one aluminium rod and one steel rod. See what happens when you change a setting.')
      + note('Conduction transfers energy from warmer places to cooler places. A rate of 2 W means 2 joules of energy move each second.')
      + rig('experiment') + '<section class="review"><h2>Compare two runs</h2>'
      + (state.runs.length < 2 ? '<p>Save two runs to start a comparison.</p>' : form('pair',
        select('First run', 'first', runOptions(), draft.first) + select('Second run', 'second', runOptions(), draft.second)
        + `<fieldset><legend>What should be the same in both runs?</legend>${controls.map(item =>
          `<label class="option"><input type="checkbox" name="fixed" value="${item}" ${draft.fixed?.includes(item) ? 'checked' : ''}> ${item}</label>`).join('')}</fieldset>`
        + actions(button('Check comparison'), hintButton('pair'))))
      + '<div data-selected-runs>' + (findRun(draft.first) && findRun(draft.second)
        ? table([findRun(draft.first), findRun(draft.second)], 'Selected setups', state.hints.pair > 1)
          + chart([findRun(draft.first), findRun(draft.second)], 'Compare selected runs') : '') + '</div>'
      + showHints('pair') + (state.done.pair ? actions(link('investigate', 'Go to Investigate')) : '') + '</section>';
  },
  investigate() {
    const draft = getDraft('investigate');
    return heading('Investigate a surprising result', 'A lab notebook shows steel transferring more energy each second in this pair.')
      + table(sample, 'Sample comparison', state.hints.investigate > 1)
      + chart(sample, 'Compare the sample runs')
      + form('investigate', select('What can you conclude from these two runs?', 'answer', [
        ['steel', 'Steel conducts better because its reading is higher.'],
        ['both', 'Both material and warm-end temperature changed. I need a fair test.'],
        ['material', 'Only the rod material changed.'],
      ], draft.answer) + actions(button('Check my reasoning'), hintButton('investigate')))
      + showHints('investigate')
      + '<section class="review"><h2>Run a new test</h2><p>Make a new aluminium or steel run here. You can reuse one sample run and retest the other material.</p>'
      + rig('investigate-rig')
      + (state.runs.some(run => run.stage === 'investigate') ? form('retest',
        select('First run', 'first', retestOptions(), getDraft('retest').first)
        + select('Second run', 'second', retestOptions(), getDraft('retest').second)
        + actions(button('Save retest'), hintButton('investigate'))) : '')
      + (state.done.retest ? actions(link('revise', 'Go to Revise claim')) : '') + '</section>';
  },
  revise() {
    const draft = getDraft('revise');
    const prediction = state.done.predict;
    const warm = state.done.retest?.[0].warm;
    return heading('Revise your claim', 'Add a dry wood run and compare all three materials at the same setting.')
      + (prediction ? note(`Your first prediction was ${prediction.material}. Your reason was “${prediction.reason}”`) : '')
      + (warm ? note(`Your retest used a warm end of ${warm} °C. Use that setting for dry wood.`)
        + table(matchedReadings(warm), 'Matched readings') + chart(matchedReadings(warm), 'Compare at the same temperature')
        : '<p><a href="#investigate">Save your retest first.</a></p>')
      + rig('revise-rig') + form('revise',
        select('Fastest', 'first', options, draft.first)
        + select('Middle', 'second', options, draft.second)
        + select('Slowest', 'third', options, draft.third)
        + select('Which covering would reduce conduction the most?', 'handle', options, draft.handle)
        + select('What happened to your original prediction?', 'decision', [['Kept', 'I kept it'], ['Revised', 'I revised it']], draft.decision)
        + writing('Use two readings with units to explain your ranking, covering choice and what changed in the sample test.', 'reason', draft.reason, 'I measured … W for … and … W for …')
        + actions(button('Save revised claim'), link('transfer', 'Go to Explain')));
  },
};

function matchedReadings(warm) {
  return [...state.done.retest, ...state.runs.filter(run => run.material === 'Dry wood' && run.warm === warm).slice(-1)];
}

function retestOptions() {
  return [...runOptions(), ...sample.map((run, i) => ['sample' + i, `Sample · ${run.material} at ${run.warm} °C`])];
}

screens.transfer = function () {
  const draft = getDraft('transfer');
  return heading('Explain the spoon test', 'A steel spoon and a wooden spoon sat in the same room for hours. Both thermometers read 25 °C. Your hand is warmer.')
    + form('transfer',
      select('Which spoon feels cooler at first?', 'feels', [['steel', 'Steel'], ['wood', 'Wood'], ['same', 'Both feel the same']], draft.feels)
      + select('What were their temperatures before touch?', 'temperature', [['same', 'Both were 25 °C'], ['steel', 'Steel started colder'], ['wood', 'Wood started colder']], draft.temperature)
      + select('Which way does energy move at first?', 'direction', [['out', 'From my hand into both spoons'], ['in', 'From both spoons into my hand'], ['none', 'No energy moves']], draft.direction)
      + writing('Why might the spoons feel different?', 'reason', draft.reason, 'Energy moves … The steel spoon feels … because …')
      + actions(button('Save explanation'), hintButton('transfer')))
    + showHints('transfer')
    + (state.done.transfer ? actions(link('notebook', 'Open notebook to submit')) : '');
};

function progress() {
  return `${['predict', 'pair', 'retest', 'revise', 'transfer'].filter(id => state.done[id]).length} of 5 tasks saved`;
}

function details(entries) {
  return '<dl>' + entries.map(([label, value]) => `<dt>${label}</dt><dd>${escape(value)}</dd>`).join('') + '</dl>';
}

function evidenceDetails(evidence) {
  const { predict, pair, fixed, retest, revise, transfer, investigation } = evidence;
  const investigationText = { steel: 'Steel conducts better because its reading is higher.', both: 'Both material and warm-end temperature changed.', material: 'Only the material changed.' };
  const temperatures = { same: 'Both were 25 °C', steel: 'Steel started colder', wood: 'Wood started colder' };
  const directions = { out: 'From hand to spoons', in: 'From spoons to hand', none: 'No energy moves' };
  return details([
    ['Prediction', `${predict.material} · ${predict.reason}`],
    ['Conditions identified', fixed.join(', ') || 'None selected'],
    ['Sample interpretation', investigationText[investigation] ?? 'No response'],
    ['Sample responses tried', evidence.history.map(choice => investigationText[choice]).join(' → ') || 'None'],
    ['Ranking and handle choice', `${revise.first} → ${revise.second} → ${revise.third}. Handle: ${revise.handle}.`],
    ['Claim revision and evidence', `${revise.decision}. ${revise.reason}`],
    ['Spoon explanation', `Feels cooler: ${transfer.feels}. ${temperatures[transfer.temperature]}. ${directions[transfer.direction]}. ${transfer.reason}`],
  ]) + table(pair, 'Fair-test pair') + table(retest, 'Retest pair');
}

const outcomes = ['O1 · Fair comparison', 'O2 · Evidence and revision', 'O3 · Spoon explanation'];
const reviewStatus = review => !review.text ? 'Pending'
  : ['Overridden', 'Teacher override shared'].includes(review.status) ? 'Overridden' : 'Approved';
const sourceLabel = source => ({ gemini: 'Gemini', teacher: 'Teacher override', rules: 'Rule-based fallback' })[source];
const reviewedSource = review => review.source ?? (reviewStatus(review) === 'Overridden' ? 'teacher' : 'rules');

function released(review) {
  return note(review.text) + details([['Feedback source', sourceLabel(reviewedSource(review))],
    ...outcomes.map((label, i) => [label, review.outcomes[i]])]);
}

screens.notebook = function () {
  return heading('Your lab notebook', 'Review your work and send it to your teacher when you are ready.')
    + `<p><strong>${progress()}</strong></p>`
    + (state.done.predict ? details([['First prediction', `${state.done.predict.material} · ${state.done.predict.reason}`]]) : '')
    + (state.done.revise ? details([['Latest claim', `${state.done.revise.decision}. ${state.done.revise.reason}`]]) : '')
    + table(state.runs, 'All saved runs')
    + form('submit', actions(button('Send work for teacher review')))
    + state.reviews.map(review => `<section class="review"><h2>Submission ${review.id} · ${reviewStatus(review)}</h2>
      ${review.text ? released(review) : note('Waiting for teacher review. You can keep exploring.')}
      <details><summary>Work sent with this submission</summary>${evidenceDetails(review.evidence)}</details></section>`).join('');
};

function suggestedDraft(review) {
  return teacherDrafts.get(review) ?? { source: 'rules', text: review.draft ?? draftFeedback(review.evidence) };
}

function generationForm(review) {
  if (!geminiDemo) return '<p class="muted">This deployment uses rule-based feedback.</p>';
  return form('generate-' + review.id,
    '<label>Teacher access code<input type="password" name="accessCode" required maxlength="256" autocomplete="off"></label>'
      + actions(`<button ${pendingDraft ? 'disabled' : ''}>Generate Gemini draft</button>`)
      + '<small>Use synthetic learner work for the adult examiner demo.</small>');
}

screens.teacher = function () {
  return heading('Teacher dashboard', 'Review this browser’s learner work and decide which feedback to share.')
    + `<p><strong>${progress()}</strong> · Current activity: ${steps[state.section]}</p>`
    + details([
      ['Initial prediction', state.done.predict ? `${state.done.predict.material} · ${state.done.predict.reason}` : 'Awaiting prediction'],
      ['Latest revised claim', state.done.revise?.reason ?? 'Awaiting revision'],
      ['Latest spoon explanation', state.done.transfer?.reason ?? 'Awaiting explanation'],
    ]) + table(state.runs, 'Learner runs')
    + (state.reviews.length ? state.reviews.map(review => {
      const id = 'review-' + review.id;
      const draft = getDraft(id);
      const suggestion = suggestedDraft(review);
      return `<section class="review"><h2>Submission ${review.id} · ${reviewStatus(review)}</h2>`
        + evidenceDetails(review.evidence)
        + '<h3>Suggested feedback</h3>' + details([[sourceLabel(suggestion.source), suggestion.text]])
        + generationForm(review)
        + (review.text ? '<h3>Shared with learner</h3>' + released(review) : '')
        + form(id, outcomes.map((label, i) => select(label, 'outcome' + i,
          [['Needs review', 'Needs review'], ['Demonstrated', 'Demonstrated'], ['Revise', 'Revise']],
          draft['outcome' + i] ?? review.outcomes?.[i] ?? 'Needs review')).join('')
          + `<label>Your feedback if overriding<textarea name="override" maxlength="1500">${escape(draft.override ?? '')}</textarea></label>`
          + actions('<button name="decision" value="approve">Approve draft</button>',
            '<button class="secondary" name="decision" value="override">Share override</button>')) + '</section>';
    }).join('') : '<p>Submitted work will appear here for review.</p>')
    + actions(link(state.section, 'Return to learner view'));
};

screens.about = function () {
  return heading('About the lab', 'A Class 7 inquiry activity on heat conduction in different materials.')
    + details([['Roll number', '23B0644'], ['Exam card', 'P5-T9-L5-C5']])
    + '<h2>How the lab calculates a reading</h2><p>Heat-transfer rate = rate factor × (warm-end temperature − 20 °C). The factors are 0.20 W/°C for aluminium, 0.10 W/°C for steel and 0.005 W/°C for dry wood.</p>'
    + '<p>The rods have the same geometry and steady end temperatures. The factors are illustrative. Warm-up time and heat loss to the room are outside this model. The spoon task explains the initial sensation qualitatively.</p>'
    + '<h2>Saved work</h2><p>Work stays in this browser. The learner and teacher use the same browser profile for review. The public lab uses rule-based feedback. An adult examiner demo can generate a Gemini draft from fixed lab choices and concept flags. Written answers stay in the browser.</p>'
    + actions(link(state.section, 'Return to lab'));
};

function render(focus) {
  const route = location.hash.slice(1);
  active = Object.hasOwn(screens, route) ? route : 'predict';
  const learner = Object.hasOwn(steps, active);
  if (learner) {
    state.section = active;
    save();
  }
  const nav = learner ? `<nav class="steps" aria-label="Lab steps">${Object.entries(steps).map(([id, title]) =>
    `<a href="#${id}" ${id === active ? 'aria-current="step"' : ''}>${title}</a>`).join('')}</nav>` : '';
  const sidebar = ['experiment', 'investigate', 'revise'].includes(active)
    ? panel('Run history', table(state.runs, 'Your measurements')) : '';
  app.innerHTML = nav + (storageError ? note('This browser could not save progress. Keep this tab open to continue.', 'hint') : '')
    + '<div class="' + (sidebar ? 'grid' : '') + '"><article class="panel">' + screens[active]()
    + `<div id="status" role="status" tabindex="-1">${message ? note(message) : ''}</div></article>` + sidebar + '</div>';
  if (focus) app.querySelector(focus)?.focus();
}

function capture(formElement) {
  const values = new FormData(formElement);
  const data = Object.fromEntries(values);
  if (formElement.dataset.form === 'pair') data.fixed = values.getAll('fixed');
  state.drafts[formElement.dataset.form] = data;
  save();
  return data;
}

function feedback(text) {
  message = text;
  save();
  render('#status');
}

function go(route) {
  save();
  location.hash = route;
}

function checkPair(data, retest) {
  const pair = [data.first, data.second].map(id => id.startsWith('sample') ? sample[Number(id.at(-1))] : findRun(id));
  const [first, second] = pair;
  const difference = compare(first, second);
  if (!difference.fair) {
    const id = retest ? 'investigate' : 'pair';
    state.hints[id] = Math.max(state.hints[id] ?? 0, 1);
    return feedback(`These runs show ${watts(first)} and ${watts(second)}. Use the hint to plan another comparison.`);
  }
  if (!pair.some(run => run.material === 'Aluminium') || !pair.some(run => run.material === 'Steel')) {
    return feedback('Use one aluminium rod and one steel rod for this comparison.');
  }
  if (retest) {
    if (!pair.some(run => run.stage === 'investigate')) return feedback('Use at least one new run you made in this step.');
    if (!state.done.investigate) return feedback('Check what changed in the sample pair before saving your retest.');
    state.done.retest = pair;
  } else {
    if (data.fixed.length !== controls.length) return feedback('The two runs match. Check which four conditions stayed the same.');
    state.done.pair = pair;
    state.done.fixed = data.fixed;
  }
  feedback(`You changed only the material. ${first.material} transferred ${watts(first)} and ${second.material} transferred ${watts(second)}. ${retest ? 'Continue to Revise claim.' : 'Continue to Investigate.'}`);
}

app.addEventListener('input', event => {
  const formElement = event.target.closest('form[data-form]');
  if (!formElement || formElement.dataset.form.startsWith('generate-')) return;
  const data = capture(formElement);
  if (event.target.name === 'warm') formElement.querySelector('[data-warm]').textContent = event.target.value || '—';
  if (formElement.dataset.form === 'pair' && ['first', 'second'].includes(event.target.name)) {
    const runs = [findRun(data.first), findRun(data.second)];
    app.querySelector('[data-selected-runs]').innerHTML = runs.every(Boolean)
      ? table(runs, 'Selected setups', state.hints.pair > 1) + chart(runs, 'Compare selected runs') : '';
  }
});

document.querySelector('#new-session').addEventListener('click', () => {
  if (!window.confirm('Start a new session? This clears this browser’s saved predictions, runs, submissions and teacher feedback.')) return;
  pendingDraft?.abort();
  pendingDraft = undefined;
  teacherDrafts.clear();
  state = fresh();
  storageError = false;
  save();
  message = '';
  history.replaceState(null, '', '#predict');
  feedback('A new session is ready.');
  window.scrollTo(0, 0);
});

app.addEventListener('click', event => {
  const hint = event.target.closest('[data-hint]');
  if (!hint) return;
  const id = hint.dataset.hint;
  state.hints[id] = Math.min((state.hints[id] ?? 0) + 1, hints[id].length);
  feedback(state.hints[id] === hints[id].length ? 'Both hints are open above. Try your next step.' : 'A hint is open above.');
});

async function requestDraft(formElement, review) {
  if (!review || pendingDraft) return;
  if (Date.now() < nextRequest) return feedback('Wait a few seconds before asking for another draft. You can use the rule-based draft meanwhile.');
  const code = new FormData(formElement).get('accessCode');
  if (!code || !/^[\x21-\x7e]{16,256}$/.test(code)) return feedback('Enter a valid teacher access code to request a draft.');

  const controller = new AbortController();
  pendingDraft = controller;
  nextRequest = Date.now() + 8000;
  feedback('Requesting a Gemini draft…');
  let result;
  let serviceStatus;
  try {
    const response = await fetch('./api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + code },
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(13000)]),
      cache: 'no-store',
      body: JSON.stringify(feedbackEvidence(review.evidence)),
    });
    serviceStatus = response.status;
    if (response.ok) {
      const data = await response.json();
      if (data.source === 'gemini' && typeof data.draft === 'string' && data.draft.trim() && data.draft.length <= 784) {
        result = { source: 'gemini', text: data.draft };
      }
    }
  } catch {
    // The local rule-based draft is available even if the network fails.
  }
  if (pendingDraft !== controller) return;
  pendingDraft = undefined;
  if (active !== 'teacher' || !state.reviews.includes(review)) return;
  if (result) {
    teacherDrafts.set(review, result);
    return feedback('Gemini draft ready for teacher review.');
  }
  teacherDrafts.delete(review);
  const reason = serviceStatus === 401 ? 'The teacher access code was not accepted.'
    : serviceStatus === 429 ? 'The feedback service has reached its request limit.' : 'Gemini feedback is unavailable.';
  feedback(reason + ' The rule-based fallback is ready for review.');
}

app.addEventListener('submit', event => {
  event.preventDefault();
  const id = event.target.dataset.form;
  if (id.startsWith('generate-')) {
    return requestDraft(event.target, state.reviews.find(review => id === 'generate-' + review.id));
  }
  const data = capture(event.target);
  if (id === 'predict') {
    if (!data.reason.trim()) return feedback('Add a short reason for your prediction.');
    state.done.predict ??= data;
    return go('experiment');
  }
  if (['experiment', 'investigate-rig', 'revise-rig'].includes(id)) {
    const run = simulate(data.material, Number(data.warm));
    state.runs.push({ ...run, id: state.runs.length + 1, stage: active });
    return feedback(`Run ${state.runs.length} saved. ${run.material} transferred ${watts(run)}.`);
  }
  if (id === 'pair' || id === 'retest') return checkPair(data, id === 'retest');
  if (id === 'investigate') {
    state.done.investigate = data.answer;
    if (state.history.at(-1) !== data.answer) state.history.push(data.answer);
    if (data.answer === 'both') return feedback('You spotted two changes. Run a new test to find out what happens when only material changes.');
    state.hints.investigate = Math.max(state.hints.investigate ?? 0, 1);
    return feedback(data.answer === 'steel'
      ? 'Steel gave the higher reading in this pair. Use the hint to check what else could explain it.'
      : 'Check the two setup rows again. A hint is open above.');
  }
  if (id === 'revise') {
    const warm = state.done.retest?.[0].warm;
    if (!warm || !state.done.predict) return feedback('Save your prediction and retest before saving a claim.');
    if (!state.runs.some(run => run.material === 'Dry wood' && run.warm === warm)) return feedback(`Run dry wood with the warm end at ${warm} °C to match your retest.`);
    if (new Set([data.first, data.second, data.third]).size !== 3) return feedback('Choose a different material for each place in your ranking.');
    if (!data.reason.trim()) return feedback('Add two readings with units and explain your claim.');
    state.done.revise = { ...data, wood: state.runs.find(run => run.material === 'Dry wood' && run.warm === warm) };
    return feedback('Your claim is saved. Continue to Explain when you are ready.');
  }
  if (id === 'transfer') {
    if (!data.reason.trim()) return feedback('Add a short explanation about the movement of energy.');
    state.done.transfer = data;
    if (data.temperature === 'steel') {
      state.hints.transfer = Math.max(state.hints.transfer ?? 0, 1);
      return feedback('Your idea is saved. Check the thermometer hint and revise if you want.');
    }
    return feedback(data.temperature === 'same' && data.direction === 'out' && data.feels === 'steel'
      ? 'You matched the starting temperatures and showed energy moving out of your hand. Your teacher will read your explanation.'
      : 'Your explanation is saved. You can use a hint or send it to your teacher.');
  }
  if (id === 'submit') {
    const { predict, pair, fixed, retest, revise, transfer, investigate } = state.done;
    if (!predict || !pair || !retest || !revise || !transfer || !investigate) {
      return feedback('Save your prediction, comparison, retest, revised claim and spoon explanation first.');
    }
    if (revise.wood.warm !== retest[0].warm) return feedback('Update your revised claim to match your latest retest.');
    const evidence = structuredClone({ predict, pair, fixed, retest, revise, transfer, investigation: investigate, history: state.history });
    state.reviews.push({ id: state.reviews.length + 1, evidence });
    return feedback('Your work was sent. Teacher feedback will appear in this notebook.');
  }
  if (id.startsWith('review-')) {
    const review = state.reviews.find(item => id === 'review-' + item.id);
    const override = event.submitter?.value === 'override';
    if (override && !data.override.trim()) return feedback('Write your feedback before sharing an override.');
    const suggestion = suggestedDraft(review);
    review.text = override ? data.override.trim() : suggestion.text;
    review.source = override ? 'teacher' : suggestion.source;
    review.status = override ? 'Overridden' : 'Approved';
    review.outcomes = outcomes.map((_, i) => data['outcome' + i]);
    return feedback(`Feedback shared for submission ${review.id}.`);
  }
});

window.addEventListener('hashchange', () => {
  if (active === 'teacher') {
    pendingDraft?.abort();
    pendingDraft = undefined;
    teacherDrafts.clear();
  }
  message = '';
  render('h1');
  window.scrollTo(0, 0);
});
render();
