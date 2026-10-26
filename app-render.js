function renderToday(){
 const p=profile(), c=nextCal();
 const content=c?`<div class="card hero"><h1>${p.name}: Calibration ${p.calDone.length+1}/6</h1><p>${c.name}</p><p class="muted">${c.focus}</p><button class="primary" data-startcal="${c.id}">Start calibration</button></div>`:
 (()=>{const w=recommendedTemplate();return `<div class="card hero"><h1>Today's program</h1><p><b>${w.name}</b></p><p class="muted">${w.focus}</p><div>${w.items.map(k=>`<div class="exercise"><b>${EX[k].n}</b><div class="small muted">${currentPrescription(k)} • ${EX[k].gear}</div></div>`).join('')}</div><button class="primary" data-startrec="1">Start workout</button></div>`})();
 $('#today').innerHTML=`<div class="card"><div class="grid"><div><label>Profile</label><select id="profileSel"><option value="me">You</option><option value="gf">Girlfriend</option></select></div><div class="kpi"><span class="small muted">Saved sessions</span><b>${p.history.length}</b></div></div></div>${content}
 <div class="card"><h2>Programming rule</h2><p class="notice"><b>Advance the program first.</b> Extra gym time fills with accessories, bands, rings, micro-movements or conditioning after the important work is covered.</p></div>`;
 $('#profileSel').value=activeProfile; $('#profileSel').onchange=e=>{activeProfile=e.target.value;renderAll()};
 const sc=$('[data-startcal]');if(sc)sc.onclick=()=>startCalibration(sc.dataset.startcal);
 const sr=$('[data-startrec]');if(sr)sr.onclick=()=>startWorkout(recommendedTemplate().items,'Program');
 $('#startRecommended').onclick=()=>c?startCalibration(c.id):startWorkout(recommendedTemplate().items,'Program');
}
function renderCal(){
 const p=profile();
 $('#cal').innerHTML=`<div class="card hero"><h1>2-Week Calibration</h1><p>Working-8 rule: the heaviest load you can control for the target while still leaving roughly 2 good reps.</p></div>`+
 CAL.map(c=>`<div class="card"><div class="row"><div><h2>${c.name}</h2><p class="muted">${c.focus}</p></div><span class="badge">${p.calDone.includes(c.id)?'DONE':'PENDING'}</span></div>${c.items.map(k=>`<div class="exercise"><div class="row"><div><b>${EX[k].n}</b><div class="small muted">${EX[k].gear} • ${EX[k].target}</div></div><button data-info="${k}">How</button></div></div>`).join('')}<button class="primary" data-cal="${c.id}">${p.calDone.includes(c.id)?'Repeat':'Start'}</button></div>`).join('');
 bindInfo();$$('[data-cal]').forEach(b=>b.onclick=()=>startCalibration(b.dataset.cal));
}
function renderQuick(){
 $('#quick').innerHTML=`<div class="card hero"><h1>Quick Hit</h1><p>Not random. It starts with something that advances your real program, then uses remaining time intelligently.</p></div>
 <div class="card"><div class="grid"><div><label>Time</label><select id="qmins"><option>15</option><option>25</option><option selected>45</option><option>60</option><option>90</option><option>120</option></select></div>
 <div><label>Intensity</label><select id="qint"><option value="easy">Easy</option><option value="normal" selected>Normal</option><option value="hard">Hard</option><option value="work">I'm working today</option></select></div></div>
 <button class="primary" id="makeQuick" style="width:100%;margin-top:10px">Build Quick Hit</button></div><div id="quickPlan"></div>`;
 $('#makeQuick').onclick=buildQuick;
}
function buildQuick(){
 const mins=+$('#qmins').value, intensity=$('#qint').value, rec=recommendedTemplate().items.slice(0,2);
 const accessories=['bandpull','bandext','ringrow','triceps','curl','crunch','platecarry','rope','kickback','abduct'];
 let count=mins<=25?3:mins<=45?4:mins<=60?5:mins<=90?6:8;
 let items=[...rec];
 for(const k of accessories){if(items.length>=count)break;if(!items.includes(k))items.push(k)}
 const work=intensity==='easy'?30:intensity==='normal'?40:intensity==='hard'?45:50, rest=intensity==='easy'?30:intensity==='normal'?20:15;
 $('#quickPlan').innerHTML=`<div class="card"><h2>${mins}-minute Quick Hit</h2><p class="muted">Program priority first, then accessories. Timed blocks: ${work}s work / ${rest}s transition where appropriate.</p>${items.map((k,i)=>`<div class="exercise"><b>${i<2?'PROGRAM • ':''}${EX[k].n}</b><div class="small muted">${EX[k].gear} • ${currentPrescription(k)}</div></div>`).join('')}<button class="primary" id="startQuick">Start timed workout</button></div>`;
 $('#startQuick').onclick=()=>startWorkout(items,'Quick Hit',{work,rest,mins});
}
function renderCouple(){
 $('#couple').innerHTML=`<div class="card hero"><h1>Couple Training</h1><p>Tuesday when possible. Saturday is the anchor. Same movement goal, different level/load.</p></div>
 <div class="card"><h2>Tuesday • Strength</h2><table><tr><td>Squat</td><td>You: barbell • Her: landmine/KB</td><td>3×8</td></tr><tr><td>Pull</td><td>You: pull-up/pulldown • Her: pulldown/assisted pull</td><td>3×8</td></tr><tr><td>Hinge</td><td>You: barbell RDL • Her: KB/landmine</td><td>3×8</td></tr><tr><td>Push</td><td>You: bench • Her: incline push-up/landmine</td><td>3×8</td></tr><tr><td>Core</td><td>Low-cable half-kneeling anti-rotation</td><td>2×10/side</td></tr></table><button class="primary" id="startTue">Start Tuesday</button></div>
 <div class="card"><h2>Saturday • Full Body</h2><table><tr><td>Pull-up pathway</td><td>Individual level</td><td>benchmark + practice</td></tr><tr><td>Landmine squat</td><td>Separate loads</td><td>3×8</td></tr><tr><td>Push-up progression</td><td>Separate level</td><td>2 sets</td></tr><tr><td>Low row</td><td>Separate loads</td><td>3×10</td></tr><tr><td>Reverse lunge</td><td>Separate load</td><td>3×8/leg</td></tr><tr><td>Rope / circuit</td><td>Timed</td><td>8 min</td></tr></table><button class="primary" id="startSat">Start Saturday</button></div>
 <div class="card"><h2>Her away option</h2><p>25-lb kettlebell + bodyweight + jump rope: goblet squat, KB RDL, reverse lunge, 1-arm KB row, floor press if controllable, plank, rope intervals.</p></div>`;
 $('#startTue').onclick=()=>startWorkout(['squat','pulldown','rdl','bench','anti'],'Couple Tuesday');
 $('#startSat').onclick=()=>startWorkout(['hang','lmsquat','pushup','lowrow','lunge','rope'],'Couple Saturday',{work:40,rest:20});
}
function renderLibrary(){
 const groups={legs:'Lower / Hinge',push:'Push',pull:'Pull',core:'Core / Carry',micro:'Bands / Micro',cardio:'Conditioning'};
 $('#library').innerHTML=`<div class="card hero"><h1>Exercise Library</h1><p>Core lifts stay stable. Extra equipment gives us options without turning programming into chaos.</p></div>`+
 Object.keys(groups).map(g=>`<div class="card"><h2>${groups[g]}</h2>${Object.keys(EX).filter(k=>EX[k].cat===g).map(k=>`<div class="exercise"><div class="row"><div><b>${EX[k].n}</b><div class="small muted">${EX[k].gear}</div></div><button data-info="${k}">How</button></div></div>`).join('')}</div>`).join('');
 bindInfo();
}
function renderHistory(){
 const p=profile();
 $('#history').innerHTML=`<div class="card hero"><h1>History</h1><p>${p.name} • ${p.goal}</p></div><div class="card">${p.history.length?`<table><tr><th>Date</th><th>Workout</th><th>Work</th></tr>${p.history.slice(0,40).map(h=>`<tr><td>${new Date(h.date).toLocaleDateString()}</td><td>${h.type}</td><td>${h.entries.map(e=>`${EX[e.k]?.n||e.k}: ${e.load||''} ${e.reps||''}`).join('<br>')}</td></tr>`).join('')}</table>`:'<p class="muted">No workouts logged yet.</p>'}</div>`;
}
function renderAll(){renderToday();renderCal();renderQuick();renderCouple();renderLibrary();renderHistory()}
