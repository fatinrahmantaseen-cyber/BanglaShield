# BanglaShield — Backend API

FastAPI backend providing deterministic, explainable heuristic URL analysis with a regional focus on digital scam patterns in Bangladesh.

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
    "version": "0.1.0"
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

---

## 3. Deterministic Heuristic Scoring Rules

The backend employs an additive, explainable scoring index from **0 to 100**. The final score is derived strictly from rule evaluation, not random generation or machine learning confidence:

| Rule ID | Category | Condition | Impact | Status |
| :--- | :--- | :--- | :--- | :--- |
| `proto-http-unencrypted` | Protocol | Unencrypted `http://` scheme used | `+25` | Alert |
| `host-ip-address` | Domain | Host is a raw IPv4/IPv6 literal | `+45` | Alert |
| `auth-userinfo-delimiter`| Structure | `@` symbol present in authority | `+35` | Alert |
| `regional-lure-mismatch` | Regional | Financial/telecom keyword on unofficial host | `+40` | Alert |
| `domain-high-abuse-tld` | Domain | High-abuse TLD (`.xyz`, `.top`, `.buzz`, etc.) | `+20` | Warning |
| `struct-subdomain-depth` | Structure | Subdomain depth exceeds 4 labels | `+15` | Warning |
| `struct-non-standard-port`| Structure | Non-standard port specified (not 80/443) | `+15` | Warning |

### Risk Level Categorization
* **`0 - 15` — Low Risk:** No high-severity structural indicators flagged.
* **`16 - 49` — Suspicious:** Non-standard attributes or suspicious TLD observed.
* **`50 - 100` — High Risk:** Multiple compounding risk indicators observed.

---

## 4. Security & Privacy Guarantees

1. **Zero Outbound Traffic:** Submitted URLs are analyzed purely via lexical string parsing with standard library `urllib.parse`. The backend **never** makes DNS queries, ping requests, or socket connections to the target.
2. **Safe Logging:** Server logs record request metadata (e.g. input string length, status code) but **never print or persist the raw URL string** to prevent leaking tokens or private parameters.
3. **Strict Validation:** Only `http` and `https` schemes are accepted. Non-web schemes (`javascript:`, `file:`, `data:`, `ftp:`) and inputs exceeding 2048 characters are safely rejected with `422 Unprocessable Entity`.

---

## 5. Running Automated Tests

To run the complete test suite:

```powershell
.\.venv\Scripts\pytest.exe backend/tests -v
```

This executes 21 automated unit and integration tests covering:
* System health check
* Valid HTTPS URLs and verified official domains
* Unencrypted HTTP and IP address hosts
* Regional lures and high-abuse TLDs
* Subdomain depth and userinfo `@` delimiters
* Malformed URLs and unsupported schemes
* **Zero network request verification** (verifying that no socket or DNS traffic is generated)
* Determinism verification (identical inputs yield identical scores)

