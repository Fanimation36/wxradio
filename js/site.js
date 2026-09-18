// GitHub Pages/mobile-friendly status detection.
// We intentionally do NOT fetch Icecast's HTTP status-json.xsl from this HTTPS page,
// because mobile browsers can block that request as mixed content.
const player = document.getElementById('player');
const statusEl = document.getElementById('status');
const listenersEl = document.getElementById('listeners');
const formatEl = document.getElementById('format');
const serverEl = document.getElementById('server');

function setStatus(text, live) {
  statusEl.textContent = text;
  statusEl.className = `status ${live ? 'live' : 'offline'}`;
}

// Listener totals require Icecast's status API. Since this page deliberately avoids
// the mixed-content API request, don't display a false "0 listeners" value.
listenersEl.textContent = '—';
formatEl.textContent = '64 kbps MP3';
serverEl.textContent = 'Icecast';

// Start neutral while the browser checks the audio endpoint.
setStatus('CHECKING…', false);

let confirmed = false;
function markLive() {
  confirmed = true;
  setStatus('LIVE', true);
}
function markOffline() {
  confirmed = false;
  setStatus('OFFLINE', false);
}

// Icecast streams normally fire one or more of these once the endpoint responds.
player.addEventListener('loadedmetadata', markLive);
player.addEventListener('loadeddata', markLive);
player.addEventListener('canplay', markLive);
player.addEventListener('playing', markLive);
player.addEventListener('error', markOffline);
player.addEventListener('stalled', () => {
  // A brief stall is common on live streams, so only call it offline if we never
  // established a working stream in the first place.
  if (!confirmed) markOffline();
});

// Ask the browser to probe the stream without autoplaying it.
try { player.load(); } catch (_) {}

// Some mobile browsers defer media loading until the user presses Play. In that
// case, don't falsely label the station OFFLINE just because probing was deferred.
setTimeout(() => {
  if (!confirmed && !player.error) setStatus('READY', true);
}, 5000);
