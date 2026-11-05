'use strict';
const data=window.ATLAS_DATA, scenes=data.scenes, cast=data.cast;
const $=id=>document.getElementById(id), NS='http://www.w3.org/2000/svg';
const index=new Map(scenes.map((s,i)=>[s.id,i]));
let memoryView=false, skipFlashbacks=false, nightReview=false, nightPerspective="all", nightLayerSnapshot=null;
try{skipFlashbacks=window.localStorage?.getItem('shadesmar-skip-flashbacks')==='true';}catch{}
const inMemory=()=>nightReview||!skipFlashbacks&&(Boolean(scenes[step].flashback)||memoryView);
const readingSteps=()=>scenes.map((s,i)=>({s,i})).filter(({s})=>!skipFlashbacks||!s.flashback&&!s.memoryEventId);
function nextReadingStep(from,direction){return readingSteps().map(x=>x.i).filter(i=>direction>0?i>from:i<from).sort((a,b)=>direction>0?a-b:b-a)[0]??from;}
let step=0, selected=null, zoom=1, timer=null, detailOpen=false;
let onlyChapterCharacters=false,chapterFilterKey='',chapterFilterIds=new Set();
try{onlyChapterCharacters=window.localStorage?.getItem('shadesmar-only-chapter-characters')==='true';}catch{}
function chapterScopeIds(){return nightReview?knownNightScenes().filter(s=>nightPerspective==='all'||s.id===nightPerspective).map(s=>s.id):[scenes[step].id];}
function currentChapterIds(){const key=step+'|'+nightReview+'|'+nightPerspective;if(chapterFilterKey!==key){chapterFilterKey=key;chapterFilterIds=new Set(chapterScopeIds().flatMap(id=>data.chapterCharacters?.[id]||[]).map(identityId));}return chapterFilterIds;}
function chapterCharacterVisible(p){return !onlyChapterCharacters||currentChapterIds().has(identityId(p.ownerId||p.id));}
function chapterLocationAvailable(p){
 if(!onlyChapterCharacters)return true;
 const owner=cast.find(c=>c.id===identityId(p.ownerId||p.id))||p,scope=new Set(chapterScopeIds()),e=last(owner),mapped=mapEvidence(owner),experience=cognitiveExperience(owner);
 if(experience&&scope.has(experience.sceneId)&&experience.entryAnchor?.xy)return true;
 return Boolean(e?.xy&&mapped?.xy&&scope.has(e.scene)&&scope.has(mapped.scene));
}
const atlasScale=data.mapPresentation?.atlasScale||1;
let mapPins=[],mapClusters=[];
const expandedClusters=new Set();
function clusterCharacters(people){
 const pending=new Set(people),groups=[],factor=zoom*atlasScale;
 while(pending.size){
  const first=pending.values().next().value;pending.delete(first);const members=[first];
  for(let i=0;i<members.length;i++)for(const p of [...pending]){
   const a=mapEvidence(members[i]),b=mapEvidence(p);
   if(realm(a)===realm(b)&&Boolean(members[i].representativeExperience)===Boolean(p.representativeExperience)&&(!$('showShadesmar').checked||Boolean(cognitiveExperience(members[i]))===Boolean(cognitiveExperience(p)))&&Math.hypot(a.xy[0]-b.xy[0],a.xy[1]-b.xy[1])*factor<54){members.push(p);pending.delete(p);}
  }
  members.sort((a,b)=>a.id.localeCompare(b.id));
  const xy=[0,0];for(const p of members){const e=mapEvidence(p);xy[0]+=e.xy[0]/members.length;xy[1]+=e.xy[1]/members.length;}
  groups.push({key:(first.representativeExperience?'representative:':$('showShadesmar').checked&&cognitiveExperience(first)?'entry-ghost:':'')+realm(mapEvidence(first))+':'+members.map(p=>p.id).join('|'),members,xy,realm:realm(mapEvidence(first))});
 }
 return groups;
}
function layoutMapPins(){
 for(const pin of mapPins){
  const [x,y]=pin.xy,pinScale=zoom*atlasScale;
  pin.g.setAttribute('transform','translate('+x+' '+y+') scale('+(1/pinScale)+') translate('+pin.dx+' '+pin.dy+')');
  if(pin.leader)pin.leader.setAttribute('d','M'+x+' '+y+'L'+(x+pin.dx/pinScale)+' '+(y+pin.dy/pinScale));
  if(pin.anchor)pin.anchor.setAttribute('r',3/pinScale);
 }
}
let hiddenCharacters=new Set();
try{const saved=JSON.parse(window.localStorage?.getItem('shadesmar-hidden-characters')||'[]');if(Array.isArray(saved))hiddenCharacters=new Set(saved.filter(id=>cast.some(p=>p.id===id)));}catch{}
function saveVisibility(){try{window.localStorage?.setItem('shadesmar-hidden-characters',JSON.stringify([...hiddenCharacters]));}catch{}}
function changeVisibility(id,visible){if(visible)hiddenCharacters.delete(id);else hiddenCharacters.add(id);saveVisibility();render();showSelectedGroup();}
function identityId(id){const seen=new Set();let current=id;while(!seen.has(current)){seen.add(current);const link=(data.identityAliases||[]).find(x=>x.from===current&&index.get(x.revealedAt.sceneId)<=step);if(!link)break;current=link.to;}return current;}
function characterName(p){const personId=identityId(p.ownerId||p.id),person=cast.find(c=>c.id===personId)||p;return (person.nameRevelations||[]).filter(x=>x.status!=='rejected'&&index.get(x.revealedAt.sceneId)<=step).sort((a,b)=>index.get(a.revealedAt.sceneId)-index.get(b.revealedAt.sceneId)).at(-1)?.name||person.name;}
const markerCode=p=>characterName(p).split(/[\s-]+/).filter(Boolean).map(w=>w[0]).join('').slice(0,3).toLocaleUpperCase('es')||(p.initial||'?');
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tierLabels={primary:'Principal',secondary:'Secundario',tertiary:'Terciario'};
let showPrimary=true;
try{showPrimary=window.localStorage?.getItem('shadesmar-show-primary')!=='false';}catch{}
let showSecondary=true;
try{showSecondary=window.localStorage?.getItem('shadesmar-show-secondary')!=='false';}catch{}
let showTertiary=showSecondary;
try{const saved=window.localStorage?.getItem('shadesmar-show-tertiary');if(saved!=null)showTertiary=saved!=='false';}catch{}
const categoryVisible=p=>({primary:showPrimary,secondary:showSecondary,tertiary:showTertiary})[p.importance||'tertiary'];
let showDeceased=true;
try{showDeceased=window.localStorage?.getItem('shadesmar-show-deceased')!=='false';}catch{}
function lifeState(p){
 const known=(data.lifeEvents||[]).filter(x=>x.status!=='rejected'&&identityId(x.characterId)===identityId(p.ownerId||p.id)&&index.get(x.revealedAt.sceneId)<=step).sort((a,b)=>index.get(a.revealedAt.sceneId)-index.get(b.revealedAt.sceneId));
 const state=known.at(-1);if(!state)return null;
 const e=last(p);if(nightReview){if(!isNightEvent({scene:state.revealedAt.sceneId})||nightPhase(e)===0)return null;return state;}if(inMemory()&&e?.scene===scenes[step].id&&isPast(e)&&state.revealedAt.sceneId!==scenes[step].id)return null;
 return state;
}
const isDeceased=p=>['dead','reported-dead'].includes(lifeState(p)?.state);
const isVisible=p=>chapterCharacterVisible(p)&&!hiddenCharacters.has(p.ownerId||p.id)&&(showDeceased||!isDeceased(p))&&categoryVisible(p);
const markerColor=p=>isDeceased(p)?'#ef6464':p.color;
const inDisplayedRealm=p=>!$('showShadesmar').checked||realm(last(p))==='cognitive'||Boolean(cognitiveExperience(p));
const eventsFor=p=>{
 if(identityId(p.id)!==p.id)return [];const candidates=[...p.events,...(data.identityAliases||[]).filter(x=>identityId(x.from)===p.id&&identityId(x.from)!==x.from).flatMap(x=>cast.find(c=>c.id===x.from)?.events||[])].sort((a,b)=>index.get(a.scene)-index.get(b.scene)||(a.memoryOrder||0)-(b.memoryOrder||0)||index.get(a.revealedAt.sceneId)-index.get(b.revealedAt.sceneId));const known=candidates.filter(e=>index.get(e.revealedAt?.sceneId||e.scene)<=step&&index.get(e.scene)<=step);
 const superseded=new Set(known.flatMap(e=>e.supersedes||[]));
 return known.filter(e=>!superseded.has(e.id)&&!e.excludedFromRoute);
};
const isNightEvent=e=>Boolean(scenes[index.get(e?.scene)]?.memoryEventId==='gavilar-death-night');
const knownNightScenes=()=>scenes.filter((s,i)=>s.memoryEventId==='gavilar-death-night'&&i<=step);
const nightPhase=e=>({before:0,assassination:1,after:2}[e.memoryPhase]??1);
function nightEventsFor(p){return eventsFor(p).filter(e=>isNightEvent(e)&&(nightPerspective==='all'||e.scene===nightPerspective)).sort((a,b)=>nightPhase(a)-nightPhase(b)||index.get(a.revealedAt.sceneId)-index.get(b.revealedAt.sceneId)||(a.memoryOrder||0)-(b.memoryOrder||0));}
function isMemoryMarker(e){return isPast(e)||Boolean(isNightEvent(e)&&(nightReview||scenes[step].memoryEventId));}
function setNightReview(active){if(active&&!nightReview){nightLayerSnapshot={overlay:$('showShadesmar').checked,follow:$('followRealm').checked};$('showShadesmar').checked=false;$('followRealm').checked=false;}else if(!active&&nightReview&&nightLayerSnapshot){$('showShadesmar').checked=nightLayerSnapshot.overlay;$('followRealm').checked=nightLayerSnapshot.follow;nightLayerSnapshot=null;}nightReview=active;}
function renderNightControls(){const known=knownNightScenes();$('reviewNight').hidden=!known.length;$('reviewNight').textContent=nightReview?'Volver a la escena del capítulo':'Ver aquella noche';$('reviewNight').setAttribute('aria-pressed',String(nightReview));$('nightReviewPanel').hidden=!nightReview;if(!nightReview)return;
 $('nightPerspective').replaceChildren();for(const [value,label] of [['all','Todas las perspectivas leídas'],...known.map(s=>[s.id,(books.find(b=>b.id===sceneBook(s))?.title||'')+' · '+s.memoryPerspective])]){const o=document.createElement('option');o.value=value;o.textContent=label;$('nightPerspective').append(o);}$('nightPerspective').value=nightPerspective;
 $('nightReviewStatus').textContent='RECUERDO COMPARTIDO · Noche de la muerte de Gavilar. '+known.length+' perspectivas conocidas hasta '+sceneLabel(scenes[step])+'. Se muestra el último momento documentado de cada personaje esa noche; los puntos no afirman que todos coincidieran a la vez. Selecciona la perspectiva de Jasnah para ver también su visita breve a Shadesmar y el anclaje de entrada en Roshar; es un episodio con retorno, no una estancia permanente.';
}
const isPast=e=>e.storyTime?.frame==='flashback';
const last=p=>{
 const known=eventsFor(p);
 if(nightReview)return nightEventsFor(p).at(-1);
 if(inMemory())return known.filter(e=>e.scene===scenes[step].id&&isPast(e)).at(-1);
 return known.filter(e=>!isPast(e)).at(-1)||known.at(-1);
};
function mapEvidence(p){
 if(p.representativeEvidence)return p.representativeEvidence;
 const latest=last(p);if(!latest)return null;
 if(nightReview)return nightEventsFor(p).filter(e=>e.xy&&realm(e)===realm(latest)).at(-1)||null;
 if(inMemory())return eventsFor(p).filter(e=>e.xy&&isPast(e)&&e.scene===scenes[step].id&&realm(e)===realm(latest)).at(-1)||null;
 if(isPast(latest)&&(!scenes[step].flashback||latest.scene!==scenes[step].id)){
  // A character known only from memories still has a last documented location.
  return eventsFor(p).filter(e=>e.xy&&isPast(e)&&realm(e)===realm(latest)).at(-1)||null;
 }
 if(latest.xy)return latest;
 const mapped=eventsFor(p).filter(e=>e.xy&&realm(e)===realm(latest)&&isPast(e)===isPast(latest)&&(!isPast(e)||e.scene===scenes[step].id)).at(-1);
 if(mapped)return mapped;
 // An unlocated flashback must not erase the known narrative-present position.
 return isPast(latest)?eventsFor(p).filter(e=>e.xy&&!isPast(e)&&realm(e)===realm(latest)).at(-1)||null:null;
}
const books=data.books||[{id:data.bookId||'wok',title:data.book,order:1}];
const sceneBook=s=>s.bookId||data.bookId||'wok';
const sceneLabel=s=>(books.find(b=>b.id===sceneBook(s))?.title||'')+' \u00b7 '+s.label.replace(/^PR\s*\u00b7\s*/,'');
function syncReadingControls(scene){
 const entries=readingSteps(),parts=[...new Set(entries.map(({s})=>s.part))];
 $('partSelect').replaceChildren(...parts.map(id=>{const o=document.createElement('option');o.value=id;const s=scenes.find(s=>s.part===id),name=partNames[id]||id;o.textContent=name.startsWith('Palabras radiantes')?name:(books.find(b=>b.id===sceneBook(s))?.title||'')+' \u00b7 '+name;return o;}));
 $('sceneSelect').replaceChildren(...entries.map(({s,i})=>{const o=document.createElement('option');o.value=i;o.textContent=sceneLabel(s)+(s.memoryEventId?' · Recuerdo: noche de Gavilar':s.flashback?' · Recuerdo':s.mixedFlashback?' · Presente y recuerdo':'')+(s.excluded?' \u00b7 Fuera del recorrido':'');return o;}));
 $('chapter').min=0;$('chapter').max=scenes.length-1;
 $('timelineStart').textContent=skipFlashbacks?'Inicio del presente':'Preludio · Recuerdo';$('timelineEnd').textContent=sceneLabel(scenes.at(-1));
}
const partNames={'ob-2e':'Segunda parte · capítulos 45-48','ob-2d':'Segunda parte · capítulos 41-44','ob-2c':'Segunda parte · capítulos 38-40','ob-2b':'Segunda parte · capítulos 36-37','ob-2a':'Segunda parte · capítulos 33-35','ob-interludes-1-3':'Interludios I-1–I-3','ob-1f':'Primera parte · capítulos 31-32','ob-1e':'Primera parte · capítulos 25–30','ob-1d':'Primera parte · capítulos 19-24','ob-1c':'Primera parte · capítulos 13-18','ob-1b':'Primera parte · capítulos 7–12','ob-prologue':'Prólogo','ob-1':'Primera parte · capítulos 1–6','ed-3':'Capítulos 11–20','ed-2':'Capítulos 5–10','ed-1':'Capítulos 1–4','1':'Primera parte — hasta el capítulo 11','interludes':'Interludios I-1-I-3','2':'Segunda parte — capítulos 12-28','interludes-4-6':'Interludios I-4-I-6','3':'Tercera parte — capítulos 29-51','interludes-7-9':'Interludios I-7-I-9','4':'Cuarta parte — capítulos 52-69','5':'Quinta parte — capítulos 70-75','epilogue':'Epílogo','wor-prologue':'Palabras radiantes · Prólogo','wor-1':'Palabras radiantes · Primera parte · capítulos 1–12','wor-interludes-1-4':'Palabras radiantes · Interludios I-1–I-4','wor-2':'Palabras radiantes · Segunda parte · capítulos 13–34','wor-interludes-5-8':'Palabras radiantes \u00b7 Interludios I-5-I-8','wor-3':'Palabras radiantes · Tercera parte · capítulos 35-58','wor-interludes-9-11':'Palabras radiantes · Interludios I-9-I-11','wor-4':'Palabras radiantes · Cuarta parte · capítulos 59-75','wor-interludes-12-14':'Palabras radiantes · Interludios I-12-I-14','wor-5':'Palabras radiantes · Quinta parte · capítulos 76-89','wor-epilogue':'Palabras radiantes · Epílogo'};
const realm=e=>e?.realm||'physical';
const isRegional=e=>e?.coordinatePrecision==='region-approximate';
const markerOwner=p=>p.ownerId||p.id;
const cognitiveExperience=p=>data.experiencePresentation?.cognitiveEntryTokens?(data.experiences||[]).find(x=>x.characterId===markerOwner(p)&&x.sceneId===(nightReview?(nightPerspective==='all'?null:nightPerspective):scenes[step].id)&&index.get(x.sceneId)<=step&&x.type==='cognitive-experience'):null;
function cognitiveRepresentative(p){
 const x=cognitiveExperience(p);if(!x?.entryAnchor?.xy)return null;
 const base=mapEvidence(p);if(!base||realm(base)==='cognitive')return null;
 return {...p,id:p.id+'--cognitive-entry',ownerId:p.id,representativeExperience:x.id,representativeEvidence:{...base,id:x.id+'-entry-token',scene:x.sceneId,realm:'cognitive',xy:x.entryAnchor.xy,place:'Shadesmar · Entrada desde '+x.entryAnchor.name,placeId:x.cognitivePlaceId||null,coordinateStatus:'representative',coordinatePrecision:'entry-representative',coordinateAnchorName:x.entryAnchor.name}};
}
const markerGroup=(groups,p)=>$('showShadesmar').checked&&!p.representativeExperience&&realm(mapEvidence(p))==='physical'&&cognitiveExperience(p)?groups.entryGhost:groups[realm(mapEvidence(p))];
function raiseMarker(g){const parent=g.parentNode;if(!parent)return;if(parent.lastElementChild!==g){if(parent.moveBefore)parent.moveBefore(g,null);else parent.append(g);}if(parent.parentNode===$('markers')&&$('markers').lastElementChild!==parent){if($('markers').moveBefore)$('markers').moveBefore(parent,null);else $('markers').append(parent);}}
function closeCharacter(){detailOpen=false;render();}
function focusCharacter(id){if(identityId(selected)===identityId(id)&&detailOpen){closeCharacter();return;}selected=id;detailOpen=true;for(const c of mapClusters.filter(c=>c.members.length>1&&c.members.some(p=>markerOwner(p)===id)))expandedClusters.add(c.key);render();}
function updateMapLayers(evidence,scene){
 const show=$('showShadesmar'),opacity=$('shadesmarOpacity');
 const registration=data.mapPresentation?.atlasToBase||[1,0,0,1,0,0];
 $('registeredAtlas').setAttribute('transform','matrix('+registration.join(' ')+')');
 if($('followRealm').checked)show.checked=realm(evidence)==='cognitive'||cast.some(p=>last(p)&&isVisible(p)&&cognitiveExperience(p));
 const enabled=Boolean(show.checked),alpha=Math.max(0,Math.min(100,Number(opacity.value)||0))/100;
 $('shadesmarLayer').setAttribute('opacity',enabled?alpha:0);
 $('mapLabels').setAttribute('opacity',enabled?1-alpha:1);
 $('mapBase').setAttribute('opacity',enabled?1-alpha:1);
 $('shadesmarOpacityValue').textContent=Math.round(alpha*100)+' %';opacity.disabled=!enabled;
 $('mapName').textContent=enabled?(alpha===1?'SHADESMAR':'ROSHAR + SHADESMAR'):'ROSHAR';
 const hasCognitiveExperience=cast.some(p=>p.id===identityId(selected)&&cognitiveExperience(p));
 $('viewCognitiveExperience').hidden=!hasCognitiveExperience;
 $('realmLegend').textContent=enabled?'Shadesmar: visitantes de este capítulo y personajes cuya última referencia sigue en el plano cognitivo. El token translúcido señala su entrada desde Roshar.':'Roshar. Activa Shadesmar para consultar los visitantes y las últimas referencias del plano cognitivo.';
 return {enabled,alpha};
}
const sourceFor=e=>data.sources[e.source]||'';
function stop(){if(timer!==null)clearInterval(timer);timer=null;$('play').textContent='▶';$('play').setAttribute('aria-label','Reproducir');}
function showSelectedGroup(){
 if(!detailOpen||!isVisible(cast.find(p=>p.id===identityId(selected))||{id:selected}))return;
 const groups=mapClusters.filter(c=>c.members.length>1&&c.members.some(p=>markerOwner(p)===identityId(selected)));
 if(groups.some(g=>!expandedClusters.has(g.key))){for(const g of groups)expandedClusters.add(g.key);render();}
}
function keepTimelineViewport(update){
 const body=document.body,x=window.scrollX,y=window.scrollY,height=window.innerHeight;
 const preserve=Boolean(body?.style&&document.activeElement?.closest?.('.timeline')&&Number.isFinite(y)&&Number.isFinite(height));
 // Shorter chapter content must not clamp the page above the timeline being used.
 // Reserve only the current viewport, rather than the longest chapter's height.
 if(preserve)body.style.minHeight=Math.ceil(y+height)+'px';
 update();
 if(preserve&&window.scrollY!==y&&typeof window.scrollTo==='function')window.scrollTo({left:Number.isFinite(x)?x:0,top:y,behavior:'instant'});
}
function go(value){keepTimelineViewport(()=>{stop();expandedClusters.clear();const target=Math.max(0,Math.min(scenes.length-1,value));step=skipFlashbacks&&(scenes[target].flashback||scenes[target].memoryEventId)?nextReadingStep(target,value<step?-1:1):target;memoryView=false;render();showSelectedGroup();});}
let unlocatedTrayExpanded=false;
function renderMemoryTokens(people,chapterMode=false){
 const panel=$('memoryUnlocatedPanel'),grid=$('memoryUnlocatedTokens');
 const visible=inMemory()||chapterMode?people.slice().sort((a,b)=>characterName(a).localeCompare(characterName(b),'es')||a.id.localeCompare(b.id)):[];
 panel.setAttribute('aria-label',chapterMode?'Personajes mencionados sin ubicación en este capítulo':'Personajes del recuerdo sin ubicación conocida');
 $('memoryUnlocatedCaption').textContent=chapterMode?'No se ha podido localizar en este capítulo a estos personajes':'Personajes del recuerdo · Sin ubicación conocida';
 panel.hidden=visible.length===0;panel.style.maxWidth='360px';grid.replaceChildren();
 grid.hidden=!unlocatedTrayExpanded;
 const toggle=$('toggleUnlocatedTokens');
 toggle.textContent=(unlocatedTrayExpanded?'Ocultar':'Ver')+' personajes sin localizar ('+visible.length+')';
 toggle.setAttribute('aria-expanded',String(unlocatedTrayExpanded));
 toggle.onclick=()=>{unlocatedTrayExpanded=!unlocatedTrayExpanded;render();};
 grid.onwheel=e=>e.stopPropagation();grid.onpointerdown=e=>e.stopPropagation();
 for(const p of visible){
  const b=document.createElement('button'),active=detailOpen&&selected===p.id,color=markerColor(p);
  b.type='button';b.className='memory-unlocated-token';b.setAttribute('data-character-id',p.id);b.setAttribute('data-location-state','unlocated');b.setAttribute('aria-label',characterName(p)+(chapterMode?' · Sin ubicación documentada en este capítulo':' · Recuerdo sin ubicación conocida'));b.setAttribute('aria-pressed',String(active));b.setAttribute('title',characterName(p)+' · Ubicación desconocida');
  b.innerHTML='<svg viewBox="-32 -32 64 64" width="58" height="58" aria-hidden="true" focusable="false"><path d="M-27 -20L-27 -27L-20 -27M20 -27L27 -27L27 -20M27 20L27 27L20 27M-20 27L-27 27L-27 20" fill="none" stroke="#c7a4ff" stroke-width="2"/>'+(active?'<circle r="25" fill="none" stroke="#fff1c6" stroke-width="2"/>':'')+'<circle r="19" fill="#10212a" stroke="'+color+'" stroke-width="2.5"/><text text-anchor="middle" dy="4" fill="'+color+'" font-family="system-ui" font-weight="700" font-size="12">'+escapeHtml(markerCode(p))+'</text></svg><span>'+escapeHtml(characterName(p))+'</span>';
  b.onclick=()=>{if(chapterMode&&!last(p)){selectRelationshipPerson(p.id);showAtlasView('relationships');}else focusCharacter(p.id);};grid.append(b);
 }
}
function render(){
 if(nightReview&&nightPerspective!=='all'&&!knownNightScenes().some(s=>s.id===nightPerspective)){nightPerspective='all';$('showShadesmar').checked=false;}
 const scene=scenes[step], available=cast.filter(p=>last(p));
 $('onlyChapterCharacters').setAttribute('aria-pressed',String(onlyChapterCharacters));
 $('onlyChapterCharacters').textContent='Solo personajes del capítulo: '+(onlyChapterCharacters?'Sí':'No');
 syncReadingControls(scene);renderNightControls();
 $('skipFlashbacks').textContent='Omitir flashbacks: '+(skipFlashbacks?'Sí':'No');$('skipFlashbacks').setAttribute('aria-pressed',String(skipFlashbacks));
 $('memoryView').hidden=nightReview||!scene.mixedFlashback||skipFlashbacks;$('memoryView').textContent=inMemory()?'Volver al presente':'Ver recuerdo';$('memoryView').setAttribute('aria-pressed',String(inMemory()));
 const memoryUnlocated=available.filter(p=>!mapEvidence(p));
 const visibleMemoryUnlocated=memoryUnlocated.filter(isVisible);
 $('memoryBanner').hidden=!inMemory()&&!scene.memoryEventId;
 $('memoryBanner').textContent=visibleMemoryUnlocated.length
  ?'RECUERDO · Se desconoce la ubicación en el mapa.'
  :memoryUnlocated.length&&!available.some(isVisible)
   ?'RECUERDO · Se desconoce la ubicación en el mapa. No hay personajes visibles con los filtros actuales.'
   :available.length?'RECUERDO · Solo participantes de esta escena. Los puntos regionales son aproximados.':'RECUERDO · Evocación sin lugar identificable. No hay una posición corporal documentada.';
 if(nightReview)$('memoryBanner').textContent='RECUERDO COMPARTIDO · Noche de Gavilar · Solo presencias de las perspectivas ya leídas.';else if(scene.memoryEventId)$('memoryBanner').textContent='RECUERDO · Noche de la muerte de Gavilar · Perspectiva de '+scene.memoryPerspective+'.';
 $('atlasLayout').setAttribute('data-memory-view',String(inMemory()||Boolean(scene.memoryEventId)));
 $('showPrimary').textContent='Mostrar principales: '+(showPrimary?'Sí':'No');$('showPrimary').setAttribute('aria-pressed',String(showPrimary));
 $('showTertiary').textContent='Mostrar terciarios: '+(showTertiary?'Sí':'No');$('showTertiary').setAttribute('aria-pressed',String(showTertiary));
 $('showSecondary').textContent='Mostrar secundarios: '+(showSecondary?'Sí':'No');$('showSecondary').setAttribute('aria-pressed',String(showSecondary));
 $('showDeceased').textContent='Mostrar fallecidos: '+(showDeceased?'Sí':'No');$('showDeceased').setAttribute('aria-pressed',String(showDeceased));
 $('detail').hidden=!detailOpen;$('atlasLayout').setAttribute('data-detail-open',String(detailOpen));
 $('showOnlySelected').disabled=!selected||!detailOpen;
 // Preserve the chosen person across chapters, including before their introduction.
 const current=cast.find(p=>p.id===identityId(selected)), evidence=current&&last(current);
 $('detail').hidden=!detailOpen||!evidence;if(!evidence)$('detail').innerHTML='';
 const mapLayers=updateMapLayers(onlyChapterCharacters&&current&&!chapterCharacterVisible(current)?null:evidence,scene);
 const chapterMentionsMode=onlyChapterCharacters&&(!inMemory()||scene.id==='prelude');
 const chapterUnlocated=chapterMentionsMode?(typeof relationshipPeople==='function'?relationshipPeople():cast).filter(p=>isVisible(p)&&inDisplayedRealm(p)&&!chapterLocationAvailable(p)&&characterName(p).toLocaleLowerCase('es').includes($('search').value.toLocaleLowerCase('es'))):[];
 renderMemoryTokens(chapterUnlocated.length?chapterUnlocated:visibleMemoryUnlocated,chapterMentionsMode);
 const filtered=available.filter(categoryVisible).filter(chapterCharacterVisible).filter(p=>characterName(p).toLocaleLowerCase('es').includes($('search').value.toLocaleLowerCase('es')));
 $('count').textContent=available.filter(p=>isVisible(p)&&inDisplayedRealm(p)).length+' / '+available.length+' visibles';$('people').replaceChildren();
 for(const p of filtered){
  const row=document.createElement('div');row.className='person-row';
  const check=document.createElement('input');check.type='checkbox';check.checked=!hiddenCharacters.has(p.id);check.setAttribute('aria-label','Mostrar a '+characterName(p)+' en el mapa');check.onchange=()=>changeVisibility(p.id,check.checked);
  const e=last(p),b=document.createElement('button');b.className='person'+(detailOpen&&selected===p.id?' active':'');
  b.setAttribute('aria-pressed',String(detailOpen&&selected===p.id));b.setAttribute('title',tierLabels[p.importance]+': '+p.importanceReason);
  b.innerHTML='<span class="avatar" style="color:'+markerColor(p)+'">'+escapeHtml(p.initial)+'</span><span><strong>'+escapeHtml(characterName(p))+'</strong><small>'+escapeHtml(tierLabels[p.importance])+' · '+(isDeceased(p)?(lifeState(p).state==='reported-dead'?'Dado por fallecido':'Fallecido'):isPast(e)?'Referencia del pasado':e.scene===scene.id?'Referencia del capítulo':'Última referencia')+'</small></span>';
  b.onclick=()=>{focusCharacter(p.id);};row.append(check,b);$('people').append(row);
 }
 if(!filtered.length)$('people').textContent='Sin coincidencias en este punto de lectura.';
 $('pendingCharacterSelection').replaceChildren();$('pendingCharacterSelection').hidden=true;
 if(current&&!available.some(p=>p.id===current.id)){
  const introduced=typeof relationshipPeople==='function'?relationshipPeople().some(p=>p.id===current.id):eventsFor(current).length>0;
  const row=document.createElement('div');row.className='person-selection-pending';const caption=document.createElement('small');caption.textContent='Selección conservada';
  const b=document.createElement('button');b.setAttribute('aria-pressed',String(detailOpen));b.setAttribute('data-pending-selection','true');b.textContent=introduced?characterName(current):'?????';b.setAttribute('aria-label',introduced?'Selección conservada: '+characterName(current):'Personaje seleccionado aún no presentado');b.onclick=()=>focusCharacter(current.id);
  const note=document.createElement('small');note.textContent=introduced?'Sin referencia de ubicación en esta escena.':'Todavía no se ha presentado en este punto de lectura.';row.append(caption,b,note);$('pendingCharacterSelection').append(row);$('pendingCharacterSelection').hidden=false;
 }

 $('chapter').value=step;$('sceneSelect').value=step;$('partSelect').value=scene.part;
 $('chapterTitle').textContent=nightReview?'Noche de la muerte de Gavilar · RECUERDO COMPARTIDO':sceneLabel(scene)+(scene.memoryEventId?' · RECUERDO: NOCHE DE GAVILAR':inMemory()?' · RECUERDO':'')+(scene.excluded?' · Fuera del recorrido':'');
 $('sceneNote').textContent=nightReview?'El punto de lectura se mantiene en '+sceneLabel(scene)+'. Esta vista no cambia las ubicaciones del recorrido presente.':scene.note;
 $('sceneNote').className=scene.excluded||scene.vision||scene.flashback||scene.memoryEventId||scene.deferred?'scene-note attention':'scene-note';
 $('prev').disabled=nextReadingStep(step,-1)===step;$('next').disabled=nextReadingStep(step,1)===step;
 $('partLabel').textContent=partNames[scene.part]||scene.part;
 if(current&&evidence){
  const isCurrent=nightReview||evidence.scene===scene.id;
  const death=lifeState(current);
  const state=isMemoryMarker(evidence)?'Referencia del pasado':evidence.kind==='vision'?'Visión · posición física sin precisar':evidence.kind==='remote'&&isCurrent?'Comunicación a distancia':isCurrent?'Referencia del capítulo':'Última ubicación conocida';
  const intro=isMemoryMarker(evidence)?'Escena del pasado: no indica la ubicación del personaje en el presente narrativo.':evidence.status==='confirmed'?'Ubicación cotejada con el texto del libro.':evidence.review==='primary-text'?'Referencia de un adelanto autorizado del libro; pendiente de cotejo con tu edición.':evidence.review==='legacy-unverified'?'Referencia de muestra heredada del prototipo.':evidence.kind==='vision'?'La visión no desplaza físicamente al personaje a su escenario antiguo.':evidence.kind==='remote'&&isCurrent?'Una conversación por vinculacaña no implica viajar al campamento.':'Ubicación recogida en un resumen secundario; pendiente de cotejo con el libro.';
  const url=sourceFor(evidence);
  const mapped=mapEvidence(current),fallbackNote=onlyChapterCharacters&&!chapterLocationAvailable(current)?'<p class="attention">No hay un punto documentado para este capítulo. El filtro no coloca la ubicación anterior como si fuera actual; la ficha conserva la última referencia conocida.</p>':mapped&&mapped.id!==evidence.id?'<p class="attention">'+(isPast(evidence)&&!isPast(mapped)?'Este capítulo muestra un recuerdo sin punto cartografiado. El mapa conserva la referencia del presente narrativo, no el lugar del recuerdo.<br>':'')+'Última ubicación conocida en el mapa: '+escapeHtml(mapped.place)+' ('+escapeHtml(scenes[index.get(mapped.scene)].label)+'). La referencia más reciente es '+escapeHtml(evidence.place)+', aún sin coordenadas. El marcador conserva el punto anterior; no confirma que siga allí.</p>':'';
  const experiences=(data.experiences||[]).filter(x=>x.characterId===current.id&&x.sceneId===scene.id);
  const entry=cognitiveExperience(current),entryNote=entry?'<p class="attention">En Shadesmar durante este episodio. '+(entry.entryAnchor?.xy?'Rombo representativo sobre el punto de entrada; el token de Roshar queda translúcido. No es una coordenada cognitiva confirmada.':'Punto de entrada sin localizar; no se inventan coordenadas para el representante.')+'</p>':'';
  const experienceNote=experiences.length?'<div class="evidence"><span class="eyebrow">Relato o experiencia</span>'+experiences.map(x=>'<p>'+escapeHtml(x.experiencedPlace)+'. '+escapeHtml(x.notes.join(' '))+'</p>').join('')+'</div>':'';
  const labels={pending:'Pendiente de confirmar',inferred:'Ubicación deducida',confirmed:'Confirmada en el texto',contested:'Ubicación en discusión'};
  const documentation='<div class="evidence"><span class="tag">'+escapeHtml(labels[evidence.status]||evidence.status)+'</span><p>Referencia: '+escapeHtml(evidence.id)+'<br>Lugar: '+escapeHtml(evidence.placeId)+'</p><p>Plano: '+(realm(evidence)==='cognitive'?'Cognitivo · Shadesmar':'Físico · Roshar')+'</p><p>Marcador: '+(isRegional(evidence)?'anclaje regional aproximado; punto exacto pendiente':evidence.coordinatePrecision==='city-anchor'?'anclaje de ciudad; edificio sin precisar':evidence.coordinateStatus==='calibrated'?'calibrado':evidence.coordinateStatus==='unlocated'?'sin localizar':'pendiente de calibrar')+'</p>'+(evidence.needsConfirmation.length?'<p>Pendiente: '+evidence.needsConfirmation.map(escapeHtml).join(' ')+'</p>':'')+'</div>';
  $('detail').innerHTML='<button id="closeDetail" class="detail-close" aria-label="Cerrar ficha del personaje">×</button><div><button id="openCharacterArchive" class="open-character-archive">Ver todo lo conocido y sus relaciones</button><span class="eyebrow">Ficha del personaje</span><div class="avatar" style="color:'+current.color+'">'+escapeHtml(current.initial)+'</div><h3>'+escapeHtml(characterName(current))+'</h3><span class="subtitle">'+escapeHtml(current.role)+'</span><div class="evidence"><span class="tag">'+escapeHtml(tierLabels[current.importance])+'</span><p>'+escapeHtml(current.importanceReason||'Clasificación editorial pendiente de revisar.')+'</p><small>Clasificación editorial para filtrar el reparto.</small></div><label>LOCALIZACIÓN DE LA REFERENCIA</label><div class="location">'+escapeHtml(evidence.place)+'</div>'+fallbackNote+'</div><div><label>ESTADO DE LA INFORMACIÓN</label><span class="tag">'+state+'</span><p>'+intro+'</p>'+(!isCurrent?'<p>Esta referencia pertenece a '+escapeHtml(scenes[index.get(evidence.scene)].label)+'. No confirma dónde está ahora.</p>':'')+(death&&isDeceased(current)?'<p class="attention" style="color:#ef6464">'+(death.state==='reported-dead'?'Dado por fallecido según la información comunicada.':'Fallecido según la información de este punto de lectura.')+' Fuente: '+escapeHtml(death.sourceIds.join(', '))+'.</p>':'')+documentation+entryNote+experienceNote+'<div class="evidence"><span class="eyebrow">Referencias y recuerdos conocidos</span><ol class="route">'+eventsFor(current).filter(e=>nightReview?isNightEvent(e)&&(nightPerspective==='all'||e.scene===nightPerspective):!inMemory()||e.scene===scene.id&&isPast(e)).map(e=>'<li><b>'+escapeHtml(scenes[index.get(e.scene)].label)+'</b><br>'+escapeHtml(e.place)+(e.retrospective?'<br><em>Precisado en '+escapeHtml(scenes[index.get(e.revealedAt.sceneId)].label)+'</em>':'')+(isPast(e)?'<br><em>Recuerdo'+(e.storyTime.relativeYearsBeforePresent!=null?' · hace '+escapeHtml(e.storyTime.relativeYearsBeforePresent)+' años':'')+'</em>':'')+'</li>').join('')+'</ol><p>Coordenadas provisionales. Las líneas unen referencias; no describen un camino confirmado.</p>'+(url?'<a href="'+escapeHtml(url)+'" target="_blank" rel="noopener">Consultar la fuente</a>':'<p>'+escapeHtml(evidence.locator||'Fuente del prototipo pendiente de revisión.')+'</p>')+'</div></div>';
 }
 $('unlocatedPeople').replaceChildren();
 const mentionedWithoutLocation=!inMemory()&&!scene.memoryEventId&&!$('showShadesmar').checked&&typeof relationshipPeople==='function'?relationshipPeople().filter(p=>!last(p)&&isVisible(p)&&characterName(p).toLocaleLowerCase('es').includes($('search').value.toLocaleLowerCase('es'))):[];
 const unlocated=[...available.filter(p=>isVisible(p)&&inDisplayedRealm(p)&&!mapEvidence(p)),...mentionedWithoutLocation];
 $('unlocatedPanel').hidden=unlocated.length===0||onlyChapterCharacters;
 $('unlocatedCount').textContent=unlocated.length+' sin punto localizado';
 for(const p of unlocated){const b=document.createElement('button');b.className='unlocated-person';b.setAttribute('data-character-id',p.id);b.setAttribute('aria-pressed',String(detailOpen&&selected===p.id));const reference=last(p);b.textContent=characterName(p)+' · '+(reference?reference.place:'Sin ubicación documentada');b.onclick=()=>{if(reference)focusCharacter(p.id);else{selectRelationshipPerson(p.id);showAtlasView('relationships');}};$('unlocatedPeople').append(b);}
 $('markers').replaceChildren();mapPins=[];
 const markerGroups={};
 for(const plane of ['physical','cognitive']){
  const group=document.createElementNS(NS,'g');group.setAttribute('data-realm',plane);
  if(plane==='physical'){group.setAttribute('opacity',1);group.style.display='';}
  if(plane==='cognitive')group.style.display=mapLayers.enabled?'':'none';
  markerGroups[plane]=group;$('markers').append(group);
 }
 const ghostGroup=document.createElementNS(NS,'g');ghostGroup.setAttribute('data-realm','physical-entry');ghostGroup.setAttribute('opacity',data.experiencePresentation?.physicalGhostOpacity??0.28);markerGroups.entryGhost=ghostGroup;$('markers').append(ghostGroup);$('markers').append(markerGroups.cognitive);
 if(current&&evidence&&detailOpen&&isVisible(current)&&chapterLocationAvailable(current)&&inDisplayedRealm(current)&&!nightReview){
  const routeEvidence=mapEvidence(current)||evidence;
  let previous=null,previousRealm=null;
  for(const e of eventsFor(current)){
   if(mapLayers.enabled&&realm(e)!=='cognitive'){previous=null;previousRealm=null;continue;}
   if(isPast(e)!==isPast(routeEvidence)||(isPast(e)&&e.scene!==scene.id)){previous=null;continue;}
   if(!e.xy){previous=null;previousRealm=null;continue;}
   if(previousRealm!==realm(e))previous=null;
   if(previous&&previous.join()!==e.xy.join()){
    const l=document.createElementNS(NS,'line');for(const [k,v]of Object.entries({x1:previous[0],y1:previous[1],x2:e.xy[0],y2:e.xy[1],stroke:current.color,'stroke-width':2,'stroke-dasharray':'5 7'}))l.setAttribute(k,v);
    markerGroups[realm(e)].append(l);
   }
   previous=e.xy;previousRealm=realm(e);
  }
 }
 const positions=new Map();
 const plotted=available.filter(p=>isVisible(p)&&chapterLocationAvailable(p)&&inDisplayedRealm(p)).filter(p=>{const e=last(p);return Boolean(mapEvidence(p));});
 const representatives=plotted.map(cognitiveRepresentative).filter(Boolean);
 mapClusters=clusterCharacters([...plotted,...representatives]);
 const activeKeys=new Set(mapClusters.filter(c=>c.members.length>1).map(c=>c.key));
 for(const key of expandedClusters)if(!activeKeys.has(key))expandedClusters.delete(key);
 const visiblePeople=[];
 for(const cluster of mapClusters){
  const {members,xy,key}=cluster,n=members.length,expanded=expandedClusters.has(key);
  if(n>1){
   const g=document.createElementNS(NS,'g');g.classList.add('marker');g.setAttribute('data-cluster-key',key);g.setAttribute('data-cluster-count',n);g.setAttribute('data-marker-kind',members[0].representativeExperience?'cognitive-representative':'reference');g.setAttribute('role','button');g.setAttribute('tabindex','0');g.setAttribute('aria-expanded',String(expanded));
   const deadCount=members.filter(isDeceased).length;g.setAttribute('data-deceased-count',deadCount);
   const action=expanded?'Contraer':'Desplegar';g.setAttribute('aria-label',action+' grupo de '+n+' personajes: '+members.map(p=>characterName(p)).join(', '));
   const hasSelected=detailOpen&&members.some(p=>markerOwner(p)===identityId(selected));
   g.innerHTML='<title>'+action+': '+members.map(p=>escapeHtml(characterName(p))).join(', ')+'</title><circle r="'+(expanded?16:23)+'" fill="#162d3a" stroke="'+(deadCount===n?'#ef6464':hasSelected?'#fff1c6':'#c4a572')+'" stroke-width="3"/><text text-anchor="middle" dy="5" fill="#fff1c6" font-size="16" font-weight="700">'+(expanded?'−':n)+'</text>';
   const toggle=()=>{if(expandedClusters.has(key))expandedClusters.delete(key);else{expandedClusters.clear();expandedClusters.add(key);}render();};
   if(deadCount)g.innerHTML+='<circle cx="19" cy="-19" r="10" fill="#7f252c" stroke="#ef6464"/><text x="19" y="-15" text-anchor="middle" fill="#fff" font-size="11">'+deadCount+'</text>';
   g.onclick=toggle;g.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();toggle();}};
   markerGroup(markerGroups,members[0]).append(g);mapPins.push({g,xy,dx:0,dy:0});
   if(!expanded)continue;
  }
  const factor=zoom*atlasScale;
  let outerRing=1,capacity=12;while(n>capacity){outerRing++;capacity+=12*outerRing;}
  const outerRadius=n<=12?Math.max(68,n*52/(2*Math.PI)):outerRing*100;
  const matrix=data.mapPresentation?.atlasToBase||[1,0,0,1,0,0];
  const screenX=(matrix[0]*xy[0]+matrix[2]*xy[1]+matrix[4])*zoom+500*(1-zoom)+panX;
  const screenY=(matrix[1]*xy[0]+matrix[3]*xy[1]+matrix[5])*zoom+350*(1-zoom)+panY;
  const margin=outerRadius+32,shiftX=Math.max(margin,Math.min(1000-margin,screenX))-screenX,shiftY=Math.max(margin,Math.min(700-margin,screenY))-screenY;
  const determinant=matrix[0]*matrix[3]-matrix[1]*matrix[2];
  const center=[xy[0]+(matrix[3]*shiftX-matrix[2]*shiftY)/determinant/zoom,xy[1]+(-matrix[1]*shiftX+matrix[0]*shiftY)/determinant/zoom];
  members.forEach((p,i)=>{const e=mapEvidence(p);let ring=1,offset=i;while(offset>=12*ring){offset-=12*ring;ring++;}
   const before=6*ring*(ring-1),onRing=Math.min(12*ring,n-before),radius=n<=12?outerRadius:ring*100,angle=-Math.PI/2+offset*2*Math.PI/onRing;
   const dx=n===1?0:(center[0]-e.xy[0])*factor+Math.cos(angle)*radius,dy=n===1?0:(center[1]-e.xy[1])*factor+Math.sin(angle)*radius;
   let leader=null,anchor=null;
   if(n>1){
    leader=document.createElementNS(NS,'path');leader.setAttribute('stroke',markerColor(p));leader.setAttribute('stroke-width','1');leader.setAttribute('vector-effect','non-scaling-stroke');leader.setAttribute('opacity','.75');leader.setAttribute('fill','none');leader.setAttribute('pointer-events','none');markerGroup(markerGroups,p).append(leader);
    anchor=document.createElementNS(NS,'circle');anchor.setAttribute('cx',e.xy[0]);anchor.setAttribute('cy',e.xy[1]);anchor.setAttribute('fill',markerColor(p));anchor.setAttribute('pointer-events','none');markerGroup(markerGroups,p).append(anchor);
   }
   positions.set(p.id,{xy:e.xy,dx,dy,leader,anchor});visiblePeople.push(p);
  });
 }
 $('mapVisibility').textContent=onlyChapterCharacters&&!inMemory()?plotted.length+' con ubicación en el capítulo; '+chapterUnlocated.length+' sin punto localizado. Según las referencias registradas.':inMemory()&&visibleMemoryUnlocated.length?visibleMemoryUnlocated.length+' personajes del recuerdo sin ubicación, agrupados en el centro.':plotted.length?'Mostrando '+plotted.length+' personajes con punto disponible.':'No hay marcadores visibles. Marca personajes con ubicación disponible o cambia de capítulo.';
 for(const p of visiblePeople.filter(p=>markerOwner(p)!==identityId(selected)).concat(visiblePeople.filter(p=>markerOwner(p)===identityId(selected)))){
  const e=mapEvidence(p),pin=positions.get(p.id),fallback=!p.representativeExperience&&e.id!==last(p).id;
  const g=document.createElementNS(NS,'g');mapPins.push({...pin,g});
  g.onmouseenter=()=>raiseMarker(g);g.onfocus=()=>raiseMarker(g);
  g.setAttribute('tabindex','0');g.setAttribute('role','button');g.setAttribute('aria-label',characterName(p)+' — '+e.place);g.classList.add('marker');if(isMemoryMarker(e))g.classList.add('memory-marker');g.setAttribute('data-realm',realm(e));g.setAttribute('data-character-id',markerOwner(p));g.setAttribute('aria-pressed',String(detailOpen&&markerOwner(p)===identityId(selected)));g.setAttribute('data-marker-kind',p.representativeExperience?'cognitive-representative':'reference');if(!p.representativeExperience&&cognitiveExperience(p)){g.setAttribute('data-entry-ghost','true');if(!$('showShadesmar').checked)g.setAttribute('opacity',data.experiencePresentation?.physicalGhostOpacity??0.28);}g.setAttribute('data-life-state',lifeState(p)?.state||'not-reported-dead');g.setAttribute('data-location-state',fallback?'last-mapped':'latest-reference');if(fallback)g.setAttribute('aria-label',characterName(p)+' · Referencia cartografiada: '+e.place+' · Referencia más reciente sin coordenadas: '+last(p).place);
  const title=escapeHtml((isMemoryMarker(e)?'RECUERDO. ':'')+(p.representativeExperience?'Representante en Shadesmar sobre el punto de entrada en Roshar; no es una coordenada cognitiva confirmada. ':'')+(fallback?'Referencia cartografiada ('+scenes[index.get(e.scene)].label+'). Referencia actual sin coordenadas: '+last(p).place+'. ':'')+characterName(p)+' — '+e.place+' · '+(isRegional(e)?'Región aproximada: '+e.coordinateAnchorName:e.coordinateStatus==='calibrated'?'Punto calibrado':'Ubicación provisional'));
  const badge=realm(e)==='cognitive'?'<path d="M0 -22L22 0L0 22L-22 0Z"':'<circle r="19"';
  g.innerHTML='<title>'+title+'</title>'+(isMemoryMarker(e)?'<path d="M-27 -20L-27 -27L-20 -27M20 -27L27 -27L27 -20M27 20L27 27L20 27M-20 27L-27 27L-27 20" fill="none" stroke="#c7a4ff" stroke-width="2"/>':'')+(isRegional(e)?'<circle r="29" fill="none" stroke="'+markerColor(p)+'" stroke-dasharray="2 5" opacity=".65"/>':'')+(detailOpen&&markerOwner(p)===identityId(selected)?'<circle class="selection-ring" r="25" fill="none" stroke="#fff1c6" stroke-width="2"'+(fallback||e.scene!==scene.id?' stroke-dasharray="4 3"':'')+'/>':'')+badge+' fill="#10212a" stroke="'+markerColor(p)+'" stroke-width="2.5"'+(fallback||e.scene!==scene.id?' stroke-dasharray="4 3"':'')+'/><text text-anchor="middle" dy="4" fill="'+markerColor(p)+'" font-family="system-ui" font-weight="700" font-size="12">'+escapeHtml(markerCode(p))+'</text><text class="marker-name'+(detailOpen&&markerOwner(p)===identityId(selected)?' selected-name':'')+'" text-anchor="middle" y="-31" fill="#fff1d6" font-size="13" style="paint-order:stroke;stroke:#10212a;stroke-width:5;stroke-linejoin:round">'+escapeHtml(characterName(p))+'</text>';
  g.onclick=ev=>{ev?.stopPropagation?.();focusCharacter(markerOwner(p));};g.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();ev.stopPropagation?.();focusCharacter(markerOwner(p));}};
  markerGroup(markerGroups,p).append(g);
 }
 const closeButton=$('closeDetail');if(closeButton)closeButton.onclick=closeCharacter;
 if(current&&evidence&&typeof showAtlasView==='function')$('openCharacterArchive').onclick=()=>showAtlasView('relationships');
 layoutMapPins();
 if(typeof renderRelationships==='function')renderRelationships();
 if(typeof renderKnowledgeArchive==='function')renderKnowledgeArchive();
}
$('showPrimary').onclick=()=>{showPrimary=!showPrimary;try{window.localStorage?.setItem('shadesmar-show-primary',String(showPrimary));}catch{}render();showSelectedGroup();};
$('showTertiary').onclick=()=>{showTertiary=!showTertiary;try{window.localStorage?.setItem('shadesmar-show-tertiary',String(showTertiary));}catch{}render();showSelectedGroup();};
$('showSecondary').onclick=()=>{showSecondary=!showSecondary;try{window.localStorage?.setItem('shadesmar-show-secondary',String(showSecondary));}catch{}render();showSelectedGroup();};
$('showDeceased').onclick=()=>{showDeceased=!showDeceased;try{window.localStorage?.setItem('shadesmar-show-deceased',String(showDeceased));}catch{}render();showSelectedGroup();};
 $('onlyChapterCharacters').onclick=()=>{onlyChapterCharacters=!onlyChapterCharacters;expandedClusters.clear();try{window.localStorage?.setItem('shadesmar-only-chapter-characters',String(onlyChapterCharacters));}catch{}render();showSelectedGroup();};
