const ICECAST = 'https://wxm49.duckdns.org';
const MOUNT = '/wxm49';
const statusEl = document.getElementById('status');
const listenersEl = document.getElementById('listeners');
const formatEl = document.getElementById('format');
const serverEl = document.getElementById('server');
const player = document.getElementById('player');
const weatherButton = document.getElementById('weatherButton');
const playButton = document.getElementById('playButton');
const radioDisplay = document.getElementById('radioDisplay');
const lcdState = document.getElementById('lcdState');
const volume = document.getElementById('volume');

function status(mode,label){
  statusEl.className='status '+mode;
  statusEl.innerHTML='<i></i>'+label;
}
function setLive(){ status('live','LIVE'); }
function setOffline(){ status('offline','OFFLINE'); listenersEl.textContent='—'; }

function clockText(){
  return new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',hour12:true}).format(new Date()).toUpperCase();
}
function syncRadio(){
  const playing = player && !player.paused && !player.ended;
  radioDisplay.textContent = playing ? 'WEATHER' : clockText();
  lcdState.textContent = playing ? 'ON AIR' : 'STANDBY';
  weatherButton?.setAttribute('aria-label', playing ? 'Pause weather broadcast' : 'Play weather broadcast');
  if(playButton){
    playButton.classList.toggle('playing',playing);
    playButton.querySelector('span').textContent = playing ? 'Ⅱ' : '▶';
    playButton.setAttribute('aria-label',playing?'Pause WXM49':'Play WXM49');
  }
}
async function togglePlayback(){
  if(!player) return;
  if(player.paused){
    try { await player.play(); } catch(e) { console.warn('Playback could not start:',e); }
  } else player.pause();
  syncRadio();
}

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
    if(player && !player.error && !player.paused) setLive();
  }
}
weatherButton?.addEventListener('click',togglePlayback);
playButton?.addEventListener('click',togglePlayback);
volume?.addEventListener('input',()=>{ player.volume=Number(volume.value); });
player?.addEventListener('playing',()=>{setLive();syncRadio();});
player?.addEventListener('pause',syncRadio);
player?.addEventListener('ended',syncRadio);
player?.addEventListener('error',()=>{setOffline();syncRadio();});
setInterval(()=>{ if(player?.paused) syncRadio(); },1000);
syncRadio();
refreshStatus();
setInterval(refreshStatus,15000);
