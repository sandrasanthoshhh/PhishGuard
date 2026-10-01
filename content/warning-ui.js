function showWarningUI(result) {

    // Remove an existing warning
    const existing =
        document.getElementById("phishguard-warning");

    if (existing) {
        existing.remove();
    }

    // Main container
    const panel =
        document.createElement("div");

    panel.id = "phishguard-warning";

    // Panel styling
    panel.style.position = "fixed";
    panel.style.top = "20px";
    panel.style.right = "20px";
    panel.style.width = "360px";
    panel.style.padding = "20px";
    panel.style.background = "#ffffff";
    panel.style.color = "#111111";
    panel.style.borderRadius = "12px";
    panel.style.boxShadow =
        "0 8px 30px rgba(0,0,0,0.35)";
    panel.style.zIndex = "2147483647";
    panel.style.fontFamily =
        "Arial, sans-serif";
    panel.style.fontSize = "14px";

    // Header
    const title =
        document.createElement("h2");

    title.textContent =
        "🛡️ PhishGuard";

    title.style.marginTop = "0";

    // Risk level
    const level =
        document.createElement("div");

    level.textContent =
        result.level;

    level.style.fontSize = "24px";
    level.style.fontWeight = "bold";
    level.style.marginBottom = "5px";

    // Score
    const score =
        document.createElement("div");

    score.textContent =
        `Risk Score: ${result.score}/100`;

    score.style.marginBottom = "15px";

    // Reasons heading
    const heading =
        document.createElement("div");

    heading.textContent =
        "Why PhishGuard flagged this page:";

    heading.style.fontWeight = "bold";
    heading.style.marginBottom = "8px";

    // Reasons list
    const list =
        document.createElement("ul");

    list.style.paddingLeft = "20px";

    for (const reason of result.reasons) {

        const item =
            document.createElement("li");

        item.textContent = reason;

        item.style.marginBottom = "6px";

        list.appendChild(item);
    }

    // Close button
    const closeButton =
        document.createElement("button");

    closeButton.textContent =
        "Close";

    closeButton.style.padding =
        "8px 14px";

    closeButton.style.border = "none";
    closeButton.style.borderRadius = "6px";
    closeButton.style.cursor = "pointer";

    closeButton.addEventListener(
        "click",
        () => {
            panel.remove();
        }
    );

    // Assemble panel
    panel.appendChild(title);
    panel.appendChild(level);
    panel.appendChild(score);
    panel.appendChild(heading);

    if (result.reasons.length > 0) {
        panel.appendChild(list);
    }

    panel.appendChild(closeButton);

    // Add to page
    document.body.appendChild(panel);
}