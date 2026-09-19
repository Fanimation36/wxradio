const MOUNT = '/wxm49';

const statusEl = document.getElementById('status');
const listenersEl = document.getElementById('listeners');
const formatEl = document.getElementById('format');
const serverEl = document.getElementById('server');

const player = document.getElementById('player');

function setLive() {
    statusEl.textContent = 'LIVE';
    statusEl.className = 'status live';
    formatEl.textContent = '64 kbps · MP3';
    serverEl.textContent = 'Icecast 2.5.0';
}

function setOffline() {
    statusEl.textContent = 'OFFLINE';
    statusEl.className = 'status offline';
    formatEl.textContent = 'Stream unavailable';
    serverEl.textContent = 'Icecast';
}

function setChecking() {
    statusEl.textContent = 'CHECKING…';
    statusEl.className = 'status';
    formatEl.textContent = 'Checking stream…';
    serverEl.textContent = 'Icecast';
}

/*
 * Listener count cannot be obtained reliably from the HTTP
 * Icecast status API when this page is served over HTTPS.
 */
listenersEl.textContent = '—';

setChecking();

if (player) {
    // Browser successfully obtained enough information from the stream.
    player.addEventListener('loadedmetadata', setLive);
    player.addEventListener('canplay', setLive);
    player.addEventListener('playing', setLive);

    // Stream/player failure.
    player.addEventListener('error', setOffline);

    // Some mobile browsers don't actually connect to a live audio
    // stream until the user presses Play.
    setTimeout(() => {
        if (statusEl.textContent === 'CHECKING…') {
            statusEl.textContent = 'READY';
            statusEl.className = 'status live';
            formatEl.textContent = 'Press Play to connect';
        }
    }, 5000);
}
