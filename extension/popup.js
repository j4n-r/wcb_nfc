document.addEventListener("DOMContentLoaded", function () {
    // Fixed API URL
    const API_URL = "http://localhost:8088";

    // DOM elements
    const readerStatus = document.getElementById("readerStatus");
    const connectBtn = document.getElementById("connectBtn");
    const disconnectBtn = document.getElementById("disconnectBtn");
    const pollBtn = document.getElementById("pollBtn");
    const readBtn = document.getElementById("readBtn");
    const writeBtn = document.getElementById("writeBtn");
    const getCurrentUrlBtn = document.getElementById("getCurrentUrlBtn");
    const statusMessage = document.getElementById("statusMessage");
    const readResult = document.getElementById("readResult");
    const writeData = document.getElementById("writeData");
    const writeResult = document.getElementById("writeResult");

    // Check reader status on popup open
    checkReaderStatus();

    // Get current URL button
    getCurrentUrlBtn.addEventListener("click", function () {
        chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
                if (tabs && tabs[0] && tabs[0].url) {
                    writeData.value = tabs[0].url;
                    showMessage(writeResult, "Current URL loaded", "success");
                } else {
                    showMessage(
                        writeResult,
                        "Could not get current URL",
                        "error",
                    );
                }
            },
        );
    });

    // Connect reader
    connectBtn.addEventListener("click", function () {
        sendApiRequest({
            url: `${API_URL}/create`,
        }).then((response) => {
            if (response.success && response.data.success) {
                updateReaderStatus("connected");
                showMessage(
                    statusMessage,
                    "Reader connected successfully",
                    "success",
                );
            } else {
                const errorMsg =
                    response.error ||
                    (response.data && response.data.error) ||
                    "Failed to connect reader";
                showMessage(statusMessage, errorMsg, "error");
            }
        });
    });

    // Disconnect reader
    disconnectBtn.addEventListener("click", function () {
        sendApiRequest({
            url: `${API_URL}/disconnect`,
        }).then((response) => {
            if (response.success && response.data.success) {
                updateReaderStatus("disconnected");
                showMessage(
                    statusMessage,
                    "Reader disconnected successfully",
                    "success",
                );
            } else {
                const errorMsg =
                    response.error ||
                    (response.data && response.data.error) ||
                    "Failed to disconnect reader";
                showMessage(statusMessage, errorMsg, "error");
            }
        });
    });

    // Poll card
    pollBtn.addEventListener("click", function () {
        sendApiRequest({
            url: `${API_URL}/poll`,
        }).then((response) => {
            if (response.success && response.data.success) {
                showMessage(statusMessage, "Card is present", "success");
            } else {
                const errorMsg =
                    response.error ||
                    (response.data && response.data.error) ||
                    "Card not present";
                showMessage(statusMessage, errorMsg, "error");
            }
        });
    });

    // Read tag
    readBtn.addEventListener("click", function () {
        sendApiRequest({
            url: `${API_URL}/read`,
        }).then((response) => {
            if (response.success) {
                if (response.data.data) {
                    readResult.textContent = response.data.data;
                } else {
                    readResult.textContent =
                        response.data.error || "No data read";
                }
            } else {
                readResult.textContent = `Error: ${response.error}`;
            }
        });
    });

    // Write tag
    writeBtn.addEventListener("click", function () {
        const message = writeData.value.trim();

        if (!message) {
            showMessage(writeResult, "Please enter data to write", "error");
            return;
        }

        sendApiRequest({
            url: `${API_URL}/write`,
            method: "POST",
            body: { message: message },
        }).then((response) => {
            if (response.success && response.data.success) {
                showMessage(
                    writeResult,
                    "Data written successfully",
                    "success",
                );
            } else {
                const errorMsg =
                    response.error ||
                    (response.data && response.data.error) ||
                    "Failed to write data";
                showMessage(writeResult, errorMsg, "error");
            }
        });
    });

    // Check reader status
    function checkReaderStatus() {
        sendApiRequest({
            url: `${API_URL}/status`,
        })
            .then((response) => {
                if (response.success) {
                    updateReaderStatus(response.data.status);
                } else {
                    updateReaderStatus("disconnected");
                }
            })
            .catch(() => {
                updateReaderStatus("disconnected");
            });
    }

    // Send API request through background script
    function sendApiRequest(config) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage(
                { type: "apiRequest", config },
                (response) =>
                    resolve(
                        response || {
                            success: false,
                            error: "No response from background script",
                        },
                    ),
            );
        });
    }

    // Update reader status UI
    function updateReaderStatus(status) {
        if (status === "connected") {
            readerStatus.textContent = "Connected";
            readerStatus.className = "status status-connected";
            connectBtn.disabled = true;
            disconnectBtn.disabled = false;
            pollBtn.disabled = false;
            readBtn.disabled = false;
            writeBtn.disabled = false;
            getCurrentUrlBtn.disabled = false;
        } else {
            readerStatus.textContent = "Disconnected";
            readerStatus.className = "status status-disconnected";
            connectBtn.disabled = false;
            disconnectBtn.disabled = true;
            pollBtn.disabled = true;
            readBtn.disabled = true;
            writeBtn.disabled = true;
            getCurrentUrlBtn.disabled = false; // This can still be enabled
        }
    }

    // Show message helper
    function showMessage(element, message, type) {
        element.textContent = message;
        element.className = `message ${type}`;
        element.style.display = "block";

        setTimeout(() => {
            element.style.display = "none";
        }, 3000);
    }

    // Automatically get current URL when popup opens
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs && tabs[0] && tabs[0].url) {
            writeData.value = tabs[0].url;
        }
    });
});
