# 🛡️ PhishGuard

### Real-Time Browser-Based Phishing Detection and Website Security Analysis

PhishGuard is a Chrome-first browser extension designed to analyze web pages in real time and identify indicators commonly associated with phishing and suspicious websites.

Instead of relying on a single signal, PhishGuard combines multiple lightweight heuristics, including URL security, IP-based access, lookalike-domain detection, credential-form analysis, suspicious page language, and redirect analysis. The individual findings are combined into a risk score and classified as **LOW, SUSPICIOUS, HIGH, or CRITICAL**.

> **Project status:** Working prototype / academic cybersecurity project.

---

## Features

- 🔎 Real-time webpage scanning
- 🌐 HTTP/HTTPS analysis
- 🖥️ IP-address based website detection
- 🪞 Lookalike-domain detection using string similarity
- 🏷️ Trusted-brand/domain comparison
- 🔐 Credential/password form analysis
- 🔀 Redirect analysis using Chrome `webNavigation`
- 📝 Suspicious social-engineering language detection
- ⚠️ HIGH and CRITICAL warning interface
- 📊 Scan history and risk statistics
- ⚙️ Configurable analysis settings
- 🔄 Manual page rescanning
- 💾 Local storage of scan results

---

## Detection Modules

### 1. URL Analyzer

Checks characteristics of the current URL, including:

- HTTP instead of HTTPS
- IP address instead of a conventional domain
- URL parsing failures

### 2. Domain Analyzer

The domain analyzer:

- Normalizes hostnames
- Extracts the base domain
- Checks trusted domains
- Uses Levenshtein similarity to identify potential lookalikes
- Detects trusted brand names appearing in suspicious hostnames

Example:

```text
paypal.com   → trusted domain
paypa1.com   → potential lookalike
```

The trusted-brand dataset is intentionally limited for the prototype.

### 3. Form Analyzer

The form analyzer identifies credential-related forms and checks:

- Password fields
- HTTP credential submission
- Cross-origin credential submission
- Dynamically created forms

### 4. Page Content Analyzer

The prototype checks for suspicious social-engineering phrases such as:

- `verify your account`
- `confirm your identity`
- `account suspended`
- `account will be suspended`
- `urgent action required`
- `password expired`

These are treated as **heuristic indicators**, not proof that a website is malicious.

### 5. Redirect Analyzer

PhishGuard integrates with Chrome's `webNavigation` API to identify navigation/redirect behavior.

The background service worker tracks navigation events and communicates redirect information to the content scanner.

### 6. Risk Engine

Individual findings are combined into an overall risk score.

Current classification:

| Score | Level |
|---:|---|
| 0–29 | LOW |
| 30–59 | SUSPICIOUS |
| 60–79 | HIGH |
| 80–100 | CRITICAL |

The score is capped at 100.

---

## Architecture

```text
                         ┌───────────────────┐
                         │     Web Page      │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │  PhishGuard       │
                         │  Content Scanner  │
                         └─────────┬─────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
      ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
      │ URL / Domain  │    │ Form Analyzer  │    │ Page Analyzer │
      │ Analyzer      │    │                │    │               │
      └───────┬───────┘    └───────┬───────┘    └───────┬───────┘
              │                    │                    │
              └────────────────────┼────────────────────┘
                                   ▼
                         ┌───────────────────┐
                         │ Redirect Analyzer │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │    Risk Engine    │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │ Risk Classification│
                         └─────────┬─────────┘
                                   │
                         ┌─────────┴─────────┐
                         ▼                   ▼
                  ┌─────────────┐     ┌─────────────┐
                  │ Popup /     │     │ Warning UI  │
                  │ Dashboard   │     │             │
                  └─────────────┘     └─────────────┘
```

---

## Project Structure

```text
PhishGuard ext/
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
├── options.html
├── options.js
├── background/
│   └── service-worker.js
├── content/
│   ├── scanner.js
│   ├── domain-analyzer.js
│   ├── form-analyzer.js
│   ├── risk-engine.js
│   ├── warning-ui.js
│   ├── redirect-analyzer.js
│   └── page-analyzer.js
├── data/
│   └── trusted-brands.js
└── test-site/
    ├── index.html
    ├── form-test.html
    ├── content-test.html
    ├── low-risk.html
    └── redirect.py
```

