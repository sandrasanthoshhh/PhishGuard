const DEFAULT_SETTINGS = {
    enableWarning: true,
    enablePageAnalysis: true,
    enableFormAnalysis: true
};


/*
 * Wait until the options page is fully loaded.
 */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "[PhishGuard] Options page loaded."
        );

        loadSettings();

        setupSaveButton();
    }
);


/*
 * Load saved settings.
 */

function loadSettings() {

    chrome.storage.local.get(
        "phishguard_settings",
        (data) => {

            if (
                chrome.runtime.lastError
            ) {

                console.error(
                    "[PhishGuard] Failed to load settings:",
                    chrome.runtime.lastError.message
                );

                return;
            }


            const savedSettings =
                data.phishguard_settings;


            const settings = {

                ...DEFAULT_SETTINGS,

                ...(savedSettings || {})
            };


            console.log(
                "[PhishGuard] Settings loaded:",
                settings
            );


            document.getElementById(
                "enable-warning"
            ).checked =
                settings.enableWarning;


            document.getElementById(
                "enable-page-analysis"
            ).checked =
                settings.enablePageAnalysis;


            document.getElementById(
                "enable-form-analysis"
            ).checked =
                settings.enableFormAnalysis;
        }
    );
}


/*
 * Setup Save button.
 */

function setupSaveButton() {

    const saveButton =
        document.getElementById(
            "save-button"
        );


    if (!saveButton) {

        console.error(
            "[PhishGuard] Save button not found."
        );

        return;
    }


    saveButton.addEventListener(
        "click",
        saveSettings
    );
}


/*
 * Save settings.
 */

function saveSettings() {

    const settings = {

        enableWarning:
            document.getElementById(
                "enable-warning"
            ).checked,

        enablePageAnalysis:
            document.getElementById(
                "enable-page-analysis"
            ).checked,

        enableFormAnalysis:
            document.getElementById(
                "enable-form-analysis"
            ).checked
    };


    console.log(
        "[PhishGuard] Saving settings:",
        settings
    );


    chrome.storage.local.set(
        {
            phishguard_settings:
                settings
        },
        () => {

            if (
                chrome.runtime.lastError
            ) {

                console.error(
                    "[PhishGuard] Failed to save settings:",
                    chrome.runtime.lastError.message
                );

                return;
            }


            console.log(
                "[PhishGuard] Settings saved:",
                settings
            );


            showSaveStatus();
        }
    );
}


/*
 * Display "Settings saved."
 */

function showSaveStatus() {

    const status =
        document.getElementById(
            "status"
        );


    if (!status) {
        return;
    }


    status.textContent =
        "Settings saved.";


    setTimeout(
        () => {

            status.textContent =
                "";

        },
        2000
    );
}