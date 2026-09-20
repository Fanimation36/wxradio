const ICECAST = 'https://wxm49.duckdns.org';
const MOUNT = '/wxm49';
const statusEl = document.getElementById('status');
const listenersEl = document.getElementById('listeners');
const formatEl = document.getElementById('format');
const serverEl = document.getElementById('server');
const player = document.getElementById('player');

function status(mode,label){
  statusEl.className='status '+mode;
  statusEl.innerHTML='<span></span>'+label;
}
function setLive(){status('live','LIVE')}
function setOffline(){status('offline','OFFLINE');listenersEl.textContent='—'}

async function refreshStatus(){
  try{
    const r=await fetch(`${ICECAST}/status-json.xsl`,{cache:'no-store'});
    if(!r.ok) throw new Error('status');
    const data=await r.json();
    let source=data?.icestats?.source;
    if(!source){setOffline();return}
    if(!Array.isArray(source)) source=[source];
    const feed=source.find(s=>s.listenurl?.endsWith(MOUNT)||s.mount===MOUNT)||source[0];
    setLive();
    listenersEl.textContent=feed.listeners ?? 0;
    const kbps=feed.bitrate || feed.audio_bitrate || 64;
    formatEl.textContent=`${kbps} kbps · MP3 · Mono`;
    serverEl.textContent=data.icestats.server_id || 'Icecast';
  }catch(e){
    // Cross-origin/status failures should not falsely mark a playable stream offline.
    if(player && !player.error && !player.paused) setLive();
  }
}
player?.addEventListener('playing',setLive);
player?.addEventListener('canplay',()=>{ if(statusEl.textContent.includes('CHECKING')) setLive(); });
player?.addEventListener('error',setOffline);
refreshStatus();
setInterval(refreshStatus,15000);
