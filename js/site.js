const ICECAST = 'https://wxm49.duckdns.org';
const MOUNT = '/wxm49';

const statusEl = document.getElementById('status');
const listenersEl = document.getElementById('listeners');
const formatEl = document.getElementById('format');
const serverEl = document.getElementById('server');
const serverDetailEl = document.getElementById('server-detail');
const player = document.getElementById('player');

function setStatus(label, kind) {
  if (!statusEl) return;
  statusEl.className = `status ${kind}`;
  statusEl.innerHTML = `<span class="status-dot"></span><span>${label}</span>`;
}

function normalizeSources(source) {
  if (!source) return [];
  return Array.isArray(source) ? source : [source];
}

async function refreshIcecastStatus() {
  try {
    const response = await fetch(`${ICECAST}/status-json.xsl`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const stats = data.icestats || {};
    const sources = normalizeSources(stats.source);
    const source = sources.find(s => s && (s.listenurl?.endsWith(MOUNT) || s.server_name === 'WXM49')) || sources[0];

    if (!source) {
      setStatus('OFFLINE', 'offline');
      listenersEl.textContent = '0';
      return;
    }

    setStatus('LIVE', 'live');
    listenersEl.textContent = source.listeners ?? 0;

    const bitrate = source.bitrate || source.audio_bitrate;
    const type = (source.server_type || 'audio/mpeg').replace('audio/', '').toUpperCase();
    formatEl.textContent = `${bitrate ? `${bitrate} kbps • ` : ''}${type}${source.channels === 1 ? ' • Mono' : ''}`;
    serverEl.textContent = stats.server_id || 'Icecast';
    if (serverDetailEl) serverDetailEl.textContent = stats.server_id || 'Icecast';
  } catch (error) {
    // If the status API is temporarily unavailable, audio events still provide a useful fallback.
    if (player && !player.paused && !player.error) setStatus('LIVE', 'live');
    else setStatus('READY', 'ready');
    listenersEl.textContent = '—';
  }
}

if (player) {
  player.addEventListener('playing', () => setStatus('LIVE', 'live'));
  player.addEventListener('error', () => setStatus('OFFLINE', 'offline'));
}

setStatus('CHECKING', 'checking');
refreshIcecastStatus();
setInterval(refreshIcecastStatus, 15000);
