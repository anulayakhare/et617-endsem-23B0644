# D6 · Gemini teacher feedback

**ET617 · P5-T9-L5-C5 · 23B0644**

## Purpose and scope

Gemini drafts a short, supportive response for adult teacher review in the protected examiner demo. It uses evidence from one saved submission and suggests one next step. The scientific simulation, progressive hints, and outcome assessment run independently of Gemini. The Class 7 public app uses the rule-based fallback. The protected preview is for adults using synthetic submissions. [Gemini API age and unpaid-service terms](https://ai.google.dev/gemini-api/terms)

## Model call

The Vercel Node.js function at `POST /api/feedback` invokes `gemini-3.1-flash-lite` with Gemini's `v1beta` `generateContent` API. Google lists free text input and output for this model, subject to project eligibility and quota. The server sends the key as the `x-goog-api-key` header. It requests JSON with a temperature of 0.25, minimal thinking, up to 450 output tokens and a 10-second API timeout. The executable call and validator are in [server/gemini.mjs](server/gemini.mjs). [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.1-flash-lite)

The following is the system prompt sent by the function.

```text
Write a teacher-review draft addressed to a Class 7 learner repeating a heat conduction lab. Use warm, plain English, short sentences and one practical next step. Treat predictions as ideas to test. Never score, judge, or infer the learner's feelings or identity.
Use the supplied evidence only. Rate is in watts, temperatures are in degrees Celsius, and energy flows from warm to cool. Compare materials only when rod size and both end temperatures match. For matching settings the virtual rods rank aluminium, steel, dry wood from fastest to slowest. Dry wood slows conduction the most in this comparison.
sampleAnswer "steel" suggests M2: a higher unmatched reading was treated as proof. Ask what changed and how the matched retest helps. "both" means the learner spotted both changes; acknowledge that even if the learner previously chose steel. "material" calls for checking both columns. Cite at least one supplied reading with its unit and material, and never invent numbers.
spoonTemperature "steel" suggests M1: cooler feeling was treated as lower starting temperature. Prompt the learner to compare the two 25 °C readings before touch. Otherwise, acknowledge equal starting temperature only for "same". spoonDirection "out" means from the warmer hand into both cooler spoons; "in" is the reverse and "none" means no transfer. Steel typically feels cooler at first because energy leaves the hand faster. Concept flags mean a word or reading was mentioned; they cannot verify the quality of an explanation. Ask for clarification when needed.
Return JSON with exactly three plain-text strings: investigation, spoon, nextStep. Keep each field at 260 characters or less. Use a neutral question if the evidence is incomplete. No markdown, links, grades or personal data.
```

The user message consists of the JSON produced by `JSON.stringify(evidence)`. The server builds it from validated selections and recomputes watts using the unchanged lab model. This example uses a synthetic submission.

```json
{
  "prediction": "Steel",
  "predictionMentionsConduction": true,
  "fairTestReadings": [
    {"material":"Aluminium","warm":50,"cool":20,"rate":6},
    {"material":"Steel","warm":50,"cool":20,"rate":3}
  ],
  "retestReadings": [
    {"material":"Aluminium","warm":50,"cool":20,"rate":6},
    {"material":"Steel","warm":50,"cool":20,"rate":3}
  ],
  "comparisonWood":{"material":"Dry wood","warm":50,"cool":20,"rate":0.15},
  "sampleReadings":[
    {"material":"Steel","warm":70,"cool":20,"rate":5},
    {"material":"Aluminium","warm":40,"cool":20,"rate":4}
  ],
  "identifiedControls":4,
  "sampleAnswer":"steel",
  "previouslyChoseSteel":true,
  "ranking":["Aluminium","Steel","Dry wood"],
  "handle":"Dry wood",
  "revision":"Revised",
  "matchedReadingsMentioned":2,
  "claimMentionsTemperature":true,
  "spoonFeels":"steel",
  "spoonTemperature":"steel",
  "spoonDirection":"out",
  "explanationMentionsRate":false
}
```

## Validation, privacy and fallback

- The browser extracts fixed choices, concept flags and a count of cited simulated rates. Names, identifiers, free-text explanations and the roll number stay out of the request. The teacher can read full explanations in the local dashboard. The server allows only known choices and numeric settings and sends only its reconstructed evidence to Google.
- The function accepts only JSON POSTs up to 2,048 bytes and compares a teacher access code server-side. Its one-minute window permits at most four requests per client and twelve per warm instance. The browser allows one in-flight request and an eight-second interval between starts. Instance limits reset on cold starts and are independent across instances. Gemini's project quota also applies.
- The function requires a completed response and exactly three plain-text fields of 12–260 characters each. It rejects links, markup delimiters, control characters and watt figures absent from the supplied readings. These checks cannot establish whether a figure is attributed to the right material or whether the reasoning is sound. The teacher checks wording, scientific accuracy and fit before publishing.
- An unavailable service, missing configuration, rejected request, timeout, quota error or invalid response leaves the existing **Rule-based fallback** available. This includes distinct responses for M1 and M2. The teacher can approve either draft source or write an override and assess O1–O3. A submission starts **Pending**, changes to **Approved** when the draft is released, and becomes **Overridden** if the teacher shares their own wording. The notebook shows only released feedback and its source.
- Unapproved Gemini drafts are held in memory in the teacher view and cleared when leaving it. Saved and approved work stays in `localStorage`. The teacher code is used for the current request and stays out of local storage. This is a single-browser classroom prototype. The existing public teacher controls simulate review locally, while the adult preview uses Vercel Authentication and a separate code for the Gemini endpoint.

## Vercel setup

1. Open `et617-23b0644` in Vercel and check **Settings → Git** for `anulayakhare/et617-endsem-23B0644`. Connect it if needed. If you are setting up the project from scratch, import that repository with the name `et617-23b0644`. Use the repository root. The repository's `vercel.json` builds the static app and deploys its Node function. The GitHub Pages backup continues to serve the static app. [Vercel project settings](https://vercel.com/docs/project-configuration/general-settings)
2. Open **Settings → Deployment Protection** and select **Vercel Authentication → Standard Protection**. Restrict preview access to adult examiners. Check the preview URL in a private browser window before adding a key. It should require Vercel authentication. [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection)
3. In **Settings → Environment Variables**, add `GEMINI_API_KEY` as **Sensitive**, scoped to **Preview** only. Paste the value into Vercel from your password manager or Google AI Studio. Add a separate `TEACHER_ACCESS_CODE` the same way, using at least 16 random printable characters without spaces. Keep both values in your password manager. Enable Vercel's system environment variables so `VERCEL_ENV` identifies Preview at build and runtime. [Sensitive variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables)
4. Create or redeploy a protected Preview. The production deployment and GitHub Pages use rules. In the preview, complete the lab with synthetic answers, submit, open **Teacher dashboard**, enter the teacher code and select **Generate Gemini draft**. Check the draft and its source, then approve or override it. In the notebook, verify the decision, source and outcomes. [Vercel Preview environments](https://vercel.com/docs/deployments/environments)

## Viva walkthrough

Use aluminium and steel at 50 °C to get 6.00 W and 3.00 W. Contrast them with the sample pair where both the material and warm end changed. For the misconception path, choose steel as the better conductor from the unmatched sample and choose that steel started colder in the spoon task. Open the hints, complete a fair retest and submit. In the teacher view, show why the Gemini draft is a suggestion and how an override changes the notebook. Use GitHub Pages to demonstrate the fallback. The two original material factors and the wood factor remain in `lab.mjs`. The chart shares a 0–10 W scale and exposes each measured value as text.

Run `node --test tests/feedback.test.mjs` for the offline checks. To also make real HTTPS requests, set `RUN_LIVE_GEMINI=1` in a shell that already has `GEMINI_API_KEY` and rerun the tests. The live check uses two synthetic submissions and asserts successful, validated Gemini responses through the HTTP handler.
