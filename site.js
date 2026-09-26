const ICECAST='https://wxm49.duckdns.org', MOUNT='/wxm49';
const $=id=>document.getElementById(id);
const statusEl=$('status'),listenersEl=$('listeners'),formatEl=$('format'),serverEl=$('server');
const player=$('player'),weatherButton=$('weatherButton'),playButton=$('playButton'),radioDisplay=$('radioDisplay'),lcdState=$('lcdState'),volume=$('volume'),buttonPressSound=$('buttonPressSound');
const buttons={menu:$('menuButton'),select:$('selectButton'),up:$('arrowUpButton'),down:$('arrowDownButton'),left:$('arrowLeftButton'),right:$('arrowRightButton'),volUp:$('volumeUpButton'),volDown:$('volumeDownButton')};

const wr120Template=$('wr120Template');
let backlightTimer=null;
function wakeBacklight(){
  if(!wr120Template)return;
  wr120Template.src='assets/wr120-backlight.png';
  wr120Template.classList.add('backlight-on');
  clearTimeout(backlightTimer);
  backlightTimer=setTimeout(()=>{
    wr120Template.src='assets/wr120-blank.png';
    wr120Template.classList.remove('backlight-on');
  },5000);
}
function bindBacklight(el){
  if(!el)return;
  el.addEventListener('pointerdown',wakeBacklight);
  el.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===' '){wakeBacklight();}
  });
}
[weatherButton,...Object.values(buttons)].forEach(bindBacklight);

