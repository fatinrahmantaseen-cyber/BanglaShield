"""Pydantic schemas for request validation and response formatting."""

from typing import List, Literal
from pydantic import BaseModel, Field


class UrlScanRequest(BaseModel):
    """Incoming request payload for URL scanning."""
    url: str = Field(
        ...,
        min_length=1,
        max_length=2048,
        description="The target URL to be statically analyzed (max 2048 characters).",
        examples=["https://example.com/login"]
    )


class HeuristicIndicator(BaseModel):
    """An individual heuristic rule observation."""
    id: str = Field(..., description="Unique identifier for the heuristic rule.")
    category: Literal["protocol", "domain", "keywords", "structure", "regional"] = Field(
        ..., description="Heuristic category."
    )
    title: str = Field(..., description="Short descriptive title of the check.")
    description: str = Field(..., description="Plain-language technical explanation of the check.")
    status: Literal["passed", "warning", "alert", "info"] = Field(
        ..., description="Status outcome of this indicator."
    )
    score_impact: int = Field(
        ..., description="Deterministic point contribution of this rule to the overall risk score."
    )


class UrlScanResponse(BaseModel):
    """Structured response for a scanned URL."""
    url: str = Field(..., description="Normalized target URL.")
    hostname: str = Field(..., description="Parsed domain or host.")
    risk_level: Literal["low", "suspicious", "high"] = Field(
        ..., description="Categorized risk assessment derived from heuristic score."
    )
    risk_score: int = Field(
        ..., ge=0, le=100, description="Deterministic risk score between 0 and 100."
    )
    max_risk_score: int = Field(
        default=100, description="Theoretical maximum risk score ceiling."
    )
    score_meaning: str = Field(
        ..., description="Documented explanation of the numerical score scale."
    )
    summary: str = Field(
        ..., description="Human-readable plain language summary of the analysis."
    )
    indicators: List[HeuristicIndicator] = Field(
        ..., description="List of individual heuristic rule findings."
    )
    disclaimer: str = Field(
        ..., description="Important safety notice regarding heuristic limitations."
    )
    is_demo_heuristic: bool = Field(
        default=True, description="Indicates that analysis is heuristic-based, not machine learning."
    )
    timestamp: str = Field(..., description="UTC timestamp of the scan analysis.")


class HealthResponse(BaseModel):
    """System health status response."""
    status: Literal["healthy"] = "healthy"
    service: str
    version: str
