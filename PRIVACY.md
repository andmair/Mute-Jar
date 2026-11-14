# Mute Jar Privacy Policy

**Last updated:** November 14, 2026  
**Author:** Andrew Mair ([andmair@gmail.com](mailto:andmair@gmail.com))

[← Back to README](./README.md) · [Download Installers](./DOWNLOAD.md)

---

## 1. Zero-Recording Audio Guarantee

Mute Jar is built on a strict **100% on-device, in-memory** audio processing architecture:

- **No Audio Recording:** Your microphone stream is analyzed solely in volatile computer memory (`AudioContext` / Web Audio API) to detect sound amplitude, dominant pitch ($F_0$), and spectral voiceprint similarity.
- **No Speech-to-Text or Transcripts:** Mute Jar contains **no** speech recognition, transcription engine, or word-capture pipeline.
- **Immediate Buffer Disposal:** Live waveform buffers are evaluated in real time (~50 ms frames) and immediately discarded. Zero audio clips, recordings, or spoken words are ever written to disk or transmitted over the network.

---

## 2. Data Stored Locally on Your Device

All application state is stored locally on your machine in browser/webview `localStorage` and **never uploaded to any Mute Jar cloud server**:

| Data Category | What Is Stored | Purpose |
| :--- | :--- | :--- |
| **Mute Ledger** | Numeric tally, timestamps, duration (in seconds), optional meeting title, and notes | Track MuteCoins per cycle and allow 5-second undo |
| **User Preferences** | Active philosophy, currency/coin value, microphone sensitivity/noise floor, custom hotkey (`Alt+Shift+M` default), theme, cycle cadence | Persist your desktop and web app settings |
| **Voiceprint Profile** *(Optional)* | Numeric 16-band frequency/formant summary vector and median pitch Hz | Filter out background voices, TV, or radio without saving audio |
| **Profile & Proof** *(Optional)* | Display name, chosen avatar (custom uploaded photos are resized client-side), receipt/goal images attached by you | Personalize your local dashboard and track fulfilled pledges |
| **Calendar Titles** *(Optional)* | Meeting title copied at mute time from connected calendars | Label ledger rows automatically without storing full calendar feeds in logs |

---

## 3. Optional External & Local Features

Mute Jar functions **100% offline** by default. External network calls happen **only** if you explicitly enable and configure them:

1. **Team Chat Webhooks (Slack / Discord / Teams):** Disabled by default. When you add a webhook URL and enable a publish rule, only the event summary you allow (such as coin milestone alerts) is relayed to your chosen channel.
2. **Gemini AI Pledge Suggestions *(Optional Sidecar)*:** Only active if you run the local sidecar (`npm run sidecar`) with a `GEMINI_API_KEY` and click **Get Ideas**. Only your chosen philosophy and numeric coin count are sent — never audio, calendar events, or personal mute logs.
3. **Local MCP Integration:** Runs strictly on `http://localhost:3000/api/mcp` on your own machine when the local sidecar is started, with strict privacy redaction enabled by default.
4. **External Charity / Repo Links:** Clicking a charity website link (e.g., GlobalGiving) or GitHub link opens that external site in your browser under its own privacy policy.

---

## 4. Telemetry, Ads & Tracking

- **No Analytics or Telemetry:** Mute Jar contains zero third-party analytics SDKs, ad networks, behavioral tracking pixels, or crash-reporting beacons.
- **No Accounts Required:** There is no user registration, login server, or cloud database managed by the author.

---

## 5. Your Control & Permanent Data Deletion

You have complete control over your local data at all times:

- **Individual Logs & Settings:** Edit meeting labels, clear voiceprint calibration, or disconnect calendars anytime in the app.
- **Complete Wipe:** Open **Mute Jar Settings → Immutable Ledger & Danger Zone → Delete User Profile & Wipe All Data** to permanently erase all settings, mute records, schedules, avatars, and pledge history from your device. Uninstalling the app or clearing browser site data removes all remaining local files.

---

## 6. Contact

Questions about privacy or security can be directed to **Andrew Mair** at [andmair@gmail.com](mailto:andmair@gmail.com) or via [GitHub Issues](https://github.com/andrewmair/Mute-Jar/issues).
