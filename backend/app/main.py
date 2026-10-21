"""BanglaShield FastAPI Application Entry Point.

Provides endpoints for system health verification and deterministic URL scanning.
"""

import logging
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .core.config import settings
from .schemas import HealthResponse, UrlScanRequest, UrlScanResponse
from .services.heuristic_analyzer import InvalidUrlError, analyze_url_heuristics

# Configure secure logging that avoids logging raw sensitive URLs
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
        "and regional phishing lures in Bangladesh via deterministic heuristics."
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
    tags=["Scanner"],
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
        logger.info("Scan completed successfully (input_length=%d, risk_level=%s)", url_len, result.risk_level)
        return result
    except InvalidUrlError as exc:
        logger.warning("Scan rejected due to validation failure (input_length=%d): %s", url_len, exc)
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.error("Unexpected error during scan processing (input_length=%d)", url_len, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal processing error occurred while analyzing the URL.",
        ) from exc