$('showAllCharacters').onclick=()=>{hiddenCharacters.clear();saveVisibility();render();showSelectedGroup();};
$('hideAllCharacters').onclick=()=>{hiddenCharacters=new Set(cast.map(p=>p.id));saveVisibility();render();};
$('showOnlySelected').onclick=()=>{if(!selected||!detailOpen)return;hiddenCharacters=new Set(cast.filter(p=>p.id!==identityId(selected)).map(p=>p.id));saveVisibility();render();showSelectedGroup();};
$('showShadesmar').onchange=()=>{$('followRealm').checked=false;render();};
$('followRealm').onchange=render;
$('shadesmarOpacity').oninput=render;
$('viewCognitiveExperience').onclick=()=>{$('followRealm').checked=false;$('showShadesmar').checked=true;render();};
$('skipFlashbacks').onclick=()=>{setNightReview(false);skipFlashbacks=!skipFlashbacks;memoryView=false;try{window.localStorage?.setItem('shadesmar-skip-flashbacks',String(skipFlashbacks));}catch{}go(step);};
$('reviewNight').onclick=()=>{stop();setNightReview(!nightReview);nightPerspective='all';memoryView=false;expandedClusters.clear();if(typeof atlasView!=='undefined')atlasView='map';render();showSelectedGroup();};
$('nightPerspective').onchange=e=>{nightPerspective=e.target.value;$('followRealm').checked=false;$('showShadesmar').checked=(data.experiences||[]).some(x=>x.sceneId===nightPerspective&&index.get(x.sceneId)<=step&&x.type==='cognitive-experience');expandedClusters.clear();render();showSelectedGroup();};
$('memoryView').onclick=()=>{memoryView=!memoryView;expandedClusters.clear();render();showSelectedGroup();};
$('sceneSelect').onchange=e=>go(Number(e.target.value));
$('partSelect').onchange=e=>go(scenes.findIndex(s=>s.part===e.target.value));
$('search').oninput=render;$('chapter').oninput=e=>go(Number(e.target.value));
$('prev').onclick=()=>go(nextReadingStep(step,-1));$('next').onclick=()=>go(nextReadingStep(step,1));
$('play').onclick=()=>{if(timer!==null){stop();return;}if(step===scenes.length-1)step=0;$('play').textContent='Ⅱ';$('play').setAttribute('aria-label','Pausar');render();timer=setInterval(()=>{const target=nextReadingStep(step,1);if(target===step){stop();return;}step=target;memoryView=false;render();if(nextReadingStep(step,1)===step)stop();},1800);};
// Pan is measured in root SVG units, shared by Roshar, Shadesmar and markers.
const mapCanvas=$('mapCanvas');
let panX=0,panY=0,mapDrag=null,suppressMapClick=false;
function scale(){
 const maxX=Math.max(0,(zoom-1)*500),maxY=Math.max(0,(zoom-1)*350);
 panX=Math.max(-maxX,Math.min(maxX,panX));panY=Math.max(-maxY,Math.min(maxY,panY));
 $('world').setAttribute('transform','translate('+(500*(1-zoom)+panX)+' '+(350*(1-zoom)+panY)+') scale('+zoom+')');
 layoutMapPins();
 $('plus').disabled=zoom>=3;$('minus').disabled=zoom<=.8;
}
function zoomAt(value,point={x:500,y:350}){
 const next=Math.max(.8,Math.min(3,value)),ratio=next/zoom;
 panX=point.x-500-ratio*(point.x-500-panX);
 panY=point.y-350-ratio*(point.y-350-panY);
 zoom=next;scale();render();showSelectedGroup();
}
function resetMap(){zoom=1;panX=0;panY=0;expandedClusters.clear();scale();render();showSelectedGroup();}
function svgPoint(event){
 const m=mapCanvas.getScreenCTM();
 if(!m)return null;
 const det=m.a*m.d-m.b*m.c;if(!det)return null;
 const x=event.clientX-m.e,y=event.clientY-m.f;
 return {x:(m.d*x-m.c*y)/det,y:(m.a*y-m.b*x)/det};
}
mapCanvas.addEventListener('pointerdown',event=>{
 if(event.isPrimary===false||event.button!==0)return;
 const point=svgPoint(event);if(!point)return;
 suppressMapClick=false;
 mapDrag={id:event.pointerId,startClientX:event.clientX,startClientY:event.clientY,point,moved:false};
 // Capture immediately on the background; delay on a marker to retain ordinary clicks.
 if(!event.target.closest?.('.marker'))mapCanvas.setPointerCapture(event.pointerId);
});
mapCanvas.addEventListener('pointermove',event=>{
 if(!mapDrag||event.pointerId!==mapDrag.id)return;
 if(event.pointerType==='mouse'&&event.buttons===0){finishPan(event);return;}
 if(!mapDrag.moved&&Math.hypot(event.clientX-mapDrag.startClientX,event.clientY-mapDrag.startClientY)<5)return;
 const point=svgPoint(event);if(!point)return;
 if(!mapDrag.moved){mapDrag.moved=true;mapCanvas.classList.add('is-panning');mapCanvas.setPointerCapture(event.pointerId);}
 panX+=point.x-mapDrag.point.x;panY+=point.y-mapDrag.point.y;mapDrag.point=point;scale();
 event.preventDefault();
});
function finishPan(event){
 if(!mapDrag||event.pointerId!==mapDrag.id)return;
 if(mapDrag.moved&&event.type==='pointerup')suppressMapClick=true;
 mapDrag=null;mapCanvas.classList.remove('is-panning');
 if(mapCanvas.hasPointerCapture(event.pointerId))mapCanvas.releasePointerCapture(event.pointerId);
}
mapCanvas.addEventListener('pointerup',finishPan);
mapCanvas.addEventListener('pointercancel',finishPan);
mapCanvas.addEventListener('lostpointercapture',finishPan);
mapCanvas.addEventListener('click',event=>{
 if(!suppressMapClick||event.detail===0)return;
 suppressMapClick=false;event.preventDefault();event.stopImmediatePropagation();
},true);
mapCanvas.addEventListener('dragstart',event=>event.preventDefault());
mapCanvas.addEventListener('wheel',event=>{
 if(event.ctrlKey||event.metaKey)return;
 const point=svgPoint(event);if(!point)return;
 event.preventDefault();
 const units=event.deltaMode===1?16:event.deltaMode===2?700:1;
 const delta=Math.max(-250,Math.min(250,event.deltaY*units));
 zoomAt(zoom*Math.exp(-delta*.0015),point);
},{passive:false});
mapCanvas.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&expandedClusters.size){expandedClusters.clear();render();event.preventDefault();return;}
 if(event.target!==mapCanvas||event.ctrlKey||event.metaKey||event.altKey)return;
 const moves={ArrowLeft:[60,0],ArrowRight:[-60,0],ArrowUp:[0,60],ArrowDown:[0,-60]};
 if(moves[event.key]){panX+=moves[event.key][0];panY+=moves[event.key][1];scale();}
 else if(event.key==='+'||event.key==='=')zoomAt(zoom+.2);
 else if(event.key==='-')zoomAt(zoom-.2);
 else if(event.key==='Home')resetMap();
 else return;
 event.preventDefault();
});
$('plus').onclick=()=>zoomAt(zoom+.2);
$('minus').onclick=()=>zoomAt(zoom-.2);
$('reset').onclick=resetMap;
if(typeof initRelationships==='function')initRelationships();
if(skipFlashbacks&&(scenes[step].memoryEventId||scenes[step].flashback))step=nextReadingStep(step,1);
scale();
render();
