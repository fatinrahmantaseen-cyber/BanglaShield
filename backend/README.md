# BanglaShield — Backend API

FastAPI backend providing deterministic, explainable heuristic URL analysis and SMS/scam-message classification with a regional focus on digital scam patterns in Bangladesh.

---

## 1. Quick Start

### Prerequisites
* Python 3.14+ (or your existing `.venv` at the project root)
* Dependencies installed from `backend/requirements.txt`

### Start the Backend Server
From the project root:

```powershell
# 1. Activate your virtual environment (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# 2. Start the Uvicorn ASGI server
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

### Accessing the API
* **Base URL:** `http://127.0.0.1:8000`
* **Interactive OpenAPI Docs (Swagger UI):** `http://127.0.0.1:8000/docs`
* **Alternative Documentation (ReDoc):** `http://127.0.0.1:8000/redoc`
* **Health Check Endpoint:** `http://127.0.0.1:8000/health`

---

## 2. API Endpoints

### `GET /health`
Verifies backend operational status.
* **Response `200 OK`:**
  ```json
  {
    "status": "healthy",
    "service": "BanglaShield Cybersecurity API",
    "version": "0.2.0"
  }
  ```

### `POST /api/v1/scan-url`
Statically analyzes a URL's structure using deterministic heuristic rules.

* **Request Body:**
  ```json
  {
    "url": "http://bkash-eid-bonus.xyz/claim"
  }
  ```

* **Example Response `200 OK`:**
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
    "timestamp": "2026-10-22T00:07:00Z"
  }
  ```

### `POST /api/v1/analyze-message`
Analyzes an SMS or text message across Bangla, Banglish, and English for deceptive patterns.

* **Request Body:**
  ```json
  {
    "message": "Apnar bkash account 24 ghontar moddhe bondho hobe. Verify korte ei link e click korun: http://bkash-verify.xyz ebong otp din."
  }
  ```

* **Example Response `200 OK`:**
  ```json
  {
    "risk_level": "high",
    "risk_score": 80,
    "max_risk_score": 100,
    "score_meaning": "Message Heuristic Risk Index (0 - 100): 0 = strictly standard transactional or benign patterns; 50+ = compounding scam indicators (e.g. brand impersonation combined with urgency, credential requests, or fee demands).",
    "summary": "Multiple compounding social-engineering indicators detected. High likelihood of fraudulent lure.",
    "indicators": [
      {
        "id": "brand-impersonation-risk",
        "category": "brand_impersonation",
        "title": "Potential Financial Brand Impersonation (BKASH)",
        "description": "Message references recognizable financial/telecom service(s) [BKASH] in combination with high-pressure, payment, or credential request patterns.",
        "status": "alert",
        "score_impact": 25
      },
      {
        "id": "urgency-coercive-pressure",
        "category": "urgency_threat",
        "title": "Coercive Urgency & Account Threat",
        "description": "Threatens imminent account suspension, block, or closure to compel immediate user compliance with verification links or sensitive data sharing.",
        "status": "alert",
        "score_impact": 30
      },
      {
        "id": "credential-harvesting-request",
        "category": "credential_harvesting",
        "title": "PIN / OTP / Password Request",
        "description": "Explicitly asks the recipient to send, enter, or share a PIN, OTP, or secret code. Legitimate financial institutions and telcos NEVER request PINs or passwords via message.",
        "status": "alert",
        "score_impact": 40
      },
      {
        "id": "link-suspicious-present",
        "category": "suspicious_link",
        "title": "Suspicious Link Embedded in Message",
        "description": "Found 1 link(s), including unencrypted HTTP or high-abuse TLDs. Phishing smishing messages routinely direct victims to fake portals.",
        "status": "alert",
        "score_impact": 25
      }
    ],
    "extracted_urls": [
      "http://bkash-verify.xyz"
    ],
    "disclaimer": "BanglaShield uses deterministic heuristic analysis for educational scam recognition. Heuristic patterns may yield false positives or false negatives and cannot prove whether a message is genuinely authentic or fraudulent. This system does not claim to use machine learning.",
    "is_rule_based": true,
    "timestamp": "2026-10-22T00:50:00Z"
  }
  ```

---

## 3. Heuristic Scoring & Combination Logic

### URL Scanning Weights
* Unencrypted HTTP: `+25`
* Raw IP Host: `+45`
* Userinfo Delimiter (`@`): `+35`
* Brand Impersonation on Unofficial Host: `+40`
* High-Abuse TLD (`.xyz`, `.top`, etc.): `+20`
* Excessive Subdomain Depth: `+15`
* Non-Standard Port: `+15`

### Message Scam Analysis Weights & Correlation
* Advance-Fee Prize/Lottery Claim: `+55`
* Brand Impersonation with Coercion/Threat: `+25`
* Coercive Urgency & Account Threats: `+30` (or `+15` standalone)
* Credential Harvesting Demand (PIN/OTP): `+40`
* Suspicious Embedded Link: `+25`
* Standard Web Link: `+10`
* **Legitimate Transaction Receipts (TrxID, Balance, Cash-in):** `0 pts` (Passed)
* **Security Advisories ("Do not share OTP", "কাউকে বলবেন না"):** `0 pts` (Defensive compliance passed)

---

## 4. Running Automated Tests

To run the complete test suite (36 tests):

```powershell
.\.venv\Scripts\pytest.exe backend/tests -v
```
