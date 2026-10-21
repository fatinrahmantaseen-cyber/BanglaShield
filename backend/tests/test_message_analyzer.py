"""Automated test suite for POST /api/v1/analyze-message endpoint."""

import socket
import pytest
from fastapi.testclient import TestClient


def test_analyze_bangla_lottery_advance_fee_scam(client: TestClient):
    """Test classic Bangla lottery lure requesting advance fee."""
    msg = "অভিনন্দন! আপনি ৫০,০০০ টাকা লটারি জিতেছেন। প্রসেসিং ফি বাবদ ১,০০০ টাকা পাঠান।"
    response = client.post("/api/v1/analyze-message", json={"message": msg})
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "high"
    assert data["risk_score"] >= 45
    indicator_ids = [ind["id"] for ind in data["indicators"]]
    assert "prize-advance-fee-lure" in indicator_ids
    assert data["is_rule_based"] is True
    assert "disclaimer" in data


def test_analyze_bangla_urgency_credential_theft(client: TestClient):
    """Test Bangla urgency combined with brand impersonation and OTP/PIN demand."""
    msg = "বিকাশ হেল্পডেস্ক: আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে। অবিলম্বে চালু করতে পিন ও ওটিপি দিন।"
    response = client.post("/api/v1/analyze-message", json={"message": msg})
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "high"
    assert data["risk_score"] >= 70
    indicator_ids = [ind["id"] for ind in data["indicators"]]
    assert "brand-impersonation-risk" in indicator_ids
    assert "urgency-coercive-pressure" in indicator_ids
    assert "credential-harvesting-request" in indicator_ids


def test_analyze_banglish_phishing_message_with_link(client: TestClient):
    """Test Banglish message with brand, urgency, link, and OTP demand."""
    msg = "Apnar bkash account 24 ghontar moddhe bondho hobe. Verify korte ei link e click korun: http://bkash-verify.xyz ebong otp din."
    response = client.post("/api/v1/analyze-message", json={"message": msg})
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "high"
    assert data["risk_score"] >= 80
    assert len(data["extracted_urls"]) == 1
    assert "http://bkash-verify.xyz" in data["extracted_urls"]
    indicator_ids = [ind["id"] for ind in data["indicators"]]
    assert "link-suspicious-present" in indicator_ids
    assert "credential-harvesting-request" in indicator_ids


def test_analyze_english_lottery_scam(client: TestClient):
    """Test English lottery prize lure with advance charge."""
    msg = "Congratulations! You have won $10,000 cash prize. Please send $50 processing fee to claim your prize."
    response = client.post("/api/v1/analyze-message", json={"message": msg})
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "high"
    indicator_ids = [ind["id"] for ind in data["indicators"]]
    assert "prize-advance-fee-lure" in indicator_ids


def test_analyze_mixed_language_message(client: TestClient):
    """Test mixed English, Bangla, and Banglish words."""
    msg = "Robi Reward: Apni Eid Lottery jitechen! Taka pathan processing fee babod."
    response = client.post("/api/v1/analyze-message", json={"message": msg})
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "high"


def test_legitimate_transactional_receipt_sms(client: TestClient):
    """Verify that legitimate banking receipts are NOT falsely marked as scams."""
    msg = "You have received Tk 1,500.00 from 01712345678. Fee Tk 0.00. Balance Tk 2,350.00. TrxID 9H7B6K2."
    response = client.post("/api/v1/analyze-message", json={"message": msg})
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "low"
    assert data["risk_score"] <= 15
    indicator_ids = [ind["id"] for ind in data["indicators"]]
    assert "standard-transaction-format" in indicator_ids


