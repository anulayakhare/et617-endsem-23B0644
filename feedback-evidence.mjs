import { materials, settings, simulate, sample } from './lab.mjs';

// Only fixed choices, settings and concept flags cross the network.
export function feedbackEvidence({ predict, pair, fixed, retest, revise, transfer, investigation, history }) {
  const runs = rows => rows.map(({ material, warm }) => [material, warm]);
  const rates = [...retest, revise.wood].map(run => run.rate);
  const cited = [...revise.reason.matchAll(/\b(\d+(?:\.\d+)?)\s*(?:watts?\b|W\b)/gi)].map(match => Number(match[1]));
  return {
    prediction: predict.material,
    predictionMentionsConduction: /\b(conduct\w*|heat|energy)\b/i.test(predict.reason),
    pair: runs(pair),
    retest: runs(retest),
    identifiedControls: fixed.length,
    investigation,
    previouslyChoseSteel: history.includes('steel'),
    ranking: [revise.first, revise.second, revise.third],
    handle: revise.handle,
    revision: revise.decision,
    matchedReadingsMentioned: new Set(cited.filter(rate => rates.includes(rate))).size,
    claimMentionsTemperature: /\b(temperature|warm.end|hot.end)\b/i.test(revise.reason),
    spoonFeels: transfer.feels,
    spoonTemperature: transfer.temperature,
    spoonDirection: transfer.direction,
    explanationMentionsRate: /\b(faster|slower|quickly|rate|conduct\w*)\b/i.test(transfer.reason),
  };
}

export function validateEvidence(data) {
  const material = value => typeof value === 'string' && Object.hasOwn(materials, value);
  const reading = row => Array.isArray(row) && row.length === 2 && material(row[0]) && settings.includes(row[1]);
  const pair = rows => Array.isArray(rows) && rows.length === 2 && rows.every(reading);
  const count = (value, max) => Number.isInteger(value) && value >= 0 && value <= max;
  const boolean = value => typeof value === 'boolean';
  if (!data || !material(data.prediction) || !pair(data.pair) || !pair(data.retest)
    || !count(data.identifiedControls, 4) || !['steel', 'both', 'material'].includes(data.investigation)
    || !Array.isArray(data.ranking) || data.ranking.length !== 3 || !data.ranking.every(material)
    || new Set(data.ranking).size !== 3 || !material(data.handle) || !['Kept', 'Revised'].includes(data.revision)
    || !count(data.matchedReadingsMentioned, 3)
    || !['steel', 'wood', 'same'].includes(data.spoonFeels) || !['steel', 'wood', 'same'].includes(data.spoonTemperature)
    || !['out', 'in', 'none'].includes(data.spoonDirection)
    || ![data.predictionMentionsConduction, data.previouslyChoseSteel, data.claimMentionsTemperature,
      data.explanationMentionsRate].every(boolean)) throw new TypeError('Invalid lab evidence');

  const readings = rows => rows.map(([material, warm]) => simulate(material, warm));
  const retest = readings(data.retest);
  return {
    prediction: data.prediction,
    predictionMentionsConduction: data.predictionMentionsConduction,
    fairTestReadings: readings(data.pair),
    retestReadings: retest,
    comparisonWood: simulate('Dry wood', retest[0].warm),
    sampleReadings: sample,
    identifiedControls: data.identifiedControls,
    sampleAnswer: data.investigation,
    previouslyChoseSteel: data.previouslyChoseSteel,
    ranking: data.ranking,
    handle: data.handle,
    revision: data.revision,
    matchedReadingsMentioned: data.matchedReadingsMentioned,
    claimMentionsTemperature: data.claimMentionsTemperature,
    spoonFeels: data.spoonFeels,
    spoonTemperature: data.spoonTemperature,
    spoonDirection: data.spoonDirection,
    explanationMentionsRate: data.explanationMentionsRate,
  };
}
