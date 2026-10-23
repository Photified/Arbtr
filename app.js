'use strict';
const $=id=>document.getElementById(id);
const labels={coin:'Flip coin',dice:'Roll dice',picker:'Pick a winner',ranker:'Shuffle list'};
let mode='coin',busy=false,coinRot=0,rolls=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const delay=()=>new Promise(resolve=>setTimeout(resolve,reduced?30:950));
function read(key){try{const a=JSON.parse(localStorage.getItem('arbtr_'+key)||'[]');return Array.isArray(a)?a.filter(v=>typeof v==='string').slice(0,20):[]}catch{return []}}
function save(key,value){try{localStorage.setItem('arbtr_'+key,JSON.stringify(value))}catch{}}
const lists={picker:read('picker'),ranker:read('ranker')};
const history={coin:read('coin_history').slice(0,5),dice:read('dice_history').slice(0,5)};
function random(n){const a=new Uint32Array(1),limit=Math.floor(4294967296/n)*n;do{crypto.getRandomValues(a)}while(a[0]>=limit);return a[0]%n}
function status(k,text){$(k+'-status').textContent=text}
function controls(){
 $('main-btn').textContent=busy?'Settling it…':labels[mode];
 $('main-btn').disabled=busy||(lists[mode]&&lists[mode].length<2);
 document.querySelectorAll('.nav-item,.input-group button,.input-group input,.delete-btn,.list-tools button,.rank-actions button').forEach(b=>b.disabled=busy);
}
function recent(k){const el=$(k+'-recent');el.replaceChildren();if(!history[k].length)return;const label=document.createElement('span');label.className='recent-label';label.textContent='RECENT';el.append(label);history[k].forEach(v=>{const s=document.createElement('span');s.textContent=v;el.append(s)})}
function record(k,v){history[k].unshift(v);history[k]=history[k].slice(0,5);save(k+'_history',history[k]);recent(k)}
document.querySelectorAll('.nav-item').forEach(btn=>btn.addEventListener('click',()=>{
 if(busy)return;mode=btn.dataset.target.replace('view-','');
 document.querySelectorAll('.nav-item').forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-pressed',String(b===btn))});
 document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active-view',v.id==='view-'+mode));controls();
}));
function render(k){
 const el=$(k==='picker'?'options-list':'ranker-list');el.replaceChildren();
 if(!lists[k].length){const empty=document.createElement('div');empty.className='empty-state';empty.textContent=k==='picker'?'Dinner spots, names, or anything else. Add at least two options above.':'Who goes first? Add at least two names or items above.';el.append(empty)}
 lists[k].forEach((text,i)=>{
  const row=document.createElement('div');row.className=k==='picker'?'list-item':'rank-item';
  if(k==='ranker'){const badge=document.createElement('span');badge.className='rank-number';badge.textContent=i+1;row.append(badge)}
  const name=document.createElement('span');name.className='item-text';name.textContent=text;row.append(name);
  if(k==='ranker'){const actions=document.createElement('span');actions.className='rank-actions';[-1,1].forEach(d=>{const b=document.createElement('button');b.className='quiet-btn';b.textContent=d<0?'↑':'↓';b.setAttribute('aria-label','Move '+text+(d<0?' up':' down'));b.addEventListener('click',()=>{if(busy||i+d<0||i+d>=lists[k].length)return;[lists[k][i],lists[k][i+d]]=[lists[k][i+d],lists[k][i]];changed(k)});actions.append(b)});row.append(actions)}
  const remove=document.createElement('button');remove.className='delete-btn';remove.textContent='×';remove.setAttribute('aria-label','Remove '+text);remove.addEventListener('click',()=>{if(busy)return;lists[k].splice(i,1);changed(k)});row.append(remove);el.append(row);
 });
 $(k+'-count').textContent=lists[k].length+' / 20 items';
}
function changed(k){save(k,lists[k]);render(k);status(k,lists[k].length<2?'Add '+(2-lists[k].length)+' more '+(lists[k].length===1?'item':'items'):k==='picker'?'Ready to pick':'Ready to shuffle');controls()}
for(const k of ['picker','ranker']){
 const add=()=>{if(busy)return;const input=$(k+'-input'),v=input.value.trim();if(!v)return;if(lists[k].length>=20){status(k,'Your list is full (20 items)');return}lists[k].push(v);input.value='';changed(k);input.focus()};
 $(k+'-add-btn').addEventListener('click',add);$(k+'-input').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();add()}});
 $(k+'-clear').addEventListener('click',()=>{if(!busy&&lists[k].length&&confirm('Clear this list?')){lists[k]=[];changed(k)}});
 $(k+'-copy').addEventListener('click',async()=>{if(!lists[k].length)return;try{await navigator.clipboard.writeText(lists[k].map((v,i)=>k==='ranker'?`${i+1}. ${v}`:v).join('\n'));status(k,'List copied')}catch{status(k,'Copy unavailable in this browser')}});
 changed(k);
}
$('main-btn').addEventListener('click',async()=>{
 if(busy||(lists[mode]&&lists[mode].length<2))return;
 const k=mode;busy=true;controls();$(k+'-status').classList.add('loading');
 try{
 if(k==='coin'){
  const heads=random(2)===0;status(k,'Flipping…');coinRot+=1800+(heads?0:180)-(coinRot%360);$('coin').style.transform=`rotateX(${coinRot}deg)`;await delay();status(k,heads?'Heads':'Tails');record(k,heads?'H':'T');
 }else if(k==='dice'){
  const n=random(6)+1;status(k,'Rolling…');const [x,y]=({1:[0,0],2:[0,180],3:[0,-90],4:[0,90],5:[-90,0],6:[90,0]})[n];rolls+=4;$('cube').style.transform=`rotateX(${rolls*360+x}deg) rotateY(${rolls*360+y}deg)`;await delay();status(k,'You rolled '+n);record(k,String(n));
 }else if(k==='picker'){
  render(k);controls();status(k,'Choosing…');const rows=[...$('options-list').children],winner=random(lists[k].length);let ticker;
  if(!reduced)ticker=setInterval(()=>{rows.forEach(r=>r.classList.remove('highlight'));rows[random(rows.length)].classList.add('highlight')},90);
  await delay();clearInterval(ticker);rows.forEach(r=>r.classList.remove('highlight'));rows[winner].classList.add('winner');rows[winner].scrollIntoView({block:'nearest',behavior:reduced?'instant':'smooth'});status(k,lists[k][winner]);
 }else{
  status(k,'Shuffling…');await delay();for(let i=lists[k].length-1;i>0;i--){const j=random(i+1);[lists[k][i],lists[k][j]]=[lists[k][j],lists[k][i]]}save(k,lists[k]);render(k);status(k,'Your new order is ready');
 }
 }finally{busy=false;$(k+'-status').classList.remove('loading');controls()}
});
// Keep animation and result timing in sync.
document.querySelectorAll('.coin,.cube').forEach(el=>el.style.transitionDuration=reduced?'0s':'.95s');
recent('coin');recent('dice');controls();
let installPrompt;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;try{if(sessionStorage.getItem('arbtr_install_dismissed'))return}catch{}$('install-modal').style.display='block'});
$('install-dismiss').addEventListener('click',()=>{$('install-modal').style.display='none';try{sessionStorage.setItem('arbtr_install_dismissed','1')}catch{}});
$('install-accept').addEventListener('click',async()=>{if(installPrompt){await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null}$('install-modal').style.display='none'});
window.addEventListener('appinstalled',()=>{$('install-modal').style.display='none';installPrompt=null});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
