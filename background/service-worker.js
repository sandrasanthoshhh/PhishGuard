console.log("[PhishGuard] Service worker started.");

const pendingNavigations = new Map();

const navigationHistory = new Map();

const pendingRedirects = new Map();

/*
 * ----------------------------------------
 * BEFORE NAVIGATION
 * ----------------------------------------
 */

chrome.webNavigation.onBeforeNavigate.addListener(
    (details) => {

        // Only monitor the main frame.
        if (details.frameId !== 0) {
            return;
        }

        const tabId = details.tabId;

        const navigation = {
            url: details.url,
            time: Date.now()
        };

        pendingNavigations.set(
            tabId,
            navigation
        );

        console.log(
            "[PhishGuard] BEFORE NAVIGATION:",
            navigation
        );
    }
);


/*
 * ----------------------------------------
 * COMMITTED NAVIGATION
 * ----------------------------------------
 */

chrome.webNavigation.onCommitted.addListener(
    (details) => {

        // Only monitor the main frame.
        if (details.frameId !== 0) {
            return;
        }

        const tabId = details.tabId;

        const currentNavigation = {
            url: details.url,
            time: Date.now(),
            transitionType:
                details.transitionType,
            transitionQualifiers:
                details.transitionQualifiers || []
        };

        const pending =
            pendingNavigations.get(tabId);

        console.log(
            "[PhishGuard] COMMITTED:",
            currentNavigation
        );


        /*
         * --------------------------------
         * REDIRECT DETECTION
         * --------------------------------
         */

        if (pending) {

            const requestedURL =
                pending.url;

            const committedURL =
                currentNavigation.url;

            const differentURL =
                requestedURL !== committedURL;

            const qualifiers =
                currentNavigation.transitionQualifiers;


            if (differentURL) {

            const redirectInfo = {

            detected: true,

            from: requestedURL,

            to: committedURL,

            timeDifference:
                currentNavigation.time -
                pending.time,

            transitionType:
                currentNavigation.transitionType,

            transitionQualifiers:
                qualifiers
        };

            pendingRedirects.set(
                tabId,
                redirectInfo
            );

            console.warn(
                "[PhishGuard] REDIRECT DETECTED:",
                redirectInfo
            );
        }

            pendingNavigations.delete(tabId);
        }


        /*
         * --------------------------------
         * NAVIGATION HISTORY
         * --------------------------------
         */

        if (!navigationHistory.has(tabId)) {

            navigationHistory.set(
                tabId,
                []
            );
        }

        const history =
            navigationHistory.get(tabId);

        history.push(
            currentNavigation
        );

        if (history.length > 10) {
            history.shift();
        }

        console.log(
            "[PhishGuard] Navigation history:",
            history
        );
    }
);
chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        if (
            message.type !==
            "PHISHGUARD_GET_REDIRECT"
        ) {
            return;
        }

        const tabId =
            sender.tab?.id;

        if (tabId === undefined) {

            sendResponse({
                redirect: null
            });

            return;
        }

        const redirect =
            pendingRedirects.get(tabId)
            || null;

        if (redirect) {

            pendingRedirects.delete(tabId);

            console.log(
                "[PhishGuard] Sending redirect to content script:",
                redirect
            );
        }

        sendResponse({
            redirect: redirect
        });
    }
);