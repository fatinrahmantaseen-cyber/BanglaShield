"""BanglaShield Deterministic Scam Message Analyzer.

Analyzes SMS and text messages for social-engineering patterns across:
1. Bangla script
2. Banglish (Bangla transliterated into Latin characters)
3. English
4. Mixed-language communications

SECURITY ASSURANCES:
- Zero Network Activity: Never fetches links, connects to URLs, or sends message content externally.
- Safe Privacy: Never logs or stores raw message contents.
- Transparent Heuristics: Does not claim to use machine learning or prove absolute malice/authenticity.
"""

from datetime import datetime, timezone
import re
from typing import List, Set, Tuple
from urllib.parse import urlsplit

from ..core.config import settings
from ..schemas import MessageAnalyzeResponse, MessageIndicator


class InvalidMessageError(ValueError):
    """Raised when an input message fails validation."""
    pass


# ---------------------------------------------------------------------------
# Lexical & Pattern Dictionaries (Bangla, Banglish, English)
# ---------------------------------------------------------------------------

BRAND_PATTERNS = {
    "bkash": [r"\bbkash\b", r"বিকাশ", r"\bb-kash\b"],
    "nagad": [r"\bnagad\b", r"নগদ", r"\bnogod\b"],
    "rocket": [r"\brocket\b", r"রকেট", r"\broket\b"],
    "upay": [r"\bupay\b", r"উপায়", r"\bu-pay\b"],
    "dbbl": [r"\bdbbl\b", r"ডাচ[- ]?বাংলা", r"dutch[- ]?bangla"],
    "bank": [r"\bbank\b", r"ব্যাংক", r"\bbanking\b"],
    "grameenphone": [r"\bgrameenphone\b", r"\bgp\b", r"গ্রামীণফোন"],
    "banglalink": [r"\bbanglalink\b", r"\bbl\b", r"বাংলালিংক"],
    "robi": [r"\brobi\b", r"রবি"],
    "teletalk": [r"\bteletalk\b", r"টেলিটক"],
}

PRIZE_PATTERNS = [
    # Bangla
    r"লটারি", r"পুরস্কার", r"জিতেছেন", r"বিজয়ী", r"উপহার", r"বাম্পার", r"ফ্রি রিচার্জ",
    r"বোনাস পেয়েছেন", r"ঈদ অফার", r"ক্যাশব্যাক পেয়েছেন", r"অভিনন্দন",
    # Banglish
    r"\blottery\b", r"\bjitechen\b", r"\bjitchen\b", r"\bbijoyi\b", r"\bpuroshkar\b",
    r"\bupohar\b", r"\bfree recharge\b", r"\bbonus peyechen\b", r"\beid bonus\b",
    r"\bcongratulations\b", r"\bcongrats\b", r"\bwinner\b", r"\bwon\b",
    # English
    r"\bwon\b", r"\bwinner\b", r"\bprize\b", r"\bjackpot\b", r"\bselected to receive\b",
    r"\bclaim your\b", r"\breward\b", r"\bfree cash\b",
]

URGENCY_PATTERNS = [
    # Bangla
    r"জরুরী", r"অবিলম্বে", r"বন্ধ হবে", r"স্থগিত", r"বাতিল", r"ব্লক", r"২৪ ঘণ্টার মধ্যে",
    r"তাড়াতাড়ি", r"লক করা", r"নিষ্ক্রিয়", r"আইনি ব্যবস্থা", r"অ্যাকাউন্ট স্থগিত",
    # Banglish
    r"\bjoruri\b", r"\bobilombe\b", r"\bbondho hobe\b", r"\bsthogit\b", r"\bbatil\b",
    r"\bblock hobe\b", r"\b24 ghontar moddhe\b", r"\b24 hours er moddhe\b", r"\btaratari\b",
    r"\block kora\b", r"\baction required\b", r"\baccount closed\b", r"\bsuspended\b",
    # English
    r"\burgent\b", r"\burgently\b", r"\bimmediately\b", r"\bwithin 24 hours\b",
    r"\baccount suspended\b", r"\bblocked\b", r"\bterminated\b", r"\brestricted\b",
    r"\bdeactivated\b", r"\baction required\b", r"\blegal action\b",
]

