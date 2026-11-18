# ET617 design checkpoint · Heat conduction in different materials

## Identity card

| Field | Selection |
| --- | --- |
| Roll number | 23B0644 |
| Examination card | P5-T9-L5-C5 |
| P5 | Inquiry-based virtual laboratory |
| T9 | Heat conduction in different materials, Class 7 |
| L5 | Anxious repeat learner |
| C5 | Teacher-in-the-loop |

## D1 · Educational problem and learning outcomes

A Class 7 learner repeating heat conduction may remember that metals are good conductors yet still judge which material transfers heat faster by how cold it feels. A comparison can reinforce that confusion if the learner changes both the material and the temperature difference in the same run. The virtual lab lets the learner make a private prediction, compare simulated measurements, and revise a claim using a fair test. A teacher reviews the learner's reasoning and controls the release of personalized feedback.

**Context of use.** A 20-minute science support period at school, using a shared tablet in a browser. The learner works individually at their own pace while the science teacher checks submissions from a laptop. If review takes longer than the period, the learner can read the approved feedback at the next check-in.

| Outcome | Observable success criterion |
| --- | --- |
| O1 · Design a fair comparison of heat conduction in two materials. | Save two runs that differ only in material and identify the need to keep rod length, thickness and both end temperatures equal across runs. |
| O2 · Interpret results and revise a hypothesis. | Rank all three materials by simulated heat-transfer rate under matched conditions, cite two readings with units, and explain why an earlier comparison with two changed variables cannot isolate the effect of material. Record whether the original prediction was kept or revised and why. |
| O3 · Explain conduction in a new situation. | In a room-temperature touch example, state that both objects can have the same temperature, identify the direction of heat transfer, and explain the different sensations by comparing how quickly the materials draw heat from the hand. |

## D2 · Learner persona

**Mira Jadhav** is a fictional 12-year-old Class 7 learner who is repeating this topic after an unsuccessful assessment. She reads a thermometer in °C, can subtract temperatures and can order numbers in a table. She remembers that a metal spoon warms in soup, but she tends to describe heat and temperature interchangeably. When she sees an unexpected result, she often erases her first answer and waits for the teacher to tell her what to write.

Mira uses a shared school tablet for about 20 minutes during a science support period. She speaks Marathi at home and studies science in English. Short English prompts, consistent labels such as “warm end” and “cool end,” and a sentence starter help her explain what she sees. She wants to understand why the steel and wooden spoons in her kitchen feel different and to explain it in her own words. Predictions are private to Mira and her teacher. She can pause, ask for a hint, and revise without a timer or score penalty. Her notebook keeps earlier attempts visible so she can see what changed.

| Misconception | What would reveal it | Experience that addresses it |
| --- | --- | --- |
| M1 · If steel feels colder than wood, the steel must be at a lower temperature. | Mira selects “steel is colder” even when thermometers show both objects at 25 °C. | Compare thermometer readings before touch, then reason about energy moving from a warmer hand into both materials at different rates. |
| M2 · A higher measured rate proves that the material is a better conductor, even when heating conditions differ. | Mira compares steel at 70 °C with aluminium at 40 °C and uses the higher rate for steel as proof about the materials. | Retest the same two materials with matching end temperatures and compare the new readings with the first pair. |

## D3 · Educational content and activity plan

### Driving question and concept

**Which material should cover the part of a hot-pan handle you hold? How could we test your choice?**

Learner-facing explanation after the initial prediction: “When one end of a rod is warmer than the other, energy travels through the rod from the warmer end to the cooler end. This is conduction. The heat-transfer rate tells us how much energy moves each second. A reading of 2 watts means 2 joules each second. We can compare materials fairly by using rods of the same size and keeping their warm and cool ends at the same temperatures in each run.”

### Virtual lab model

- **Change:** choose aluminium, steel or dry wood. Set the warm end to 40, 50 or 70 °C.
- **Keep fixed:** the cool end stays at 20 °C. All rods have equal length and cross-sectional area. A labelled diagram shows both ends and an arrow from warm to cool.
- **Measure:** each run returns the simulated heat-transfer rate in watts once the rate is steady. The notebook records both end temperatures, material and rate. Selected runs appear side by side with differences marked in text.
- **Model:** for fixed geometry, steady heat-transfer rate is proportional to the material's thermal conductivity and to the temperature difference between the ends. The simulation uses illustrative rate factors of 0.20 W/°C for aluminium, 0.10 W/°C for steel and 0.005 W/°C for dry wood. Multiply the factor by the warm-end temperature minus 20 °C. These are teaching values for the virtual rods. The model holds both end temperatures constant and omits heat loss to the air and warm-up time.

| Material | Warm end 40 °C | Warm end 50 °C | Warm end 70 °C |
| --- | ---: | ---: | ---: |
| Aluminium | 4.00 W | 6.00 W | 10.00 W |
| Steel | 2.00 W | 3.00 W | 5.00 W |
| Dry wood | 0.10 W | 0.15 W | 0.25 W |

