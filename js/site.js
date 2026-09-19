const ICECAST='http://192.168.1.155:8000';
const MOUNT='/wxm49';
const statusEl=document.getElementById('status'), listenersEl=document.getElementById('listeners'), formatEl=document.getElementById('format'), serverEl=document.getElementById('server');
function sources(data){const s=data?.icestats?.source;if(!s)return[];return Array.isArray(s)?s:[s]}
async function update(){try{const r=await fetch(`${ICECAST}/status-json.xsl`,{cache:'no-store'});if(!r.ok)throw 0;const data=await r.json();const src=sources(data).find(x=>String(x.listenurl||'').endsWith(MOUNT));serverEl.textContent=data.icestats?.server_id||'Icecast';if(!src)throw 0;statusEl.textContent='LIVE';statusEl.className='status live';listenersEl.textContent=src.listeners??0;const bits=[];if(src.bitrate)bits.push(`${src.bitrate} kbps`);if(src.server_type)bits.push(src.server_type);formatEl.textContent=bits.join(' · ')||'Live stream'}catch(e){statusEl.textContent='OFFLINE';statusEl.className='status offline';listenersEl.textContent='0';formatEl.textContent='Waiting for /wxm49…'}}
update();setInterval(update,10000);
