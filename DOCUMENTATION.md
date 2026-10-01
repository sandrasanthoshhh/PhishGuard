# PhishGuard — Project Documentation

## 1. Abstract

Phishing attacks use deceptive websites and social-engineering techniques to persuade users to disclose credentials and other sensitive information. PhishGuard is a Chrome-first browser extension developed as a cybersecurity project to analyze webpages in real time and identify multiple indicators associated with suspicious or phishing websites.

The system combines URL analysis, IP-address detection, lookalike-domain detection, trusted-domain comparison, credential-form analysis, suspicious-content analysis, and redirect analysis. These findings are processed by a risk engine that produces a score between 0 and 100 and classifies the page as LOW, SUSPICIOUS, HIGH, or CRITICAL.

The extension provides an in-page warning for HIGH and CRITICAL results, a popup dashboard for current scan information, configurable settings, and locally stored scan history and statistics. Controlled local testing demonstrated detection of multiple indicators and produced a CRITICAL score of 90/100 for a deliberately constructed test page.

---

# 2. Introduction

## 2.1 Background

Phishing is a form of social engineering in which an attacker attempts to deceive a user into interacting with a fraudulent website, message, or service. Modern phishing pages may imitate trusted organizations, use deceptive domains, collect credentials through forms, redirect users through multiple pages, and create urgency through threatening or persuasive language.

A browser is an important location for detecting these indicators because the browser has access to the current URL, webpage structure, forms, navigation events, and page content.

## 2.2 Problem Context

A newly created phishing page may not immediately appear in a reputation database or blacklist. A detection approach that considers several characteristics of the current page can provide additional context to the user.

PhishGuard therefore uses multiple lightweight heuristic indicators rather than relying on a single condition.

## 2.3 Motivation

The project was motivated by the need to understand how browser-level security mechanisms can combine several observable signals into an explainable risk assessment.

An important design goal is explainability: when PhishGuard flags a page, the user can see the reasons contributing to the result.

---

# 3. Problem Statement

Phishing websites increasingly use deceptive domains, credential-harvesting forms, redirects, and social-engineering content to imitate legitimate services. A browser-based system is therefore required to analyze webpages in real time, identify suspicious characteristics, combine those characteristics into an interpretable risk assessment, and warn users when a page presents multiple risk indicators.

---

# 4. Objectives

The main objectives are:

1. Develop a browser extension for real-time webpage security analysis.
2. Detect websites using HTTP instead of HTTPS.
3. Detect IP-address-based website access.
4. Identify potential lookalike domains.
5. Compare domains against a trusted-brand dataset.
6. Detect credential/password forms.
7. Identify insecure or cross-origin credential submission.
8. Detect suspicious social-engineering language.
9. Analyze browser navigation and redirect behavior.
10. Combine findings into an explainable risk score.
11. Warn users about HIGH and CRITICAL pages.
12. Store scan history and provide scan statistics.
13. Provide user-configurable security settings.

---

# 5. Existing System

Common website-security approaches include browser security warnings, URL reputation systems, blacklists, and antivirus/security products.

These mechanisms can be useful, but a newly created phishing page may not yet be represented in a reputation database. In addition, a webpage may exhibit suspicious characteristics even when its domain is not known to a blacklist.

PhishGuard is designed as a complementary heuristic analysis layer rather than a replacement for established browser and security protections.

---

# 6. Proposed System

PhishGuard is implemented as a Manifest V3 browser extension.

The system receives information from the webpage and browser navigation layer, analyzes several categories of indicators, and combines them using a risk engine.

## 6.1 High-Level Flow

```text
Web Page
   ↓
Content Scanner
   ↓
URL / Domain / Form / Page Analysis
   ↓
Redirect Information
   ↓
Risk Engine
   ↓
Risk Score
   ↓
LOW / SUSPICIOUS / HIGH / CRITICAL
   ↓
Popup + Warning Interface
```

---

# 7. System Architecture

## 7.1 Components

### Content Scanner

`content/scanner.js` coordinates the complete analysis pipeline.

It obtains:

- Current URL
- Domain analysis
- Form analysis
- Page-content analysis
- Redirect information

and passes the results to the risk engine.

### Background Service Worker

`background/service-worker.js` uses Chrome navigation events to track navigation and redirect behavior.

### Popup

The popup presents:

- Current scan status
- Risk level
- Risk score
- Current URL
- Detection reasons
- Scan statistics
- Rescan control

### Options Page

The options page allows users to configure:

- HIGH/CRITICAL warning display
- Suspicious-content analysis
- Credential-form analysis

### Local Storage

Chrome local storage is used for:

- Latest scan result
- Scan history
- User settings

---

# 8. Module Design

## 8.1 URL Analysis

The URL analysis layer checks whether:

- The page uses HTTP
- The host is an IP address
- The URL can be parsed correctly

An HTTP page and an IP-based URL are treated as security indicators.

These characteristics are not individually proof of phishing. They contribute to the overall risk assessment.

---

## 8.2 Domain Analysis

The domain analyzer performs:

1. Hostname normalization
2. Base-domain extraction
3. Trusted-domain lookup
4. Lookalike analysis
5. Brand-in-hostname detection

### Lookalike Detection

Levenshtein distance is used to estimate similarity between an observed domain name and trusted brand names.

The prototype also normalizes selected visually similar substitutions such as:

```text
0 → o
1 → l
3 → e
4 → a
5 → s
7 → t
```

This helps identify examples such as:

```text
g00gle.com
paypa1.com
```

as potential lookalikes.

The approach is heuristic and does not represent complete Unicode homograph detection.

---

# 9. Credential Form Analysis

The form analyzer identifies password fields inside HTML forms.

