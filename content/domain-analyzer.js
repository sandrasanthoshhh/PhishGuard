console.log("[PhishGuard] Domain analyzer loaded.");

function normalizeHostname(hostname) {
    return hostname
        .toLowerCase()
        .replace(/\.$/, "");
}

function getBaseDomain(hostname) {

    if (!hostname) {
        return "";
    }

    // IPv4
    const ipv4Regex =
        /^(?:\d{1,3}\.){3}\d{1,3}$/;

    if (ipv4Regex.test(hostname)) {
        return hostname;
    }

    // IPv6
    if (hostname.includes(":")) {
        return hostname;
    }

    const parts =
        hostname.split(".").filter(Boolean);

    if (parts.length < 2) {
        return hostname;
    }

    const commonTwoPartSuffixes = [
        "co.uk",
        "org.uk",
        "ac.uk",
        "gov.uk",
        "co.in",
        "org.in",
        "net.in",
        "ac.in",
        "gov.in",
        "co.au",
        "com.au",
        "net.au",
        "org.au",
        "co.nz",
        "com.br",
        "com.cn",
        "com.sg",
        "co.jp"
    ];

    const lastTwo =
        parts.slice(-2).join(".");

    if (commonTwoPartSuffixes.includes(lastTwo)) {

        if (parts.length < 3) {
            return hostname;
        }

        return parts.slice(-3).join(".");
    }

    return parts.slice(-2).join(".");
}

function findTrustedBrand(baseDomain) {

    for (const brand of TRUSTED_BRANDS) {

        for (const trustedDomain of brand.domains) {

            if (baseDomain === trustedDomain) {
                return brand;
            }
        }
    }

    return null;
}

function levenshtein(a, b) {

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {

        for (let j = 1; j <= a.length; j++) {

            if (b[i - 1] === a[j - 1]) {

                matrix[i][j] =
                    matrix[i - 1][j - 1];

            } else {

                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

function similarity(a, b) {

    const distance =
        levenshtein(a, b);

    const maxLength =
        Math.max(a.length, b.length);

    if (maxLength === 0) {
        return 1;
    }

    return 1 - distance / maxLength;
}

function normalizeLookalikeText(text) {

    return text
        .toLowerCase()
        .replace(/0/g, "o")
        .replace(/1/g, "l")
        .replace(/3/g, "e")
        .replace(/4/g, "a")
        .replace(/5/g, "s")
        .replace(/7/g, "t");
}

function detectLookalikeDomain(baseDomain) {

    const ipv4Regex =
        /^(?:\d{1,3}\.){3}\d{1,3}$/;

    if (
        ipv4Regex.test(baseDomain) ||
        baseDomain.includes(":")
    ) {
        return [];
    }

    const domainName =
        baseDomain.split(".")[0];

    const normalizedDomainName =
        normalizeLookalikeText(domainName);

    const findings = [];

    for (const brand of TRUSTED_BRANDS) {

        for (const trustedDomain of brand.domains) {

            const trustedName =
                trustedDomain.split(".")[0];

            if (domainName === trustedName) {
                continue;
            }

            const originalSimilarity =
                similarity(
                    domainName,
                    trustedName
                );

            const normalizedSimilarity =
                similarity(
                    normalizedDomainName,
                    trustedName
                );

            const bestSimilarity =
                Math.max(
                    originalSimilarity,
                    normalizedSimilarity
                );

            if (bestSimilarity >= 0.75) {

                findings.push({
                    brand: brand.name,
                    observed: domainName,
                    expected: trustedName,
                    originalSimilarity:
                        originalSimilarity,
                    normalizedSimilarity:
                        normalizedSimilarity,
                    normalized:
                        normalizedDomainName !== domainName
                });
            }
        }
    }

    return findings;
}

function detectBrandInHostname(
    hostname,
    baseDomain
) {

    const findings = [];

    const labels =
        hostname.split(".");

    for (const brand of TRUSTED_BRANDS) {

        for (const trustedDomain of brand.domains) {

            const trustedName =
                trustedDomain.split(".")[0];

            if (baseDomain === trustedDomain) {
                continue;
            }

            if (labels.includes(trustedName)) {

                findings.push({
                    brand: brand.name,
                    hostname: hostname,
                    baseDomain: baseDomain
                });
            }
        }
    }

    return findings;
}

function analyzeDomain(urlString) {

    const result = {
        hostname: null,
        baseDomain: null,
        trustedBrand: null,
        lookalikes: [],
        brandInHostname: [],
        score: 0,
        reasons: []
    };

    let url;

    try {

        url = new URL(urlString);

    } catch {

        result.score = 100;

        result.reasons.push(
            "Unable to parse URL"
        );

        return result;
    }

    const hostname =
        normalizeHostname(url.hostname);

    result.hostname = hostname;

    result.baseDomain =
        getBaseDomain(hostname);

    const brand =
        findTrustedBrand(
            result.baseDomain
        );

    if (brand) {

        result.trustedBrand =
            brand.name;
    }

    result.lookalikes =
        detectLookalikeDomain(
            result.baseDomain
        );

    if (result.lookalikes.length > 0) {

        result.score += 35;

        for (const finding of result.lookalikes) {

            result.reasons.push(
                `Domain resembles ${finding.brand}`
            );
        }
    }

    result.brandInHostname =
        detectBrandInHostname(
            result.hostname,
            result.baseDomain
        );

    if (result.brandInHostname.length > 0) {

        result.score += 25;

        for (
            const finding
            of result.brandInHostname
        ) {

            result.reasons.push(
                `${finding.brand} appears in hostname but is not the actual domain`
            );
        }
    }

    return result;
}