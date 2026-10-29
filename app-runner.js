function bindInfo(){$$('[data-info]').forEach(b=>b.onclick=()=>showInfo(b.dataset.info))}
function showInfo(k){const e=EX[k];if(!e)return;$('#infoBody').innerHTML=`<h2>${e.n}</h2><p><span class="badge">${e.gear}</span></p><h3>What it works</h3><p>${e.works}</p><h3>How</h3><p>${e.how}</p><a class="btn primary yt" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(e.yt)}">Search YouTube demo ↗</a>`;$('#infoModal').classList.remove('hide')}
const closeInfo=$('#closeInfo');if(closeInfo)closeInfo.onclick=()=>$('#infoModal').classList.add('hide');
const timedKeys=['rope','hang','platecarry','hexlateral','hexforward','hexshuffle'];
function isTimedKey(k){return timedKeys.includes(k)}
function startCalibration(id){const c=CAL.find(x=>x.id===id);if(c)startWorkout(c.items,'Calibration',{calibration:true},id)}
function buildSteps(items,opts){
 const steps=[];
 if(opts?.calibration){items.forEach(k=>steps.push({kind:'work',k,attempt:1,calibration:true,seconds:isTimedKey(k)?40:0}));return steps}
 if(opts?.hiit){const rounds=opts.rounds||1;for(let r=1;r<=rounds;r++)items.forEach((k,idx)=>{steps.push({kind:'work',k,set:r,round:r,seconds:opts.work||40,hiit:true});if(!(r===rounds&&idx===items.length-1))steps.push({kind:'rest',k,round:r,seconds:opts.rest||20,hiit:true})});return steps}
 items.forEach(k=>{const timed=isTimedKey(k);let sets=k==='bandpull'||k==='bandext'||k==='anti'?2:3;if(k==='hang')sets=1;for(let s=1;s<=sets;s++){steps.push({kind:'work',k,set:s,seconds:timed?(opts?.work||40):0});if(s<sets||k!==items[items.length-1])steps.push({kind:'rest',k,seconds:opts?.rest||(timed?20:75)})}});return steps
}
function startWorkout(items,type,opts,calId){if(!ensureClockedIn())return;clearInterval(tick);tick=null;runner={items,type,opts:opts||{},calId,steps:buildSteps(items,opts||{}),i:0,entries:[],remaining:0,orig:0,running:false,startedAt:new Date().toISOString(),calAttempts:{}};$('#runnerModal').classList.remove('hide');showStep()}
function calibrationCue(st){
 if(isTimedKey(st.k))return `Benchmark • ${EX[st.k].gear} • stop early if form breaks`;
 if(st.attempt===1)return 'Attempt 1 of 2 • choose a reasonable load • aim for up to 12 clean reps';
 const prev=runner.calAttempts[st.k]?.[0];
 if(prev?.direction==='up')return 'Attempt 2 of 2 • heavier load • target about 10 clean reps';
 if(prev?.direction==='down')return 'Attempt 2 of 2 • reduce the load • target about 10 clean reps';
 return 'Attempt 2 of 2 • target about 10 clean reps';
}
function showStep(){
 if(!runner)return;clearInterval(tick);tick=null;runner.running=false;if(runner.i>=runner.steps.length){finishWorkout();return}
 const st=runner.steps[runner.i],e=EX[st.k];if(!e){runner.i++;showStep();return}
 $('#runnerMeta').textContent=`${runner.type}${st.round?' • Round '+st.round:''}${st.calibration?' • '+(st.attempt===2?'Attempt 2':'Attempt 1'):''} • ${runner.i+1}/${runner.steps.length}`;
 if(st.kind==='rest'){$('#runnerStep').textContent='REST / TRANSITION';$('#runnerCue').textContent=st.cue||('Next: '+(EX[runner.steps.slice(runner.i+1).find(x=>x.kind==='work')?.k]?.n||'finish'));$('#logFields').classList.add('hide');$('#runnerDone').textContent='Skip Rest';startCountdown(st.seconds,true);return}
 $('#runnerStep').textContent=e.n+(st.hiit?'':st.calibration?'':' • Set '+st.set);
 if(st.calibration){
  $('#runnerCue').textContent=calibrationCue(st);$('#logFields').classList.remove('hide');
  $('#runLoad').value=st.attempt===2?(runner.calAttempts[st.k]?.[0]?.suggestedLoad||runner.calAttempts[st.k]?.[0]?.load||''):(profile().exercise[st.k]?.workingLoad||'');$('#runReps').value='';
  const ew=$('#effortWrap');if(ew)ew.classList.toggle('hide',isTimedKey(st.k));$('#runEffort').value='clean';$('#runnerDone').textContent=isTimedKey(st.k)?'Stop / Save':'Save Attempt';
  if(st.seconds)startCountdown(st.seconds,false);else{$('#runnerTimer').textContent=st.attempt===1?'TARGET 12':'TARGET 10';$('#runnerBar').style.width='0%'}
 }else if(st.hiit){$('#runnerCue').textContent=`${st.seconds}s work • ${e.gear}`;$('#logFields').classList.add('hide');$('#runnerDone').textContent='Done Early';startCountdown(st.seconds,true)}
 else{$('#runnerCue').textContent=`${currentPrescription(st.k)} • ${e.gear}`;$('#logFields').classList.remove('hide');const ew=$('#effortWrap');if(ew)ew.classList.add('hide');$('#runLoad').value=profile().exercise[st.k]?.workingLoad||'';$('#runReps').value='';$('#runnerDone').textContent='Set Done';if(st.seconds)startCountdown(st.seconds,false);else{$('#runnerTimer').textContent='REP SET';$('#runnerBar').style.width='0%'}}
}
function startCountdown(sec,autoNext){if(!runner)return;runner.remaining=runner.orig=sec;runner.running=true;drawTime();tick=setInterval(()=>{if(!runner){clearInterval(tick);tick=null;return}runner.remaining--;drawTime();if(runner.remaining<=0){clearInterval(tick);tick=null;runner.running=false;if(autoNext){const st=runner.steps[runner.i];if(st?.kind==='work'&&st.hiit)runner.entries.push({k:st.k,set:st.set,load:'',reps:`${st.seconds}s`});runner.i++;showStep()}}},1000)}
function drawTime(){if(!runner)return;let m=Math.floor(runner.remaining/60),s=runner.remaining%60;$('#runnerTimer').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');$('#runnerBar').style.width=runner.orig?((100*(1-runner.remaining/runner.orig))+'%'):'0%'}
function saveCalibrationAttempt(st){
 const load=$('#runLoad').value.trim(),reps=parseInt($('#runReps').value,10),effort=$('#runEffort').value;
 if(isTimedKey(st.k)){
  const elapsed=st.seconds?Math.max(0,st.seconds-runner.remaining):0;runner.entries.push({k:st.k,attempt:st.attempt,load:load||'',reps:`${elapsed||st.seconds}s`,effort:'benchmark'});return {retry:false};
 }
 if(!load){alert('Enter the weight/load you used.');return null}
 if(!Number.isFinite(reps)||reps<1){alert('Enter how many clean reps you completed.');return null}
 const hard=effort==='hard'||effort==='grind';let direction='keep',retry=false,message='Baseline found.';
 if(st.attempt===1){
  if(reps>=12&&!hard){direction='up';retry=true;message='12 clean reps reached. Increase the weight for one final attempt and aim for about 10 clean reps.'}
  else if(reps>=10&&!hard){direction='keep';message='Good clean range. This load is a solid starting baseline.'}
  else{direction='down';retry=true;message='This is too heavy for a 3×8 starting load. Reduce the weight for one final attempt and aim for about 10 clean reps.'}
 }
 const attempt={k:st.k,attempt:st.attempt,load,reps,effort,direction};
 (runner.calAttempts[st.k]||(runner.calAttempts[st.k]=[])).push(attempt);runner.entries.push(attempt);
 if(st.attempt===1&&retry){
  const retryStep={kind:'work',k:st.k,attempt:2,calibration:true,seconds:0};
  const rest={kind:'rest',k:st.k,seconds:90,calibration:true,cue:message};runner.steps.splice(runner.i+1,0,rest,retryStep);return {retry:true,message};
 }
 const es=profile().exercise[st.k]||(profile().exercise[st.k]={successes:0});
 if(st.attempt===1){es.workingLoad=load;es.calibratedAt=new Date().toISOString();es.calibrationStatus='baseline';}
 else{
  const first=runner.calAttempts[st.k]?.[0];
  if(reps>=10&&!hard){es.workingLoad=load;es.calibrationStatus='baseline'}
  else if(first&&first.direction==='up'){es.workingLoad=first.load;es.calibrationStatus='conservative'}
  else{es.workingLoad=load;es.calibrationStatus='reduce-next-session'}
  es.calibratedAt=new Date().toISOString();
 }
 return {retry:false,message};
}
const doneBtn=$('#runnerDone');if(doneBtn)doneBtn.onclick=()=>{
 if(!runner)return;const st=runner.steps[runner.i];if(!st)return;
 if(st.kind==='rest'){runner.i++;showStep();return}
 if(st.calibration){const result=saveCalibrationAttempt(st);if(!result)return;runner.i++;showStep();return}
 if(st.kind==='work'){if(st.hiit)runner.entries.push({k:st.k,set:st.set,load:'',reps:`${Math.max(0,st.seconds-runner.remaining)}s`});else runner.entries.push({k:st.k,set:st.set,load:$('#runLoad').value.trim(),reps:$('#runReps').value.trim()})}runner.i++;showStep();
};
const skipBtn=$('#runnerSkip');if(skipBtn)skipBtn.onclick=()=>{if(!runner)return;runner.i++;showStep()};
const backBtn=$('#runnerBack');if(backBtn)backBtn.onclick=()=>{if(!runner)return;runner.i=Math.max(0,runner.i-1);showStep()};
function exitWorkout(){if(!runner){$('#runnerModal')?.classList.add('hide');tab('today');return}if(confirm('Exit this workout? Unsaved work from this session will be discarded, but you will stay clocked in.')){clearInterval(tick);tick=null;runner=null;const modal=$('#runnerModal');if(modal)modal.classList.add('hide');const fields=$('#logFields');if(fields)fields.classList.add('hide');renderAll();tab('today')}}
const exitBtn=$('#runnerExit');if(exitBtn)exitBtn.onclick=exitWorkout;
async function finishWorkout(){
 if(!runner)return;clearInterval(tick);tick=null;const finished=runner;runner=null;$('#runnerModal').classList.add('hide');const p=profile(),now=new Date().toISOString();const hist={date:now,startedAt:finished.startedAt,type:finished.type,entries:finished.entries,calId:finished.calId||null,gymSessionStartedAt:state.gym.startedAt||null};p.history.unshift(hist);
 if(!finished.opts.calibration){finished.entries.forEach(e=>{const x=EX[e.k];if(x&&['legs','push','pull','core'].includes(x.cat))p.lastCats[x.cat]=now;if(!p.exercise[e.k])p.exercise[e.k]={successes:0};const es=p.exercise[e.k];if(e.load)es.lastLoad=e.load});const by={};finished.entries.forEach(e=>(by[e.k]||(by[e.k]=[])).push(e));Object.keys(by).forEach(k=>{const arr=by[k],nums=arr.map(x=>parseInt(x.reps,10)).filter(Number.isFinite),load=arr.find(x=>x.load)?.load;if(load&&nums.length>=2&&nums.every(n=>n>=8)){const es=p.exercise[k]||(p.exercise[k]={successes:0});es.workingLoad=es.workingLoad||load;es.successes=(es.lastSuccessLoad===load?(es.successes||0)+1:1);es.lastSuccessLoad=load}})}
 if(finished.calId&&!p.calDone.includes(finished.calId))p.calDone.push(finished.calId);await save();renderAll();tab('today');alert(finished.opts.calibration?'Calibration saved.':'Work logged.');
}
function removeStaleCoupleUI(){const oldBtn=$('#tabs button[data-tab="couple"]');if(oldBtn)oldBtn.remove();const oldSection=$('#couple');if(oldSection)oldSection.remove();}
function initApp(){loadLocal();removeStaleCoupleUI();if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{})}renderAll();const syncBtn=$('#syncBtn');if(syncBtn){syncBtn.textContent='Save';syncBtn.onclick=save}$$('#tabs button').forEach(b=>b.onclick=()=>tab(b.dataset.tab))}
initApp();
