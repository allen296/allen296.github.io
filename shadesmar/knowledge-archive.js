'use strict';
const archiveFocus={heralds:null,'spren-types':null,'spren-individuals':null};
let sprenArchiveMode='spren-types';
function archiveFactsKnown(){return relationRecords(data.knowledgeArchive?.facts||[]).sort((a,b)=>index.get(a.revealedAt.sceneId)-index.get(b.revealedAt.sceneId)||a.id.localeCompare(b.id));}
function archiveEntryKnown(entry){return archiveFactsKnown().some(f=>f.entryId===entry.id&&f.field==='name');}
function archiveCharacter(entry){return entry?.characterId&&relationKnownAt(entry.characterRevealedAt)?relationPerson(entry.characterId):null;}
function archiveName(entry){if(!entry||!archiveEntryKnown(entry))return '?????';const person=entry.section==='spren-individuals'?archiveCharacter(entry):null;return person?characterName(person):archiveFactsKnown().filter(f=>f.entryId===entry.id&&f.field==='name').at(-1)?.value||'?????';}
function archiveModel(section){
 const all=data.knowledgeArchive?.entries||[],facts=archiveFactsKnown(),entries=all.filter(e=>e.section===section&&archiveEntryKnown(e));
 const knownIds=new Set(all.filter(archiveEntryKnown).map(e=>e.id));
 const links=relationRecords(data.knowledgeArchive?.links||[]).filter(l=>knownIds.has(l.fromEntry)&&knownIds.has(l.toEntry));
 return {entries,facts,links};
}
function archiveReferences(record){
 const sources=(record.sourceIds||[]).map(id=>({id,url:data.sources[id]}));
 const locator=record.readingLocator||record.primaryLocator;
 return (locator?'<p class="archive-locator"><strong>Dónde buscarlo:</strong> '+escapeHtml(locator)+'</p>':'')+'<details class="archive-reference"><summary>'+escapeHtml(relationSceneLabel(record.revealedAt))+' · '+(record.status==='confirmed'?'Pasaje cotejado':'Cotejo directo pendiente')+'</summary>'+(record.status==='confirmed'?'':'<p>Hay una referencia registrada; queda pendiente contrastarla directamente con el pasaje del libro.</p>')+'<ul>'+sources.map((s,i)=>'<li>'+(s.url?'<a target="_blank" rel="noopener" href="'+escapeHtml(s.url)+'">Consultar fuente '+(i+1)+'</a>':'Referencia del capítulo')+'</li>').join('')+'</ul><p>Las páginas externas pueden contener información posterior.</p></details>';
}
function archiveFactLabel(field){return ({name:'Nombre o referencia inicial',alias:'Otro nombre conocido',title:'Título',order:'Orden asociada',type:'Tipo de spren',description:'Información',nature:'Naturaleza',appearance:'Aspecto'})[field]||'Información';}
function archiveDisplayFacts(entry,person,facts){
 const result=facts.map(f=>({...f,sourceIds:[...(f.sourceIds||[])]}));
 if(entry.section!=='spren-individuals'||!person)return result;
 for(const [i,r] of (person.nameRevelations||[]).entries()){
  if(r.status==='rejected'||!relationKnownAt(r.revealedAt))continue;
  const existing=result.find(f=>['name','alias'].includes(f.field)&&f.value===r.name&&f.revealedAt.sceneId===r.revealedAt.sceneId);
  if(existing){existing.sourceIds=[...new Set([...existing.sourceIds,...(r.sourceIds||[])])];if(r.status==='confirmed')existing.status='confirmed';existing.primaryLocator=existing.primaryLocator||r.primaryLocator;existing.readingLocator=existing.readingLocator||r.readingLocator;}
  else result.push({...r,id:'display-name-'+entry.id+'-'+i,entryId:entry.id,field:'name',value:r.name});
 }
 return result.sort((a,b)=>index.get(a.revealedAt.sceneId)-index.get(b.revealedAt.sceneId)||a.id.localeCompare(b.id));
}
function archiveEntryMatches(entry,query,knownFacts){
 if(!query)return true;
 const names=archiveDisplayFacts(entry,archiveCharacter(entry),knownFacts.filter(f=>f.entryId===entry.id)).filter(f=>['name','alias'].includes(f.field)).map(f=>f.value);
 return [archiveName(entry),...names].some(name=>name.toLocaleLowerCase('es').includes(query));
}
function archiveGroupedFacts(facts){
 const groups=new Map();
 for(const f of facts){const key=['name','alias'].includes(f.field)?'identity':f.field;if(key==='description')continue;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(f);}
 return [...groups].map(([field,records])=>({field,records,values:[...new Set(records.flatMap(f=>field==='identity'?f.value.split(/\s+\/\s+/):[f.value]).map(v=>v.trim()).filter(Boolean))]}));
}
function archiveSummaryHtml(facts,isHerald){
 const groups=archiveGroupedFacts(facts),order=['identity','order','title','type','nature','appearance'];
 groups.sort((a,b)=>(order.includes(a.field)?order.indexOf(a.field):99)-(order.includes(b.field)?order.indexOf(b.field):99));
 let html=groups.map(g=>'<article data-archive-field="'+escapeHtml(g.field)+'"><span class="archive-label">'+(g.field==='identity'?'Nombres conocidos':archiveFactLabel(g.field))+'</span><div class="archive-values">'+g.values.map(v=>'<span>'+escapeHtml(v)+'</span>').join('')+'</div><details class="archive-evolution"><summary>'+(g.field==='identity'?'Cuándo se conoce cada nombre':'Referencias y evolución')+'</summary><ol>'+g.records.map(r=>'<li><p>'+escapeHtml(r.value)+'</p>'+archiveReferences(r)+'</li>').join('')+'</ol></details></article>').join('');
 if(isHerald&&!groups.some(g=>g.field==='order'))html+='<article data-archive-field="order"><span class="archive-label">Orden asociada</span><p>Pasaje pendiente de localizar</p><small>No hay una referencia revisada que permita mostrarla en este capítulo. Esto no afirma que el libro aún no la haya revelado.</small></article>';
 return html;
}
function archiveDiscoveries(facts,personalFacts){
 const groups=new Map();
 for(const f of [...facts.filter(f=>f.field==='description'),...personalFacts]){const text=f.value||f.text,key=text.trim().replace(/\s+/g,' ').toLocaleLowerCase('es');if(!groups.has(key))groups.set(key,{text,records:[]});groups.get(key).records.push(f);}
 return [...groups.values()].sort((a,b)=>index.get(a.records[0].revealedAt.sceneId)-index.get(b.records[0].revealedAt.sceneId));
}
function renderKnowledgeArchive(){
 for(const section of ['heralds','spren']){$(section+'View').hidden=atlasView!==section;$('view'+(section==='heralds'?'Heralds':'Spren')).setAttribute('aria-pressed',String(atlasView===section));}
 if(!['heralds','spren'].includes(atlasView))return;
 $('unlocatedPanel').hidden=true;
 const section=atlasView==='heralds'?'heralds':sprenArchiveMode,prefix=atlasView,model=archiveModel(section),query=$(prefix+'Search').value.trim().toLocaleLowerCase('es');
 $(prefix+'Cutoff').textContent='Lo que has leído hasta '+sceneLabel(scenes[step])+'.';
 if(prefix==='spren'){for(const mode of ['spren-types','spren-individuals'])$(mode==='spren-types'?'sprenTypes':'sprenIndividuals').setAttribute('aria-pressed',String(mode===sprenArchiveMode));}
 if(!archiveFocus[section]&&model.entries.length)archiveFocus[section]=model.entries[0].id;
 const focus=(data.knowledgeArchive?.entries||[]).find(e=>e.id===archiveFocus[section]),known=focus&&archiveEntryKnown(focus),matches=model.entries.filter(e=>archiveEntryMatches(e,query,model.facts)).sort((a,b)=>archiveName(a).localeCompare(archiveName(b),'es'));
 const list=$(prefix+'List');list.replaceChildren();$(prefix+'Count').textContent=model.entries.length+' '+(section==='heralds'?'entradas con referencias':section==='spren-types'?'tipos mencionados':'individuos conocidos');
 for(const e of matches){const b=document.createElement('button');b.className='archive-person';b.setAttribute('data-archive-entry',e.id);b.setAttribute('aria-pressed',String(e.id===archiveFocus[section]));b.textContent=archiveName(e);b.onclick=()=>{archiveFocus[section]=e.id;renderKnowledgeArchive();};list.append(b);}
 if(focus&&!known){const b=document.createElement('button');b.className='archive-person';b.textContent='????? · Seleccionado';b.setAttribute('aria-pressed','true');b.setAttribute('data-archive-entry',focus.id);list.append(b);}
 if(!matches.length){const p=document.createElement('p');p.textContent=query?'Sin coincidencias entre las referencias conocidas.':'Todavía no hay referencias revisadas en este punto de lectura.';list.append(p);}
 const detail=$(prefix+'Detail');detail.replaceChildren();
 if(!focus||!known){detail.innerHTML='<h3>'+(focus?'?????':'Tu archivo de lectura')+'</h3><p>'+(focus?'La selección se conserva. Esta entrada aún no se ha presentado en el capítulo elegido.':'Selecciona una entrada para consultar lo conocido y sus referencias.')+'</p>';return;}
 const person=archiveCharacter(focus),facts=archiveDisplayFacts(focus,person,model.facts.filter(f=>f.entryId===focus.id)),related=model.links.filter(l=>l.fromEntry===focus.id||l.toEntry===focus.id),knownPersonIds=new Set(model.entries.map(archiveCharacter).filter(Boolean).map(p=>p.id));
 detail.innerHTML='<span class="eyebrow">'+(section==='heralds'?'HERALDOS':section==='spren-types'?'TIPO DE SPREN':'SPREN INDIVIDUAL')+'</span><h3>'+escapeHtml(archiveName(focus))+'</h3><div class="archive-facts">'+archiveSummaryHtml(facts,section==='heralds'&&focus.id!=='herald-heralds-collective')+'</div>';
 const personalFacts=person?characterFactsKnown().filter(f=>f.characterId===person.id):[];
 const discoveries=archiveDiscoveries(facts,personalFacts);
 if(discoveries.length){const block=document.createElement('section');block.className='archive-discoveries';block.innerHTML='<h4>Lo que sabes hasta aquí</h4><ol>'+discoveries.map(g=>'<li><p>'+escapeHtml(g.text)+'</p>'+g.records.map(archiveReferences).join('')+'</li>').join('')+'</ol>';detail.append(block);}
 if(related.length){const block=document.createElement('section');block.innerHTML='<h4>'+(section==='heralds'?'Relaciones entre Heraldos':'Relaciones documentadas')+'</h4>';for(const link of related){const other=(data.knowledgeArchive.entries).find(e=>e.id===(link.fromEntry===focus.id?link.toEntry:link.fromEntry));const card=document.createElement('article');card.className='archive-note';card.innerHTML='<p>'+escapeHtml(link.label)+'</p>'+archiveReferences(link);const button=document.createElement('button');button.textContent='Ver '+archiveName(other);button.onclick=()=>{if(other.section.startsWith('spren-'))sprenArchiveMode=other.section;archiveFocus[other.section]=other.id;showAtlasView(other.section==='heralds'?'heralds':'spren');};card.append(button);block.append(card);}detail.append(block);}
 const bonds=person?documentedRelationships().filter(r=>[r.from,r.to].includes(person.id)&&(section!=='heralds'||knownPersonIds.has(r.from===person.id?r.to:r.from))):[];
 if(bonds.length){const block=document.createElement('section');block.innerHTML='<h4>Vínculos conocidos</h4>'+bonds.map(r=>'<article class="archive-note"><p>'+escapeHtml(relationName(r.from)+' · '+r.label+' · '+relationName(r.to))+'</p>'+archiveReferences(r)+'</article>').join('');detail.append(block);}
 const history=person?relationshipHistory(person.id).filter(e=>section!=='heralds'||interactionContacts(e,person.id).some(id=>knownPersonIds.has(id))):[];
 if(history.length){const block=document.createElement('section');block.innerHTML='<h4>Historial de interacciones'+(section==='heralds'?' entre Heraldos':'')+'</h4>'+history.map(e=>'<article class="archive-note"><p>'+escapeHtml(e.summary)+'</p>'+archiveReferences(e)+'</article>').join('');detail.append(block);}
 if(section==='heralds'&&!related.length&&!bonds.length&&!history.length){const p=document.createElement('p');p.className='relationship-muted';p.textContent='No hay vínculos individuales entre Heraldos revisados para esta entrada hasta aquí. Pertenecer al mismo grupo no implica parentesco.';detail.append(p);}
 if(person){const b=document.createElement('button');b.className='open-character-archive';b.textContent='Abrir ficha y red de '+characterName(person);b.onclick=()=>{selectRelationshipPerson(focus.characterId);showAtlasView('relationships');};detail.append(b);}
}
function initKnowledgeArchive(){
 $('viewHeralds').onclick=()=>showAtlasView('heralds');$('viewSpren').onclick=()=>showAtlasView('spren');
 for(const id of ['heraldsSearch','sprenSearch'])$(id).oninput=renderKnowledgeArchive;
 $('sprenTypes').onclick=()=>{sprenArchiveMode='spren-types';renderKnowledgeArchive();};$('sprenIndividuals').onclick=()=>{sprenArchiveMode='spren-individuals';renderKnowledgeArchive();};
}
