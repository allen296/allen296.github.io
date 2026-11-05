'use strict';
// Independent routes: cards are obstacles, never implicit junctions.
function familyRoutes(positions, edges, width, height) {
 const cell=20,cols=Math.ceil(width/cell)+1,rows=Math.ceil(height/cell)+1;
 const cards=[...positions].map(([id,p])=>({id,x:p.x-80,y:p.y-42,right:p.x+80,bottom:p.y+62})),blocked=new Set(),used=new Map();
 const key=(x,y)=>y*cols+x;
 for(const r of cards)for(let y=Math.max(0,Math.ceil(r.y/cell));y<=Math.floor(r.bottom/cell);y++)for(let x=Math.max(0,Math.ceil(r.x/cell));x<=Math.floor(r.right/cell);x++)blocked.add(key(x,y));
 const ordered=edges.slice().sort((a,b)=>a.id.localeCompare(b.id)),ports=new Map();
 function side(id,r){const a=positions.get(id),b=positions.get(r.from===id?r.to:r.from);return r.kind==='parent'||a.y!==b.y?(b.y>=a.y?'bottom':'top'):(b.x>a.x?'right':'left');}
 for(const r of ordered)for(const id of [r.from,r.to]){const group=id+'|'+side(id,r);if(!ports.has(group))ports.set(group,[]);ports.get(group).push(r);}
 function port(id,r){const a=positions.get(id),s=side(id,r),group=ports.get(id+'|'+s);group.sort((l,r)=>{const a=positions.get(l.from===id?l.to:l.from),b=positions.get(r.from===id?r.to:r.from);return a.x-b.x||a.y-b.y||l.id.localeCompare(r.id);});
  const i=group.indexOf(r),offset=(i-(group.length-1)/2)*Math.min(18,100/Math.max(1,group.length-1)),p=s==='bottom'?{x:a.x+offset,y:a.y+50}:s==='top'?{x:a.x+offset,y:a.y-30}:s==='left'?{x:a.x-68,y:a.y+10+offset/3}:{x:a.x+68,y:a.y+10+offset/3};
  const outer={x:p.x+(s==='left'?-40:s==='right'?40:0),y:p.y+(s==='top'?-40:s==='bottom'?40:0)};return {p,side:s,x:Math.round(outer.x/cell),y:Math.round(outer.y/cell)};
 }
 function search(a,b){const heap=[],best=new Map(),previous=new Map(),start=key(a.x,a.y)*5+4;
  function push(v){heap.push(v);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p].f<=v.f)break;heap[i]=heap[p];i=p;}heap[i]=v;}
  function pop(){const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let j=i*2+1;if(j+1<heap.length&&heap[j+1].f<heap[j].f)j++;if(heap[j].f>=last.f)break;heap[i]=heap[j];i=j;}heap[i]=last;}return first;}
  best.set(start,0);push({x:a.x,y:a.y,dir:4,g:0,f:0,state:start});let end;
  while(heap.length){const n=pop();if(n.g!==best.get(n.state))continue;if(n.x===b.x&&n.y===b.y){end=n.state;break;}
   for(const [dir,[dx,dy]] of [[1,0],[0,1],[-1,0],[0,-1]].entries()){const x=n.x+dx,y=n.y+dy,k=key(x,y);if(x<1||y<1||x>=cols-1||y>=rows-1||blocked.has(k))continue;
    const state=k*5+dir,g=n.g+1+(n.dir!==4&&n.dir!==dir ? .7 : 0)+(used.get(k)||0)*8;if(g>=(best.get(state)??Infinity))continue;best.set(state,g);previous.set(state,n.state);push({x,y,dir,g,state,f:g+Math.abs(x-b.x)+Math.abs(y-b.y)});
   }
  }
  if(end===undefined)throw new Error('No hay ruta libre para un vínculo familiar');const path=[];
  for(let state=end;state!==undefined;state=previous.get(state)){const k=Math.floor(state/5),x=k%cols,y=Math.floor(k/cols);path.push({x:x*cell,y:y*cell});used.set(k,(used.get(k)||0)+1);}return path.reverse();
 }
 function lead(port,grid,reverse){const bend=port.side==='top'||port.side==='bottom'?{x:port.p.x,y:grid.y}:{x:grid.x,y:port.p.y},points=[port.p,bend,grid];return reverse?points.reverse():points;}
 return ordered.map(r=>{const a=port(r.from,r),b=port(r.to,r),grid=search(a,b),points=[...lead(a,grid[0],false),...grid.slice(1,-1),...lead(b,grid.at(-1),true)],simple=[];
  for(const p of points){if(simple.length&&p.x===simple.at(-1).x&&p.y===simple.at(-1).y)continue;while(simple.length>1){const q=simple.at(-1),s=simple.at(-2);if(!((s.x===q.x&&q.x===p.x)||(s.y===q.y&&q.y===p.y)))break;simple.pop();}simple.push(p);}
  return {record:r,points:simple,d:simple.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join(' '),a:a.p,b:b.p};
 });
}

