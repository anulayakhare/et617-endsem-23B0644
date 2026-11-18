export const model = 'gemini-3.1-flash-lite';

export const prompt = `Write a teacher-review draft addressed to a Class 7 learner repeating a heat conduction lab. Use warm, plain English, short sentences and one practical next step. Treat predictions as ideas to test. Never score, judge, or infer the learner's feelings or identity.
Use the supplied evidence only. Rate is in watts, temperatures are in degrees Celsius, and energy flows from warm to cool. Compare materials only when rod size and both end temperatures match. For matching settings the virtual rods rank aluminium, steel, dry wood from fastest to slowest. Dry wood slows conduction the most in this comparison.
sampleAnswer "steel" suggests M2: a higher unmatched reading was treated as proof. Ask what changed and how the matched retest helps. "both" means the learner spotted both changes; acknowledge that even if the learner previously chose steel. "material" calls for checking both columns. Cite at least one supplied reading with its unit and material, and never invent numbers.
spoonTemperature "steel" suggests M1: cooler feeling was treated as lower starting temperature. Prompt the learner to compare the two 25 °C readings before touch. Otherwise, acknowledge equal starting temperature only for "same". spoonDirection "out" means from the warmer hand into both cooler spoons; "in" is the reverse and "none" means no transfer. Steel typically feels cooler at first because energy leaves the hand faster. Concept flags mean a word or reading was mentioned; they cannot verify the quality of an explanation. Ask for clarification when needed.
Return JSON with exactly three plain-text strings: investigation, spoon, nextStep. Keep each field at 260 characters or less. Use a neutral question if the evidence is incomplete. No markdown, links, grades or personal data.`;

const fields = ['investigation', 'spoon', 'nextStep'];
const schema = {
  type: 'object',
  properties: Object.fromEntries(fields.map(field => [field, { type: 'string' }])),
  required: fields,
  additionalProperties: false,
};

function validateOutput(payload, evidence) {
  const candidate = payload?.candidates?.[0];
  if (candidate?.finishReason !== 'STOP') throw new Error('Incomplete response');
  const parts = candidate.content?.parts?.filter(part => !part.thought);
  const result = JSON.parse(parts?.map(part => part.text).join('') ?? '');
  if (!result || Object.keys(result).length !== fields.length || !fields.every(field => {
    const value = result[field];
    return typeof value === 'string' && value.trim().length >= 12 && value.length <= 260
      && !/[<>\x00-\x1f\x7f]|https?:|www\./i.test(value);
  })) throw new Error('Invalid AI draft');

  const text = fields.map(field => result[field].trim()).join('\n\n');
  const readings = [...evidence.fairTestReadings, ...evidence.retestReadings, ...evidence.sampleReadings, evidence.comparisonWood];
  const rateMentions = [...text.matchAll(/\b(\d+(?:\.\d+)?)\s*(?:watts?\b|W\b)/gi)];
  if (!rateMentions.length || rateMentions.some(match => !readings.some(run => run.rate === Number(match[1])))) {
    throw new Error('Unsupported rate');
  }
  return text;
}

export async function generateFeedback(evidence, key, request = fetch) {
  const response = await request(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    signal: AbortSignal.timeout(10000),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: prompt }] },
      contents: [{ role: 'user', parts: [{ text: JSON.stringify(evidence) }] }],
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 450,
        thinkingConfig: { thinkingLevel: 'minimal' },
        responseMimeType: 'application/json',
        responseJsonSchema: schema,
      },
    }),
  });
  if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
  return validateOutput(await response.json(), evidence);
}
