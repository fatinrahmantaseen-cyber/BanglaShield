"""BanglaShield FastAPI Application Entry Point.

Provides endpoints for system health verification, deterministic URL scanning,
and Bangla/Banglish/English scam-message analysis.
"""

import logging
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .core.config import settings
from .schemas import (
    HealthResponse,
    MessageAnalyzeRequest,
    MessageAnalyzeResponse,
    UrlScanRequest,
    UrlScanResponse,
)
from .services.heuristic_analyzer import InvalidUrlError, analyze_url_heuristics
from .services.message_analyzer import InvalidMessageError, analyze_scam_message

# Configure secure logging that avoids logging raw sensitive URLs and messages
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("banglashield.api")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Cybersecurity analysis API focused on detecting suspicious URL structures "
        "and regional scam/phishing message patterns in Bangladesh via deterministic heuristics."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware to allow requests from the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["System"],
    summary="Health Check",
    description="Reports the service operational status and version.",
)
async def health_check() -> HealthResponse:
    """System health check endpoint."""
    return HealthResponse(
        status="healthy",
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
    )


@app.post(
    f"{settings.API_V1_PREFIX}/scan-url",
    response_model=UrlScanResponse,
    tags=["URL Scanner"],
    summary="Scan URL for Suspicious Heuristics",
    description=(
        "Statically inspects a URL's structure using deterministic, explainable heuristic rules. "
        "Never visits, fetches, or resolves the submitted destination."
    ),
    status_code=status.HTTP_200_OK,
)
async def scan_url(payload: UrlScanRequest) -> UrlScanResponse:
    """Analyze a URL for structural risk indicators without external network traffic.

    Security note:
    Submitted URLs are never printed or logged to server output to protect sensitive paths.
    """
    url_len = len(payload.url)
    try:
        result = analyze_url_heuristics(payload.url)
        # Log metadata only, omitting the raw URL string
        logger.info("URL scan completed (input_length=%d, risk_level=%s)", url_len, result.risk_level)
        return result
    except InvalidUrlError as exc:
        logger.warning("URL scan rejected due to validation failure (input_length=%d): %s", url_len, exc)
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.error("Unexpected error during URL scan processing (input_length=%d)", url_len, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal processing error occurred while analyzing the URL.",
        ) from exc


@app.post(
    f"{settings.API_V1_PREFIX}/analyze-message",
    response_model=MessageAnalyzeResponse,
    tags=["Message Analyzer"],
    summary="Analyze Message for Scam Patterns",
    description=(
        "Analyzes SMS or text messages for social-engineering indicators across Bangla, Banglish, and English. "
        "Zero network requests. Raw message content is never logged or persisted."
    ),
    status_code=status.HTTP_200_OK,
)
async def analyze_message(payload: MessageAnalyzeRequest) -> MessageAnalyzeResponse:
    """Analyze an SMS or text message for deceptive scam indicators.

    Security note:
    Raw message text is never logged to server output to protect user privacy.
    """
    msg_len = len(payload.message)
    try:
        result = analyze_scam_message(payload.message)
        logger.info("Message analysis completed (input_length=%d, risk_level=%s)", msg_len, result.risk_level)
        return result
    except InvalidMessageError as exc:
        logger.warning("Message analysis rejected due to validation failure (input_length=%d): %s", msg_len, exc)
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.error("Unexpected error during message analysis (input_length=%d)", msg_len, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal processing error occurred while analyzing the message.",
        ) from exc
