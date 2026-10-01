let latestRiskResult = null;
console.log("[PhishGuard] Scanner initialized.");

const currentURL = window.location.href;
const currentHostname = window.location.hostname;


/*
 * ----------------------------------------
 * URL ANALYSIS
 * ----------------------------------------
 */

function analyzeURL(urlString) {

    const result = {
        score: 0,
        reasons: []
    };

    let url;

    try {
        url = new URL(urlString);
    } catch {
        result.score = 100;
        result.reasons.push("Unable to parse URL");
        return result;
    }

    const hostname = url.hostname;

    // HTTPS check
    if (url.protocol !== "https:") {

        result.score += 10;

        result.reasons.push(
            "Website is not using HTTPS"
        );
    }

    // IP address check
    const ipRegex =
        /^(?:\d{1,3}\.){3}\d{1,3}$/;

    if (ipRegex.test(hostname)) {

        result.score += 20;

        result.reasons.push(
            "Website uses an IP address instead of a domain name"
        );
    }

    // Punycode
    if (hostname.includes("xn--")) {

        result.score += 20;

        result.reasons.push(
            "Hostname contains punycode"
        );
    }

    // Long hostname
    if (hostname.length > 50) {

        result.score += 10;

        result.reasons.push(
            "Hostname is unusually long"
        );
    }

    // Long URL
    if (urlString.length > 180) {

        result.score += 10;

        result.reasons.push(
            "URL is unusually long"
        );
    }

    // Embedded credentials
    if (url.username || url.password) {

        result.score += 20;

        result.reasons.push(
            "URL contains embedded username or password information"
        );
    }

    result.score = Math.min(
        result.score,
        100
    );

    return result;
}


/*
 * ----------------------------------------
 * DISPLAY RESULT
 * ----------------------------------------
 */

function showResult(result) {

    let badge = document.getElementById(
        "phishguard-badge"
    );

    if (!badge) {

        badge = document.createElement("div");

        badge.id = "phishguard-badge";

        badge.style.position = "fixed";
        badge.style.top = "10px";
        badge.style.right = "10px";
        badge.style.zIndex = "2147483647";
        badge.style.padding = "10px 14px";
        badge.style.borderRadius = "8px";
        badge.style.background = "#111";
        badge.style.color = "#fff";
        badge.style.fontFamily = "Arial, sans-serif";
        badge.style.fontSize = "13px";
        badge.style.boxShadow =
            "0 2px 10px rgba(0,0,0,0.3)";

        document.body.appendChild(badge);
    }

    badge.textContent =
        `PhishGuard: ${result.level} (${result.score}/100)`;

    if (result.reasons.length > 0) {

        badge.title =
            result.reasons.join("\n");
    } else {

        badge.title =
            "No suspicious signals detected.";
    }
}


/*
 * ----------------------------------------
 * FULL PAGE ANALYSIS
 * ----------------------------------------
 */

