'use strict';
(function(root){
 const normalize=(books,raw={})=>Object.fromEntries(books.map(b=>{const v=raw&&typeof raw==='object'?raw[b.id]:null;return [b.id,{complete:v?.complete===true,chapter:Number.isInteger(v?.chapter)&&v.chapter>=0&&v.chapter<=999?v.chapter:0,special:b.specials?.some(s=>s.id===v?.special)?v.special:'',part:Number.isInteger(v?.part)&&v.part>=1&&v.part<=6?v.part:1}];}));
 function meets(r,progress,books){const p=progress[r.book];if(!p)return false;if(p.complete)return true;if(r.complete)return false;const b=books.find(b=>b.id===r.book),s=b?.specials?.find(s=>s.id===p.special);return Math.max(p.chapter,s?.rank||0)>=r.at;}
 const all=(rs,p,bs)=>rs.every(r=>meets(r,p,bs));
 const state=(c,p,bs)=>!all(c.introduced,p,bs)?'hidden':all(c.requires,p,bs)?'ready':'locked';
 function project(c,p,bs,opened){const status=state(c,p,bs);if(status==='hidden')return null;const safe={id:c.id,status,question:c.question};return status==='ready'&&opened?{...safe,answer:c.answer,kind:c.kind,evidence:c.evidence,sources:c.sources,requires:c.requires}:safe;}
 const api={normalize,meets,all,state,project};if(typeof module!=='undefined')module.exports=api;else root.CosmereModel=api;
})(typeof window==='undefined'?globalThis:window);
