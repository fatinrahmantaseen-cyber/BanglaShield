"""Pydantic schemas for request validation and response formatting."""

from typing import List, Literal
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# URL Scanner Schemas
# ---------------------------------------------------------------------------

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
    """An individual URL heuristic rule observation."""
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


# ---------------------------------------------------------------------------
# Message & Scam Analyzer Schemas
# ---------------------------------------------------------------------------

class MessageAnalyzeRequest(BaseModel):
    """Incoming request payload for SMS or scam message analysis."""
    message: str = Field(
        ...,
        min_length=1,
        max_length=4096,
        description="Text message to be analyzed (max 4096 characters). Supports Bangla, Banglish, and English.",
        examples=["bKash: Apnar account bondho hoye jabe. Ekhoni OTP din."]
    )


class MessageIndicator(BaseModel):
    """An individual message heuristic indicator observation."""
    id: str = Field(..., description="Unique identifier for the indicator rule.")
    category: Literal[
        "prize_lottery",
        "urgency_threat",
        "credential_harvesting",
        "suspicious_payment",
        "brand_impersonation",
        "suspicious_link",
        "general"
    ] = Field(..., description="Indicator category.")
    title: str = Field(..., description="Short descriptive title of the indicator.")
    description: str = Field(..., description="Plain-language explanation of what was detected and why.")
    status: Literal["passed", "warning", "alert", "info"] = Field(
        ..., description="Status outcome of this indicator."
    )
    score_impact: int = Field(
        ..., description="Deterministic point contribution of this rule to the message risk score."
    )


class MessageAnalyzeResponse(BaseModel):
    """Structured response for analyzed scam message."""
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
        ..., description="Explanation of the numerical risk scale."
    )
    summary: str = Field(
        ..., description="Human-readable plain language summary of the message analysis."
    )
    indicators: List[MessageIndicator] = Field(
        ..., description="List of individual indicator observations."
    )
    extracted_urls: List[str] = Field(
        default_factory=list,
        description="URLs extracted from the message without resolving or fetching them."
    )
    disclaimer: str = Field(
        ..., description="Important safety notice regarding heuristic limitations."
    )
    is_rule_based: bool = Field(
        default=True,
        description="Indicates that analysis is rule-based heuristics, not machine learning."
    )
    timestamp: str = Field(..., description="UTC timestamp of the message analysis.")


# ---------------------------------------------------------------------------
# System Schemas
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    """System health status response."""
    status: Literal["healthy"] = "healthy"
    service: str
    version: str