---

## Chrome Extension Architecture

PhishGuard uses Manifest V3.

Main components:

| Component | Purpose |
|---|---|
| `manifest.json` | Extension configuration and permissions |
| `background/service-worker.js` | Navigation and redirect tracking |
| `content/scanner.js` | Coordinates the analysis pipeline |
| `content/domain-analyzer.js` | Domain and lookalike analysis |
| `content/form-analyzer.js` | Credential-form analysis |
| `content/page-analyzer.js` | Suspicious-content analysis |
| `content/redirect-analyzer.js` | Redirect analysis |
| `content/risk-engine.js` | Risk calculation |
| `content/warning-ui.js` | In-page warning interface |
| `data/trusted-brands.js` | Prototype trusted-domain dataset |
| `popup.*` | Scan dashboard |
| `options.*` | User configuration |

---

## Permissions

The prototype uses:

```text
storage
webNavigation
tabs
```

and HTTP/HTTPS host permissions for webpage analysis.

Permissions should be reviewed before any public release to ensure every permission remains necessary.

---

## Example Detection

A local test page was designed to combine multiple indicators.

Observed findings included:

```text
Website is not using HTTPS
Website uses an IP address instead of a domain name
Password form submits credentials over HTTP
Page asks the user to verify their account
Page asks the user to confirm their identity
Page threatens account suspension
Page uses urgent-action language
Page claims that a password has expired
```

The resulting score was:

```text
90 / 100
CRITICAL
```

This demonstrates how multiple independent indicators can contribute to a single risk assessment.

---

## Testing

The project has been tested using controlled local pages for:

- HTTP pages
- IP-based URLs
- Password forms
- Dynamically created forms
- Suspicious page language
- Server-side redirects
- Risk classification
- Warning settings
- Popup live results
- Scan history
- Scan statistics

Example test result:

| Test | Expected | Result |
|---|---|---|
| HTTP detection | Detected | PASS |
| IP address detection | Detected | PASS |
| HTTP credential submission | Detected | PASS |
| Suspicious language | Detected | PASS |
| Redirect detection | Detected | PASS |
| HIGH warning | Displayed | PASS |
| CRITICAL warning | Displayed | PASS |
| Settings persistence | Saved | PASS |
| Scan history | Recorded | PASS |

---

## Limitations

PhishGuard is a heuristic-based prototype and should not be treated as a complete phishing prevention system.

Current limitations include:

- Limited trusted-brand dataset
- Heuristic detection can produce false positives
- Suspicious language does not prove malicious intent
- No external reputation service is currently integrated
- HTTPS alone cannot establish that a website is trustworthy
- Unicode/homograph detection can be expanded
- Sophisticated phishing pages may evade simple heuristics
- Chrome is the primary target platform

---

## Future Scope

Potential improvements include:

- Machine-learning-based phishing classification
- Larger threat-intelligence and reputation datasets
- Unicode homograph detection
- Visual similarity analysis
- QR-code phishing detection
- Advanced iframe analysis
- More sophisticated dynamic-page monitoring
- External threat-intelligence APIs
- Firefox support
- Improved explainable risk scoring

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/PhishGuard.git
cd PhishGuard
```

### 2. Open Chrome Extensions

Open:

```text
chrome://extensions
```

### 3. Enable Developer Mode

Turn on **Developer mode**.

### 4. Load the extension

Select:

```text
Load unpacked
```

and choose the project directory containing `manifest.json`.

### 5. Test

Open a webpage and click the PhishGuard extension icon.

For controlled testing, use the included `test-site` pages.

---

## Important Safety Note

The included test pages are intended for **local, controlled security testing only**.

Do not use PhishGuard's testing pages to collect real credentials or deploy deceptive pages against other users.

---

## Academic Value

PhishGuard demonstrates practical application of:

- Browser extension development
- Web security
- Phishing detection
- Domain analysis
- String similarity
- Web form security
- Browser navigation APIs
- Heuristic risk scoring
- Security-focused UI design
- Security testing

---

## Author

**Sandra Santhosh Kumar**

B.Tech Computer Science Engineering (Cyber Security)

---

## License

Choose an appropriate open-source license before publishing the repository. MIT is a common option for projects intended to be reused, but the final choice should match the project's goals.
