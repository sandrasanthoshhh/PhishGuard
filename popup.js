document.addEventListener(
    "DOMContentLoaded",
    initializePopup
);


async function initializePopup() {

    console.log(
        "[PhishGuard] Popup initialized."
    );

    setupRescanButton();

    await loadCurrentPage();

    loadStatistics();
}


/* =========================
   CURRENT TAB
   ========================= */

async function getCurrentTab() {

    const tabs =
        await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

    return tabs[0] || null;
}


/* =========================
   LOAD CURRENT PAGE
   ========================= */

async function loadCurrentPage() {

    const tab =
        await getCurrentTab();


    if (!tab) {

        setStatus(
            "Unable to identify current tab."
        );

        return;
    }


    const currentURL =
        tab.url || "";


    console.log(
        "[PhishGuard] Current tab:",
        currentURL
    );


    document.getElementById(
        "current-url"
    ).textContent =
        currentURL ||
        "Unknown";


    /*
     * Ask the content script for its
     * latest scan result.
     */

    chrome.tabs.sendMessage(
        tab.id,
        {
            type:
                "PHISHGUARD_GET_RESULT"
        },
        (response) => {

            /*
             * Content script may not be available
             * on Chrome internal pages or may still
             * be loading.
             */

            if (
                chrome.runtime.lastError
            ) {

                console.log(
                    "[PhishGuard] Content script unavailable. Using stored result."
                );

                loadStoredResult(
                    currentURL
                );

                return;
            }


            if (
                response &&
                response.result
            ) {

                console.log(
                    "[PhishGuard] Received live result:",
                    response
                );


                const stored = {

                    url:
                        response.url ||
                        currentURL,

                    result:
                        response.result,

                    timestamp:
                        Date.now()
                };


                setStatus(
                    "Page scanned successfully."
                );


                displayRiskResult(
                    stored
                );


                return;
            }


            /*
             * No live result yet.
             * Fall back to storage.
             */

            console.log(
                "[PhishGuard] No live result. Checking storage."
            );


            loadStoredResult(
                currentURL
            );
        }
    );
}
function loadStoredResult(
    currentURL
) {

    chrome.storage.local.get(
        "phishguard_last_result",
        (data) => {

            if (
                chrome.runtime.lastError
            ) {

                console.error(
                    "[PhishGuard] Storage error:",
                    chrome.runtime.lastError.message
                );

                setStatus(
                    "Unable to load scan result."
                );

                return;
            }


            const stored =
                data.phishguard_last_result;


            if (!stored) {

                setStatus(
                    "Page has not been scanned yet."
                );

                displayNoResult();

                return;
            }


            console.log(
                "[PhishGuard] Stored result:",
                stored
            );


            /*
             * Make sure the stored result belongs
             * to the current page.
             */

            if (
                stored.url &&
                currentURL &&
                stored.url !== currentURL
            ) {

                setStatus(
                    "Waiting for current page scan..."
                );

                displayNoResult();

                return;
            }


            setStatus(
                "Page scanned successfully."
            );


            displayRiskResult(
                stored
            );
        }
    );
}

/* =========================
   DISPLAY RESULT
   ========================= */

function displayRiskResult(stored) {

    const result =
        stored.result;

    if (!result) {

        displayNoResult();

        return;
    }


    const riskLevel =
        result.level || "LOW";

    const score =
        Number(result.score || 0);


    const levelElement =
        document.getElementById(
            "risk-level"
        );

    const scoreElement =
        document.getElementById(
            "risk-score"
        );


    levelElement.textContent =
        riskLevel;

    scoreElement.textContent =
        `${score} / 100`;


    /*
     * Remove previous risk classes.
     */

    levelElement.classList.remove(
        "risk-low",
        "risk-suspicious",
        "risk-high",
        "risk-critical"
    );


    /*
     * Apply appropriate class.
     */

    switch (riskLevel) {

        case "LOW":

            levelElement.classList.add(
                "risk-low"
            );

            break;


        case "SUSPICIOUS":

            levelElement.classList.add(
                "risk-suspicious"
            );

            break;


        case "HIGH":

            levelElement.classList.add(
                "risk-high"
            );

            break;


        case "CRITICAL":

            levelElement.classList.add(
                "risk-critical"
            );

            break;
    }


    displayReasons(
        result.reasons || []
    );
}


