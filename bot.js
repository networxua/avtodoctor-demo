/* Автодоктор — бот-діагност (ДЕМО).
   Повністю фронтенд-сценарій: без зовнішнього AI/API, жодні дані нікуди не надсилаються.
   PRODUCTION: у функції submitLead() заявку (ім'я, телефон, авто, симптом) відправляємо
   на бекенд сайту (напр. POST /api/appointments), звідти — менеджеру в Telegram і в CRM. */
(function(){
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const TEL='+380676501800', TEL_H='067 650-18-00', HOURS='Пн–Пт 8:00–17:00, Сб 8:00–13:00';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const SYM={
  knock:{label:'Стук при повороті',
    text:'Найчастіше так дають про себе знати зношені опорні втулки рейки або зубчаста пара штока. Іноді стукають кермові тяги чи наконечники — це точно видно на діагностиці.',
    lvl:2, urg:'Їздити можна, але не відкладайте: знос наростає, і ремонт з часом дорожчає.'},
  play:{label:'Люфт керма',
    text:'Люфт зазвичай означає знос зубчастої пари штока й опорних втулок або кермових тяг. Машина гірше тримає траєкторію, кермо «гуляє» біля центру.',
    lvl:3, urg:'Люфт впливає на керованість — краще перевірити найближчими днями.'},
  leak:{label:'Тече рідина ГПК',
    text:'Рідина гідропідсилювача найчастіше тече через зношені сальники рейки або розірваний пильовик. Буває, що підтікають шланги.',
    lvl:3, urg:'Без рідини насос працює «на сухо» й може вийти з ладу — тоді ремонт стане дорожчим.'},
  heavy:{label:'Важко крутити кермо',
    text:'Туге кермо — це зазвичай знос розподільника рейки, несправний насос ГПК або низький рівень рідини. На авто з електропідсилювачем часто винен датчик обертового моменту чи блок керування ЕПК.',
    lvl:3, urg:'Кермо може «закусити» в найменш зручний момент. Не відкладайте.'},
  other:{label:'Інше'}
};
const LVL=['','низька','середня','висока'];

/* ---------- markup ---------- */
const fab=document.createElement('button');
fab.className='bot-fab'; fab.type='button'; fab.setAttribute('aria-label','Відкрити бот-діагност'); fab.setAttribute('aria-expanded','false');
fab.innerHTML=`<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="3.2"/><path d="M12.8 16H5.4M19.2 16h7.4M16 19.2V27"/></svg><span class="bot-fab__t">Бот-діагност</span><i class="bot-fab__badge">1</i>`;
const tip=document.createElement('div'); tip.className='bot-tip'; tip.hidden=true;
tip.innerHTML=`<button type="button" class="bot-tip__x" aria-label="Закрити підказку">×</button><b>Стукає чи тече?</b><span>Підкажу, що це може бути, і запишу на діагностику.</span>`;
const panel=document.createElement('section');
panel.className='bot'; panel.setAttribute('role','dialog'); panel.setAttribute('aria-modal','false'); panel.setAttribute('aria-label','Бот-діагност Автодоктор'); panel.hidden=true;
panel.innerHTML=`
 <header class="bot__hdr">
   <span class="bot__ava" aria-hidden="true"><svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="3.2"/><path d="M12.8 16H5.4M19.2 16h7.4M16 19.2V27"/></svg></span>
   <div class="bot__who"><b>Бот-діагност</b><span class="mono">Автодоктор · демо-сценарій</span></div>
   <button type="button" class="bot__restart mono" aria-label="Почати спочатку">↺</button>
   <button type="button" class="bot__x" aria-label="Закрити">×</button>
 </header>
 <div class="bot__log" data-lenis-prevent aria-live="polite"></div>
 <div class="bot__opts"></div>
 <form class="bot__in" autocomplete="on" hidden>
   <input type="text" class="bot__field" aria-label="Ваша відповідь">
   <button type="submit" class="bot__send" aria-label="Надіслати">→</button>
 </form>`;
document.body.append(fab,tip,panel);
const log=panel.querySelector('.bot__log'), opts=panel.querySelector('.bot__opts'), form=panel.querySelector('.bot__in'), field=panel.querySelector('.bot__field');

/* ---------- chat primitives ---------- */
let token=0; // cancels pending timers on restart
const wait=ms=>new Promise(r=>setTimeout(r,RM?Math.min(ms,80):ms));
const scroll=()=>{ log.scrollTop=log.scrollHeight; };
function bubble(html,who='bot',cls=''){ const m=document.createElement('div'); m.className=`msg msg--${who} ${cls}`; m.innerHTML=html; log.appendChild(m); requestAnimationFrame(()=>{m.classList.add('in');scroll();}); return m; }
async function say(html,cls){ const t=token; const ty=bubble('<i></i><i></i><i></i>','bot','msg--typing'); await wait(Math.min(1100,380+String(html).replace(/<[^>]+>/g,'').length*9)); ty.remove(); if(t!==token) throw 0; return bubble(html,'bot',cls); }
function choose(list){ opts.innerHTML=''; form.hidden=true; return new Promise(res=>{ list.forEach(([id,txt,kind])=>{ const b=document.createElement(kind==='tel'?'a':'button');
  b.className='opt'+(kind==='main'?' opt--main':'')+(kind==='tel'?' opt--tel':''); b.textContent=txt;
  if(kind==='tel'){ b.href='tel:'+TEL; } else b.type='button';
  b.addEventListener('click',()=>{ if(kind==='tel'){ bubble(esc(txt),'me'); } else bubble(esc(txt),'me'); opts.innerHTML=''; res(id); }); opts.appendChild(b); }); scroll(); }); }
function ask({type='text',ph='',auto='',mode='text',check}){ opts.innerHTML=''; form.hidden=false; field.value=''; field.type=type; field.placeholder=ph; field.autocomplete=auto; field.inputMode=mode;
  if(matchMedia('(hover:hover)').matches||panel.classList.contains('is-typing')) field.focus({preventScroll:true});
  return new Promise(res=>{ form.onsubmit=e=>{ e.preventDefault(); const v=field.value.trim(); if(!v) return; const err=check&&check(v);
      bubble(esc(v),'me'); if(err){ field.value=''; say(err).catch(()=>{}); return; } form.hidden=true; form.onsubmit=null; res(v); }; }); }

/* ---------- flow ---------- */
let lead={};
async function start(ctx={}){
  token++; log.innerHTML=''; opts.innerHTML=''; form.hidden=true; lead={};
  try{
    await say('Вітаю! Я бот-помічник «Автодоктор».');
    if(ctx.book){ lead.symptom=ctx.book; await say(`Бачу, вас цікавить: <b>${esc(ctx.book)}</b>. Запишу на діагностику — це три короткі питання.`); return book(); }
    await say('Підкажу, що може означати симптом, і за хвилину запишу на діагностику. <b>Що відчуваєте за кермом?</b>');
    return pickSymptom();
  }catch(e){}
}
async function pickSymptom(){
  const id=await choose(Object.entries(SYM).map(([k,v])=>[k,v.label]));
  const s=SYM[id]; lead.symptom=s.label;
  if(id==='other'){
    await say('Опишіть своїми словами, що відбувається — кількох слів достатньо.');
    const d=await ask({ph:'Напр.: скрипить при паркуванні'}); lead.symptom='Інше: '+d;
    await say('Зрозумів. Такі речі точніше видно на стенді та під час комп’ютерної діагностики. Майстер подивиться авто й назве причину.');
  } else {
    await say(`<span class="msg__k mono">Що це може означати</span>${s.text}`);
    await say(`<span class="urg urg--${s.lvl}"><i></i><i></i><i></i></span><span class="msg__k mono">Терміновість: ${LVL[s.lvl]}</span>${s.urg}`,'msg--urg');
  }
  return next();
}
async function next(){
  await say('Що робимо далі?');
  const id=await choose([['book','Записатися на діагностику','main'],['call',`Зателефонувати`,''],['again','Інший симптом','']]);
  if(id==='book') return book();
  if(id==='call') return call();
  await say('Добре, оберіть інший симптом:'); return pickSymptom();
}
async function call(){
  await say(`Телефонуйте, підкажемо одразу:<a class="msg__tel" href="tel:${TEL}">${TEL_H}</a><span class="msg__s mono">${HOURS}</span>`);
  const id=await choose([['book','Краще запишіть мене','main'],['again','Інший симптом','']]);
  return id==='book'?book():pickSymptom();
}
async function book(){
  await say('Як до вас звертатися?');
  lead.name=await ask({ph:'Ім’я',auto:'given-name',check:v=>v.length<2?'Напишіть, будь ласка, ім’я.':null});
  await say(`Приємно, ${esc(lead.name)}. Ваш номер телефону?`);
  lead.phone=await ask({type:'tel',mode:'tel',ph:'067 123 45 67',auto:'tel',check:v=>{const d=v.replace(/\D/g,'');return (d.length<10||d.length>12)?'Схоже, у номері не вистачає цифр. Приклад: 067 123 45 67':null;}});
  await say('Яке авто? Марка, модель і рік — як зручно.');
  lead.car=await ask({ph:'Напр.: Skoda Octavia 2014',check:v=>v.length<2?'Напишіть марку авто, будь ласка.':null});
  await say(`<span class="msg__k mono">Перевірте заявку</span><dl class="sum"><div><dt>Ім’я</dt><dd>${esc(lead.name)}</dd></div><div><dt>Телефон</dt><dd>${esc(lead.phone)}</dd></div><div><dt>Авто</dt><dd>${esc(lead.car)}</dd></div>${lead.symptom?`<div><dt>Симптом</dt><dd>${esc(lead.symptom)}</dd></div>`:''}</dl>`,'msg--card');
  const id=await choose([['ok','Підтвердити запис','main'],['edit','Змінити дані','']]);
  if(id==='edit') return book();
  submitLead(lead);
  await say(`<span class="ok" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7"/></svg></span><b>Готово, заявку прийнято!</b> Майстер передзвонить у робочий час (${HOURS}), уточнить деталі й запропонує зручний час.`,'msg--done');
  await say('<span class="msg__s">Це демо: дані нікуди не надсилаються. У робочій версії заявка одразу йде менеджеру в Telegram і в CRM.</span>','msg--note');
  const id2=await choose([['restart','Почати спочатку',''],['call','Зателефонувати','tel']]);
  if(id2==='restart') return start();
}
function submitLead(data){
  // DEMO: nothing is sent. Production: fetch('/api/appointments',{method:'POST',body:JSON.stringify(data)}) → Telegram-бот менеджера + CRM.
  window.__lastDemoLead=Object.assign({},data); // for automated test only
}

/* ---------- open / close ---------- */
let started=false, lastFocus=null;
const mobile=()=>matchMedia('(max-width:600px)').matches;
function open(ctx){
  tip.hidden=true; fab.querySelector('.bot-fab__badge').hidden=true; lastFocus=document.activeElement;
  panel.hidden=false; fab.setAttribute('aria-expanded','true'); document.documentElement.classList.add('bot-open');
  requestAnimationFrame(()=>panel.classList.add('is-on'));
  if(mobile()&&window.__lenis) window.__lenis.stop();
  if(ctx&&ctx.book){ started=true; start(ctx); } else if(!started){ started=true; start(); }
  panel.querySelector('.bot__x').focus({preventScroll:true});
}
function close(){
  panel.classList.remove('is-on'); fab.setAttribute('aria-expanded','false'); document.documentElement.classList.remove('bot-open');
  if(window.__lenis) window.__lenis.start();
  setTimeout(()=>{ if(!panel.classList.contains('is-on')) panel.hidden=true; },RM?0:320);
  if(lastFocus&&lastFocus.focus) lastFocus.focus({preventScroll:true});
}
fab.addEventListener('click',()=>panel.classList.contains('is-on')?close():open());
panel.querySelector('.bot__x').addEventListener('click',close);
panel.querySelector('.bot__restart').addEventListener('click',()=>start());
tip.addEventListener('click',e=>{ if(e.target.closest('.bot-tip__x')){ tip.hidden=true; return; } open(); });
addEventListener('keydown',e=>{ if(e.key==='Escape'&&panel.classList.contains('is-on')) close(); });
field.addEventListener('focus',()=>panel.classList.add('is-typing'));
document.addEventListener('click',e=>{ const t=e.target.closest('[data-bot-open]'); if(t){ e.preventDefault(); open(); } });
// teaser after a while (once per session)
if(!sessionStorage.getItem('avdTip')) setTimeout(()=>{ if(!panel.classList.contains('is-on')){ tip.hidden=false; sessionStorage.setItem('avdTip','1'); setTimeout(()=>tip.hidden=true,12000); } },9000);
window.AvdBot={open,close};
})();
