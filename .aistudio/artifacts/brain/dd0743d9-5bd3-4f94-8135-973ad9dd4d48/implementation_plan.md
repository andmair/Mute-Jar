# Mute Jar — Automated Meeting Mute-Speaking Tally & Monthly Pledge Jar

A lightweight, privacy-first meeting companion that automatically detects whenever you speak while muted in a meeting using dual-channel device audio monitoring, deposits cartoonish animated "MuteCoins" into a customizable glass jar with sound effects, and turns meeting slip-ups into positive monthly charity donations, team pledges, and personal goals tailored to your chosen **"Mute Philosophy" persona**.

> [!IMPORTANT]
> **User Review & Confirmed Decisions (Revised)**
> - **Charity Aggregators & Custom URL Option**:
>   - *Global Priorities First*:
>     1. **GlobalGiving** (`globalgiving.org`): Vetted grassroots projects across 175+ countries.
>     2. **Every.org** (`every.org`): Tech-forward giving platform supporting 1M+ non-profits with 0% platform fees.
>     3. **PayPal Giving Fund** (`paypal.com/givingfund`): Trusted global platform with 100% donation pass-through.
>   - *Regional Leaders*:
>     4. **JustGiving** (`justgiving.com`): UK & European leader with automated Gift Aid.
>     5. **GiveNow** (`givenow.com.au`): Australia's premier DGR community giving platform.
>     6. **CanadaHelps** (`canadahelps.org`): Canada's leading charity aggregator.
>     7. **Benevity** (`benevity.com`): Global corporate matching & workplace giving.
>   - *Custom Charity of Choice*: Dedicated URL input where the user can enter their own charity's direct donation link with automated title and domain preview.
> - **Pledge & Goal Action Tracker**:
>   - Interactive accountability tracker for work and personal pledges:
>     - **Status Pipeline**: `Pending Action` ➔ `In Progress` ➔ `Actioned / Completed`.
>     - **When & How**: Logs exact action date/timestamp, action notes/reflection (e.g. *"Took design team out for coffee & sprint retro"* or *"Did 45 pushups across 3 workouts"*), and optional completion link/photo note.
>     - **Accountability Ledger**: Visual archive of past months' completed pledges with streak tracker.
> - **Privacy Statement & Tickbox Consent (Mandatory Onboarding Step)**: An explicit, transparent privacy pledge with a required confirmation tickbox before audio monitoring can be activated (Local Storage Only, In-Memory Voice Energy Analysis, Zero Recording / Zero Transcription).
> - **Onboarding "Mute Philosophy" (3 Curated Personas)**: "The Saint" (Charity & Giving), "The Pragmatist" (Growth & Productivity), "The Roast Master" (Humor & Team Fun).
> - **Zero Hotkeys / 100% Automated Audio Detection**: Runs automatically via microphone Voice Activity Detection (VAD) coupled with meeting audio monitoring.
> - **Frictionless "Oops, I was unmuted" Grace Period**: 5-second automatic undo toast on every detected mute coin drop.
> - **Visual Aesthetic**: Playful, cartoonish glass jar with rich visual depth, wobbling physics-inspired coin drops, persona emblem sticker on the glass, and synthesized chime sound effects (with instant toggle/volume control).

---

## 1. Overview & Core Concept

- **What It Does**: Operates fully automatically in the background without requiring local administrative software installation or meeting bot invites. It uses browser audio APIs to monitor microphone and speaker activity. When it detects speech from the user during an active meeting, it logs a "mute incident", plays a satisfying coin clink, and animates a cartoon MuteCoin falling into the glass jar.
- **Privacy & Safety Guarantees**: A strict privacy-first architecture with upfront informed consent. Zero audio eavesdropping, zero cloud audio transit, and zero transcription. All data remains inside the user's browser sandbox.
- **Target Audience / Persona**: Remote and hybrid professionals across Zoom, Google Meet, Microsoft Teams, Webex, and Slack who want a fun, effortless way to track and curb speaking while muted.
- **Key Value**: Hands-free operation, strict client-side privacy, direct integration with top global and regional charities (plus custom charity URLs), and full accountability tracking for personal habits and team pledges.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Onboarding: Privacy Consent & Mute Philosophy Setup**:
   - **Step 1: Privacy Pledge & Consent Modal**:
     - Visual badge: 🔒 *Zero-Audio-Recording Guarantee*.
     - Explicit disclosure: Local Storage Only; In-Memory Voice Energy; Not a Transcription Tool.
     - **Mandatory Tickbox**: *"I understand that Mute Jar does not record or transcribe audio, and I consent to local in-memory voice activity monitoring."*
   - **Step 2: Choose Your "Mute Philosophy"**:
     - 🕊️ **The Saint**: Charity & global impact focus.
     - ⚡ **The Pragmatist**: Habit formation & personal goals.
     - 👑 **The Roast Master**: Humor, team roasts & workplace pledges.
