function bindInfo(){$$('[data-info]').forEach(b=>b.onclick=()=>showInfo(b.dataset.info))}
function showInfo(k){const e=EX[k];if(!e)return;$('#infoBody').innerHTML=`<h2>${e.n}</h2><p><span class="badge">${e.gear}</span></p><h3>What it works</h3><p>${e.works}</p><h3>How</h3><p>${e.how}</p><a class="btn primary yt" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(e.yt)}">Search YouTube demo ↗</a>`;$('#infoModal').classList.remove('hide')}
const closeInfo=$('#closeInfo');if(closeInfo)closeInfo.onclick=()=>$('#infoModal').classList.add('hide');
const timedKeys=['rope','hang','platecarry','hexlateral','hexforward','hexshuffle'];
function isTimedKey(k){return timedKeys.includes(k)}
function isStrengthCal(k){return STRENGTH_CAL.includes(k)}
function benchmarkSeconds(k){return k==='hang'?60:45}
function startCalibration(id){const c=CAL.find(x=>x.id===id);if(c)startWorkout(c.items,'Calibration',{calibration:true},id)}
function buildSteps(items,opts){
 const steps=[];
 if(opts?.calibration){items.forEach(k=>steps.push({kind:'work',k,attempt:1,calibration:true,seconds:isTimedKey(k)?benchmarkSeconds(k):0}));return steps}
 if(opts?.hiit){const rounds=opts.rounds||1;for(let r=1;r<=rounds;r++)items.forEach((k,idx)=>{steps.push({kind:'work',k,set:r,round:r,seconds:opts.work||40,hiit:true});if(!(r===rounds&&idx===items.length-1))steps.push({kind:'rest',k,round:r,seconds:opts.rest||20,hiit:true})});return steps}
 items.forEach(k=>{const timed=isTimedKey(k);let sets=k==='bandpull'||k==='bandext'||k==='anti'?2:3;if(k==='hang')sets=1;for(let s=1;s<=sets;s++){steps.push({kind:'work',k,set:s,seconds:timed?(opts?.work||40):0});if(s<sets||k!==items[items.length-1])steps.push({kind:'rest',k,seconds:opts?.rest||(timed?20:90)})}});return steps
}
function startWorkout(items,type,opts,calId){if(!ensureClockedIn())return;clearInterval(tick);tick=null;runner={items,type,opts:opts||{},calId,steps:buildSteps(items,opts||{}),i:0,entries:[],remaining:0,orig:0,running:false,startedAt:new Date().toISOString(),calAttempts:{},calResults:{}};$('#runnerModal').classList.remove('hide');showStep()}
function setAdvice(text){const a=$('#calAdvice');if(!a)return;a.textContent=text||'';a.classList.toggle('hide',!text)}
function calibrationCue(st){
 if(isTimedKey(st.k))return `Benchmark • go until the timer ends or stop when clean form/footwork breaks.`;
 if(st.attempt===1)return 'Attempt 1 of 2 • choose a reasonable load • push for up to 12 clean reps, but do not grind past clean form.';
 const prev=runner.calAttempts[st.k]?.[0];return prev?.direction==='up'?'Attempt 2 of 2 • increase the load • target about 10 clean reps.':prev?.direction==='down'?'Attempt 2 of 2 • lower the load • target about 10 clean reps after the recovery.':'Attempt 2 of 2 • target about 10 clean reps.'
}
function showStep(){
 if(!runner)return;clearInterval(tick);tick=null;runner.running=false;setAdvice('');if(runner.i>=runner.steps.length){finishWorkout();return}
 const st=runner.steps[runner.i],e=EX[st.k];if(!e){runner.i++;showStep();return}
 $('#runnerMeta').textContent=`${runner.type}${st.round?' • Round '+st.round:''}${st.calibration?' • '+(st.attempt===2?'Attempt 2':'Attempt 1'):''} • ${runner.i+1}/${runner.steps.length}`;
 if(st.kind==='rest'){$('#runnerStep').textContent='RECOVER';$('#runnerCue').textContent=st.cue||('Next: '+(EX[runner.steps.slice(runner.i+1).find(x=>x.kind==='work')?.k]?.n||'finish'));$('#logFields').classList.add('hide');$('#runnerDone').textContent='Skip Rest';setAdvice(st.advice||'');startCountdown(st.seconds,true);return}
 $('#runnerStep').textContent=e.n+(st.hiit?'':st.calibration?'':' • Set '+st.set);
 if(st.calibration){
  $('#runnerCue').textContent=calibrationCue(st);$('#logFields').classList.remove('hide');
  const prior=runner.calAttempts[st.k]?.[0];$('#runLoad').value=st.attempt===2?(prior?.suggestedLoad||''):(profile().exercise[st.k]?.workingLoad||'');$('#runReps').value='';
  const ew=$('#effortWrap');if(ew)ew.classList.toggle('hide',!isStrengthCal(st.k));$('#runEffort').value='clean';$('#runnerDone').textContent=isTimedKey(st.k)?'STOP / SAVE':'SAVE ATTEMPT';
  if(st.seconds){$('#runLoad').value='';$('#runReps').value='';startCountdown(st.seconds,false)}else{$('#runnerTimer').textContent=st.attempt===1?'TARGET 12':'TARGET 10';$('#runnerBar').style.width='0%'}
 }else if(st.hiit){$('#runnerCue').textContent=`${st.seconds}s work • ${e.gear}`;$('#logFields').classList.add('hide');$('#runnerDone').textContent='Done Early';startCountdown(st.seconds,true)}
 else{$('#runnerCue').textContent=`${currentPrescription(st.k)} • ${e.gear}`;$('#logFields').classList.remove('hide');const ew=$('#effortWrap');if(ew)ew.classList.add('hide');$('#runLoad').value=profile().exercise[st.k]?.nextLoad||profile().exercise[st.k]?.workingLoad||'';$('#runReps').value='';$('#runnerDone').textContent='Set Done';if(st.seconds)startCountdown(st.seconds,false);else{$('#runnerTimer').textContent='REP SET';$('#runnerBar').style.width='0%'}}
}
function startCountdown(sec,autoNext){if(!runner)return;runner.remaining=runner.orig=sec;runner.running=true;drawTime();tick=setInterval(()=>{if(!runner){clearInterval(tick);tick=null;return}runner.remaining--;drawTime();if(runner.remaining<=0){clearInterval(tick);tick=null;runner.running=false;if(autoNext){const st=runner.steps[runner.i];if(st?.kind==='work'&&st.hiit)runner.entries.push({k:st.k,set:st.set,load:'',reps:`${st.seconds}s`});runner.i++;showStep()}}},1000)}
function drawTime(){if(!runner)return;let m=Math.floor(runner.remaining/60),s=runner.remaining%60;$('#runnerTimer').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');$('#runnerBar').style.width=runner.orig?((100*(1-runner.remaining/runner.orig))+'%'):'0%'}
function finishStrengthCalibration(st,attempt){
 const p=profile(),es=p.exercise[st.k]||(p.exercise[st.k]={});const attempts=runner.calAttempts[st.k]||[];
 if(st.attempt===1){
  const hard=attempt.effort==='hard'||attempt.effort==='grind';
  if(attempt.reps>=12&&!hard){attempt.direction='up';attempt.suggestedLoad='';return {retry:true,rest:150,advice:'Good. That load is clearly usable. Add a sensible amount of weight, recover, then see if you can still hit about 10 clean reps.'}}
  if(attempt.reps>=10&&!hard){es.workingLoad=attempt.load;es.nextLoad=null;es.calibrationStatus='confirmed';es.calibratedAt=new Date().toISOString();runner.calResults[st.k]={status:'confirmed',load:attempt.load};return {retry:false,advice:`Baseline found at ${attempt.load}.`}}
  attempt.direction='down';attempt.suggestedLoad='';return {retry:true,rest:180,advice:'That starting load was too heavy for a repeatable 3×8 baseline. Lower it, take the full recovery, and use the second attempt as a check.'}
 }
 const first=attempts[0],hard=attempt.effort==='hard'||attempt.effort==='grind';let chosen,status;
 if(attempt.reps>=10&&!hard){chosen=attempt.load;status='confirmed'}
 else if(first?.direction==='up'&&first.reps>=12&&(first.effort==='easy'||first.effort==='clean')){chosen=first.load;status='conservative'}
 else{
  const e1=estimateWorkingLoad(first?.load,first?.reps,first?.effort),e2=estimateWorkingLoad(attempt.load,attempt.reps,attempt.effort);const vals=[e1,e2].filter(v=>v!=null);let est=vals.length===2?round5(vals[0]*.4+vals[1]*.6):(vals[0]||parseLoad(attempt.load));const second=parseLoad(attempt.load);if(second!=null&&est>=second)est=round5(second*.95);chosen=formatLoad(st.k,est);status='estimated';
 }
 es.workingLoad=chosen;es.nextLoad=null;es.calibrationStatus=status;es.calibratedAt=new Date().toISOString();es.successStreak=0;es.failStreak=0;runner.calResults[st.k]={status,load:chosen};return {retry:false,advice:status==='estimated'?`Calibration was fatigue-affected. Starting load estimated at ${chosen}; the first real 3×8 session will validate it.`:`Starting load saved at ${chosen}.`}
}
function saveCalibrationAttempt(st){
 if(isTimedKey(st.k)){
  const seconds=st.seconds?Math.max(0,st.seconds-runner.remaining):0,actual=seconds||st.seconds;profile().benchmarks[st.k]={seconds:actual,date:new Date().toISOString()};runner.entries.push({k:st.k,attempt:1,load:'',reps:`${actual}s`,effort:'benchmark'});runner.calResults[st.k]={status:'benchmark',seconds:actual};return {retry:false,advice:`Benchmark saved: ${actual} seconds.`}
 }
 const load=$('#runLoad').value.trim(),reps=parseInt($('#runReps').value,10),effort=$('#runEffort').value;if(!load){alert('Enter the weight/load you used.');return null}if(!Number.isFinite(reps)||reps<1){alert('Enter how many clean reps you completed.');return null}
 const attempt={k:st.k,attempt:st.attempt,load,reps,effort,direction:'keep',suggestedLoad:''};(runner.calAttempts[st.k]||(runner.calAttempts[st.k]=[])).push(attempt);runner.entries.push(attempt);const result=finishStrengthCalibration(st,attempt);
 if(result.retry){const rest={kind:'rest',k:st.k,seconds:result.rest||150,calibration:true,cue:'Recover before the final attempt.',advice:result.advice};const retryStep={kind:'work',k:st.k,attempt:2,calibration:true,seconds:0};runner.steps.splice(runner.i+1,0,rest,retryStep)}else setAdvice(result.advice||'');return result
}
const doneBtn=$('#runnerDone');if(doneBtn)doneBtn.onclick=()=>{if(!runner)return;const st=runner.steps[runner.i];if(!st)return;if(st.kind==='rest'){runner.i++;showStep();return}if(st.calibration){const result=saveCalibrationAttempt(st);if(!result)return;runner.i++;showStep();return}if(st.kind==='work'){if(st.hiit)runner.entries.push({k:st.k,set:st.set,load:'',reps:`${Math.max(0,st.seconds-runner.remaining)}s`});else runner.entries.push({k:st.k,set:st.set,load:$('#runLoad').value.trim(),reps:$('#runReps').value.trim()})}runner.i++;showStep()};
const skipBtn=$('#runnerSkip');if(skipBtn)skipBtn.onclick=()=>{if(!runner)return;runner.i++;showStep()};
const backBtn=$('#runnerBack');if(backBtn)backBtn.onclick=()=>{if(!runner)return;runner.i=Math.max(0,runner.i-1);showStep()};
function exitWorkout(){if(!runner){$('#runnerModal')?.classList.add('hide');tab('today');return}if(confirm('Exit this workout? Unsaved work from this session will be discarded, but you will stay clocked in.')){clearInterval(tick);tick=null;runner=null;const modal=$('#runnerModal');if(modal)modal.classList.add('hide');setAdvice('');renderAll();tab('today')}}
const exitBtn=$('#runnerExit');if(exitBtn)exitBtn.onclick=exitWorkout;
async function finishWorkout(){
 if(!runner)return;clearInterval(tick);tick=null;const finished=runner;runner=null;$('#runnerModal').classList.add('hide');setAdvice('');const p=profile(),now=new Date().toISOString();const hist={date:now,startedAt:finished.startedAt,type:finished.type,programId:finished.opts.programId||null,entries:finished.entries,calId:finished.calId||null,gymSessionStartedAt:state.gym.startedAt||null};p.history.unshift(hist);
 if(!finished.opts.calibration){const by={};finished.entries.forEach(e=>{const x=EX[e.k];if(x&&['legs','push','pull','core'].includes(x.cat))p.lastCats[x.cat]=now;(by[e.k]||(by[e.k]=[])).push(e)});Object.keys(by).forEach(k=>updateExerciseFromWorkout(k,by[k]));advanceProgramIfNeeded(finished.type)}
 if(finished.calId&&!p.calDone.includes(finished.calId))p.calDone.push(finished.calId);await save();renderAll();tab('today');alert(finished.opts.calibration?(programReady()?'Calibration complete. Your first recommended workout is ready.':'Calibration saved. Continue to the next calibration session.'):'Work logged.')
}
function removeStaleCoupleUI(){const oldBtn=$('#tabs button[data-tab="couple"]');if(oldBtn)oldBtn.remove();const oldSection=$('#couple');if(oldSection)oldSection.remove()}
function initApp(){loadLocal();removeStaleCoupleUI();if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{})}renderAll();const syncBtn=$('#syncBtn');if(syncBtn){syncBtn.textContent='Save';syncBtn.onclick=save}$$('#tabs button').forEach(b=>b.onclick=()=>tab(b.dataset.tab))}
initApp();
