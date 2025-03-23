// Background service worker for NFC Tag Manager
chrome.runtime.onInstalled.addListener(() => {
    console.log("NFC Tag Manager extension installed");
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "apiRequest") {
        handleApiRequest(request.config)
            .then((data) => sendResponse({ success: true, data }))
            .catch((error) => {
                console.error("Background script error:", error);

                // Log to extension's error log
                chrome.runtime.sendMessage({
                    type: "logError",
                    error: {
                        message: error.message,
                        stack: error.stack,
                        timestamp: new Date().toISOString(),
                        requestConfig: request.config,
                    },
                });

                sendResponse({ success: false, error: error.message });
            });
        return true; // Required for async sendResponse
    }
});

// Handle API requests with better error logging
async function handleApiRequest(config) {
    const { url, method = "GET", body = null } = config;

    try {
        console.log(
            `Making ${method} request to: ${url}`,
            body ? { body } : "",
        );

        const options = {
            method,
            headers: {
                "Content-Type": "application/json",
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);

        // Log response status
        console.log(
            `Response status: ${response.status} ${response.statusText}`,
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API error response: ${errorText}`);
            throw new Error(`API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        console.log("API response data:", data);
        return data;
    } catch (error) {
        console.error("API request failed:", error);
        throw error;
    }
}

// Global error handler
self.addEventListener("error", (event) => {
    console.error("Background worker global error:", event.message, event);
});

// Unhandled promise rejection handler
self.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason);
});