2. **Automated Meeting Detection & Live Mute Event**:
   - One-click monitor start (browser mic + meeting audio stream).
   - Dynamic coin drop animation into the cartoon glass jar upon voice activity during meetings.
   - Gentle toast notification: *"Mute coin added! (5s Undo if you were unmuted)"*.
   - Automatic meeting context tagging from Google Calendar or local schedule.
3. **Dashboard & Analytics**:
   - **Playful Cartoon Jar View**: Animated glass jar with bouncing coins, cork lid, persona sticker, and live coin counter.
   - **Comparative Metrics**: Current Month vs. Last Month and 12-Month Rolling Average.
   - **Meeting History Ledger**: Timestamps, meeting titles, and coin counts with 1-click manual adjustment.
   - **Active Pledge Tracker Card**: Displays the current active pledge or goal with progress badge and "Log Action" button.
4. **End-of-Month Review & Pledge Ceremony**:
   - Scheduled reminder banner when month ends.
   - **3 Redemption Paths**:
     - **Path A: Charity Donation**:
       - Value per coin selector (e.g. $1.00 or custom currency/amount).
       - Curated aggregator picker:
         - 🌐 **GlobalGiving** (Grassroots projects in 175+ countries)
         - 🌐 **Every.org** (1M+ charities, 0% platform fee)
         - 🌐 **PayPal Giving Fund** (100% donation pass-through)
         - 🇬🇧 **JustGiving** (UK & Global, Gift Aid eligible)
         - 🇦🇺 **GiveNow** (Australia's DGR charity platform)
         - 🇨🇦 **CanadaHelps** (Canadian registered charities)
         - 💼 **Benevity** (Workplace corporate matching)
         - 🔗 **Custom Charity URL**: Direct link input with auto-preview.
       - "Open Donation Link" button that records donation proof.
     - **Path B: Personal Goals**:
       - Multiplier setting (e.g. 5 pushups / 10 book pages per coin).
       - Gemini AI generator for motivating goal suggestions.
     - **Path C: Work Pledges**:
       - Team commitment (coffee shout, demo lightning talk, team snacks).
       - Gemini AI generator tailored to Roast Master / humor.
5. **Pledge & Goal Action Tracking**:
   - When a pledge or goal is committed, it enters the **Action Log**:
     - Mark as **"Actioned / Done"**
     - Record **When** (completion date picker) and **How** (action notes describing what you did)
     - Completion celebration animation and monthly badge awarded.

### Visual Identity & Theme
- **Aesthetic Direction**: Playful, cartoonish glass jar with vibrant colors, rounded contours, and clean contemporary interface framing (inspired by high-end casual game art and modern productivity tools).
- **Color Palette**:
  - Dominant Neutral Canvas: Crisp slate/paper white in light mode (`#F8FAFC`), deep midnight slate in dark mode (`#0F172A`).
  - Jar Glass: Translucent aqua/cyan glass sheen with glossy cartoon specular highlights (`#38BDF8`).
  - Coins: Radiant golden yellow (`#FBBF24`, `#F59E0B`) with embossed mute mic symbol.
  - Persona Badges: Sky Blue for The Saint, Vibrant Amber for The Pragmatist, Warm Coral/Purple for The Roast Master.
- **Typography & Hierarchy**:
  - Display Font: `Plus Jakarta Sans` for punchy, friendly titles.
  - Body Font: `DM Sans` for clean, readable interface copy.
  - Data Figures: Monospace tabular numerals (`font-mono tabular-nums`) for exact coin counts and timestamps.
- **Interactive Feedback & Motion**:
  - Physics-settling bounce animations using `motion` and canvas coin stacks.
  - Live audio waveform visualizer allowing visual confirmation of voice input without saving any recordings.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Curated Aggregators with Global Priority & Custom URL**:
  - *Chosen Approach*: Highlight top-tier global platforms (GlobalGiving, Every.org, PayPal Giving Fund) followed by regional leaders (JustGiving, GiveNow, CanadaHelps, Benevity) plus a custom URL field.
  - *Why*: Accommodates users worldwide without restricting them to a single country or payment processor, while allowing exact local charities via custom URL.
- **Decision 2: Action Tracking with Verification Notes**:
  - *Chosen Approach*: Structured tracking of "When" (timestamp) and "How" (action notes) with a status pipeline (`Pending` ➔ `In Progress` ➔ `Completed`).
  - *Why*: Turns pledges from empty promises into real accountability and fun personal milestones.
- **Decision 3: Transparent Privacy Architecture with Mandatory Consent**:
  - *Chosen Approach*: Explicit onboarding privacy disclosure with a mandatory acknowledgment checkbox before enabling audio listeners.
- **Decision 4: Elimination of Hotkeys in Favor of Fully Automated Detection**:
  - *Chosen Approach*: Automatic dual-stream analysis (Mic VAD + Meeting audio stream) with calendar auto-sessioning and a 5-second "Undo if unmuted" grace toast.
- **Decision 5: Server-Side Gemini AI Pledge Suggestion Engine**:
  - *Chosen Approach*: Secure server endpoint (`/api/pledges/suggest`) calling `gemini-3.8-flash` with persona context.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Automated Mute Jar System                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
┌─────────────────────────────────────────┐               ┌─────────────────────────────────────────┐
│     Automated Audio Engine (Web Audio)  │               │      Context & Calendar Engine          │
│  - Mic AnalyserNode (VAD)               │               │  - Google Calendar OAuth Sync           │
│  - Meeting Speaker Monitor (Stream)     │               │  - Local Meeting Schedule Fallback      │
│  - Auto Speech Energy & Gate Detector   │               │  - Automatic Active Call Matcher        │
│  - 5-second "Undo / Unmuted" Window     │               └────────────────────┬────────────────────┘
└───────────────────┬─────────────────────┘                                    │
                    │                                                          │
                    ▼                                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   Central State & Ledger Store                                    │
│  - Privacy Consent Agreed (boolean flag + timestamp)                                              │
│  - User Persona ('saint' | 'pragmatist' | 'roastmaster')                                          │
│  - Listening State & Audio Sensitivity Levels                                                     │
│  - Current Month Mute Ledger (id, timestamp, meetingTitle, duration, status)                      │
│  - Historical Monthly Archives (last month, 12-month rolling stats)                               │
│  - Pledge & Goal Action Log (status, actionedAt, actionNotes, evidenceUrl)                        │
│  - Settings (sound FX toggle/volume, reminder day, currency, country, customCharityUrl)           │
└───────────────────────────────────────────┬───────────────────────────────────────────────────────┘
                                            │
       ┌────────────────────────────────────┼────────────────────────────────────┐
       ▼                                    ▼                                    ▼
┌───────────────────────────┐ ┌───────────────────────────┐ ┌───────────────────────────────────────┐
│    Cartoon Glass Jar      │ │   Dashboard & Analytics   │ │     Monthly Review & Action Loop      │
│  - SVG/Canvas Glass Body  │ │  - Current Month Total    │ │  - Global/Regional Aggregators        │
│  - Persona Emblem Sticker │ │  - Last Month Comparison  │ │  - Custom Charity URL Input           │
│  - Bouncing Coin Physics  │ │  - 12-Month Average Trend │ │  - Work & Personal Pledge Action Log  │
│  - Synthesized Sound FX   │ │  - Meeting Log Table      │ │  - Gemini AI Suggestion Engine        │
│  - Dynamic Fill Level     │ │  - Active Action Card     │ │  - Completion Card Generator          │
└───────────────────────────┘ └───────────────────────────┘ └───────────────────┬───────────────────┘
                                                                                │
                                                                                ▼
                                                              ┌───────────────────────────────────┐
                                                              │ Server Route (/api/pledges)       │
                                                              │ - @google/genai (gemini-3.8-flash)│
                                                              │ - Persona-tuned prompt generation │
                                                              └───────────────────────────────────┘
```

### Data Structures & State
- **`PrivacyConsent`**: `{ hasConsented: boolean, consentedAt: number, version: string }`
- **`PersonaType`**: `'saint' | 'pragmatist' | 'roastmaster'`
- **`CharityAggregator`**: `{ id: string, name: string, region: 'global'|'us'|'uk'|'au'|'ca'|'custom', url: string, description: string, feeInfo: string }`
- **`PledgeActionRecord`**: `{ id: string, monthKey: string, type: 'charity'|'pledge'|'goal', title: string, description: string, coinsCommitted: number, estimatedValue: string, status: 'pending'|'in_progress'|'completed', actionedAt?: number, actionNotes?: string, donationUrl?: string }`
- **`MuteRecord`**: `{ id: string, timestamp: number, meetingTitle: string, durationSeconds: number, undone: boolean, monthKey: string }`
- **`UserSettings`**: `{ privacyConsent: PrivacyConsent, persona: PersonaType, soundEnabled: boolean, soundVolume: number, sensitivity: number, autoDetectMeetingAudio: boolean, reminderDay: number, country: string, currency: string, perCoinValue: number, hasCompletedOnboarding: boolean, customCharityUrl?: string }`

### Verification & Testing Plan
1. **Privacy Statement & Consent**: Verify mandatory tickbox consent blocking audio access until accepted.
2. **Onboarding Flow**: Verify persona selection (The Saint, The Pragmatist, The Roast Master).
3. **Charity Aggregator System**: Verify list of global and regional aggregators (GlobalGiving, Every.org, PayPal Giving Fund, JustGiving, GiveNow, CanadaHelps, Benevity) and custom charity URL handling.
4. **Pledge & Goal Action Tracking**: Verify logging "When" (completion date) and "How" (action notes), status transitions, and history archive.
5. **Audio Detection**: Verify microphone permissions, speech energy detection, ambient threshold calibration, and 5-second automatic undo function.
6. **Cartoon Jar & Coin Physics**: Verify visual rendering of cartoon glass jar with persona emblem, smooth coin drop animations, stacking behavior, and synthesized sound effects.
7. **Code Quality**: Verify via `compile_applet` and `lint_applet` for clean compilation.
