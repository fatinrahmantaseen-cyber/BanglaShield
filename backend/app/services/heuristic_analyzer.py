"""BanglaShield Deterministic Heuristic URL Analyzer.

IMPORTANT SECURITY ASSURANCES:
1. Zero Outbound Traffic: This module never performs DNS resolution, socket connections,
   pings, HTTP requests, or any external network activity.
2. Safe Parsing: Uses Python standard library urllib.parse to analyze URL lexical structures.
3. Deterministic: Identical inputs produce identical scores and indicators every time.
4. Transparent Heuristics: Does NOT claim to use machine learning or prove absolute safety/malice.
"""

from datetime import datetime, timezone
import ipaddress
import re
from typing import List, Tuple
from urllib.parse import urlsplit

from ..core.config import settings
from ..schemas import HeuristicIndicator, UrlScanResponse


class InvalidUrlError(ValueError):
    """Raised when an input URL fails structure, scheme, or length validation."""
    pass


# Known official Bangladesh financial, governmental, and telecom domains
OFFICIAL_BANGLADESH_DOMAINS = {
    "bkash.com",
    "nagad.com.bd",
    "dutchbanglabank.com",
    "bangladesh.gov.bd",
    "grameenphone.com",
    "robi.com.bd",
    "banglalink.net",
    "teletalk.com.bd",
}

# Regional brand and promotion keywords frequently used in phishing/smishing lures
BANGLA_REGIONAL_KEYWORDS = [
    "bkash",
    "nagad",
    "rocket",
    "upay",
    "grameenphone",
    "robi",
    "banglalink",
    "teletalk",
    "cashout",
    "recharge",
    "eid-bonus",
    "lottery",
    "reward",
]

# High-abuse Top-Level Domains frequently associated with transient phishing campaigns
HIGH_ABUSE_TLDS = {
    ".xyz",
    ".top",
    ".buzz",
    ".fit",
    ".work",
    ".click",
    ".gq",
    ".cf",
    ".tk",
    ".ml",
}

SCORE_MEANING = (
    "Heuristic Risk Index (0 - 100): 0 indicates no structural risk heuristics were triggered; "
    "100 indicates maximum cumulative structural risk flags were observed. Derived deterministically."
)

DISCLAIMER_TEXT = (
    "BanglaShield uses deterministic heuristic analysis for educational and risk-flagging purposes. "
    "These rules assess structural indicators and cannot prove that a URL is definitively safe or malicious. "
    "This system does not claim to use machine learning."
)


def _is_ip_address(host: str) -> bool:
    """Safely check if host is an IPv4 or IPv6 literal without network lookups."""
    # Strip brackets from IPv6 hostnames like [::1]
    clean_host = host.strip("[]")
    try:
        ipaddress.ip_address(clean_host)
        return True
    except ValueError:
        return False


def validate_and_normalize_url(raw_url: str) -> Tuple[str, str]:
    """Validate URL string boundaries, scheme, and presence of a valid hostname.
    
    Returns:
        Tuple of (normalized_url, hostname)
    Raises:
        InvalidUrlError: If URL fails validation checks.
    """
    if not raw_url or not isinstance(raw_url, str):
        raise InvalidUrlError("URL string must not be empty.")

    trimmed = raw_url.strip()

    if len(trimmed) > settings.MAX_URL_LENGTH:
        raise InvalidUrlError(
            f"URL exceeds maximum allowed length of {settings.MAX_URL_LENGTH} characters."
        )

    try:
        parsed = urlsplit(trimmed)
    except Exception as exc:
        raise InvalidUrlError(f"Malformed URL structure: {exc}") from exc

    scheme = parsed.scheme.lower()
    if not scheme:
        raise InvalidUrlError(
            "Missing URL scheme. The address must explicitly begin with 'http://' or 'https://'."
        )

    if scheme not in settings.ALLOWED_SCHEMES:
        raise InvalidUrlError(
            f"Unsupported scheme '{scheme}'. Only 'http' and 'https' are permitted."
        )

    hostname = parsed.hostname
    if not hostname:
        raise InvalidUrlError("URL must contain a valid domain name or host address.")

    return trimmed, hostname.lower()


