# CLAUDE.md: Project context (read this first)

## What we're building
**[PRODUCT NAME]**: a camera-free, wearable-free fall detection system for senior living. It uses WiFi signals (CSI: Channel State Information, which measures how a body disturbs the WiFi signal) read by ESP32 boards, plus an AI classifier, to detect when a resident falls and doesn't get up (a "long lie"). A caregiver dashboard shows live room status and pushes an instant alert with the room, the time, and a "no movement for X seconds" counter. The same dashboard shows which rooms are occupied during a fire evacuation.

Pitch line: "No pendant, no camera, no new device per room. The WiFi that's already there notices when someone falls and doesn't get up, and alerts staff right away."

- **Why:** CDC counts about 37M falls, 9M fall injuries, and 3M ED visits among older adults each year. In a study of people over 90, 30% had lain on the floor for an hour or more, and call alarms were usually not used. (Verify and link sources before they appear on the site.)
- **First customer:** memory care and assisted living operators. Buyer = Executive Director or Director of Nursing. Reached through nurse-call system companies (e.g., Austco, TekTone). Later: independent living, then families of seniors aging at home (via internet providers).
- **Competitors to name before judges do:** Vayyar, Butlr (radar/thermal sensors), Cognitive Systems, Origin Wireless (WiFi sensing). Our edge: runs on WiFi, no camera, no wearable, no new hardware per room.

## Event and hard constraints (CPVC AI Hackathon at Cal Poly; Discord overrides the guide)
Guide: https://cpvc-ai-hackathon-guide.vercel.app/

- Team of 3 (Anthony, a business student, a mechanical engineering student). Roster is locked.
- Everything demoed must be built **Fri 5:00 PM to Sun 12:00 PM**. New repo only. No reused work. Building at home overnight is OK (team confirmed; buildings just close at 9:45 PM).
- Deadlines: **Sat 2:00 PM** project link (repo showing history). **Sat 8:00 PM** Sunday commit form with a live link judges can open. **Sun 12:00 PM** final submission; after noon only setup, no features or fixes. Be in the judging room by 12:55 PM. Room judging 1-3 PM; finals start 4:10 PM.
- Demo is **4 minutes live on our own laptop**, then 3 minutes of questions. What we show must match the noon submission.
- Open-source libraries and public datasets are allowed if credited and licensed. We must use AI somewhere in the build and disclose AI tools honestly.
- **Never delete commits, project versions, or AI chats.** No squashing history. Commit small and often with clear messages. No secrets or API keys in the repo.
- **Disqualifiers:** building before Fri 5 PM, outsiders building, made-up users or fake traction, false AI disclosures, collecting sensitive data, tools meant to deceive or surveil.

### How we're judged (100 pts)
| Criterion | Pts | Notes |
|---|---|---|
| Execution & design | 25 | Works live, **nothing faked**, looks like a real product |
| Real problem, real user | 25 | Specific person, real proof of demand (real conversations only) |
| Path to customers | 20 | Clear payer, reason to switch, specific first channels |
| Pitch & demo | 15 | Live demo of one user's path, honest answers |
| Creative use of AI | 15 | The product must depend on the AI |

Room ties go to the higher "Real problem" score, then "Execution & design."

## Honesty and wording rules (these affect the code and the copy)
- No invented testimonials, customer logos, user counts, "trusted by" claims, or press.
- Say "detects possible falls" and "alerts staff faster." Never claim to prevent deaths or to be a medical device. Footer: "Prototype. Not a medical device."
- Privacy-first framing: no cameras, no microphones, no wearables, no identity, alerts only. Avoid surveillance language ("see through walls", "track people").
- Rooms are identified by number only ("Room 104"). No resident names, photos, or health data anywhere. The pilot form collects only name, work email, facility, role, number of rooms, and an optional message.
- Any sample or simulated data must be visibly labeled (a "SAMPLE DATA" / "SIMULATED" / "REPLAY" badge). Real sensor data is "LIVE."
- Accuracy numbers must be real. **Split train/test by recording take, not by random windows**, otherwise accuracy is inflated. Placeholder metrics must be labeled "PLACEHOLDER."

## Hardware
- 3x ESP32-WROOM-32U (classic ESP32, U.FL antenna connector, no onboard antenna): one sender, one or two receivers, one spare.
- **2.4 GHz U.FL antennas arrive about Sat 10:30 AM.** Until then, only short-range pipeline tests (low TX power); do not record real training data without antennas.
- HC-SR501 PIR sensor as a backup motion/presence signal. USB data cables, a power strip, a laptop, and an exercise mat for safe demo falls.
- Not usable: RuView / WiFi-DensePose firmware (needs ESP32-S3, and its pose claims are unproven). Do not cite its accuracy.

## Status and plan
- **Fri night:** website skeleton on sample data (no hardware connection). Toolchain install (ESP-IDF 5.4+), flash sender/receiver, receiver script, dashboard shell. Business teammate starts real customer outreach (individual calls/emails, not campus lists).
- **Sat morning:** antennas at about 10:30. Place and tape down boards at the demo spot; do not move them afterward.
- **Sat 11:00-1:00:** record 20-30 labeled takes per class, including falls onto the mat.
- **Sat 1:00-2:00:** train, commit, submit the 2 PM project link.
- **Sat 2:00-5:00:** live inference into the dashboard; tune fall thresholds with repeated test falls; connect the live sensor feed to the dashboard.
- **Sat 5:00-8:00:** record replay session, deploy the public site in REPLAY mode, file the 8 PM commit form.
- **Sat night:** rehearse the 4-minute demo; optional backup video (under 2 min).
- **Sun morning:** freeze the build early. Rehearse. Submit before noon.

## Placeholders still to fill in
Product name, team names and roles, pilot price (team decides), source links for the two statistics, AI tools used (credits page), real model metrics, real recorded demo data.

## Working rules for Claude Code in this repo
- Commit small and often, with clear messages. Never rewrite or delete history.
- Prefer finishing a working, good-looking vertical slice over adding breadth. If time is short, prioritize: look and feel, then marketing homepage, then login and dashboard alert flow, then secondary pages.
- Never fabricate data or claims. Label anything that isn't real.
- Keep secrets in environment variables, never in the repo.
- Credit every open-source dependency and every AI tool used.
- If unsure about a rule, ask rather than guess; the cost of a disqualification is far higher than the cost of a question.