/* =========================
   DISPLAY REASONS
   ========================= */

function displayReasons(reasons) {

    const list =
        document.getElementById(
            "risk-reasons"
        );

    list.innerHTML = "";


    if (!reasons.length) {

        const item =
            document.createElement("li");

        item.textContent =
            "No suspicious indicators detected.";

        list.appendChild(item);

        return;
    }


    for (const reason of reasons) {

        const item =
            document.createElement("li");

        item.textContent =
            reason;

        list.appendChild(item);
    }
}


/* =========================
   NO RESULT
   ========================= */

function displayNoResult() {

    const level =
        document.getElementById(
            "risk-level"
        );

    const score =
        document.getElementById(
            "risk-score"
        );

    level.textContent =
        "NOT SCANNED";

    score.textContent =
        "— / 100";


    level.classList.remove(
        "risk-low",
        "risk-suspicious",
        "risk-high",
        "risk-critical"
    );


    displayReasons([]);
}


/* =========================
   STATUS
   ========================= */

function setStatus(message) {

    const element =
        document.getElementById(
            "scan-status"
        );

    element.textContent =
        message;
}


/* =========================
   RESCAN
   ========================= */

function setupRescanButton() {

    const button =
        document.getElementById(
            "rescan-button"
        );


    button.addEventListener(
        "click",
        async () => {

            button.disabled = true;

            button.textContent =
                "Scanning...";

            setStatus(
                "Running security scan..."
            );


            const tab =
                await getCurrentTab();


            if (!tab || !tab.id) {

                setStatus(
                    "Unable to access current tab."
                );

                button.disabled = false;

                button.textContent =
                    "🔄 Rescan Page";

                return;
            }


            chrome.tabs.sendMessage(
                tab.id,
                {
                    type:
                        "PHISHGUARD_RESCAN"
                },
                (response) => {

                    if (
                        chrome.runtime.lastError
                    ) {

                        console.error(
                            "[PhishGuard] Rescan error:",
                            chrome.runtime.lastError.message
                        );

                        setStatus(
                            "Unable to rescan this page."
                        );

                        button.disabled = false;

                        button.textContent =
                            "🔄 Rescan Page";

                        return;
                    }


                    console.log(
                        "[PhishGuard] Rescan response:",
                        response
                    );


                    setStatus(
                        "Scan started. Refreshing result..."
                    );


                    setTimeout(
                        async () => {

                            await loadCurrentPage();

                            button.disabled =
                                false;

                            button.textContent =
                                "🔄 Rescan Page";

                        },
                        500
                    );
                }
            );
        }
    );
}
function loadStatistics() {

    chrome.storage.local.get(
        "phishguard_scan_history",
        (data) => {

            if (
                chrome.runtime.lastError
            ) {

                console.error(
                    "[PhishGuard] Statistics error:",
                    chrome.runtime.lastError.message
                );

                return;
            }


            const history =
                data.phishguard_scan_history ||
                [];


            let highRisk =
                0;

            let criticalRisk =
                0;


            for (
                const scan
                of history
            ) {

                if (
                    scan.result &&
                    scan.result.level ===
                    "HIGH"
                ) {

                    highRisk++;
                }


                if (
                    scan.result &&
                    scan.result.level ===
                    "CRITICAL"
                ) {

                    criticalRisk++;
                }
            }


            document.getElementById(
                "total-scans"
            ).textContent =
                history.length;


            document.getElementById(
                "high-risk-scans"
            ).textContent =
                highRisk;


            document.getElementById(
                "critical-scans"
            ).textContent =
                criticalRisk;
        }
    );
}