let requestId = null, updateInterval = null,
    server = null, errors = 0;
const updateElement = document.getElementById('update');

const newUpdate = (text) => {
    const newParagraph = document.createElement('p');
    newParagraph.textContent = `${new Date()}: ${text}`;
    updateElement.appendChild(newParagraph);
    updateElement.scrollTop = updateElement.scrollHeight;
}

const updateRequest = async () => {
    try {
        const response = await fetch(`${server}/scrape/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ requestId }),
        });
        if (response.ok) {
            const messages = await response.json();
            for (let i = 0; i < messages.length; i++) {
                newUpdate(messages[i]);
            }
        } else {
            throw new Error("Something went wrong during get updates.");
        }
    } catch (e) {
        errors++;
        newUpdate(`Error updating from server: ${e}`);
        if (errors === 5) {
            clearInterval(updateInterval);
        }
    }
}

document.getElementById('requestForm').addEventListener('submit', async function (event) {
    // Get values
    event.preventDefault();
    // Check for the command
    if (!requestId) {
        // Get values
        server = document.getElementById('server').value;
        const url = document.getElementById('url').value;
        const keywordsText = document.getElementById('keywords').value;
        const keywordsArray = keywordsText.split('،')
            .map(keyword => keyword.trim()) // Remove extra spaces
            .filter(keyword => keyword.length > 0); // Remove empty strings
        const proxy = document.getElementById('proxy-on').checked;
        // Sending start request to the server
        try {
            const response = await fetch(`${server}/scrape/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, keywords: keywordsArray, proxy }),
            });
            // Get the response
            const data = await response.json();
            requestId = data.requestId;
            newUpdate(data.message);
            // Set the interval
            updateInterval = setInterval(updateRequest, 1000);
            // Convert the button to stop button
            document.getElementById('submit-btn').textContent = 'Stop';
        } catch (e) {
            newUpdate(`Error starting the request: ${e}`);
        }
    } else {
        // Sending stop request to the server
        clearInterval(updateInterval);
        try {
            const response = await fetch(`${server}/scrape/stop`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ requestId }),
            });
            // Get the response
            const data = await response.json();
            newUpdate(data.message);
            // Reset the values
            requestId = null;
            server = null;
            errors = 0;
            document.getElementById('submit-btn').textContent = 'Start';
        } catch (e) {
            newUpdate(`Error stopping the request: ${e}`);
        }
    }
});

window.addEventListener('beforeunload', function (event) {
    if (requestId) {
        navigator.sendBeacon(`${server}/scrape/stop`, JSON.stringify({ requestId }));
    }
});