CREDENTIAL_HARVEST_PATTERNS = [
    # Bangla
    r"পিন দিন", r"পিন দেন", r"ওটিপি দিন", r"ওটিপি দেন", r"ওটিপি পাঠান", r"পাসওয়ার্ড দিন",
    r"পিন ও ওটিপি", r"পিন নম্বর দিন", r"ওটিপি শেয়ার করুন", r"পিন ভেরিফাই", r"ওটিপি কোড দিন",
    r"গোপন পিন",
    # Banglish
    r"\bpin din\b", r"\bpin den\b", r"\botp din\b", r"\botp den\b", r"\botp pathan\b",
    r"\bpassword din\b", r"\botp share korun\b", r"\bpin share korun\b",
    r"\bpin number din\b", r"\bpin bolun\b", r"\bsecret code din\b",
    r"\bverify pin\b", r"\bsend otp\b", r"\bshare your pin\b", r"\bshare your otp\b",
    # English
    r"\bsend pin\b", r"\bshare otp\b", r"\benter password\b", r"\bprovide your pin\b",
    r"\bverify your otp\b", r"\bsend verification code\b", r"\bprovide password\b",
]

# Patterns that indicate a DEFENSIVE legitimate advisory, not credential theft
DEFENSIVE_ADVISORY_PATTERNS = [
    r"কাউকে.*বলবেন না",
    r"কাউকে.*দেবেন না",
    r"শেয়ার করবেন না",
    r"do not share",
    r"never share",
    r"share korben na",
    r"karon shathe share korben na",
    r"কাউকে ওটিপি বলবেন না",
    r"কাউকে পিন বলবেন না",
]

PAYMENT_DEMAND_PATTERNS = [
    # Bangla
    r"টাকা পাঠান", r"ফি প্রদান করুন", r"অ্যাডভান্স ফি", r"ক্যাশআউট চার্জ", r"ট্যাক্স দিন",
    r"প্রসেসিং ফি", r"ফি বাবদ", r"চার্জ পরিশোধ",
    # Banglish
    r"\btaka pathan\b", r"\bfee prodan korun\b", r"\badvance fee\b", r"\bcashout charge\b",
    r"\btax din\b", r"\bprocessing fee\b", r"\bfee babod\b", r"\bsend taka\b",
    # English
    r"\bsend fee\b", r"\badvance payment\b", r"\bprocessing charge\b", r"\bclearance fee\b",
    r"\bwire fee\b", r"\bclaim fee\b", r"\bpay fee\b",
]

LEGIT_TRANSACTION_PATTERNS = [
    r"you have received tk",
    r"trxid\b",
    r"cash in tk",
    r"cash out tk",
    r"balance tk",
    r"mobile recharge tk",
    r"payment of tk",
    r"লেনদেন সফল",
    r"আপনার ব্যালেন্স",
]

HIGH_ABUSE_TLDS = {".xyz", ".top", ".buzz", ".fit", ".work", ".click", ".gq", ".cf", ".tk", ".ml"}

URL_REGEX = re.compile(r"https?://[^\s<>\"']+|www\.[^\s<>\"']+", re.IGNORECASE)

SCORE_SCALE_EXPLANATION = (
    "Message Heuristic Risk Index (0 - 100): 0 = strictly standard transactional or benign patterns; "
    "50+ = compounding scam indicators (e.g. brand impersonation combined with urgency, credential requests, or fee demands)."
)

DISCLAIMER_TEXT = (
    "BanglaShield uses deterministic heuristic analysis for educational scam recognition. "
    "Heuristic patterns may yield false positives or false negatives and cannot prove whether a message is genuinely authentic or fraudulent. "
    "This system does not claim to use machine learning."
)


def extract_urls_safely(text: str) -> List[str]:
    """Extract URLs from text using regex without making network connections."""
    found = URL_REGEX.findall(text)
    # Deduplicate while preserving order
    seen: Set[str] = set()
    unique_urls: List[str] = []
    for u in found:
        cleaned = u.rstrip(".,;!?:)")
        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            unique_urls.append(cleaned)
    return unique_urls


def validate_message_input(raw_message: str) -> str:
    """Validate message length and non-emptiness safely."""
    if not raw_message or not isinstance(raw_message, str):
        raise InvalidMessageError("Message text must not be empty.")

    trimmed = raw_message.strip()
    if not trimmed:
        raise InvalidMessageError("Message text must not be empty or whitespace only.")

    if len(trimmed) > settings.MAX_MESSAGE_LENGTH:
        raise InvalidMessageError(
            f"Message exceeds maximum allowed length of {settings.MAX_MESSAGE_LENGTH} characters."
        )

    return trimmed