def test_legitimate_otp_with_defensive_warning(client: TestClient):
    """Verify that an authentic OTP SMS containing 'Do not share' is treated as safe."""
    msg = "Your Nagad OTP is 492019. Do not share this OTP with anyone. Valid for 2 mins."
    response = client.post("/api/v1/analyze-message", json={"message": msg})
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "low"
    assert data["risk_score"] == 0
    indicator_ids = [ind["id"] for ind in data["indicators"]]
    assert "security-advisory-compliant" in indicator_ids
    assert "credential-harvesting-request" not in indicator_ids


def test_legitimate_bangla_security_warning(client: TestClient):
    """Verify that a Bangla awareness SMS warning against sharing PINs is safe."""
    msg = "আপনার বিকাশ পিন এবং ওটিপি কাউকে বলবেন না। বিকাশ কখনো গ্রাহকের পিন জানতে চায় না।"
    response = client.post("/api/v1/analyze-message", json={"message": msg})
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "low"
    assert data["risk_score"] == 0
    indicator_ids = [ind["id"] for ind in data["indicators"]]
    assert "security-advisory-compliant" in indicator_ids


def test_benign_casual_message(client: TestClient):
    """Verify that ordinary casual messages have zero risk score."""
    msg = "Assalamu alaikum, kalke campus e kokhon asben?"
    response = client.post("/api/v1/analyze-message", json={"message": msg})
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "low"
    assert data["risk_score"] == 0


@pytest.mark.parametrize("empty_msg", ["", "   ", "\n\t"])
def test_reject_empty_message(client: TestClient, empty_msg: str):
    """Ensure empty or whitespace-only messages are rejected with 422."""
    response = client.post("/api/v1/analyze-message", json={"message": empty_msg})
    assert response.status_code == 422


def test_reject_oversized_message(client: TestClient):
    """Ensure messages exceeding 4096 characters are rejected with 422."""
    huge_msg = "Hello " * 1000
    response = client.post("/api/v1/analyze-message", json={"message": huge_msg})
    assert response.status_code == 422


def test_analyze_message_zero_network_requests(client: TestClient, monkeypatch):
    """Verify that message analysis NEVER attempts outbound network or DNS requests."""
    orig_connect = socket.socket.connect

    def forbidden_connect(self, address):
        # Allow loopback for internal FastAPI/asyncio testing on Windows
        host = address[0] if isinstance(address, tuple) and len(address) > 0 else str(address)
        if host in ("127.0.0.1", "localhost", "::1"):
            return orig_connect(self, address)
        raise RuntimeError(f"SECURITY VIOLATION: Outbound socket connection to {host} attempted!")

    def forbidden_dns(host, port, *args, **kwargs):
        if str(host) in ("127.0.0.1", "localhost", "::1"):
            return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("127.0.0.1", port or 0))]
        raise RuntimeError(f"SECURITY VIOLATION: DNS resolution for {host} attempted!")

    monkeypatch.setattr(socket.socket, "connect", forbidden_connect)
    monkeypatch.setattr(socket, "getaddrinfo", forbidden_dns)

    msg_with_links = "Claim $500 prize here: https://phishing-site.xyz and http://scam-link.top"
    response = client.post("/api/v1/analyze-message", json={"message": msg_with_links})
    assert response.status_code == 200
    assert len(response.json()["extracted_urls"]) == 2


def test_message_analysis_is_deterministic(client: TestClient):
    """Verify that identical messages yield identical scores and indicator outputs."""
    msg = "bKash: Apnar account bondho hobe 24 ghontar moddhe. Ekhoni OTP din."
    resp1 = client.post("/api/v1/analyze-message", json={"message": msg}).json()
    resp2 = client.post("/api/v1/analyze-message", json={"message": msg}).json()

    assert resp1["risk_score"] == resp2["risk_score"]
    assert resp1["risk_level"] == resp2["risk_level"]
    assert len(resp1["indicators"]) == len(resp2["indicators"])
    for i1, i2 in zip(resp1["indicators"], resp2["indicators"]):
        assert i1["id"] == i2["id"]
        assert i1["score_impact"] == i2["score_impact"]