function analyzePage(redirectResult = null) {

    console.log(
        "[PhishGuard] Starting full page analysis..."
    );

    const urlResult =
        analyzeURL(currentURL);

    const domainResult =
        analyzeDomain(currentURL);

    const formResult =
        analyzeForms();

    const pageResult =
    analyzePageContent();

    const riskResult =
        calculateRisk(
            urlResult,
            domainResult,
            formResult,
            redirectResult,
            pageResult
        );
    latestRiskResult =
        riskResult;

    console.log(
        "[PhishGuard] URL result:",
        urlResult
    );

    console.log(
        "[PhishGuard] Domain result:",
        domainResult
    );

    console.log(
        "[PhishGuard] Form result:",
        formResult
    );
    console.log(
    "[PhishGuard] Page content result:",
    pageResult
    );

    console.log(
        "[PhishGuard] Redirect result:",
        redirectResult
    );

    console.log(
    "[PhishGuard] FINAL RISK RESULT:",
    riskResult
    );

    // Store the latest result for the popup
    const scanRecord = {

    url: currentURL,

    result: riskResult,

    timestamp: Date.now()
};


chrome.storage.local.set(
    {
        phishguard_last_result:
            scanRecord
    },
    () => {
        if (chrome.runtime.lastError) {
            console.error(
                "[PhishGuard] Failed to save last result:",
                chrome.runtime.lastError.message
            );
        } else {
            console.log(
                "[PhishGuard] Last result saved:",
                scanRecord
            );
        }
    }
);


/*
 * Save scan history
 */

chrome.storage.local.get(
    "phishguard_scan_history",
    (data) => {

        if (chrome.runtime.lastError) {

            console.error(
                "[PhishGuard] Failed to read scan history:",
                chrome.runtime.lastError.message
            );

            return;
        }

        const history =
            data.phishguard_scan_history || [];

        history.unshift(scanRecord);

        /*
         * Keep only the latest 20 scans
         */

        const limitedHistory =
            history.slice(0, 20);

        chrome.storage.local.set(
            {
                phishguard_scan_history:
                    limitedHistory
            },
            () => {

                if (chrome.runtime.lastError) {

                    console.error(
                        "[PhishGuard] Failed to save scan history:",
                        chrome.runtime.lastError.message
                    );

                    return;
                }

                console.log(
                    "[PhishGuard] Scan history updated:",
                    limitedHistory
                );

                console.log(
                    "[PhishGuard] Latest history entry:",
                    limitedHistory[0]
                );
            }
        );
    }
);


chrome.storage.local.get(
    "phishguard_settings",
    (data) => {

        const settings =
            data.phishguard_settings || {

                enableWarning:
                    true,

                enablePageAnalysis:
                    true,

                enableFormAnalysis:
                    true
            };


        console.log(
            "[PhishGuard] Warning setting:",
            settings.enableWarning
        );


        if (
            settings.enableWarning &&
            (
                riskResult.level === "HIGH" ||
                riskResult.level === "CRITICAL"
            )
        ) {

            showWarningUI(
                riskResult
            );
        }
    }
);
}
/*
 * ----------------------------------------
 * START
 * ----------------------------------------
 */

/*
 * ----------------------------------------
 * REDIRECT ANALYSIS
 * ----------------------------------------
 */

function checkForPendingRedirect(
    attempt = 1
) {

    chrome.runtime.sendMessage(
        {
            type: "PHISHGUARD_GET_REDIRECT"
        },
        (response) => {

            if (chrome.runtime.lastError) {

                console.log(
                    "[PhishGuard] Redirect lookup unavailable:",
                    chrome.runtime.lastError.message
                );

                analyzePage(null);

                return;
            }


            /*
             * Redirect found
             */

            if (
                response &&
                response.redirect
            ) {

                console.log(
                    "[PhishGuard] Pending redirect received:",
                    response.redirect
                );

                const redirectResult =
                    analyzeRedirect(
                        response.redirect
                    );

                console.log(
                    "[PhishGuard] Redirect analysis:",
                    redirectResult
                );

                analyzePage(
                    redirectResult
                );

                return;
            }


            /*
             * No redirect yet.
             * Retry a few times because the
             * service worker may still be
             * processing onCommitted.
             */

            if (attempt < 5) {

                console.log(
                    `[PhishGuard] No pending redirect yet. Retry ${attempt}/5`
                );

                setTimeout(
                    () => {
                        checkForPendingRedirect(
                            attempt + 1
                        );
                    },
                    200
                );

                return;
            }


            /*
             * No redirect after all retries.
             */

            console.log(
                "[PhishGuard] No pending redirect after retries."
            );

            analyzePage(null);
        }
    );
}


/*
 * Start redirect lookup
 */

setTimeout(
    () => {
        checkForPendingRedirect();
    },
    100
);

chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        if (
            message &&
            message.type ===
            "PHISHGUARD_RESCAN"
        ) {

            console.log(
                "[PhishGuard] Rescan requested from popup."
            );


            checkForPendingRedirect();


            sendResponse({
                success: true
            });


            return true;
        }
    }
);
chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        if (
            message &&
            message.type ===
            "PHISHGUARD_GET_RESULT"
        ) {

            console.log(
                "[PhishGuard] Sending latest scan result to popup:",
                latestRiskResult
            );

            sendResponse({
                success: true,
                url: window.location.href,
                result: latestRiskResult
            });

            return true;
        }
    }
);
