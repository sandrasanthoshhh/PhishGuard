function analyzeForms() {

    const forms = document.querySelectorAll("form");

    const result = {
        formsFound: forms.length,
        passwordForms: 0,
        findings: [],
        score: 0
    };

    for (const form of forms) {

        const passwordFields =
            form.querySelectorAll('input[type="password"]');

        if (passwordFields.length === 0) {
            continue;
        }

        result.passwordForms++;

        // Get form action
        const actionAttribute =
            form.getAttribute("action");

        const actionURL = new URL(
            actionAttribute || window.location.href,
            window.location.href
        );

        // Current page URL
        const pageURL =
            new URL(window.location.href);

        // Check whether submission uses HTTP
        if (actionURL.protocol === "http:") {

            result.score += 30;

            result.findings.push({
                type: "insecure_submission",
                message:
                    "Password form submits credentials over HTTP.",
                action: actionURL.href
            });
        }

        // Check whether form submits to another origin
        if (actionURL.origin !== pageURL.origin) {

            result.score += 25;

            result.findings.push({
                type: "cross_origin_submission",
                message:
                    "Password form submits credentials to a different origin.",
                action: actionURL.href
            });
        }
    }

    // Prevent score from exceeding 100
    result.score = Math.min(result.score, 100);

    return result;
}
function startFormMonitoring() {

    const observer = new MutationObserver(() => {

        const result = analyzeForms();

        console.log(
            "[PhishGuard] Form analysis updated:",
            result
        );
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    console.log("[PhishGuard] Form monitoring started.");

    return observer;
}
let formObserver = null;

function startFormMonitoring() {

    // Prevent multiple observers
    if (formObserver) {
        console.log("[PhishGuard] Form monitoring already running.");
        return formObserver;
    }

    formObserver = new MutationObserver(() => {

        const result = analyzeForms();

        console.log(
            "[PhishGuard] Form analysis updated:",
            result
        );
    });

    formObserver.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    console.log("[PhishGuard] Form monitoring started.");

    return formObserver;
}