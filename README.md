# BanglaShield (বাংলাশিল্ড)

[![FastAPI Tests](https://img.shields.io/badge/Backend%20Tests-21%20Passed-emerald.svg)](#running-automated-tests)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-blue.svg)](frontend/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.158-cyan.svg)](backend/)
[![Python](https://img.shields.io/badge/Python-3.14-blue.svg)](backend/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](frontend/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](frontend/)

> **AI & Heuristic Cyber Defense Platform Focused on Protecting Users in Bangladesh**

BanglaShield is a cybersecurity portfolio project designed to identify deceptive URLs, fraudulent payment portals, and regional scam campaigns. It features a modern dark-navy cybersecurity dashboard and a decoupled FastAPI backend powered by a deterministic, explainable heuristic analysis engine.

---

## Table of Contents

- [Motivation & Problem Statement](#motivation--problem-statement)
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [Current Limitations & Responsible Use](#current-limitations--responsible-use)
- [Dashboard Preview](#dashboard-preview)
- [Heuristic Scoring System](#heuristic-scoring-system)
- [API Reference](#api-reference)
- [Project Directory Structure](#project-directory-structure)
- [Prerequisites (Windows)](#prerequisites-windows)
- [Local Setup & Running](#local-setup--running)
- [Running Automated Tests](#running-automated-tests)
- [Security & Privacy Guarantees](#security--privacy-guarantees)
- [Future Development Roadmap](#future-development-roadmap)

---

## Motivation & Problem Statement

Digital financial services (DFS) such as **bKash**, **Nagad**, and **Rocket**, along with major telecommunication providers (**Grameenphone**, **Robi**, **Banglalink**, **Teletalk**), have seen rapid adoption across Bangladesh. Consequently, malicious actors frequently deploy localized phishing lures—such as fake Eid bonuses, lottery winnings, and fraudulent cash-out verification pages—to compromise accounts.

BanglaShield was created to:
1. Provide an educational cybersecurity platform specifically tuned to recognize regional social-engineering patterns.
2. Deliver **explainable security indicators** so users understand *why* a link is dangerous, rather than presenting a black-box verdict.
3. Serve as a clean, production-grade portfolio architecture demonstrating modern full-stack cybersecurity engineering.

---

## System Architecture

BanglaShield is built using a **decoupled client-server architecture**:

```
+-------------------------------------------------------------+
|                      User's Browser                         |
|  Next.js 16 (App Router) + React 19 + TypeScript + Tailwind |
+-------------------------------------------------------------+
                              |
                     POST /api/v1/scan-url
                     (JSON Payload: { url })
                              |
                              v
+-------------------------------------------------------------+
|                    FastAPI Backend Server                   |
|                Uvicorn ASGI @ 127.0.0.1:8000                |
+-------------------------------------------------------------+
                              |
              +---------------+---------------+
              |                               |
              v                               v
    +-------------------+           +-------------------+
    | Safe URL Parsing  |           | Deterministic     |
    | (urllib.parse)    |           | Heuristic Engine  |
    | - Max 2048 chars  |           | - Scheme check    |
    | - Scheme whitelist|           | - IP host check   |
    | - Host validation |           | - BD brand lures  |
    +-------------------+           | - Abuse TLD check |
                                    | - Depth & ports   |
                                    +-------------------+
                                              |
                              +---------------+
                              |
                              v
             [ ZERO EXTERNAL NETWORK REQUESTS ]
             (No DNS, No Sockets, No HTTP to Target)
```

- **Frontend:** Responsive cybersecurity dashboard styled with dark navy tones (`#070b14`), restrained cyan glows, accessible keyboard navigation, empty states, and error resilience.
- **Backend:** High-performance asynchronous FastAPI service using Pydantic v2 schemas for strict request/response validation and safe, privacy-preserving logging.

---

## Key Features

- **Local Sandbox Inspection:** Statically inspects submitted URLs without ever establishing an outbound network connection to the target domain.
- **Regional Bangladesh Lure Detection:** Flags unofficial domains imitating national financial services (bKash, Nagad, Rocket, Upay) and telecom carriers.
- **Structural Anomaly Recognition:** Detects raw IP-address hostnames, high-abuse top-level domains (`.xyz`, `.top`, `.buzz`, etc.), unencrypted HTTP protocols, non-standard web ports, and userinfo delimiters (`@`).
- **Deterministic Heuristic Risk Index:** Computes a transparent numerical risk score from `0` to `100` with detailed breakdowns for each rule impact.
- **Full In-Memory Session History:** Allows users to review and reload previous scans during the active browser session without database tracking.
- **Error Resilience:** Handles backend disconnection gracefully, offering one-click health retries and troubleshooting guidance.

---

## Current Limitations & Responsible Use

Transparency and academic integrity are fundamental to BanglaShield:

- **Heuristics, Not Proof:** Heuristic analysis evaluates lexical indicators. It **cannot prove** that a website is definitely safe or malicious. A legitimate site may use a generic TLD, and an attacker can obtain a valid TLS certificate.
- **No Machine Learning Claimed Yet:** The current engine uses deterministic, explainable heuristic scoring rules. It does **not** yet claim to use an active machine learning model or neural network.
- **No Live Threat Feeds:** BanglaShield does not currently connect to external commercial threat intelligence blocklists.
- **Responsible Use Notice:** BanglaShield is an academic portfolio project for educational and defensive research. Do not rely on it as a sole line of enterprise cybersecurity defense.

---

## Dashboard Preview

<!-- Screenshot placeholder: To add a live preview, capture your browser at http://localhost:3000 and save to docs/screenshots/dashboard.png -->
![BanglaShield Dashboard Preview](docs/screenshots/dashboard.png)

*If the image above does not render, start the frontend locally and visit `http://localhost:3000` to interact with the live dashboard.*

---

## Heuristic Scoring System

The backend scores URLs on an additive **Heuristic Risk Index (0 - 100)**:

| Rule Identifier | Category | Condition Checked | Score Weight | Status |
| :--- | :--- | :--- | :--- | :--- |
| `proto-http-unencrypted` | Protocol | URL uses plaintext `http://` instead of `https://` | `+25` | Alert |
| `host-ip-address` | Domain | Host is a raw IPv4 or IPv6 address literal | `+45` | Alert |
| `auth-userinfo-delimiter`| Structure | `@` symbol present in authority (credential disguise) | `+35` | Alert |
| `regional-lure-mismatch` | Regional | Bangladesh brand keyword on an unofficial domain | `+40` | Alert |
| `domain-high-abuse-tld` | Domain | Domain uses a high-abuse TLD (`.xyz`, `.top`, etc.) | `+20` | Warning |
| `struct-subdomain-depth` | Structure | Excessive subdomain nesting (> 4 labels) | `+15` | Warning |
| `struct-non-standard-port`| Structure | Non-standard port specified (not 80 or 443) | `+15` | Warning |

### Risk Level Categorization
- **`0 - 15` (Low Risk):** Standard domain conventions and TLS encryption observed.
- **`16 - 49` (Suspicious):** Moderate structural anomalies or disposable TLD observed.
- **`50 - 100` (High Risk):** Multiple compounding indicators observed (e.g. unencrypted protocol + IP host or brand lure).

---

## API Reference

### 1. Health Check
`GET /health`

**Response (`200 OK`):**
```json
{
  "status": "healthy",
  "service": "BanglaShield Cybersecurity API",
  "version": "0.1.0"
}
```

### 2. URL Heuristic Scan
`POST /api/v1/scan-url`

**Request Body:**
```json
{
  "url": "http://bkash-eid-bonus.xyz/claim"
}
```

**Response (`200 OK`):**
```json
{
  "url": "http://bkash-eid-bonus.xyz/claim",
  "hostname": "bkash-eid-bonus.xyz",
  "risk_level": "high",
  "risk_score": 85,
  "max_risk_score": 100,
  "score_meaning": "Heuristic Risk Index (0 - 100): 0 indicates no structural risk heuristics were triggered; 100 indicates maximum cumulative structural risk flags were observed. Derived deterministically.",
  "summary": "Multiple high-risk structural indicators were flagged. Strongly advise caution.",
  "indicators": [
    {
      "id": "proto-http-unencrypted",
      "category": "protocol",
      "title": "Unencrypted Protocol (HTTP)",
      "description": "Plaintext HTTP is used. Authentic banking, telecom, and payment portals mandate HTTPS to prevent credential eavesdropping in transit.",
      "status": "alert",
      "score_impact": 25
    },
    {
      "id": "regional-lure-mismatch",
      "category": "regional",
      "title": "Potential Bangladesh Brand Impersonation",
      "description": "Matches regional financial/telecom keyword(s) [bkash, eid-bonus] on an unofficial domain (bkash-eid-bonus.xyz). Scam campaigns frequently imitate bKash, Nagad, or telco recharge pages.",
      "status": "alert",
      "score_impact": 40
    },
    {
      "id": "domain-high-abuse-tld",
      "category": "domain",
      "title": "High-Abuse Top-Level Domain (.xyz)",
      "description": "Domain utilizes .xyz, a TLD statistically overrepresented in low-cost, disposable phishing and malware infrastructure.",
      "status": "warning",
      "score_impact": 20
    }
  ],
  "disclaimer": "BanglaShield uses deterministic heuristic analysis for educational and risk-flagging purposes. These rules assess structural indicators and cannot prove that a URL is definitively safe or malicious. This system does not claim to use machine learning.",
  "is_demo_heuristic": true,
  "timestamp": "2026-10-22T00:26:00Z"
}
```

---

## Project Directory Structure

```text
BanglaShield/
├── .gitignore                   # Excludes .venv, node_modules, build outputs, and caches
├── README.md                    # Project documentation (this file)
├── backend/                     # Python FastAPI application
│   ├── README.md                # Dedicated backend documentation
│   ├── requirements.txt         # Backend Python dependencies
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app, CORS, error handling, logging
│   │   ├── schemas.py           # Pydantic v2 validation models
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py        # Settings (schemes, length limits, CORS)
│   │   └── services/
│   │       ├── __init__.py
│   │       └── heuristic_analyzer.py # Pure offline heuristic analysis
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py          # Pytest fixtures and test client
│       ├── test_health.py       # GET /health tests
│       └── test_scanner.py      # 20 tests for validation, heuristics & zero-network guarantee
└── frontend/                    # Next.js frontend application
    ├── package.json             # Frontend dependencies and scripts
    ├── tsconfig.json            # TypeScript configuration
    ├── next.config.ts           # Next.js configuration
    └── src/
        ├── app/
        │   ├── layout.tsx       # Root layout & theme metadata
        │   ├── globals.css      # Dark cybersecurity CSS variables & glow utilities
        │   └── page.tsx         # Dashboard page assembling components & state
        ├── components/
        │   ├── layout/
        │   │   ├── Navbar.tsx   # Top navigation with live backend connection indicator
        │   │   └── Sidebar.tsx  # Modules navigation & architecture stack info
        │   ├── dashboard/
        │   │   ├── NoticeBanner.tsx # Transparent heuristic notice & expander
        │   │   └── SecurityCards.tsx# Dynamic session metrics
        │   └── scanner/
        │       ├── UrlScannerForm.tsx   # Accessible URL input form with presets
        │       ├── RiskAnalysisPanel.tsx# Heuristic breakdown, risk gauge & error states
        │       └── RecentScans.tsx      # In-memory session history
        ├── lib/
        │   ├── api.ts           # Typed fetch client connecting to FastAPI
        │   └── demoScanner.ts   # Client-side format validator & fallback simulator
        └── types/
            └── scanner.ts       # TypeScript interfaces matching FastAPI schemas
```

---

## Prerequisites (Windows)

- **Python:** Version `3.12+` (Tested on `Python 3.14.7`)
- **Node.js:** Version `20+` (Tested on `Node.js v24.19.0`, `npm 12.0.2`)
- **PowerShell:** Standard Windows PowerShell

---

## Local Setup & Running

### 1. Clone the Repository
```powershell
git clone https://github.com/your-username/BanglaShield.git
cd BanglaShield
```

### 2. Set Up and Run the Backend
Open a PowerShell terminal:

```powershell
# Create virtual environment if not already present
python -m venv .venv

# Activate the virtual environment
.\.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend/requirements.txt

# Start the FastAPI server
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive OpenAPI Documentation: `http://127.0.0.1:8000/docs`

### 3. Set Up and Run the Frontend
Open a **second** PowerShell terminal:

```powershell
# Navigate to the frontend directory
cd frontend

# Install frontend dependencies
npm install

# Start the Next.js development server
npm run dev
```
- Frontend Dashboard: `http://localhost:3000`

---

## Running Automated Tests

### Backend Test Suite (Pytest)
From the project root:

```powershell
.\.venv\Scripts\pytest.exe backend/tests -v
```
Executes **21 automated tests** covering:
- Health check endpoint verification
- Baseline HTTPS and recognized Bangladesh official domains
- Unencrypted HTTP and raw IP address flags
- Regional brand impersonation and high-abuse TLDs
- Subdomain stacking and userinfo `@` delimiters
- Malformed inputs, invalid schemes, and length bounds
- **Zero Outbound Traffic Verification:** Socket and DNS interception test proving scanning makes no network calls
- Deterministic scoring consistency

### Frontend Verification (ESLint & Next.js Build)
From the `frontend/` directory:

```powershell
cd frontend

# Run TypeScript and ESLint checks
npm run lint

# Run production static build check
npm run build
```

---

## Security & Privacy Guarantees

1. **Complete Network Isolation:** Submitted target URLs are never pinged, resolved, or requested. All parsing is done in-memory via Python's standard `urllib.parse`.
2. **Safe Logging (No URL Persistence):** The backend logs only operational telemetry (`input_length`, `status_code`, `risk_level`). Submitted URLs are never written to disk, server logs, or third-party monitoring services.
3. **Strict Input Sanitization:** Rejects unsupported schemes (`javascript:`, `file:`, `data:`, `ftp:`) and enforces a strict 2048-character length limit to prevent buffer abuse.
4. **CORS Restricted:** Cross-Origin Resource Sharing is configured specifically for trusted local frontend origins (`http://localhost:3000`).

---

## Future Development Roadmap

- [x] **Phase 1: Deterministic Heuristic Engine & Full-Stack UI** (Current)
  - Next.js 16 cybersecurity dashboard.
  - Decoupled FastAPI backend with offline heuristic rule-set.
  - Zero outbound traffic sandbox and comprehensive test suite.
- [ ] **Phase 2: Machine Learning URL Classifier**
  - Train a scikit-learn / XGBoost classifier on lexical URL features (entropy, token ratios, n-grams).
  - Provide comparative hybrid scoring (Heuristics + ML Prediction).
- [ ] **Phase 3: Bangla & English Scam Message Classifier**
  - NLP classifier for SMS and messaging lures (detecting fake lottery notices, lottery OTP requests, and emergency cash transfers).
- [ ] **Phase 4: Threat Intelligence & Reporting API**
  - PostgreSQL database for anonymous aggregated threat telemetry.
  - Community reporting endpoint for newly emerging Bangladesh phishing campaigns.
- [ ] **Phase 5: Browser Extension**
  - Lightweight Chrome/Firefox extension providing real-time warnings before users enter credentials on unverified portals.

---

## License

This project is developed for educational and cybersecurity research purposes. License information will be designated prior to the first formal public distribution.