def analyze_url_heuristics(raw_url: str) -> UrlScanResponse:
    """Perform deterministic, offline heuristic structural analysis on a URL.
    
    NEVER makes any network calls.
    """
    normalized_url, hostname = validate_and_normalize_url(raw_url)
    parsed = urlsplit(normalized_url)
    
    indicators: List[HeuristicIndicator] = []
    cumulative_score = 0

    # 1. Transport Encryption Protocol (HTTP vs HTTPS)
    if parsed.scheme.lower() == "https":
        indicators.append(
            HeuristicIndicator(
                id="proto-https",
                category="protocol",
                title="Transport Layer Security (HTTPS)",
                description=(
                    "The URL specifies HTTPS encryption. Note: Phishing sites can also "
                    "obtain TLS certificates, so HTTPS alone does not guarantee authenticity."
                ),
                status="passed",
                score_impact=0,
            )
        )
    else:
        cumulative_score += 25
        indicators.append(
            HeuristicIndicator(
                id="proto-http-unencrypted",
                category="protocol",
                title="Unencrypted Protocol (HTTP)",
                description=(
                    "Plaintext HTTP is used. Authentic banking, telecom, and payment portals mandate "
                    "HTTPS to prevent credential eavesdropping in transit."
                ),
                status="alert",
                score_impact=25,
            )
        )

    # 2. Raw IP Address Hostname
    if _is_ip_address(hostname):
        cumulative_score += 45
        indicators.append(
            HeuristicIndicator(
                id="host-ip-address",
                category="domain",
                title="Raw IP Address Host",
                description=(
                    f"Destination host '{hostname}' is a raw IP literal instead of a registered domain. "
                    "Phishing operators frequently use raw IPs to bypass domain name reputation blocklists."
                ),
                status="alert",
                score_impact=45,
            )
        )
    else:
        indicators.append(
            HeuristicIndicator(
                id="host-standard-domain",
                category="domain",
                title="Standard Domain Format",
                description="Host adheres to standard registered domain name syntax.",
                status="passed",
                score_impact=0,
            )
        )

    # 3. Userinfo Delimiter '@' in Authority
    if "@" in parsed.netloc:
        cumulative_score += 35
        indicators.append(
            HeuristicIndicator(
                id="auth-userinfo-delimiter",
                category="structure",
                title="Userinfo Delimiter (@) Detected",
                description=(
                    "Contains '@' in the authority component. Browsers interpret preceding text as userinfo, "
                    "which attackers exploit to visually disguise the true target destination."
                ),
                status="alert",
                score_impact=35,
            )
        )

    # 4. Bangladesh Regional Brand Lure & Impersonation Check
    is_official_domain = any(
        hostname == official or hostname.endswith(f".{official}")
        for official in OFFICIAL_BANGLADESH_DOMAINS
    )

    url_lower = normalized_url.lower()
    matched_lures = [k for k in BANGLA_REGIONAL_KEYWORDS if k in url_lower]

    if matched_lures and not is_official_domain:
        cumulative_score += 40
        matched_str = ", ".join(matched_lures[:3])
        indicators.append(
            HeuristicIndicator(
                id="regional-lure-mismatch",
                category="regional",
                title="Potential Bangladesh Brand Impersonation",
                description=(
                    f"Matches regional financial/telecom keyword(s) [{matched_str}] on an unofficial "
                    f"domain ({hostname}). Scam campaigns frequently imitate bKash, Nagad, or telco recharge pages."
                ),
                status="alert",
                score_impact=40,
            )
        )
    elif is_official_domain:
        indicators.append(
            HeuristicIndicator(
                id="regional-official-match",
                category="regional",
                title="Verified Official Domain Pattern",
                description=f"Host matches recognized official service domain ({hostname}).",
                status="passed",
                score_impact=0,
            )
        )
    else:
        indicators.append(
            HeuristicIndicator(
                id="regional-no-lure",
                category="regional",
                title="No Regional Impersonation Keywords",
                description="No regional financial or telecommunication brand lure keywords detected.",
                status="passed",
                score_impact=0,
            )
        )

    # 5. High-Abuse / Disposable Top-Level Domain (TLD)
    matched_tld = next((tld for tld in HIGH_ABUSE_TLDS if hostname.endswith(tld)), None)
    if matched_tld:
        cumulative_score += 20
        indicators.append(
            HeuristicIndicator(
                id="domain-high-abuse-tld",
                category="domain",
                title=f"High-Abuse Top-Level Domain ({matched_tld})",
                description=(
                    f"Domain utilizes {matched_tld}, a TLD statistically overrepresented in "
                    "low-cost, disposable phishing and malware infrastructure."
                ),
                status="warning",
                score_impact=20,
            )
        )

    # 6. Excessive Subdomain Depth (Subdomain Stacking)
    domain_labels = hostname.split(".")
    # For domains like a.b.c.d.example.com, depth > 3 indicates multiple prefix subdomains
    if len(domain_labels) > 4:
        cumulative_score += 15
        indicators.append(
            HeuristicIndicator(
                id="struct-subdomain-depth",
                category="structure",
                title=f"Excessive Subdomain Depth ({len(domain_labels)} labels)",
                description=(
                    "Subdomain stacking is frequently used by attackers to hide malicious "
                    "domains on small mobile viewports (e.g. login.bank.com.attacker.site)."
                ),
                status="warning",
                score_impact=15,
            )
        )

    # 7. Non-standard Port Specification
    if parsed.port:
        standard_port = (parsed.scheme == "http" and parsed.port == 80) or (
            parsed.scheme == "https" and parsed.port == 443
        )
        if not standard_port:
            cumulative_score += 15
            indicators.append(
                HeuristicIndicator(
                    id="struct-non-standard-port",
                    category="structure",
                    title=f"Non-Standard Port ({parsed.port})",
                    description=(
                        f"URL specifies custom port {parsed.port} rather than standard web ports (80/443). "
                        "Unconventional ports are sometimes used for unmonitored command or proxy endpoints."
                    ),
                    status="warning",
                    score_impact=15,
                )
            )

    # Clamp the deterministic score strictly between 0 and 100
    final_score = min(100, max(0, cumulative_score))

    # Derive risk category from deterministic score
    if final_score >= 50:
        risk_level = "high"
        summary = (
            "Multiple high-risk structural indicators were flagged. Strongly advise caution."
        )
    elif final_score >= 16:
        risk_level = "suspicious"
        summary = (
            "Suspicious structural patterns were observed. Exercise caution before proceeding."
        )
    else:
        risk_level = "low"
        summary = (
            "No high-risk structural heuristic flags were triggered in this lexical analysis."
        )

    return UrlScanResponse(
        url=normalized_url,
        hostname=hostname,
        risk_level=risk_level,
        risk_score=final_score,
        max_risk_score=100,
        score_meaning=SCORE_MEANING,
        summary=summary,
        indicators=indicators,
        disclaimer=DISCLAIMER_TEXT,
        is_demo_heuristic=True,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
