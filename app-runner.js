function bindInfo(){$$('[data-info]').forEach(b=>b.onclick=()=>showInfo(b.dataset.info))}
function showInfo(k){const e=EX[k];$('#infoBody').innerHTML=`<h2>${e.n}</h2><p><span class="badge">${e.gear}</span></p><h3>What it works</h3><p>${e.works}</p><h3>How</h3><p>${e.how}</p><a class="btn primary yt" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(e.yt)}">Search YouTube demo ↗</a>`;$('#infoModal').classList.remove('hide')}
$('#closeInfo').onclick=()=>$('#infoModal').classList.add('hide');

function startCalibration(id){const c=CAL.find(x=>x.id===id);startWorkout(c.items,'Calibration',null,id)}
function buildSteps(items,opts){
 const steps=[];items.forEach(k=>{
  const timed=(k==='rope'||k==='hang'||k==='platecarry');
  let sets=k==='bandpull'||k==='bandext'||k==='anti'?2:3;
  if(k==='hang')sets=1;
  for(let s=1;s<=sets;s++){
   steps.push({kind:'work',k,set:s,seconds:timed?(opts?.work||40):0});
   if(s<sets||k!==items[items.length-1])steps.push({kind:'rest',k,seconds:opts?.rest||(timed?20:75)});
  }
 });return steps;
}
function startWorkout(items,type,opts,calId){
 runner={items,type,opts:opts||{},calId,steps:buildSteps(items,opts),i:0,entries:[],remaining:0,orig:0,running:false};
 $('#runnerModal').classList.remove('hide');showStep();
}
function showStep(){
 clearInterval(tick);tick=null;runner.running=false;
 if(runner.i>=runner.steps.length){finishWorkout();return}
 const st=runner.steps[runner.i];
 $('#runnerMeta').textContent=`${runner.type} • ${runner.i+1}/${runner.steps.length}`;
 if(st.kind==='rest'){
  $('#runnerStep').textContent='REST / TRANSITION';$('#runnerCue').textContent='Next: '+(EX[runner.steps.slice(runner.i+1).find(x=>x.kind==='work')?.k]?.n||'finish');
  $('#logFields').classList.add('hide');$('#runnerDone').textContent='Skip Rest';startCountdown(st.seconds,true);
 }else{
  const e=EX[st.k];$('#runnerStep').textContent=e.n+' • Set '+st.set;$('#runnerCue').textContent=currentPrescription(st.k)+' • '+e.gear;
  $('#logFields').classList.remove('hide');$('#runLoad').value=profile().exercise[st.k]?.workingLoad||'';$('#runReps').value='';
  $('#runnerDone').textContent='Set Done';
  if(st.seconds) startCountdown(st.seconds,false); else {$('#runnerTimer').textContent='REP SET';$('#runnerBar').style.width='0%'}
 }
}
function startCountdown(sec,autoNext){
 runner.remaining=runner.orig=sec;runner.running=true;drawTime();
 tick=setInterval(()=>{runner.remaining--;drawTime();if(runner.remaining<=0){clearInterval(tick);tick=null;runner.running=false;if(autoNext){runner.i++;showStep()}}},1000)
}
function drawTime(){let m=Math.floor(runner.remaining/60),s=runner.remaining%60;$('#runnerTimer').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');$('#runnerBar').style.width=(100*(1-runner.remaining/runner.orig))+'%'}
$('#runnerDone').onclick=()=>{
 const st=runner.steps[runner.i];
 if(st.kind==='work'){runner.entries.push({k:st.k,set:st.set,load:$('#runLoad').value.trim(),reps:$('#runReps').value.trim()});}
 runner.i++;showStep();
};
$('#runnerSkip').onclick=()=>{runner.i++;showStep()};
$('#runnerBack').onclick=()=>{runner.i=Math.max(0,runner.i-1);showStep()};
$('#runnerExit').onclick=()=>{if(confirm('Exit this workout? Unsaved sets will be lost.')){$('#runnerModal').classList.add('hide');clearInterval(tick)}};

async function finishWorkout(){
 clearInterval(tick);$('#runnerModal').classList.add('hide');
 const p=profile(), now=new Date().toISOString();
 const hist={date:now,type:runner.type,entries:runner.entries,calId:runner.calId||null};
 p.history.unshift(hist);
 const cats=new Set();
 runner.entries.forEach(e=>{
  const x=EX[e.k];if(x&&['legs','push','pull','core'].includes(x.cat)){p.lastCats[x.cat]=now;cats.add(x.cat)}
  if(!p.exercise[e.k])p.exercise[e.k]={successes:0};
  const es=p.exercise[e.k];
  if(e.load)es.lastLoad=e.load;
 });
 if(runner.calId&&!p.calDone.includes(runner.calId))p.calDone.push(runner.calId);
 const by={};runner.entries.forEach(e=>(by[e.k]||(by[e.k]=[])).push(e));
 Object.keys(by).forEach(k=>{
  const arr=by[k], nums=arr.map(x=>parseInt(x.reps,10)).filter(Number.isFinite), load=arr.find(x=>x.load)?.load;
  if(load&&nums.length>=2&&nums.every(n=>n>=8)){
    const es=p.exercise[k]||(p.exercise[k]={successes:0}); es.workingLoad=es.workingLoad||load; es.successes=(es.lastSuccessLoad===load?(es.successes||0)+1:1); es.lastSuccessLoad=load;
  }
 });
 await save();renderAll();tab('today');
 alert('Workout saved.');
}

function initApp(){
  loadLocal();
  renderAll();
  const syncBtn=$('#syncBtn');
  if(syncBtn){syncBtn.textContent='Save';syncBtn.onclick=save;}
  $$('#tabs button').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
  if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('/sw.js').catch(()=>{});
}
initApp();
