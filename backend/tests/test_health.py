"""Tests for GET /health endpoint."""

from fastapi.testclient import TestClient


def test_health_check_returns_ok(client: TestClient):
    """Verify that GET /health returns 200 with healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "BanglaShield" in data["service"]
    assert "version" in data

