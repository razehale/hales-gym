const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
let state=null, activeProfile='me', runner=null, tick=null;
const EX=window.HALE_EX, CAL=window.HALE_CAL;
const STORE='hales_gym_state_v1';
function defaultState(){return {version:1,profiles:{me:{name:'You',goal:'Fit, strong, visibly trained',calDone:[],history:[],exercise:{},lastCats:{}},gf:{name:'Girlfriend',goal:'Strength-led fat-loss support',calDone:[],history:[],exercise:{},lastCats:{}}},settings:{barWeight:45},updatedAt:null};}
function loadLocal(){try{const x=JSON.parse(localStorage.getItem(STORE)||'null');state=x&&x.profiles?x:defaultState()}catch{state=defaultState()}}
async function save(){state.updatedAt=new Date().toISOString();localStorage.setItem(STORE,JSON.stringify(state));const b=$('#syncBtn');if(b){b.textContent='✓ Saved';setTimeout(()=>b.textContent='Save',900)}}
async function sync(){loadLocal();renderAll();const b=$('#syncBtn');if(b){b.textContent='✓ Loaded';setTimeout(()=>b.textContent='Save',900)}}
function profile(){return state.profiles[activeProfile]}
function tab(id){$$('.tab').forEach(x=>x.classList.add('hide'));$('#'+id).classList.remove('hide');$$('#tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===id))}
function nextCal(){return CAL.find(c=>!profile().calDone.includes(c.id))}
function lastHistory(){return profile().history[0]||null}
function recommendedTemplate(){const p=profile(),last=p.lastCats||{};const score=c=>last[c]?Date.now()-new Date(last[c]).getTime():1e15;const cats=['legs','push','pull','core'].sort((a,b)=>score(b)-score(a));let primary=cats.slice(0,3);const map={legs:['squat','rdl','lunge'],push:['bench','lmpress','skull'],pull:['pulldown','lowrow','pullup'],core:['anti','crunch','platecarry']};let items=[];primary.forEach((c,i)=>items.push(map[c][i%map[c].length]));items=[...new Set(items)];if(!items.includes('bandpull'))items.push('bandpull');return {name:'Adaptive Strength',focus:'Advance the least-recently trained patterns first.',items};}
function currentPrescription(k){const es=profile().exercise[k]||{};return es.workingLoad?`${es.workingLoad} • ${EX[k].target}`:EX[k].target;}
