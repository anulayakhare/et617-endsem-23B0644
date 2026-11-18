export const materials = { Aluminium: 0.20, Steel: 0.10, 'Dry wood': 0.005 };
export const settings = [40, 50, 70];
export const cool = 20;

export function simulate(material, warm) {
  if (!Object.hasOwn(materials, material) || !settings.includes(warm)) {
    throw new RangeError('Choose a lab material and a warm-end setting.');
  }
  return { material, warm, cool, rate: materials[material] * (warm - cool) };
}

export const watts = run => run.rate.toFixed(2) + ' W';
export const sample = [simulate('Steel', 70), simulate('Aluminium', 40)];
export const controls = ['Warm-end temperature', 'Cool-end temperature', 'Rod length', 'Rod thickness'];

export function compare(first, second) {
  return {
    materialChanged: first.material !== second.material,
    warmChanged: first.warm !== second.warm,
    fair: first.material !== second.material && first.warm === second.warm,
  };
}

export function draftFeedback(evidence) {
  const { pair, fixed, investigation, transfer, history } = evidence;
  const fair = compare(...pair).fair && fixed.length === controls.length;
  const lines = [fair
    ? `Your settings match. You measured ${watts(pair[0])} for ${pair[0].material} and ${watts(pair[1])} for ${pair[1].material}. Use those readings to support your claim.`
    : 'Check the four conditions that should match when you compare materials. Look at your pair before revising.'];
  if (investigation === 'steel' || history.includes('steel')) {
    lines.push(investigation === 'steel'
      ? 'Look at the steel and aluminium setups. Which settings changed? Pick a shared warm-end temperature and use your new readings to explain your choice.'
      : 'You revisited the higher steel reading. Explain how matching the warm-end temperatures helped you test the effect of material.');
  } else if (investigation === 'both') {
    lines.push('You spotted that both the material and the warm-end temperature changed. Your retest lets you compare the materials under matching conditions.');
  } else {
    lines.push('Read both columns of the sample again. Which material and warm-end setting does each run use?');
  }
  if (transfer.temperature === 'steel') {
    lines.push('Compare the two thermometer readings before touch. Your hand is warmer than both spoons. Which way would energy move, and which spoon could take it faster?');
  } else if (transfer.temperature === 'same' && transfer.direction === 'out' && transfer.feels === 'steel') {
    lines.push('Both spoons start at 25 °C. Energy moves from your warmer hand into both, and steel usually draws it away faster. Check that your explanation connects the faster transfer to the cooler feeling.');
  } else {
    lines.push('Check the starting temperatures and point from the warmer object to the cooler objects. Then explain how the transfer rate affects what your hand feels.');
  }
  return lines.join('\n\n');
}
