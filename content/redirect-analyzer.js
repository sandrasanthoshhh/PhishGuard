function analyzeRedirect(navigation) {

    const result = {
        detected: false,
        type: null,
        score: 0,
        reasons: []
    };

    if (!navigation) {
        return result;
    }

    const qualifiers =
        navigation.transitionQualifiers || [];


    /*
     * Redirect confirmed by the service worker
     */

    if (navigation.detected) {

        result.detected = true;

        if (
            qualifiers.includes("server_redirect")
        ) {

            result.type = "server_redirect";

        } else if (
            qualifiers.includes("client_redirect")
        ) {

            result.type = "client_redirect";

        } else {

            result.type = "navigation_redirect";
        }

        result.score = 15;

        result.reasons.push(
            "Page was reached through a redirect"
        );

        return result;
    }


    /*
     * Chrome explicitly reports server redirect
     */

    if (
        qualifiers.includes("server_redirect")
    ) {

        result.detected = true;

        result.type = "server_redirect";

        result.score = 15;

        result.reasons.push(
            "Page was reached through a server-side redirect"
        );
    }


    /*
     * Chrome explicitly reports client redirect
     */

    if (
        qualifiers.includes("client_redirect")
    ) {

        result.detected = true;

        result.type = "client_redirect";

        result.score = 15;

        result.reasons.push(
            "Page was reached through a client-side redirect"
        );
    }

    return result;
}