This table is the design reference. Learners see readings from runs they have made. In the touch example, a warmer hand and equal room-temperature objects establish the direction of heat flow. That example uses qualitative reasoning about the initial heat transfer during contact. The rod's steady rates do not predict skin cooling times.

### Learning sequence

| Time and format | Learner task | Model response or observable action |
| --- | --- | --- |
| 0–3 min · Choice with a short reason | **1. Predict.** Which of the three materials would transfer energy fastest through equal-sized rods with both end temperatures matched across runs? Save “I predict ___ because ___.” | Aluminium is the expected prediction for this simulation. Any initial prediction is saved as a hypothesis to test. |
| 3–6 min · Interactive setup | **2. Plan and run.** Compare aluminium and steel. Choose a warm-end setting for each rod, save both runs, and name the conditions you held fixed. | Both warm ends at 50 °C and both cool ends at 20 °C, with equal rod lengths and thicknesses. The saved rates are 6.00 W and 3.00 W. Any shared warm-end setting is valid. |
| 6–10 min · Evidence choice and interactive retest | **3. Investigate a surprising result.** A notebook entry shows steel at 70 °C transferring 5.00 W and aluminium at 40 °C transferring 4.00 W. Can this pair tell us which material conducts better? Mark what changed, then run a pair that can answer the question. | Both material and warm-end temperature changed. Keep one run and match the other to it, or choose a common new setting. At 50 °C, aluminium transfers 6.00 W and steel 3.00 W. |
| 10–15 min · Data interpretation and written claim | **4. Extend and revise.** Add dry wood at the matched setting. Rank the three rods, cite two readings, and say whether you kept or revised your prediction. Use the evidence to pick a handle covering from the three materials. | At 50 °C, aluminium (6.00 W), steel (3.00 W), dry wood (0.15 W), from fastest to slowest. Dry wood is the choice for reducing conduction in this comparison. The learner links “I kept…” or “I revised…” to the matched data and explains why the earlier pair was inconclusive. |
| 15–20 min · Choice and written transfer explanation | **5. Explain a new situation.** A steel spoon and a wooden spoon have both been in the same room for hours. Both thermometers read 25 °C. Your hand is warmer. Which feels cooler at first, and what moves where? | The steel spoon typically feels cooler. Energy moves from the warmer hand into both spoons. Under comparable contact, steel draws energy from the hand faster, causing a stronger cooling sensation, although both spoons started at the same temperature. |

The learner exits by submitting the fair-test pair, revised claim and transfer explanation for teacher review. The teacher uses the criteria in D1 to mark each outcome as demonstrated or to suggest one specific revision.

### Feedback and recovery from an unsuccessful experiment

| Learner evidence | Learner-facing response |
| --- | --- |
| Correct reasoning supported by a matched pair | “Your rods had matching end temperatures, length and thickness. You used 6.00 W and 3.00 W to show which rod transferred more energy each second. Use that same setup to test the wooden rod.” Use the learner's own matched readings when they choose a different setting. |
| M1 · “The steel spoon started colder.” | “Look at the two thermometer readings before your hand touches the spoons. What temperature do they show? Your hand is warmer than both spoons. Draw an arrow to show where energy moves. Which spoon could take energy from your hand faster?” After revision, confirm the shared starting temperature and connect the sensation to the different rates of energy transfer. |
| M2 · “Steel must conduct better because 5.00 W is greater than 4.00 W.” | “5.00 W is higher for that pair. Put the two setups side by side. Which settings changed? Keep the steel run and decide which warm-end setting to use for aluminium so the two runs test material.” After the retest, ask the learner to cite the new readings and explain whether the first conclusion still holds. |

The unsuccessful pair stays in the notebook with its measurements. The first prompt asks the learner to spot differences. If a further hint is requested, the lab highlights the two warm-end settings and asks the learner to choose a shared value. Both supports leave the new result to be discovered through a retest. A learner who already notices the confound can proceed directly to the retest. This keeps revisions part of inquiry and makes progress visible to Mira.

### Teacher review in the activity

The teacher view shows each learner's activity stage, saved runs, initial and revised claims, transfer response and outcome evidence. It also shows the proposed AI feedback beside the source response and simulation readings. The system can suggest a question or flag a possible misconception from that evidence. The teacher can approve the draft or replace it with their own wording before it appears in the learner's notebook. For an ambiguous answer, the teacher can ask the learner to clarify before assigning an outcome.

Simulation readings and preset prompts about comparing settings are available immediately. Personalized feedback remains pending until the teacher acts, and the learner can continue experimenting while it is pending. If the draft is missing or inaccurate, the teacher can start from the feedback examples above or write a new message. Feedback is attached to the submission version the teacher reviewed so the learner can match it to the corresponding attempt.
