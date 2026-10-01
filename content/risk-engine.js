function calculateRisk(
    urlResult,
    domainResult,
    formResult,
    redirectResult,
    pageResult
) {
    const result = {
        score: 0,
        level: "LOW",
        reasons: []
    };

    // -----------------------------
    // URL signals
    // -----------------------------

    if (urlResult) {

        result.score += urlResult.score || 0;

        if (Array.isArray(urlResult.reasons)) {
            result.reasons.push(...urlResult.reasons);
        }
    }

    // -----------------------------
    // Domain signals
    // -----------------------------

    if (domainResult) {

        result.score += domainResult.score || 0;

        if (Array.isArray(domainResult.reasons)) {
            result.reasons.push(...domainResult.reasons);
        }
    }

    // -----------------------------
    // Form signals
    // -----------------------------

    if (formResult) {

        result.score += formResult.score || 0;

        if (Array.isArray(formResult.findings)) {

            for (const finding of formResult.findings) {

                result.reasons.push(
                    finding.message
                );
            }
        }
    }
    if (redirectResult) {

    result.score +=
        redirectResult.score || 0;

    if (
        Array.isArray(
            redirectResult.reasons
        )
    ) {

        result.reasons.push(
            ...redirectResult.reasons
        );
    }
    }
    // -----------------------------
// Page content signals
// -----------------------------

if (pageResult) {

    result.score +=
        pageResult.score || 0;

    if (
        Array.isArray(
            pageResult.reasons
        )
    ) {

        result.reasons.push(
            ...pageResult.reasons
        );
    }
}
    // -----------------------------
    // Limit score
    // -----------------------------

    result.score = Math.min(
        result.score,
        100
    );

    // -----------------------------
    // Determine risk level
    // -----------------------------

    if (result.score >= 80) {

        result.level = "CRITICAL";

    } else if (result.score >= 60) {

        result.level = "HIGH";

    } else if (result.score >= 30) {

        result.level = "SUSPICIOUS";

    } else {

        result.level = "LOW";
    }

    return result;
}