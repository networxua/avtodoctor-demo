/* Автодоктор — бот-помічник (ДЕМО).
   Повністю на фронтенді: власний простий розпізнавач намірів (ключові основи слів, UA/RU/суржик)
   по базі знань, зібраній ТІЛЬКИ з контенту цієї сторінки. Жодного зовнішнього AI/API, жодних ключів.
   Дані з форми запису нікуди не надсилаються.
   PRODUCTION: matchIntent()/reply() замінюємо на справжній AI через бекенд сайту (з цією ж базою знань
   як контекстом), а submitLead() шле заявку на бекенд (напр. POST /api/appointments) → менеджеру в Telegram і в CRM. */
(function(){
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const TEL='+380676501800', TEL_H='067 650-18-00', HOURS='Пн–Пт 8:00–17:00, Сб 8:00–13:00';
const MAP='https://www.google.com/maps/search/?api=1&query=%D0%90%D0%B2%D1%82%D0%BE%D0%B4%D0%BE%D0%BA%D1%82%D0%BE%D1%80+%D0%9E%D0%B4%D0%B5%D1%81%D0%B0+%D0%96%D0%B8%D1%82%D0%BE%D0%BC%D0%B8%D1%80%D1%81%D1%8C%D0%BA%D0%B0+46';
const SITE='https://avtodoctor.com.ua/ua/';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'\u00A0');

/* ---------- normalisation: UA / RU / surzhyk → one alphabet ---------- */
const norm=s=>' '+String(s).toLowerCase().replace(/[’'`ʼ"«»]/g,'').replace(/ё/g,'е').replace(/[ыіїи]/g,'и').replace(/[эє]/g,'е').replace(/ъ/g,'').replace(/ґ/g,'г')
  .replace(/[^a-zа-я0-9]+/g,' ').replace(/\s+/g,' ').trim()+' ';
// stem matches at a word start
const has=(t,stems)=>stems.reduce((n,st)=>n+(t.includes(' '+st)?1:0),0);

/* ---------- knowledge base (only facts already on the demo page) ---------- */
const SYM={
  knock:{label:'Стук при повороті', echo:'стук',
    text:'Найчастіше так дають про себе знати зношені опорні втулки рейки або зубчаста пара штока. Іноді стукають кермові тяги чи наконечники — це точно видно на діагностиці.',
    lvl:2, urg:'Їздити можна, але не відкладайте: знос наростає, і ремонт з часом дорожчає.', price:'ремонт рейки — від 1 500 грн'},
  play:{label:'Люфт керма', echo:'люфт',
    text:'Люфт зазвичай означає знос зубчастої пари штока й опорних втулок або кермових тяг. Машина гірше тримає траєкторію, кермо «гуляє» біля центру.',
    lvl:3, urg:'Люфт впливає на керованість — краще перевірити найближчими днями.', price:'ремонт рейки — від 1 500 грн'},
  leak:{label:'Тече рідина ГПК', echo:'підтікання',
    text:'Рідина гідропідсилювача найчастіше тече через зношені сальники рейки або розірваний пильовик. Буває, що підтікають шланги.',
    lvl:3, urg:'Без рідини насос працює «на сухо» й може вийти з ладу — тоді ремонт стане дорожчим.', price:'гідравлічна рейка — від 3 400 грн'},
  heavy:{label:'Важко крутити кермо', echo:'туге кермо',
    text:'Туге кермо — це зазвичай знос розподільника рейки, несправний насос ГПК або низький рівень рідини. На авто з електропідсилювачем часто винен датчик обертового моменту чи блок керування ЕПК.',
    lvl:3, urg:'Кермо може «закусити» в найменш зручний момент. Не відкладайте.', price:'гідравлічна рейка — від 3 400 грн'},
  noise:{label:'Гул чи шум', echo:'гул',
    text:'Гул або виття при повороті керма найчастіше йде від насоса гідропідсилювача: зношуються ротор, статор або пластини насоса.',
    lvl:2, urg:'Їздити можна, але не тягніть: зношений насос з часом робить кермо тугим.', price:'ремонт насоса ГПК — від 1 500 грн'},
  vibro:{label:'Вібрація, биття керма', echo:'биття керма',
    text:'Биття й стук у кермі на нерівностях часто дають зношені опорні втулки та зубчаста пара штока рейки. Але вібрацію може давати й ходова — тому краще подивитися наживо.',
    lvl:2, urg:'Їздити можна, але з діагностикою не зволікайте.', price:'ремонт рейки — від 1 500 грн'},
  pull:{label:'Веде в бік', echo:'машину веде',
    text:'Коли машину веде в бік, зазвичай порушені кути коліс або є люфт у кермових тягах. Перевіряємо тяги й робимо розвал-сходження — на місці.',
    lvl:2, urg:'Їздити можна, але шини зношуються швидше, а машина гірше тримає дорогу.', price:'розвал-сходження — ціну уточнюйте'},
  eps:{label:'Помилка ЕПК', echo:'помилка підсилювача',
    text:'Помилка підсилювача або кермо, що «клинить», на авто з електропідсилювачем часто означає несправність датчика обертового моменту чи блоку керування ЕПК. Починаємо з комп’ютерної діагностики.',
    lvl:3, urg:'Підсилювач може відключитися на ходу — краще перевірити якнайшвидше.', price:'комп’ютерна діагностика — 250 грн'}
};
const LVL=['','низька','середня','висока'];
// intent → normalised stems (+weight). Symptoms weigh more than info so «гуде насос» = noise, not services.
const INTENTS=[
  ['knock',3,['стук','стуч','клац','цока','цокот','грюк','грюка','грох','брязк','бряц','тук']],
  ['play',3,['люфт','болта','бовта','гуля','вильни хид','вильнии хид','свободни ход','свободныи ход','разбит','розбит']],
  ['leak',3,['тече','течет','теч','подтек','пидтик','пидтек','капа','кап','масл','ридин','жидк','лужа','потик','потек','мокр','сочит','сочи']],
  ['heavy',3,['важк','тяжел','тяжк','туг','не крут','не повертаеть','закус','заед','тугое','тугии']],
  ['noise',3,['гуд','гул','шум','вие','вое','вою','виют','свист','скрип','хрус','хрум','рыч','рич','завыва']],
  ['vibro',3,['вибр','тряс','трус','дриж','дрож','битт','бьет','бье','биен','бьеть','бе ']],
  ['pull',3,['веде','ведет','тягне','тяне','тянет','увод','тягн','кидае','кидает','рыска','ниска']],
  ['eps',3,['помилк','ошибк','чек ','лампоч','лампа','значок','епк','еур','епс','електроп','электроп','клин','check']],
  ['time',2.5,['термин','срок','довго','долго','скильки час','сколько врем','скильки днив','сколько дне','за день','за скильки','за сколько','коли буде','когда буд','коли готов','когда готов','швидко','быстро','як швидко','як скоро','как скоро']],
  ['price',2,['скильки','сколько','цин','цен','вартист','стоимост','кошту','кошт','стоит','грн','гривн','дорог','дешев','прайс','почем','по чем','бюджет','оплат']],
  ['warranty',2.5,['гарант']],
  ['address',2.5,['де ви','де вы','где вы','где наход','де знаход','адрес','знаход','наход','як доих','як доб','как доех','как добр','проих','проех','карт','локац','вулиц','улиц','куди','куда','одес','мисц','мест']],
  ['hours',2.5,['график','годин робот','часы работ','час работ','режим','коли працю','когда работ','працюете','работаете','субот','недил','воскрес','вихидн','выходн','видкрит','открыт','зачин','закрыв','до котор','до якои','сьогодни','сегодня','завтра']],
  ['contacts',2,['телефон','номер','зателеф','подзвон','позвон','дзвон','звон','вайбер','viber','телеграм','telegram','електронн','электрон','email','мейл','gmail','контакт','написат']],
  ['diag',2.5,['диагност','перевир','провер','огляд','осмотр','стенд','подивит','посмотр']],
  ['services',2,['послуг','услуг','що ремонт','что ремонт','ремонтуе','ремонтируе','займает','занимает','що робите','что делает','яку робот','какую работ','яки робот','какие работ','чим займает','чем занима','насос','колонк','розвал','развал','сходж','електрорейк','гидравл','механич']],
  ['process',2,['як ремонт','как ремонт','процес','етап','этап','технолог','як видновл','как восстан','що всередин','что внутри','розбира','разбира']],
  ['store',2,['купит','купу','купл','нова','нову','новую','новая','нови','новы','видновлен','восстановлен','магазин','склад','наявн','налич','доставк','нова пошт','новая почт','замов','заказ','обмин','обмен','б у','бу ']],
  ['removal',2.5,['знятт','знят','снят','сняти','встановл','установ','демонтаж','монтаж']],
  ['book',3,['запис','запиш','приих','приед','заих','заед','хочу на ремонт','хочу ремонт','коли можна','когда можно','передзвон','перезвон','перетелеф','бронь','забронир']],
  ['human',2.5,['майстр','мастер','людин','человек','оператор','менеджер','живии','живой','консультац']],
  ['partners',2.5,['партнер','опт ','оптом','для сто','мы сто','ми сто']],
  ['brands',2,['марк','бренд','яки авто','какие авто','какие маш','яки машин','з якими','с какими','мое авто','моя маш','моя авт','у мене','у меня','маю ','имею']],
  ['hello',1,['привит','привет','добр','здрав','витаю','хай','hello','hi ','хеллоу','салют']],
  ['thanks',1.5,['дяку','спасиб','спс','thank','мерси','пасиб']],
  ['bye',1.5,['бувай','пока','до побач','до свидан','до зустр','всего добр']],
  ['yes',1,['так ','да ','ок ','окей','ok ','добре','хорошо','давай','хочу','звисно','конечно','згоден','согласен','ага ']],
  ['no',1,['ни ','нет ','не треба','не надо','не хочу','пизнише','позже']],
  ['steer',1,['керм','руль','рул','рейк','рейц','кермов','рульов','проблем','щось','что то','чтото','неспр','несправ','поломк','полом','зламал','сломал']]
];
// brand aliases (normalised); merged with names from the page's price list (window.BRANDS)
const ALIAS={acura:['акур'],'alfa romeo':['альфа'],audi:['ауди','ауд'],bmw:['бмв','бэха','беха','бэмв'],chery:['чери'],chevrolet:['шевр'],chrysler:['крайсл'],citroen:['ситро','ситре'],dacia:['дачи'],daewoo:['деу','дэу','ланос','сенс','нексия','нексия','матиз'],daihatsu:['дайхат'],fiat:['фиат'],ford:['форд'],geely:['джил'],'great wall':['грейт','грет вол'],honda:['хонд'],hyundai:['хюнд','хенд','хунд','хьюнд','хендэ'],infiniti:['инфин'],isuzu:['исуз'],iveco:['ивек'],jaguar:['ягуар'],jeep:['джип'],kia:['киа','кия','kia '],lancia:['ланч','лянч'],'land rover':['ленд','лэнд','рендж','range','ленд ровер','ленд ровер'],lexus:['лексус'],mazda:['мазд'],'mercedes-benz':['мерс','мерседес','mercedes','бенц'],mini:['мини ','mini '],mitsubishi:['мицуб','митсуб','мицубиси'],nissan:['нисан','ниссан'],opel:['опел'],peugeot:['пежо','пежу'],porsche:['порш'],renault:['рено'],rover:['ровер'],seat:['сеат','сиат'],skoda:['шкод'],ssangyong:['ссанг','санг','саньенг','санг енг'],subaru:['субар'],suzuki:['сузук'],toyota:['тоиот','тойот','таиот','тайот'],volkswagen:['фольк','фольц','vw','volks','фолькс','пасат','гольф','поло '],volvo:['вольв']};
const B=(window.BRANDS||[]).map(b=>{ const key=b.n.toLowerCase().replace('ë','e').replace('citroën','citroen');
  const al=[norm(b.n).trim(),norm(b.s.replace(/-/g,' ')).trim(),...(ALIAS[key]||ALIAS[norm(b.n).trim()]||[])];
  return {...b, al:[...new Set(al)], mk:b.m.map(m=>[m, norm(m[0]).replace(/\s/g,'')])}; });
const TR={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ь:'',ю:'yu',я:'ya'};
const tr=t=>t.replace(/[а-я]/g,c=>TR[c]??c).replace(/ikh/g,'ix').replace(/ h(\d)/g,' x$1');
function findCar(t,prevBrand){
  let brand=null,bl=0; B.forEach(b=>b.al.forEach(a=>{ if(t.includes(' '+a)&&a.length>bl){brand=b;bl=a.length;} }));
  const tl=tr(t), flat=tl.replace(/\s/g,''); let model=null, ml=0;
  const scope=brand?[brand]:(prevBrand?[prevBrand]:[]);
  scope.forEach(b=>b.mk.forEach(([m,k])=>{ if(k.length>=2&&k.length>ml){ const i=tl.indexOf(' '+norm(m[0]).trim()+' '); if(i>=0||(k.length>=3&&flat.includes(k))){model=m;ml=k.length;if(!brand)brand=b;} } }));
  return {brand,model};
}

/* ---------- markup ---------- */
const ICON='<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="3.2"/><path d="M12.8 16H5.4M19.2 16h7.4M16 19.2V27"/></svg>';
const fab=document.createElement('button');
fab.className='bot-fab'; fab.type='button'; fab.setAttribute('aria-label','Відкрити бот-помічник'); fab.setAttribute('aria-expanded','false');
fab.innerHTML=`${ICON}<span class="bot-fab__t">Запитати бота</span><i class="bot-fab__badge">1</i>`;
const tip=document.createElement('div'); tip.className='bot-tip'; tip.hidden=true;
tip.innerHTML=`<button type="button" class="bot-tip__x" aria-label="Закрити підказку">×</button><b>Стукає чи тече?</b><span>Напишіть, що з кермом, — підкажу, що це може бути.</span>`;
const panel=document.createElement('section');
panel.className='bot'; panel.setAttribute('role','dialog'); panel.setAttribute('aria-label','Бот-помічник Автодоктор'); panel.hidden=true;
panel.innerHTML=`
 <header class="bot__hdr">
   <span class="bot__ava" aria-hidden="true">${ICON}</span>
   <div class="bot__who"><b>Бот-помічник</b><span class="mono">Автодоктор · демо, без AI</span></div>
   <button type="button" class="bot__restart mono" aria-label="Почати спочатку">↺</button>
   <button type="button" class="bot__x" aria-label="Закрити">×</button>
 </header>
 <div class="bot__log" data-lenis-prevent aria-live="polite"></div>
 <div class="bot__opts"></div>
 <form class="bot__in" autocomplete="off">
   <input type="text" class="bot__field" aria-label="Ваше повідомлення" placeholder="Напишіть питання або симптом…" enterkeyhint="send">
   <button type="submit" class="bot__send" aria-label="Надіслати">→</button>
 </form>`;
document.body.append(fab,tip,panel);
const log=panel.querySelector('.bot__log'), opts=panel.querySelector('.bot__opts'), form=panel.querySelector('.bot__in'), field=panel.querySelector('.bot__field');
const PH='Напишіть питання або симптом…';

/* ---------- chat primitives (one serial queue so replies never interleave) ---------- */
let token=0, q=Promise.resolve();
const wait=ms=>new Promise(r=>setTimeout(r,RM?Math.min(ms,60):ms));
const scroll=()=>{ log.scrollTop=log.scrollHeight; };
function bubble(html,who='bot',cls=''){ const m=document.createElement('div'); m.className=`msg msg--${who} ${cls}`; m.innerHTML=html; log.appendChild(m); requestAnimationFrame(()=>{m.classList.add('in');scroll();}); return m; }
function say(html,cls){ const t=token; q=q.then(async()=>{ if(t!==token) return; const ty=bubble('<i></i><i></i><i></i>','bot','msg--typing');
  await wait(Math.min(1300,450+String(html).replace(/<[^>]+>/g,'').length*7)); ty.remove(); if(t!==token) return; bubble(html,'bot',cls); }); return q; }
// chips: [label, action?]. No action → label is sent as if typed.
function chips(list){ const t=token; q=q.then(()=>{ if(t!==token) return; opts.innerHTML='';
  list.forEach(([label,act])=>{ const tel=act==='tel'; const b=document.createElement(tel?'a':'button'); b.className='opt'+(act==='book'?' opt--main':'')+(tel?' opt--tel':''); b.textContent=label;
    if(tel) b.href='tel:'+TEL; else b.type='button';
    b.addEventListener('click',()=>{ if(tel){ bubble(esc(label),'me'); return; } user(label,act); }); opts.appendChild(b); }); scroll(); }); }
const SYMCHIPS=[['Стукає при повороті'],['Люфт керма'],['Тече рідина ГПК'],['Важко крутити кермо'],['Інше','other']];

/* ---------- state ---------- */
let S;
const reset=()=>{ S={mode:'chat',turn:0,lastOffer:-9,fails:0,sym:null,brand:null,model:null,awaitCar:false,lastQ:'',lead:{}}; };
reset();
const offerBook=(force)=>{ if(!force&&S.turn-S.lastOffer<2) return false; S.lastOffer=S.turn; return true; };

/* ---------- intent matcher ---------- */
function matchIntent(t){
  t=t.replace(/ нов\S* (пошт|почт)\S*/g,' доставка ');
  const sc={}; INTENTS.forEach(([id,w,st])=>{ const n=has(t,st); if(n) sc[id]=(sc[id]||0)+w*Math.min(n,2); });
  // tie-breaks
  if(sc.time&&sc.price&&!/ (цин|цен|грн|кошт|вартист|стоимост|стоит)/.test(t)) delete sc.price;
  if(sc.book&&sc.price) sc.price+=1; // «скільки коштує запис» → price first, booking offered after
  const short=t.trim().split(' ').length<=2;
  if(!short){ delete sc.yes; delete sc.no; }
  const ranked=Object.entries(sc).sort((a,b)=>b[1]-a[1]);
  const real=ranked.filter(([id])=>!['hello','steer','yes','no','thanks'].includes(id));
  return {top:(real[0]||ranked[0]||[null])[0], sc};
}
const vowels=s=>(s.match(/[аеиоуяюaeiouy]/g)||[]).length;

/* ---------- replies ---------- */
async function replySymptom(id,t){
  const s=SYM[id]; S.sym=s.label;
  const side=/ (справ|праворуч|прав)/.test(t)?'справа':/ (злив|ливоруч|слев|лив )/.test(t)?'зліва':'';
  const turning=/ (поверт|поворач|поворот|кручу|кручу|разворот|розворот|паркув|парков)/.test(t);
  const bumps=/ (ям|нерив|неров|кочк|лежач|бруск|брусчат)/.test(t);
  const where=[side,turning?'при повороті':'',bumps?'на нерівностях':''].filter(Boolean).join(' ');
  await say((where?`Зрозумів: ${s.echo} ${where}. `:'')+`<span class="msg__k mono">Що це може означати</span>${s.text}`);
  if(side) await say(`Те, що звук ${side}, — корисна підказка майстру: так швидше видно, чи це втулка рейки, чи тяга з того боку.`);
  await say(`<span class="urg urg--${s.lvl}"><i></i><i></i><i></i></span><span class="msg__k mono">Терміновість: ${LVL[s.lvl]}</span>${s.urg}<span class="msg__s">За прайсом: ${s.price}. Точну вартість майстер назве після діагностики.</span>`,'msg--urg');
  if(offerBook()) await say('Якщо зручно, можу записати на діагностику — це 30 секунд. Або питайте далі.');
  chips([['Записатися на діагностику','book'],['Скільки триває ремонт?'],['Інший симптом','symptoms']]);
}
const carPrice=(b,m)=>m[1].length>1?`у прайсі ${m[1].map(fmt).join(' / ')} грн — залежить від модифікації й типу рейки`:`ремонт знятої рейки за прайсом від ${fmt(m[1][0])} грн`;
async function replyCar(brand,model,intent){
  S.brand=brand; S.model=model||null; S.awaitCar=false;
  const link=`<a class="msg__a" href="${SITE}steering-racks-repair/${brand.s}/" target="_blank" rel="noopener">Прайс ${esc(brand.n)} на сайті ↗</a>`;
  if(model){ await say(`<b>${esc(brand.n)} ${esc(model[0])}</b>: ${carPrice(brand,model)}. Точну ціну назве майстер після діагностики.${link}`);
    if(offerBook()) await say('Записати вас на діагностику?');
    chips([['Записатися на діагностику','book'],['Скільки триває ремонт?'],['Що входить у діагностику?']]); return; }
  if(!brand.m.length){ await say(`${esc(brand.n)} ремонтуємо. Онлайн-прайсу по моделях немає — ціну назвемо по телефону після уточнення модифікації.`); chips([['Зателефонувати','tel'],['Записатися на діагностику','book']]); return; }
  const min=Math.min(...brand.m.flatMap(m=>m[1]));
  await say(`${esc(brand.n)} ремонтуємо: у прайсі ${brand.m.length} ${brand.m.length<5?'моделі':'моделей'}, ремонт рейки від ${fmt(min)} грн. Яка у вас модель?`);
  S.awaitCar=true; chips(brand.m.slice(0,3).map(m=>[`${brand.n} ${m[0]}`]).concat([['Інша модель','othermodel']]));
}
const KB={
  price:async()=>{ await say('За прайсом сайту: ремонт кермової рейки — від 1 500 грн, гідравлічної — від 3 400 грн, насоса ГПК — від 1 500 грн. Зняття і встановлення рейки — від 1 400 грн, комп’ютерна діагностика — 250 грн.');
    await say('Точну вартість майстер називає після діагностики. Напишіть марку й модель — підкажу ціну з прайсу.'); S.awaitCar=true;
    chips([['Записатися на діагностику','book'],['Скільки коштує нова рейка?'],['Скільки триває ремонт?']]); },
  time:async()=>{ await say('Ремонт рейки — за один робочий день. Для СТО-партнерів — 1–2 дні. Комплектуючі вже на складі, тож чекати запчастини не доводиться.');
    if(offerBook()) await say('Можу записати на зручний день — майстер передзвонить і узгодить час.');
    chips([['Записатися на діагностику','book'],['Графік роботи'],['Гарантія']]); },
  warranty:async()=>{ await say('Гарантія на ремонт — 1 рік або 30 000 км. Несемо й післягарантійні зобов’язання. Кожен агрегат маркуємо й заносимо в журнал.'); chips([['Як ви ремонтуєте?'],['Скільки коштує?'],['Де ви знаходитесь?']]); },
  address:async()=>{ await say(`Ми в Одесі, вул. Житомирська, 46 — власна будівля з 2011 року.<a class="msg__a" href="${MAP}" target="_blank" rel="noopener">Відкрити на карті ↗</a><span class="msg__s mono">${HOURS}, неділя — вихідний</span>`); chips([['Зателефонувати','tel'],['Записатися на діагностику','book'],['Скільки коштує?']]); },
  hours:async()=>{ await say(`Графік: ${HOURS}. Неділя — вихідний.`); chips([['Де ви знаходитесь?'],['Зателефонувати','tel'],['Записатися на діагностику','book']]); },
  contacts:async()=>{ await say(`Телефони:<a class="msg__tel" href="tel:${TEL}">${TEL_H}</a><span class="msg__s"><a href="tel:+380503083486">050 308-34-86</a> · <a href="tel:+380487080162">048 708-01-62</a></span><span class="msg__s">Пишіть у <a href="viber://chat?number=380676501800">Viber</a> чи <a href="https://t.me/stoavtodoctor" target="_blank" rel="noopener">Telegram</a>, пошта avtodoctor0011@gmail.com</span>`); chips([['Графік роботи'],['Де ви знаходитесь?'],['Передзвоніть мені','book']]); },
  diag:async()=>{ await say('Майстер оглядає кермове керування на авто, називає причину і точну вартість. Для авто з електропідсилювачем є комп’ютерна діагностика — 250 грн. А після ремонту кожну рейку перевіряємо на стенді: герметичність і прохідність розподільника.');
    if(offerBook()) await say('Записати вас на діагностику?'); chips([['Записатися на діагностику','book'],['Скільки коштує?'],['Графік роботи']]); },
  services:async()=>{ await say('Ремонтуємо кермові рейки — електричні, гідравлічні й механічні, насоси ГПК і кермові колонки з електропідсилювачем. На місці — зняття-встановлення і розвал-сходження. Є магазин відновлених агрегатів і запчастин з доставкою Новою Поштою.'); chips([['Як ви ремонтуєте?'],['Скільки коштує?'],['З якими марками працюєте?']]); },
  process:async()=>{ await say('Розбираємо агрегат до кожної деталі, піскоструїмо й знежирюємо, поліруємо або шліфуємо шток і черв’ячний вал, виготовляємо нові опорні втулки на власних верстатах, міняємо сальники, пильовики й підшипники. Потім — перевірка на стенді і запис у журнал.'); chips([['Гарантія'],['Скільки триває ремонт?'],['Скільки коштує?']]); },
  store:async()=>{ await say('Нова рейка — від 14 000 грн (для комерційного транспорту — від 40 000 грн), тому відновлення виходить у рази дешевше. Якщо вашу рейку неможливо відновити, запропонуємо відновлену зі складу — там понад 150 агрегатів. Відправляємо Новою Поштою по всій Україні.'+`<a class="msg__a" href="${SITE}shop/" target="_blank" rel="noopener">Каталог магазину ↗</a>`); chips([['Скільки коштує ремонт?'],['Гарантія'],['Зателефонувати','tel']]); },
  removal:async()=>{ await say('Зняття і встановлення рейки — від 1 400 грн. Розвал-сходження після ремонту робимо на місці.'); chips([['Скільки коштує ремонт?'],['Скільки триває ремонт?'],['Записатися на діагностику','book']]); },
  human:async()=>{ await say(`Можу передати ваше питання майстру — він передзвонить. Або телефонуйте одразу:<a class="msg__tel" href="tel:${TEL}">${TEL_H}</a><span class="msg__s mono">${HOURS}</span>`); chips([['Передати питання майстру','ask'],['Зателефонувати','tel']]); },
  partners:async()=>{ await say(`Для СТО-партнерів: ремонт за 1–2 дні та статус замовлень онлайн.<a class="msg__a" href="${SITE}partners/" target="_blank" rel="noopener">Сторінка для партнерів ↗</a>`); chips([['Зателефонувати','tel'],['Де ви знаходитесь?']]); },
  brands:async()=>{ await say(`В онлайн-прайсі ${B.length} марки — від Acura до Volvo. У роботах є й Nissan Skyline R32, Tesla Model S, Porsche Cayenne. Напишіть свою марку й модель — підкажу ціну з прайсу.`); S.awaitCar=true; chips([['BMW X5'],['Toyota RAV 4'],['Volkswagen Passat']]); },
  hello:async()=>{ await say('Вітаю! Опишіть, що відбувається з кермом, або спитайте про ціни, терміни, гарантію чи адресу.'); chips(SYMCHIPS); },
  thanks:async()=>{ await say('Будь ласка! Якщо ще щось — пишіть.'); chips([['Скільки коштує?'],['Де ви знаходитесь?']]); },
  bye:async()=>{ await say('Гарного дня і легкого керма! Якщо що — ми тут.'); chips([]); },
  steer:async()=>{ await say('Розкажіть трохи більше: що саме відчуваєте — стук, люфт, кермо важко крутити, щось тече чи гуде?'); chips(SYMCHIPS.slice(0,4)); },
  no:async()=>{ await say('Добре. Якщо з’являться питання — пишіть.'); chips([['Скільки коштує?'],['Де ви знаходитесь?']]); }
};
async function fallback(t){
  S.fails++; S.lastQ=S.lastQ||'';
  if(S.fails>1) await say(`Схоже, тут потрібна людина. Передам ваше питання майстру — він передзвонить. Або телефонуйте: <a href="tel:${TEL}">${TEL_H}</a>.`);
  else await say('Вибачте, не зовсім зрозумів. Я знаю про симптоми кермового керування, ціни, терміни, гарантію й адресу. Можу передати ваше питання майстру — він передзвонить.');
  chips([['Передати питання майстру','ask'],['Зателефонувати','tel'],['Симптоми','symptoms']]);
}

/* ---------- router ---------- */
function user(text,act){
  bubble(esc(text),'me'); opts.innerHTML=''; S.turn++;
  if(act) return action(act);
  if(S.mode!=='chat') return bookStep(text);
  const t=norm(text);
  const {top}=matchIntent(t);
  const car=findCar(t,S.awaitCar?S.brand:null);
  if(top&&top!=='steer'&&top!=='no') S.fails=0;
  if(top==='yes'&&S.turn-S.lastOffer<=2) return action('book');
  if(top==='book') return action('book');
  if(SYM[top]) return replySymptom(top,t).then(()=>{ if(car.brand){ S.brand=car.brand; S.model=car.model; } });
  if(car.brand&&(!top||['price','brands','yes','steer','hello'].includes(top)||S.awaitCar)) return replyCar(car.brand,car.model,top);
  if(top==='human') S.lastQ=text;
  if(top&&KB[top]) return KB[top]();
  if(top==='yes') return say('Добре! Що саме цікавить?').then(()=>chips([['Скільки коштує?'],['Записатися на діагностику','book'],['Симптоми','symptoms']]));
  if(/ (tesl|тесл)/.test(t)) return say('Tesla немає в онлайн-прайсі, але рейку Tesla Model S ми вже ремонтували — є в портфоліо. Ціну назве майстер після уточнення модифікації.').then(()=>chips([['Записатися на діагностику','book'],['Зателефонувати','tel']]));
  S.lastQ=text;
  return fallback(t);
}
async function action(a){
  if(a==='ok'||a==='edit') return action2(a);
  if(a==='cancel') return cancelBook();
  if(a==='book') return book();
  if(a==='ask'){ S.lead.question=S.lastQ||'питання з чату'; return book(true); }
  if(a==='symptoms'){ await say('Оберіть симптом або опишіть своїми словами:'); return chips(SYMCHIPS); }
  if(a==='other'){ await say('Опишіть своїми словами, що відбувається з кермом — кількох слів достатньо.'); field.focus({preventScroll:true}); return chips([]); }
  if(a==='othermodel'){ await say('Напишіть модель — пошукаю в прайсі.'); S.awaitCar=true; field.focus({preventScroll:true}); return chips([]); }
}

/* ---------- booking (soft: only when the user picks it) ---------- */
const CANCEL=[' скасу',' отмен',' видмин',' стоп',' не треба',' не надо',' передумав'];
async function book(isQuestion){
  S.mode='name'; S.lead.symptom=S.sym||''; if(S.brand) S.lead.car=S.brand.n+(S.model?' '+S.model[0]:'');
  await say(isQuestion?'Добре, передам питання майстру. Як до вас звертатися?':'Запишу на діагностику — три короткі питання. Як до вас звертатися?');
  field.placeholder='Ваше ім’я'; field.type='text'; field.autocomplete='given-name'; chips([['Скасувати','cancel']]);
}
async function bookStep(v){
  const t=norm(v);
  if(CANCEL.some(c=>t.includes(c))) return cancelBook();
  if(S.mode==='name'){ if(v.trim().length<2) return err('Напишіть, будь ласка, ім’я.'); S.lead.name=v.trim(); S.mode='phone';
    await say(`Приємно, ${esc(S.lead.name)}. Ваш номер телефону?`); field.placeholder='067 123 45 67'; field.type='tel'; field.inputMode='tel'; field.autocomplete='tel'; return chips([['Скасувати','cancel']]); }
  if(S.mode==='phone'){ const d=v.replace(/\D/g,''); if(d.length<10||d.length>12) return err('Схоже, у номері не вистачає цифр. Приклад: 067 123 45 67');
    S.lead.phone=v.trim(); field.type='text'; field.inputMode='text'; field.autocomplete='off';
    if(S.lead.car||S.lead.question){ return summary(); }
    S.mode='car'; await say('Яке авто? Марка, модель і рік — як зручно.'); field.placeholder='Напр.: Skoda Octavia 2014'; return chips([['Скасувати','cancel']]); }
  if(S.mode==='car'){ if(v.trim().length<2) return err('Напишіть марку авто, будь ласка.'); S.lead.car=v.trim(); return summary(); }
  if(S.mode==='confirm'){ const y=matchIntent(t).sc; if(y.yes) return action2('ok'); if(y.no) return action2('edit'); { await say('Підтвердіть, будь ласка, кнопкою нижче.'); return chips([['Підтвердити запис','ok'],['Змінити дані','edit']]); } }
}
async function err(m){ await say(m); return chips([['Скасувати','cancel']]); }
async function summary(){
  S.mode='confirm'; field.placeholder=PH; const L=S.lead;
  await say(`<span class="msg__k mono">Перевірте заявку</span><dl class="sum"><div><dt>Ім’я</dt><dd>${esc(L.name)}</dd></div><div><dt>Телефон</dt><dd>${esc(L.phone)}</dd></div>${L.car?`<div><dt>Авто</dt><dd>${esc(L.car)}</dd></div>`:''}${L.symptom?`<div><dt>Симптом</dt><dd>${esc(L.symptom)}</dd></div>`:''}${L.question?`<div><dt>Питання</dt><dd>${esc(L.question)}</dd></div>`:''}</dl>`,'msg--card');
  chips([['Підтвердити запис','ok'],['Змінити дані','edit']]);
}
async function action2(a){
  if(a==='ok'){ submitLead(S.lead); S.mode='chat'; field.placeholder=PH;
    await say(`<span class="ok" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7"/></svg></span><b>Готово, заявку прийнято!</b> Майстер передзвонить у робочий час (${HOURS}), уточнить деталі й запропонує зручний час.`,'msg--done');
    await say('<span class="msg__s">Це демо: дані нікуди не надсилаються. У робочій версії заявка одразу йде менеджеру в Telegram і в CRM.</span>','msg--note');
    S.lead={}; S.lastOffer=S.turn+99; return chips([['Де ви знаходитесь?'],['Зателефонувати','tel']]); }
  if(a==='edit'){ const keep={symptom:S.lead.symptom,question:S.lead.question}; S.lead=keep; S.mode='name'; field.placeholder='Ваше ім’я'; await say('Добре, почнемо спочатку. Як до вас звертатися?'); return chips([['Скасувати','cancel']]); }
}
async function cancelBook(){ S.mode='chat'; S.lead={}; field.placeholder=PH; field.type='text'; await say('Добре, скасував. Питайте, що цікавить.'); chips([['Скільки коштує?'],['Симптоми','symptoms']]); }
function submitLead(data){
  // DEMO: nothing is sent. Production: fetch('/api/appointments',{method:'POST',body:JSON.stringify(data)}) → Telegram-бот менеджера + CRM.
  window.__lastDemoLead=Object.assign({},data); // for automated test only
}

form.addEventListener('submit',e=>{ e.preventDefault(); const v=field.value.trim(); if(!v) return; field.value=''; user(v); });

/* ---------- start ---------- */
function start(ctx={}){
  token++; q=Promise.resolve(); log.innerHTML=''; opts.innerHTML=''; reset(); field.placeholder=PH; field.type='text';
  say('Вітаю! Я бот-помічник «Автодоктор».');
  if(ctx.book){ S.sym=ctx.book; say(`Бачу, вас цікавить: <b>${esc(ctx.book)}</b>.`); return book(); }
  say('Напишіть своїми словами, що відбувається з кермом, — підкажу, що це може бути. Або спитайте про ціни, терміни чи адресу.');
  chips(SYMCHIPS);
}

/* ---------- open / close + mobile keyboard handling ---------- */
let started=false, lastFocus=null;
const mobile=()=>matchMedia('(max-width:600px)').matches;
const vv=window.visualViewport;
function fit(){ // keep the input above the on-screen keyboard (iOS doesn't resize the layout viewport)
  if(!mobile()||panel.hidden||!vv){ panel.style.height=''; panel.style.top=''; return; }
  panel.style.top=vv.offsetTop+'px'; panel.style.height=vv.height+'px'; scroll(); }
if(vv){ vv.addEventListener('resize',fit); vv.addEventListener('scroll',fit); }
function open(ctx){
  tip.hidden=true; fab.querySelector('.bot-fab__badge').hidden=true; lastFocus=document.activeElement;
  panel.hidden=false; fab.setAttribute('aria-expanded','true'); document.documentElement.classList.add('bot-open'); fit();
  requestAnimationFrame(()=>panel.classList.add('is-on'));
  if(mobile()&&window.__lenis) window.__lenis.stop();
  if(ctx&&ctx.book){ started=true; start(ctx); } else if(!started){ started=true; start(); }
  if(matchMedia('(hover:hover)').matches) field.focus({preventScroll:true}); else panel.querySelector('.bot__x').focus({preventScroll:true});
}
function close(){
  panel.classList.remove('is-on'); fab.setAttribute('aria-expanded','false'); document.documentElement.classList.remove('bot-open');
  if(window.__lenis) window.__lenis.start(); field.blur();
  setTimeout(()=>{ if(!panel.classList.contains('is-on')) panel.hidden=true; },RM?0:320);
  if(lastFocus&&lastFocus.focus) lastFocus.focus({preventScroll:true});
}
fab.addEventListener('click',()=>panel.classList.contains('is-on')?close():open());
panel.querySelector('.bot__x').addEventListener('click',close);
panel.querySelector('.bot__restart').addEventListener('click',()=>start());
tip.addEventListener('click',e=>{ if(e.target.closest('.bot-tip__x')){ tip.hidden=true; return; } open(); });
addEventListener('keydown',e=>{ if(e.key==='Escape'&&panel.classList.contains('is-on')) close(); });
document.addEventListener('click',e=>{ const t=e.target.closest('[data-bot-open]'); if(t){ e.preventDefault(); open(); } });
if(!sessionStorage.getItem('avdTip')) setTimeout(()=>{ if(!panel.classList.contains('is-on')){ tip.hidden=false; sessionStorage.setItem('avdTip','1'); setTimeout(()=>tip.hidden=true,12000); } },9000);
window.AvdBot={open,close,_norm:norm,_match:t=>matchIntent(norm(t)),_car:t=>findCar(norm(t))};
})();
