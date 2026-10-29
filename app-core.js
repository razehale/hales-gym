const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
let state=null, activeProfile='me', runner=null, tick=null;
const EX=window.HALE_EX, CAL=window.HALE_CAL, PROGRAMS=window.HALE_PROGRAMS, STRENGTH_CAL=window.HALE_STRENGTH_CAL;
const STORE='hales_gym_state_v1';
function makeProfile(name='You'){return {name,goal:'Fit, strong, visibly trained',calDone:[],history:[],exercise:{},lastCats:{},program:{next:'A',completed:0},benchmarks:{}}}
function defaultState(){return {version:4,profiles:{me:makeProfile('You')},gym:{clockedIn:false,startedAt:null,profileId:null,sessions:[]},settings:{barWeight:45},updatedAt:null};}
function migrateProfile(p){
 if(!p.exercise)p.exercise={};if(!p.history)p.history=[];if(!p.calDone)p.calDone=[];if(!p.lastCats)p.lastCats={};if(!p.program)p.program={next:'A',completed:0};if(!p.benchmarks)p.benchmarks={};return p;
}
function loadLocal(){
 try{
  const x=JSON.parse(localStorage.getItem(STORE)||'null');state=x&&x.profiles?x:defaultState();
  Object.keys(state.profiles).forEach(id=>migrateProfile(state.profiles[id]));
  if(!state.profiles.me)state.profiles.me=makeProfile('You');
  if(!state.gym)state.gym={clockedIn:false,startedAt:null,profileId:null,sessions:[]};if(!Array.isArray(state.gym.sessions))state.gym.sessions=[];
  if(state.gym.clockedIn){const pid=state.gym.profileId&&state.profiles[state.gym.profileId]?state.gym.profileId:'me';state.gym.profileId=pid;activeProfile=pid}else if(!state.profiles[activeProfile])activeProfile='me';
  state.version=4;
 }catch{state=defaultState();activeProfile='me'}
}
async function save(){state.updatedAt=new Date().toISOString();localStorage.setItem(STORE,JSON.stringify(state));const b=$('#syncBtn');if(b){b.textContent='✓ Saved';setTimeout(()=>b.textContent='Save',900)}}
function profile(){return state.profiles[activeProfile]||state.profiles.me}
function profileOptions(){return Object.entries(state.profiles).map(([id,p])=>({id,name:p.name||'Profile'}))}
function tab(id){if(!state?.gym?.clockedIn&&id!=='today')return;$$('.tab').forEach(x=>x.classList.add('hide'));const t=$('#'+id);if(t)t.classList.remove('hide');$$('#tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===id))}
function nextCal(){return CAL.find(c=>!profile().calDone.includes(c.id))}
function calibrationComplete(){return CAL.every(c=>profile().calDone.includes(c.id))}
function parseLoad(v){const m=String(v||'').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):null}
function round5(n){return Math.max(0,Math.round(n/5)*5)}
function formatLoad(k,n){if(n==null)return '';return k==='lmpress'||k==='lmsquat'||k==='lmrow'?`bar + ${round5(n)} lb`:`${round5(n)} lb`}
function estimateWorkingLoad(load,reps,effort){
 const n=parseLoad(load);if(n==null||!Number.isFinite(reps)||reps<1)return null;
 const oneRM=n*(1+reps/30);let base=oneRM/1.40;const mult={easy:1.02,clean:1,hard:.96,grind:.92}[effort]||1;return round5(base*mult);
}
function currentPrescription(k){
 const es=profile().exercise[k]||{};if(es.nextLoad)return `${es.nextLoad} • ${EX[k].target}`;if(es.workingLoad)return `${es.workingLoad} • ${EX[k].target}`;return EX[k].target;
}
function strengthReady(k){return !!profile().exercise[k]?.workingLoad}
function programReady(){return calibrationComplete()&&STRENGTH_CAL.every(strengthReady)}
function recommendedTemplate(){
 const p=profile();if(!programReady())return null;const id=p.program?.next||'A',base=PROGRAMS[id];return {id,name:base.name,focus:base.focus,items:[...base.items]};
}
function nextLoadAfterSuccess(k,load){const n=parseLoad(load);if(n==null)return load;return formatLoad(k,n+5)}
function reducedLoad(k,load,pct=.075){const n=parseLoad(load);if(n==null)return load;return formatLoad(k,n*(1-pct))}
function updateExerciseFromWorkout(k,entries){
 const p=profile(),es=p.exercise[k]||(p.exercise[k]={});const numeric=entries.map(e=>parseInt(e.reps,10)).filter(Number.isFinite);if(!numeric.length)return;
 const load=entries.find(e=>e.load)?.load||es.workingLoad||'';if(load)es.lastLoad=load;
 const first3=numeric.slice(0,3),complete=first3.length>=3&&first3.every(r=>r>=8),severe=first3.some(r=>r<=5);
 if(complete){
  es.failStreak=0;es.successStreak=(es.successStreak||0)+1;es.workingLoad=load||es.workingLoad;
  if(es.successStreak>=2&&load){es.nextLoad=nextLoadAfterSuccess(k,load);es.successStreak=0;es.progressNote='Two clean 3×8 sessions complete — increase next time.'}
  else{es.nextLoad=null;es.progressNote='3×8 completed — repeat this load once more before increasing.'}
 }else{
  es.successStreak=0;es.failStreak=(es.failStreak||0)+1;
  if((es.failStreak>=2||severe)&&load){es.workingLoad=reducedLoad(k,load);es.nextLoad=null;es.failStreak=0;es.progressNote='Load reduced after repeated/severe miss.'}
  else{es.nextLoad=null;es.progressNote='Hold this load and retry next exposure.'}
 }
 es.lastSetReps=first3;es.lastPerformedAt=new Date().toISOString();
}
function advanceProgramIfNeeded(type){if(type!=='Recommended')return;const p=profile();p.program=p.program||{next:'A',completed:0};p.program.completed=(p.program.completed||0)+1;p.program.next=p.program.next==='A'?'B':'A'}
async function clockIn(){if(state.gym.clockedIn)return;const sel=$('#profileSel');const pid=sel?.value||activeProfile;if(!state.profiles[pid]){alert('Choose a profile first.');return}activeProfile=pid;state.gym.clockedIn=true;state.gym.startedAt=new Date().toISOString();state.gym.profileId=pid;await save();renderAll();tab('today')}
async function clockOut(){if(!state.gym.clockedIn)return;if(runner){alert('Finish or exit the current workout before clocking out.');return}const end=new Date().toISOString();state.gym.sessions.unshift({profileId:activeProfile,startedAt:state.gym.startedAt,endedAt:end});state.gym.clockedIn=false;state.gym.startedAt=null;state.gym.profileId=null;await save();renderAll();tab('today')}
function ensureClockedIn(){if(!state.gym.clockedIn){alert('Choose your profile and clock in first.');tab('today');return false}return true}
function randomWorkout(){const pool=['squat','bench','rdl','pulldown','lowrow','lmpress','lmsquat','lmrow','pullup','pushup','lunge','anti','crunch','platecarry','bandpull','rope','hexlateral','hexforward','hexshuffle'];return [...pool].sort(()=>Math.random()-.5).slice(0,5)}
function defaultHiitInterval(){const b=profile().benchmarks||{},rope=b.rope?.seconds||0,hex=b.hexlateral?.seconds||0;const best=Math.max(rope,hex);return best>=35?'40,20':'30,30'}