const CHANNELS=['162.400','162.425','162.450','162.475','162.500','162.525','162.550'];
const MENU=['SET TIME','SET ALARM','SET LOCATION','SET CHANNEL','ALERT TYPE','ALERT TEST','BUTTON BEEPS','SET EVENTS'];
const defaults={channel:1,alertType:'VOICE',buttonBeeps:true,eventMode:'ALL DEFAULT',locationMode:'ANY',same:'000000',alarmOn:false,alarmHour:7,alarmMinute:0,clockOffset:0,volume:1};
let cfg={...defaults}; try{cfg={...cfg,...JSON.parse(localStorage.getItem('wr120-settings')||'{}')}}catch(e){}
let ui={mode:'clock',menuIndex:0,optionIndex:0,editField:0,lastInput:Date.now(),temp:null,weatherAudible:false,volumeUntil:0};
function save(){localStorage.setItem('wr120-settings',JSON.stringify(cfg))}
player.volume=Math.max(0,Math.min(1,Number(cfg.volume)||0)); volume.value=player.volume;
function status(mode,label){statusEl.className='status '+mode;statusEl.innerHTML='<i></i>'+label} function setLive(){status('live','LIVE')} function setOffline(){status('offline','OFFLINE');listenersEl.textContent='—'}
function radioNow(){return new Date(Date.now()+Number(cfg.clockOffset||0))}
function clockText(){return new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',hour12:true}).format(radioNow()).toUpperCase()}
function beep(){if(!cfg.buttonBeeps||!buttonPressSound)return;try{buttonPressSound.currentTime=0;buttonPressSound.play().catch(()=>{})}catch(e){}}
function touch(){ui.lastInput=Date.now();beep()}
function setDisplay(main,mini='MENU'){radioDisplay.textContent=main;lcdState.textContent=mini}
function render(){
  if(Date.now()<ui.volumeUntil){setDisplay('VOLUME '+Math.round(player.volume*10),'LEVEL');return}
  if(ui.mode==='clock'){
    const playing=!player.paused&&!player.ended, audible=playing&&!player.muted&&cfg.channel===1;
    setDisplay(audible?'WEATHER':clockText(),audible?'ON AIR':(playing?'MUTED':'STANDBY'));return;
  }
  if(ui.mode==='menu'){setDisplay(MENU[ui.menuIndex],'MENU');return}
  if(ui.mode==='time'){
    let d=ui.temp, h=d.getHours(), ap=h>=12?'PM':'AM', hh=h%12||12, mm=String(d.getMinutes()).padStart(2,'0');
    setDisplay(`${hh}:${mm} ${ap}`,['HOUR','MINUTE','AM/PM'][ui.editField]);return;
  }
  if(ui.mode==='alarmMenu'){setDisplay(ui.temp.on?'ON':'OFF','SET ALARM');return}
  if(ui.mode==='alarmTime'){let h=ui.temp.hour,ap=h>=12?'PM':'AM',hh=h%12||12;setDisplay(`${hh}:${String(ui.temp.minute).padStart(2,'0')} ${ap}`,ui.editField?'MINUTE':'HOUR');return}
  if(ui.mode==='location'){setDisplay(['SINGLE','MULTIPLE','ANY'][ui.optionIndex],'LOCATION');return}
  if(ui.mode==='same'){setDisplay(ui.temp,'SAME 01');return}
  if(ui.mode==='channel'){setDisplay('CH '+(ui.optionIndex+1),CHANNELS[ui.optionIndex]+' MHz');return}
  if(ui.mode==='alertType'){setDisplay(['VOICE','TONE','DISPLAY'][ui.optionIndex],'ALERT TYPE');return}
  if(ui.mode==='beeps'){setDisplay(ui.optionIndex?'OFF':'ON','BUTTON BEEPS');return}
  if(ui.mode==='events'){setDisplay(['ALL DEFAULT','ALL ON','ALL OFF','EDIT EVENTS'][ui.optionIndex],'SET EVENTS');return}
  if(ui.mode==='eventEdit'){setDisplay('SIMULATION','EDIT EVENTS');return}
  if(ui.mode==='alertTest'){setDisplay('ALERT TEST','PRESS MENU');return}
}
function enterMenu(){touch();ui.mode='menu';ui.menuIndex=0;render()}
function exitToClock(){ui.mode='clock';ui.temp=null;render()}
function menuPress(){touch(); if(ui.mode==='clock'){ui.mode='menu';ui.menuIndex=0}else if(ui.mode==='menu'){exitToClock()}else{ui.mode='menu'} render()}
function cycle(n,delta,len){return (n+delta+len)%len}
function arrow(delta,axis){touch();
 if(ui.mode==='menu'){ui.menuIndex=cycle(ui.menuIndex,delta,MENU.length)}
 else if(ui.mode==='time'){
   if(axis==='h')ui.editField=cycle(ui.editField,delta,3); else {let d=ui.temp;if(ui.editField===0)d.setHours(d.getHours()+delta);else if(ui.editField===1)d.setMinutes(d.getMinutes()+delta);else d.setHours(d.getHours()+12*delta)}
 } else if(ui.mode==='alarmMenu')ui.temp.on=!ui.temp.on;
 else if(ui.mode==='alarmTime'){if(axis==='h')ui.editField=cycle(ui.editField,delta,2);else if(ui.editField===0)ui.temp.hour=cycle(ui.temp.hour,delta,24);else ui.temp.minute=cycle(ui.temp.minute,delta,60)}
 else if(['location','channel','alertType','beeps','events'].includes(ui.mode)){
   const lens={location:3,channel:7,alertType:3,beeps:2,events:4};ui.optionIndex=cycle(ui.optionIndex,delta,lens[ui.mode]);
 } else if(ui.mode==='same'){
   let a=ui.temp.split(''),i=ui.editField;if(axis==='h')ui.editField=cycle(i,delta,6);else a[i]=String(cycle(Number(a[i]),delta,10)),ui.temp=a.join('');
 }
 render();
}
function select(){touch();
 if(ui.mode==='menu'){
   const m=MENU[ui.menuIndex];
   if(m==='SET TIME'){ui.mode='time';ui.temp=new Date(radioNow());ui.editField=0}
   else if(m==='SET ALARM'){ui.mode='alarmMenu';ui.temp={on:cfg.alarmOn,hour:cfg.alarmHour,minute:cfg.alarmMinute}}
   else if(m==='SET LOCATION'){ui.mode='location';ui.optionIndex=['SINGLE','MULTIPLE','ANY'].indexOf(cfg.locationMode);if(ui.optionIndex<0)ui.optionIndex=2}
   else if(m==='SET CHANNEL'){ui.mode='channel';ui.optionIndex=cfg.channel}
   else if(m==='ALERT TYPE'){ui.mode='alertType';ui.optionIndex=['VOICE','TONE','DISPLAY'].indexOf(cfg.alertType)}
   else if(m==='ALERT TEST'){ui.mode='alertTest';startAlertTest()}
   else if(m==='BUTTON BEEPS'){ui.mode='beeps';ui.optionIndex=cfg.buttonBeeps?0:1}
   else if(m==='SET EVENTS'){ui.mode='events';ui.optionIndex=['ALL DEFAULT','ALL ON','ALL OFF','EDIT EVENTS'].indexOf(cfg.eventMode);if(ui.optionIndex<0)ui.optionIndex=0}
 } else if(ui.mode==='time'){cfg.clockOffset=ui.temp.getTime()-Date.now();save();ui.mode='menu'}
 else if(ui.mode==='alarmMenu'){if(!ui.temp.on){cfg.alarmOn=false;save();ui.mode='menu'}else{ui.mode='alarmTime';ui.editField=0}}
 else if(ui.mode==='alarmTime'){cfg.alarmOn=true;cfg.alarmHour=ui.temp.hour;cfg.alarmMinute=ui.temp.minute;save();ui.mode='menu'}
 else if(ui.mode==='location'){let v=['SINGLE','MULTIPLE','ANY'][ui.optionIndex];cfg.locationMode=v;if(v==='ANY'){save();ui.mode='menu'}else{ui.mode='same';ui.temp=cfg.same||'000000';ui.editField=0}}
 else if(ui.mode==='same'){cfg.same=ui.temp;save();ui.mode='menu'}
 else if(ui.mode==='channel'){cfg.channel=ui.optionIndex;save(); if(cfg.channel!==1)player.muted=true; ui.mode='menu'}
 else if(ui.mode==='alertType'){cfg.alertType=['VOICE','TONE','DISPLAY'][ui.optionIndex];save();ui.mode='menu'}
 else if(ui.mode==='beeps'){cfg.buttonBeeps=ui.optionIndex===0;save();ui.mode='menu'}
 else if(ui.mode==='events'){let v=['ALL DEFAULT','ALL ON','ALL OFF','EDIT EVENTS'][ui.optionIndex];if(v==='EDIT EVENTS')ui.mode='eventEdit';else{cfg.eventMode=v;save();ui.mode='menu'}}
 render();
}
let alertOsc=null; function startAlertTest(){try{const C=window.AudioContext||window.webkitAudioContext,ctx=new C(),o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=1050;g.gain.value=.08;o.connect(g).connect(ctx.destination);o.start();alertOsc={ctx,o};setTimeout(stopAlertTest,2500)}catch(e){}}
function stopAlertTest(){if(alertOsc){try{alertOsc.o.stop();alertOsc.ctx.close()}catch(e){}alertOsc=null}}
async function weather(){touch(); if(ui.mode!=='clock'){exitToClock();return} if(cfg.channel!==1){setDisplay('NO FEED','CH '+(cfg.channel+1));setTimeout(render,1200);return} if(player.paused){player.muted=false;try{await player.play()}catch(e){}}else player.muted=!player.muted;render()}
function changeVolume(delta){touch();const next=Math.max(0,Math.min(1,Math.round((player.volume+delta)*10)/10));player.volume=next;volume.value=next;cfg.volume=next;save();ui.volumeUntil=Date.now()+1200;render()}
async function togglePlayback(){if(player.paused){if(cfg.channel!==1)cfg.channel=1;player.muted=false;try{await player.play()}catch(e){}}else player.pause();render()}
async function refreshStatus(){try{const r=await fetch(`${ICECAST}/status-json.xsl`,{cache:'no-store'});if(!r.ok)throw 0;const data=await r.json();let source=data?.icestats?.source;if(!source){setOffline();return}if(!Array.isArray(source))source=[source];const feed=source.find(s=>s.listenurl?.endsWith(MOUNT)||s.mount===MOUNT)||source[0];setLive();listenersEl.textContent=feed.listeners??0;formatEl.textContent=`${feed.bitrate||feed.audio_bitrate||64} kbps · MP3 · Mono`;serverEl.textContent=data.icestats.server_id||'Icecast'}catch(e){if(!player.paused&&!player.error)setLive()}}
buttons.menu?.addEventListener('click',menuPress);buttons.select?.addEventListener('click',select);buttons.up?.addEventListener('click',()=>arrow(1,'v'));buttons.down?.addEventListener('click',()=>arrow(-1,'v'));buttons.left?.addEventListener('click',()=>arrow(-1,'h'));buttons.right?.addEventListener('click',()=>arrow(1,'h'));buttons.volUp?.addEventListener('click',()=>changeVolume(.1));buttons.volDown?.addEventListener('click',()=>changeVolume(-.1));weatherButton?.addEventListener('click',weather);playButton?.addEventListener('click',togglePlayback);
volume?.addEventListener('input',()=>{player.volume=Number(volume.value);cfg.volume=player.volume;save();if(player.volume>0&&player.muted&&cfg.channel===1)player.muted=false;render()});
player?.addEventListener('playing',()=>{setLive();render()});player?.addEventListener('pause',render);player?.addEventListener('volumechange',render);player?.addEventListener('error',()=>{setOffline();render()});
setInterval(()=>{if(ui.mode!=='clock'&&Date.now()-ui.lastInput>60000){stopAlertTest();exitToClock()}else render()},1000);
render();refreshStatus();setInterval(refreshStatus,15000);


// WR-120 fullscreen mode (v11)
const radioCard=document.querySelector('.radio-card');
const radioFullscreenButton=$('radioFullscreenButton');

function radioIsFullscreen(){
  return document.fullscreenElement===radioCard ||
         document.webkitFullscreenElement===radioCard;
}
function syncFullscreenButton(){
  if(!radioFullscreenButton)return;
  const on=radioIsFullscreen();
  radioFullscreenButton.innerHTML=on?'✕ <span>Exit Fullscreen</span>':'⛶ <span>Fullscreen Radio</span>';
  radioFullscreenButton.setAttribute('aria-label',on?'Exit radio fullscreen':'View radio fullscreen');
  radioCard?.classList.toggle('is-fullscreen',on);
}
async function toggleRadioFullscreen(){
  if(!radioCard)return;
  try{
    if(radioIsFullscreen()){
      if(document.exitFullscreen) await document.exitFullscreen();
      else if(document.webkitExitFullscreen) document.webkitExitFullscreen();
    }else{
      if(radioCard.requestFullscreen) await radioCard.requestFullscreen();
      else if(radioCard.webkitRequestFullscreen) radioCard.webkitRequestFullscreen();
    }
  }catch(e){console.warn('Fullscreen unavailable:',e)}
}
radioFullscreenButton?.addEventListener('click',toggleRadioFullscreen);
document.addEventListener('fullscreenchange',syncFullscreenButton);
document.addEventListener('webkitfullscreenchange',syncFullscreenButton);
syncFullscreenButton();