For each password form, it evaluates the form submission URL.

The prototype detects:

### Insecure submission

A password form submitting through HTTP receives a risk contribution.

### Cross-origin submission

A password form submitting to a different origin is also treated as suspicious.

### Dynamic Forms

A guarded mutation observer allows dynamically inserted forms to be analyzed after page load.

---

# 10. Page Content Analysis

The page analyzer examines visible page text for selected social-engineering indicators.

Current patterns include:

| Pattern | Interpretation |
|---|---|
| `verify your account` | Account verification request |
| `confirm your identity` | Identity verification request |
| `account suspended` | Account-threat language |
| `account will be suspended` | Account-suspension threat |
| `urgent action required` | Urgency language |
| `password expired` | Password-expiration claim |

The detection is intentionally heuristic. These phrases may appear on legitimate websites, so they should not be interpreted independently as proof of malicious behavior.

---

# 11. Redirect Analysis

The redirect analyzer works with navigation information supplied by the background service worker.

The service worker tracks navigation requests and committed URLs.

A redirect finding may be associated with:

- Server-side redirect
- Client-side redirect
- Navigation redirect

The current prototype assigns a 15-point contribution when a redirect is detected.

---

# 12. Risk Engine

The risk engine combines findings from multiple modules.

The current risk levels are:

| Score | Classification |
|---:|---|
| 0–29 | LOW |
| 30–59 | SUSPICIOUS |
| 60–79 | HIGH |
| 80–100 | CRITICAL |

The final score is capped at 100.

## 12.1 Example

The controlled test page generated:

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

The combined result was:

```text
Risk Score: 90/100
Risk Level: CRITICAL
```

This demonstrates the main design principle: multiple independent indicators are combined to provide an explainable result.

---

# 13. Warning System

PhishGuard displays an in-page warning when:

```text
Risk Level = HIGH
OR
Risk Level = CRITICAL
```

The warning contains:

- PhishGuard title
- Risk level
- Risk score
- Reasons for detection
- Close control

The warning display can be disabled through the Options page.

---

# 14. Popup Dashboard

The popup provides the user with a compact view of the current analysis.

It includes:

- Scan status
- Current risk level
- Score
- Current URL
- Detection reasons
- Total scan count
- HIGH count
- CRITICAL count
- Rescan control

The popup obtains the current live result from the content scanner and uses locally stored history for statistics.

---

# 15. Settings

The extension provides three configurable settings:

1. Show HIGH and CRITICAL warnings
2. Enable suspicious-content analysis
3. Enable credential-form analysis

Settings are stored using Chrome local storage.

---

# 16. Testing

Testing was performed using controlled local webpages.

## 16.1 URL Tests

- HTTP page
- IP-address page
- Normal domain
- Malformed URL handling

## 16.2 Domain Tests

- Trusted domain
- Lookalike domain
- Numeric lookalike substitutions
- Brand name embedded in a non-trusted hostname

## 16.3 Form Tests

- Password form
- HTTP credential submission
- Cross-origin credential submission
- Dynamically created forms
- Forms without password fields

## 16.4 Content Tests

The controlled test page contained five suspicious language patterns.

The page analyzer returned:

```text
Score: 30
Findings: 5
```

## 16.5 Integrated Test

The complete test page produced:

```text
URL analysis       → 30
Form analysis      → 30
Page analysis      → 30
Domain analysis    → 0
Final score        → 90
Classification     → CRITICAL
```

## 16.6 Feature Test Summary

| Feature | Result |
|---|---|
| URL analysis | PASS |
| IP detection | PASS |
| Lookalike detection | PASS |
| Password-form detection | PASS |
| HTTP form submission detection | PASS |
| Page-content detection | PASS |
| Redirect detection | PASS |
| Risk classification | PASS |
| Warning configuration | PASS |
| Live popup result | PASS |
| Scan history | PASS |
| Statistics | PASS |
| Options page | PASS |

---

# 17. Limitations

PhishGuard is a heuristic prototype and has several limitations.

1. The trusted-brand dataset is limited.
2. Heuristic detection may produce false positives.
3. Suspicious phrases do not prove that a page is malicious.
4. HTTPS does not guarantee that a website is legitimate.
5. Sophisticated phishing pages may evade the current rules.
6. Unicode homograph detection can be expanded.
7. No external reputation or threat-intelligence service is currently integrated.
8. The primary implementation target is Chrome.
9. The scoring model is rule-based rather than machine-learning based.

---

# 18. Future Scope

Potential improvements include:

- Machine-learning-based classification
- Larger trusted-domain and reputation datasets
- Unicode homograph detection
- Visual similarity detection
- QR-code phishing detection
- Advanced iframe analysis
- More sophisticated dynamic navigation monitoring
- External threat-intelligence APIs
- Firefox compatibility
- Improved explainability of risk scores
- User feedback-based model refinement

---

# 19. Ethical and Security Considerations

PhishGuard should be evaluated using controlled test environments.

The included test pages should not be used to collect real credentials or deceive real users.

The extension is intended as a defensive security research and educational project. Its warnings should be interpreted as risk indicators rather than definitive proof that a website is malicious.

---

# 20. Conclusion

PhishGuard demonstrates a practical approach to browser-based phishing detection using multiple explainable heuristics.

The project integrates URL analysis, domain similarity analysis, credential-form inspection, suspicious-content detection, redirect analysis, risk scoring, browser warnings, configurable settings, and scan history into a single Chrome extension.

Controlled testing demonstrated that the system can combine multiple indicators and produce an interpretable CRITICAL result for a deliberately constructed phishing-style test page.

The project provides a foundation for future work involving larger threat-intelligence datasets, machine learning, visual similarity analysis, and more advanced browser security techniques.