def analyze_scam_message(raw_message: str) -> MessageAnalyzeResponse:
    """Analyze SMS or text message for deceptive social engineering patterns.

    Zero outbound requests. Deterministic scoring.
    """
    message = validate_message_input(raw_message)
    msg_lower = message.lower()

    indicators: List[MessageIndicator] = []
    cumulative_score = 0

    # 1. Detect Financial Brand Mentions
    detected_brands = []
    for brand, patterns in BRAND_PATTERNS.items():
        if any(re.search(pat, msg_lower, re.IGNORECASE) for pat in patterns):
            detected_brands.append(brand)

    # 2. Detect Prize / Lottery Lure
    prize_matches = [pat for pat in PRIZE_PATTERNS if re.search(pat, msg_lower, re.IGNORECASE)]
    has_prize = len(prize_matches) > 0

    # 3. Detect Urgency / Threat
    urgency_matches = [pat for pat in URGENCY_PATTERNS if re.search(pat, msg_lower, re.IGNORECASE)]
    has_urgency = len(urgency_matches) > 0

    # 4. Detect Defensive Security Warnings vs Credential Harvesting
    has_defensive_warning = any(re.search(pat, msg_lower, re.IGNORECASE) for pat in DEFENSIVE_ADVISORY_PATTERNS)
    credential_matches = [pat for pat in CREDENTIAL_HARVEST_PATTERNS if re.search(pat, msg_lower, re.IGNORECASE)]
    has_credential_request = len(credential_matches) > 0 and not has_defensive_warning

    # 5. Detect Advance Fee / Suspicious Payment Demand
    payment_matches = [pat for pat in PAYMENT_DEMAND_PATTERNS if re.search(pat, msg_lower, re.IGNORECASE)]
    has_payment_demand = len(payment_matches) > 0

    # 6. Extract and inspect embedded URLs
    extracted_urls = extract_urls_safely(message)
    has_urls = len(extracted_urls) > 0
    has_suspicious_url = False

    if has_urls:
        for url in extracted_urls:
            url_lower = url.lower()
            try:
                # Add scheme if missing for parsing
                to_parse = url if "://" in url else f"http://{url}"
                parsed = urlsplit(to_parse)
                host = parsed.hostname or ""
                # Check for HTTP or suspicious TLD
                if parsed.scheme == "http" or any(host.endswith(tld) for tld in HIGH_ABUSE_TLDS):
                    has_suspicious_url = True
                    break
            except Exception:
                has_suspicious_url = True

    # 7. Detect Legitimate Transactional Indicators
    is_standard_transaction = any(re.search(pat, msg_lower, re.IGNORECASE) for pat in LEGIT_TRANSACTION_PATTERNS)

    # -----------------------------------------------------------------------
    # Combination Rules & Heuristic Score Derivation
    # -----------------------------------------------------------------------

    # Indicator A: Brand Context Evaluation
    if detected_brands:
        brand_names = ", ".join(detected_brands).upper()
        if (has_urgency or has_credential_request or has_payment_demand or has_suspicious_url) and not is_standard_transaction:
            # Correlated brand impersonation
            cumulative_score += 25
            indicators.append(
                MessageIndicator(
                    id="brand-impersonation-risk",
                    category="brand_impersonation",
                    title=f"Potential Financial Brand Impersonation ({brand_names})",
                    description=(
                        f"Message references recognizable financial/telecom service(s) [{brand_names}] "
                        "in combination with high-pressure, payment, or credential request patterns."
                    ),
                    status="alert",
                    score_impact=25,
                )
            )
        else:
            # Benign or neutral mention of brand
            indicators.append(
                MessageIndicator(
                    id="brand-mention-neutral",
                    category="brand_impersonation",
                    title=f"Brand Reference Observed ({brand_names})",
                    description=(
                        f"References brand [{brand_names}]. On its own, mentioning an institution is neutral "
                        "and does not classify a message as a scam."
                    ),
                    status="info",
                    score_impact=0,
                )
            )

    # Indicator B: Prize / Lottery Claim
    if has_prize:
        if has_payment_demand:
            # Classic advance-fee 419 lottery lure
            cumulative_score += 55
            indicators.append(
                MessageIndicator(
                    id="prize-advance-fee-lure",
                    category="prize_lottery",
                    title="Advance-Fee Lottery / Prize Lure",
                    description=(
                        "Contains unverified lottery/reward claim combined with a request to send money, "
                        "processing fees, or cashout charges."
                    ),
                    status="alert",
                    score_impact=55,
                )
            )
        else:
            cumulative_score += 25
            indicators.append(
                MessageIndicator(
                    id="prize-claim-unsolicited",
                    category="prize_lottery",
                    title="Unexpected Prize or Reward Claim",
                    description=(
                        "Contains unsolicited lottery or reward congratulations. Fraudulent campaigns "
                        "frequently use prize announcements to excite victims into hasty actions."
                    ),
                    status="warning",
                    score_impact=25,
                )
            )

    # Indicator C: Artificial Urgency or Threat
    if has_urgency:
        if has_credential_request or has_urls:
            cumulative_score += 30
            indicators.append(
                MessageIndicator(
                    id="urgency-coercive-pressure",
                    category="urgency_threat",
                    title="Coercive Urgency & Account Threat",
                    description=(
                        "Threatens imminent account suspension, block, or closure to compel immediate user compliance "
                        "with verification links or sensitive data sharing."
                    ),
                    status="alert",
                    score_impact=30,
                )
            )
        else:
            cumulative_score += 15
            indicators.append(
                MessageIndicator(
                    id="urgency-pressure-tactic",
                    category="urgency_threat",
                    title="Urgency Language Observed",
                    description=(
                        "Employs urgent deadlines ('within 24 hours', 'immediately', 'অবিলম্বে'). "
                        "Legitimate service notices typically provide standard support channels."
                    ),
                    status="warning",
                    score_impact=15,
                )
            )

    # Indicator D: Credential Harvesting vs Defensive Advisory
    if has_defensive_warning:
        indicators.append(
            MessageIndicator(
                id="security-advisory-compliant",
                category="credential_harvesting",
                title="Defensive Security Advisory Present",
                description=(
                    "Message contains instructions NOT to share PIN or OTP ('do not share', 'কাউকে বলবেন না'). "
                    "This is a recognized pattern of legitimate banking and authentication notices."
                ),
                status="passed",
                score_impact=0,
            )
        )
    elif has_credential_request:
        cumulative_score += 40
        indicators.append(
            MessageIndicator(
                id="credential-harvesting-request",
                category="credential_harvesting",
                title="PIN / OTP / Password Request",
                description=(
                    "Explicitly asks the recipient to send, enter, or share a PIN, OTP, or secret code. "
                    "Legitimate financial institutions and telcos NEVER request PINs or passwords via message."
                ),
                status="alert",
                score_impact=40,
            )
        )

    # Indicator E: Suspicious Payment / Advance Fee Demand (if not already counted with prize)
    if has_payment_demand and not has_prize:
        cumulative_score += 35
        indicators.append(
            MessageIndicator(
                id="suspicious-payment-request",
                category="suspicious_payment",
                title="Suspicious Payment / Fee Request",
                description=(
                    "Requests the recipient to transfer money, advance fees, or cashout charges ('টাকা পাঠান', 'send fee')."
                ),
                status="alert",
                score_impact=35,
            )
        )

    # Indicator F: Embedded URLs
    if has_urls:
        if has_suspicious_url:
            cumulative_score += 25
            indicators.append(
                MessageIndicator(
                    id="link-suspicious-present",
                    category="suspicious_link",
                    title="Suspicious Link Embedded in Message",
                    description=(
                        f"Found {len(extracted_urls)} link(s), including unencrypted HTTP or high-abuse TLDs. "
                        "Phishing smishing messages routinely direct victims to fake portals."
                    ),
                    status="alert",
                    score_impact=25,
                )
            )
        else:
            cumulative_score += 10
            indicators.append(
                MessageIndicator(
                    id="link-standard-present",
                    category="suspicious_link",
                    title=f"Web Link Present ({len(extracted_urls)} URL{'s' if len(extracted_urls)>1 else ''})",
                    description=(
                        "Message contains embedded web address(es). Inspect link destination carefully before interacting."
                    ),
                    status="warning",
                    score_impact=10,
                )
            )

    # Indicator G: Normal Transactional Baseline Credit
    if is_standard_transaction and not (has_credential_request or has_payment_demand):
        indicators.append(
            MessageIndicator(
                id="standard-transaction-format",
                category="general",
                title="Standard Financial Transaction Receipt Format",
                description=(
                    "Message exhibits standard syntax typical of genuine bank or mobile-money transaction receipts "
                    "(e.g. TrxID, balance update, cash-in notification)."
                ),
                status="passed",
                score_impact=0,
            )
        )

    # If no risk indicators were triggered at all
    if not indicators:
        indicators.append(
            MessageIndicator(
                id="message-baseline-clean",
                category="general",
                title="No Social-Engineering Flags Detected",
                description="Message text does not match known prize lures, urgency threats, or credential requests.",
                status="passed",
                score_impact=0,
            )
        )

    final_score = min(100, max(0, cumulative_score))

    # Determine risk category
    if final_score >= 50:
        risk_level = "high"
        summary = "Multiple compounding social-engineering indicators detected. High likelihood of fraudulent lure."
    elif final_score >= 20:
        risk_level = "suspicious"
        summary = "Suspicious communication patterns observed (e.g. urgency, prize announcement, or link). Caution advised."
    else:
        risk_level = "low"
        summary = "No severe social-engineering scam indicators were identified in this message."

    return MessageAnalyzeResponse(
        risk_level=risk_level,
        risk_score=final_score,
        max_risk_score=100,
        score_meaning=SCORE_SCALE_EXPLANATION,
        summary=summary,
        indicators=indicators,
        extracted_urls=extracted_urls,
        disclaimer=DISCLAIMER_TEXT,
        is_rule_based=True,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
