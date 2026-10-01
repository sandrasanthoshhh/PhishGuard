console.log("[PhishGuard] Page analyzer loaded.");

function analyzePageContent() {

    console.log(
        "[PhishGuard] analyzePageContent() called."
    );

    const result = {
        score: 0,
        findings: [],
        reasons: []
    };

    const pageText =
        document.body
            ? document.body.innerText.toLowerCase()
            : "";

    const patterns = [
    {
        pattern: "verify your account",
        type: "account_verification",
        message:
            "Page asks the user to verify their account."
    },
    {
        pattern: "confirm your identity",
        type: "identity_verification",
        message:
            "Page asks the user to confirm their identity."
    },
    {
        pattern: "account suspended",
        type: "account_threat",
        message:
            "Page contains account-suspension language."
    },
    {
        pattern: "account will be suspended",
        type: "account_threat",
        message:
            "Page threatens account suspension."
    },
    {
        pattern: "urgent action required",
        type: "urgency_language",
        message:
            "Page uses urgent-action language."
    },
    {
        pattern: "password expired",
        type: "password_claim",
        message:
            "Page claims that a password has expired."
    }
];

    for (const item of patterns) {

        if (pageText.includes(item.pattern)) {

            result.score += 10;

            result.findings.push({
                type: item.type,
                pattern: item.pattern,
                message: item.message
            });

            result.reasons.push(
                item.message
            );
        }
    }

    result.score = Math.min(
        result.score,
        30
    );

    return result;
}