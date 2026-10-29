const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
let state=null, activeProfile='me', runner=null, tick=null;
const EX=window.HALE_EX, CAL=window.HALE_CAL;
const STORE='hales_gym_state_v1';
function makeProfile(name='You'){return {name,goal:'Fit, strong, visibly trained',calDone:[],history:[],exercise:{},lastCats:{}}}
function defaultState(){return {version:3,profiles:{me:makeProfile('You')},gym:{clockedIn:false,startedAt:null,profileId:null,sessions:[]},settings:{barWeight:45},updatedAt:null};}
function loadLocal(){
 try{
  const x=JSON.parse(localStorage.getItem(STORE)||'null');
  state=x&&x.profiles?x:defaultState();
  if(!state.profiles.me)state.profiles.me=makeProfile('You');
  if(!state.gym)state.gym={clockedIn:false,startedAt:null,profileId:null,sessions:[]};
  if(!Array.isArray(state.gym.sessions))state.gym.sessions=[];
  if(state.gym.clockedIn){
   const pid=state.gym.profileId&&state.profiles[state.gym.profileId]?state.gym.profileId:'me';
   state.gym.profileId=pid;activeProfile=pid;
  }else if(!state.profiles[activeProfile]) activeProfile='me';
 }catch{state=defaultState();activeProfile='me'}
}
async function save(){state.updatedAt=new Date().toISOString();localStorage.setItem(STORE,JSON.stringify(state));const b=$('#syncBtn');if(b){b.textContent='✓ Saved';setTimeout(()=>b.textContent='Save',900)}}
function profile(){return state.profiles[activeProfile]||state.profiles.me}
function profileOptions(){return Object.entries(state.profiles).map(([id,p])=>({id,name:p.name||'Profile'}))}
function tab(id){
 if(!state?.gym?.clockedIn&&id!=='today')return;
 $$('.tab').forEach(x=>x.classList.add('hide'));const t=$('#'+id);if(t)t.classList.remove('hide');
 $$('#tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));
}
function nextCal(){return CAL.find(c=>!profile().calDone.includes(c.id))}
function recommendedTemplate(){const p=profile(),last=p.lastCats||{};const score=c=>last[c]?Date.now()-new Date(last[c]).getTime():1e15;const cats=['legs','push','pull','core'].sort((a,b)=>score(b)-score(a));const map={legs:['squat','rdl','lunge'],push:['bench','lmpress','skull'],pull:['pulldown','lowrow','pullup'],core:['anti','crunch','platecarry']};let items=[];cats.slice(0,3).forEach((c,i)=>items.push(map[c][i%map[c].length]));items=[...new Set(items)];if(!items.includes('bandpull'))items.push('bandpull');return {name:'Recommended Shift',focus:'Advance the least-recently trained patterns first.',items};}
function currentPrescription(k){const es=profile().exercise[k]||{};return es.workingLoad?`${es.workingLoad} • ${EX[k].target}`:EX[k].target;}
async function clockIn(){
 if(state.gym.clockedIn)return;
 const sel=$('#profileSel');const pid=sel?.value||activeProfile;
 if(!state.profiles[pid]){alert('Choose a profile first.');return}
 activeProfile=pid;state.gym.clockedIn=true;state.gym.startedAt=new Date().toISOString();state.gym.profileId=pid;
 await save();renderAll();tab('today');
}
async function clockOut(){
 if(!state.gym.clockedIn)return;
 if(runner){alert('Finish or exit the current workout before clocking out.');return}
 const end=new Date().toISOString();state.gym.sessions.unshift({profileId:activeProfile,startedAt:state.gym.startedAt,endedAt:end});
 state.gym.clockedIn=false;state.gym.startedAt=null;state.gym.profileId=null;await save();renderAll();tab('today');
}
function ensureClockedIn(){if(!state.gym.clockedIn){alert('Choose your profile and clock in first.');tab('today');return false}return true}
function randomWorkout(){const pool=['squat','bench','rdl','pulldown','lowrow','lmpress','lmsquat','lmrow','pullup','pushup','lunge','anti','crunch','platecarry','bandpull','rope','hexlateral','hexforward','hexshuffle'];const copy=[...pool].sort(()=>Math.random()-.5);return copy.slice(0,5)}
