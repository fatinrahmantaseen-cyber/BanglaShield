"""Automated tests for POST /api/v1/scan-url endpoint."""

import socket
import pytest
from fastapi.testclient import TestClient


def test_scan_valid_https_url(client: TestClient):
    """Test clean HTTPS URL returns low risk and zero alert score."""
    response = client.post("/api/v1/scan-url", json={"url": "https://example.com/about"})
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "low"
    assert data["risk_score"] == 0
    assert data["hostname"] == "example.com"
    assert "heuristic" in data["disclaimer"].lower()
    assert data["is_demo_heuristic"] is True

    # Verify HTTPS passed
    proto_ind = next(ind for ind in data["indicators"] if ind["id"] == "proto-https")
    assert proto_ind["status"] == "passed"


def test_scan_official_bangladesh_domain(client: TestClient):
    """Test recognized official Bangladesh domain is recognized without lure penalty."""
    response = client.post("/api/v1/scan-url", json={"url": "https://bangladesh.gov.bd"})
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "low"
    assert data["risk_score"] == 0
    reg_ind = next(ind for ind in data["indicators"] if ind["id"] == "regional-official-match")
    assert reg_ind["status"] == "passed"


def test_scan_unencrypted_http_url(client: TestClient):
    """Test unencrypted HTTP URL flags the protocol alert."""
    response = client.post("/api/v1/scan-url", json={"url": "http://example.com/login"})
    assert response.status_code == 200
    data = response.json()
    assert data["risk_score"] >= 25
    assert data["risk_level"] in ("suspicious", "high")
    proto_ind = next(ind for ind in data["indicators"] if ind["id"] == "proto-http-unencrypted")
    assert proto_ind["status"] == "alert"


def test_scan_ip_address_host(client: TestClient):
    """Test raw IP address hostname triggers domain alert."""
    response = client.post("/api/v1/scan-url", json={"url": "http://192.168.1.1/admin"})
    assert response.status_code == 200
    data = response.json()
    # IP host (+45) + HTTP (+25) = 70 (high risk)
    assert data["risk_score"] >= 70
    assert data["risk_level"] == "high"
    ip_ind = next(ind for ind in data["indicators"] if ind["id"] == "host-ip-address")
    assert ip_ind["status"] == "alert"


def test_scan_regional_brand_impersonation_lure(client: TestClient):
    """Test regional brand lure on unofficial domain with high-abuse TLD."""
    # Contains 'bkash', '.xyz', 'http' -> score should be high
    response = client.post(
        "/api/v1/scan-url",
        json={"url": "http://bkash-eid-bonus.xyz/claim"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "high"
    assert data["risk_score"] >= 80

    indicator_ids = [ind["id"] for ind in data["indicators"]]
    assert "regional-lure-mismatch" in indicator_ids
    assert "domain-high-abuse-tld" in indicator_ids
    assert "proto-http-unencrypted" in indicator_ids


def test_scan_userinfo_delimiter(client: TestClient):
    """Test userinfo '@' symbol is flagged."""
    response = client.post(
        "/api/v1/scan-url",
        json={"url": "https://safe-bank.com@evil-destination.com/login"},
    )
    assert response.status_code == 200
    data = response.json()
    auth_ind = next(ind for ind in data["indicators"] if ind["id"] == "auth-userinfo-delimiter")
    assert auth_ind["status"] == "alert"
    assert auth_ind["score_impact"] == 35


def test_scan_excessive_subdomains(client: TestClient):
    """Test excessive subdomain nesting is detected."""
    response = client.post(
        "/api/v1/scan-url",
        json={"url": "https://login.verify.account.service.portal.attacker.com"},
    )
    assert response.status_code == 200
    data = response.json()
    sub_ind = next(ind for ind in data["indicators"] if ind["id"] == "struct-subdomain-depth")
    assert sub_ind["status"] == "warning"


@pytest.mark.parametrize(
    "invalid_scheme_url",
    [
        "javascript:alert(1)",
        "file:///etc/passwd",
        "ftp://ftp.example.com/file.txt",
        "data:text/html,<h1>Phishing</h1>",
        "tel:+8801700000000",
    ],
)
def test_reject_unsupported_schemes(client: TestClient, invalid_scheme_url: str):
    """Ensure unsupported URL schemes are rejected with 422 Unprocessable Entity."""
    response = client.post("/api/v1/scan-url", json={"url": invalid_scheme_url})
    assert response.status_code == 422
    assert "Unsupported scheme" in response.json()["detail"] or "scheme" in response.json()["detail"].lower()


@pytest.mark.parametrize(
    "malformed_url",
    [
        "",
        "   ",
        "example.com",  # Missing scheme
        "http://",      # Missing host
    ],
)
def test_reject_malformed_urls(client: TestClient, malformed_url: str):
    """Ensure malformed or incomplete inputs are rejected safely."""
    response = client.post("/api/v1/scan-url", json={"url": malformed_url})
    assert response.status_code == 422


def test_reject_excessively_long_url(client: TestClient):
    """Ensure URLs longer than 2048 characters are rejected."""
    long_url = "https://example.com/" + "a" * 2050
    response = client.post("/api/v1/scan-url", json={"url": long_url})
    assert response.status_code == 422


def test_scan_zero_network_requests(client: TestClient, monkeypatch):
    """Verify that scanning NEVER attempts external network connections or DNS lookups.

    We monkeypatch socket.getaddrinfo and socket.socket.connect to ensure that
    no external resolution or non-loopback connections are made.
    """
    orig_connect = socket.socket.connect

    def forbidden_connect(self, address):
        # Allow internal asyncio loopback self-pipe on Windows (127.0.0.1)
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

    # Test with standard domain
    resp1 = client.post("/api/v1/scan-url", json={"url": "https://example.org/test"})
    assert resp1.status_code == 200

    # Test with IP host
    resp2 = client.post("/api/v1/scan-url", json={"url": "http://198.51.100.1/login"})
    assert resp2.status_code == 200

    # Test with regional lure
    resp3 = client.post("/api/v1/scan-url", json={"url": "http://bkash-lottery-claim.top"})
    assert resp3.status_code == 200


def test_heuristic_service_pure_offline_guarantee(monkeypatch):
    """Directly test that analyze_url_heuristics requires zero sockets and zero network calls."""
    from backend.app.services.heuristic_analyzer import analyze_url_heuristics

    def strict_no_socket(*args, **kwargs):
        raise RuntimeError("No socket creation permitted!")

    monkeypatch.setattr(socket, "socket", strict_no_socket)
    monkeypatch.setattr(socket, "getaddrinfo", strict_no_socket)

    # Calling analyzer directly must never touch socket() or getaddrinfo()
    result = analyze_url_heuristics("https://some-unseen-external-domain.com/path?query=1")
    assert result.hostname == "some-unseen-external-domain.com"
    assert result.risk_level == "low"


def test_scan_is_deterministic(client: TestClient):
    """Verify that identical inputs produce identical scores and indicators every time."""
    test_url = "http://bkash-claim-reward.xyz/verify?id=123"
    resp1 = client.post("/api/v1/scan-url", json={"url": test_url}).json()
    resp2 = client.post("/api/v1/scan-url", json={"url": test_url}).json()

    assert resp1["risk_score"] == resp2["risk_score"]
    assert resp1["risk_level"] == resp2["risk_level"]
    assert len(resp1["indicators"]) == len(resp2["indicators"])
    for ind1, ind2 in zip(resp1["indicators"], resp2["indicators"]):
        assert ind1["id"] == ind2["id"]
        assert ind1["score_impact"] == ind2["score_impact"]
