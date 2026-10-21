(function(){
const html=document.documentElement; html.classList.add('js');
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches; if(RM) html.classList.add('rm');
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const fmt=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'\u00A0');

/* ---------- data-driven blocks ---------- */
// brands picker
const B=window.BRANDS||[]; const sb=$('#selBrand'), sm=$('#selModel');
sb.innerHTML='<option value="">Оберіть марку</option>'+B.map((b,i)=>`<option value="${i}">${b.n}</option>`).join('');
const outP=$('#outPrice'), outN=$('#outNote'), outL=$('#outLink');
let cur=1500;
function showPrice(v){ if(window.gsap&&!RM){const o={v:cur};gsap.to(o,{v,duration:.7,ease:'power3.out',onUpdate:()=>outP.textContent=fmt(o.v)});} else outP.textContent=fmt(v); cur=v; }
sb.addEventListener('change',()=>{
  const b=B[sb.value];
  if(!b){sm.disabled=true;sm.innerHTML='<option>Спершу оберіть марку</option>';return;}
  outL.href=`https://avtodoctor.com.ua/ua/steering-racks-repair/${b.s}/`; outL.textContent=`Прайс ${b.n} на сайті`;
  if(!b.m.length){sm.disabled=true;sm.innerHTML='<option>Моделі уточнюйте за телефоном</option>';outN.textContent=`Для ${b.n} ціну назвемо по телефону після уточнення модифікації.`;return;}
  sm.disabled=false; sm.innerHTML='<option value="">Оберіть модель</option>'+b.m.map((m,i)=>`<option value="${i}">${m[0]}</option>`).join('');
  const min=Math.min(...b.m.flatMap(m=>m[1])); showPrice(min);
  outN.textContent=`Найнижча ціна в прайсі ${b.n}. Оберіть модель, щоб уточнити.`;
});
sm.addEventListener('change',()=>{
  const b=B[sb.value]; const m=b&&b.m[sm.value]; if(!m) return;
  showPrice(m[1][0]);
  outN.textContent = m[1].length>1 ? `${b.n} ${m[0]}: у прайсі ${m[1].map(fmt).join(' / ')} грн — залежить від модифікації й типу рейки. Точну ціну назве майстер.` : `${b.n} ${m[0]}: ремонт знятої рейки від ${fmt(m[1][0])} грн за прайсом. Точну ціну назве майстер після діагностики.`;
});
$('#priceMeta').textContent=`${B.length} марки · ${B.reduce((a,b)=>a+b.m.length,0)} моделей у прайсі сайту`;
// brands list
$('#brandsList').innerHTML=B.map(b=>`<li><a href="https://avtodoctor.com.ua/ua/steering-racks-repair/${b.s}/">${b.n}<span>${b.m.length?b.m.length+' мод.':'—'}</span></a></li>`).join('');
// works
const pick=['remont-rulevoy-reyki-nissan-skyline-r32-0','remont-rulevoy-reyki-tesla-model-s','porsche-cayenne-2007','remont-rulevoy-reyki-mercedes-g350d-0','remont-rulevoy-reyki-chevrolet-camaro-2015g-3-6l-chevrolet-c','remont-rulevoy-reyki-audi-a8-2014','remont-rulevoy-reyki-mercedes-w220-0','remont-rulevoy-reyki-land-rover-discovery-2008-0','remont-rulevoy-reyki-s-elektrousilitelem-bmw-i3-logo-763','remont-rulevoy-reyki-mercedes-cla-2014g','remont-rulevoy-reyki-vw-passat-b7-0','remont-rulevoy-reyki-toyota-rav-4-2008-0'];
const W=(window.WORK||[]); const ws=pick.map(p=>W.find(w=>w.img===p)).filter(Boolean);
$('#worksTrack').innerHTML=ws.map((w,i)=>`<a class="work" href="${w.url}" draggable="false"><div class="work__img"><img src="img/work/${w.img}.webp" alt="${w.title}" loading="lazy" draggable="false"></div><div class="work__meta"><span class="mono">${String(i+1).padStart(2,'0')} · ${w.brand} · ${w.date}</span><span class="work__t">${w.title}</span></div></a>`).join('');
// team
const T=[['britner-nadejda-avtodoctor','Надія','Відповідальна за порядок'],['Inna-finances','Інна','Відповідальна за фінанси'],['mykhailo-expeditor','Михайло','Експедитор'],['oleksandr-automechanic','Олександр','Автомеханік'],['oleksii-steering_rack_repair','Олексій','Ремонт кермових рейок'],['pavlo-steering_rack_repair','Павло','Ремонт кермових рейок'],['roman_collapse-climbing_master','Роман','Майстер розвал-сходження'],['kazimir-oleg-avtodoctor','Олег','Автомеханік'],['lesnikov-avtodoctor','Віталій','Корпоративні клієнти'],['melnikov-vitaliy-avtodoctor','Віталій','Автомеханік'],['ostrovoy-igor-avtodoctor','Ігор','Токар'],['peichev-yuriy-avtodoctor','Юрій','Майстер цеху агрегатів'],['pushkin-vladimir-avtodoctor','Володимир','Майстер цеху агрегатів'],['til-vitaliy-avtodoctor','Віталій','Токар'],['zaicev-dmitriy-avtodoctor','Дмитро','Менеджер з клієнтами']];
$('#team').innerHTML=T.map(t=>`<figure class="tm"><img src="img/team/${t[0]}.webp" alt="${t[1]}, ${t[2]}" loading="lazy"><figcaption><b>${t[1]}</b><span>${t[2]}</span></figcaption></figure>`).join('')+`<figure class="tm tm--more"><a href="https://avtodoctor.com.ua/ua/about/"><b>24</b><span>людини в команді →</span></a></figure>`;
// mobile/static steps
const stepsLi=$$('#stepsList li'), imgs=$$('#stepPhoto img');
$('#msteps').innerHTML=stepsLi.map((li,i)=>`<li><span class="mono">${String(i+1).padStart(2,'0')}</span><b>${li.querySelector('b').textContent}</b><p>${li.querySelector('span').textContent}</p><img src="${imgs[i].getAttribute('src')}" alt="${imgs[i].alt}" loading="lazy"></li>`).join('');

/* ---------- small UI ---------- */
$('#burger').addEventListener('click',()=>document.body.classList.toggle('menu-open'));
$$('#mnav a').forEach(a=>a.addEventListener('click',()=>document.body.classList.remove('menu-open')));
$('#form').addEventListener('submit',e=>{e.preventDefault();$('#formOk').hidden=false;});
const film=$('#film');
$('#playFilm').addEventListener('click',()=>{ $('#filmBox').innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/c6Yx4mOYqvg?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Автодоктор — цех"></iframe>'; film.hidden=false; });
$('#filmX').addEventListener('click',()=>{film.hidden=true;$('#filmBox').innerHTML='';});
// works drag + buttons
const tr=$('#worksTrack'); let down=false,sx=0,sl=0,moved=false;
tr.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')return;down=true;moved=false;sx=e.clientX;sl=tr.scrollLeft;tr.style.scrollSnapType='none';});
addEventListener('pointerup',()=>{if(!down)return;down=false;tr.style.scrollSnapType='';});
tr.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-sx;if(Math.abs(dx)>4)moved=true;tr.scrollLeft=sl-dx;});
tr.addEventListener('click',e=>{if(moved){e.preventDefault();moved=false;}},true);
const step=()=>tr.querySelector('.work').getBoundingClientRect().width+2;
$('#wNext').addEventListener('click',()=>tr.scrollBy({left:step(),behavior:'smooth'}));
$('#wPrev').addEventListener('click',()=>tr.scrollBy({left:-step(),behavior:'smooth'}));

/* ---------- motion ---------- */
const hdr=$('#hdr');
if(!window.gsap||!window.ScrollTrigger){ html.classList.remove('js'); hdr.classList.add('is-solid'); return; }
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.create({trigger:'.hero',start:'bottom top+=70',onEnter:()=>hdr.classList.add('is-solid'),onLeaveBack:()=>hdr.classList.remove('is-solid')});

let lenis=null;
if(!RM && window.Lenis){
  lenis=new Lenis({lerp:.11,smoothWheel:true});
  lenis.on("scroll",ScrollTrigger.update); window.__lenis=lenis;
  gsap.ticker.add(t=>lenis.raf(t*1000)); gsap.ticker.lagSmoothing(0);
}
$$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const id=a.getAttribute('href');const t=id.length>1&&$(id);if(!t)return;e.preventDefault();lenis?lenis.scrollTo(t,{offset:id==='#top'?0:-60,duration:1.4}):t.scrollIntoView();}));

const explode={'#p-tieL':{x:-82},'#p-tieR':{x:82},'#p-bootL':{x:-60},'#p-bootR':{x:60},'#p-shaft':{y:100},'#p-valve':{y:-80},'#p-mounts':{y:-50},'#p-bush':{y:55},'#p-seals':{y:55}};
const setExploded=()=>{Object.entries(explode).forEach(([k,v])=>gsap.set(k,v));gsap.set('.lbl',{opacity:1});};

if(RM){ setExploded(); $$('[data-count]').forEach(el=>el.textContent=fmt(+el.dataset.count)); return; }

// hero intro
gsap.from('.hero__title .line>span',{yPercent:110,duration:1.2,ease:'power4.out',stagger:.09,delay:.15});
gsap.from(['.hero__aside','.spec'],{opacity:0,y:24,duration:1,ease:'power3.out',delay:.6,stagger:.12});
gsap.fromTo('.hero__video',{scale:1.12},{scale:1,duration:2.2,ease:'power2.out'});
gsap.to('.hero__media',{yPercent:18,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});

// reveals
$$('[data-reveal]').forEach(el=>gsap.to(el,{opacity:1,y:0,duration:1.1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%',once:true}}));
gsap.utils.toArray('.sym__row,.brands__list li,.counts>div,.ct__info>div').forEach(el=>gsap.from(el,{opacity:0,y:18,duration:.8,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 92%',once:true}}));
// parallax
$$('[data-parallax]').forEach(img=>gsap.fromTo(img,{yPercent:-7},{yPercent:7,ease:'none',scrollTrigger:{trigger:img.parentElement,start:'top bottom',end:'bottom top',scrub:true}}));
// counters
$$('[data-count]').forEach(el=>{const v=+el.dataset.count,o={v:0};el.textContent='0';ScrollTrigger.create({trigger:el,start:'top 90%',once:true,onEnter:()=>gsap.to(o,{v,duration:1.8,ease:'power3.out',onUpdate:()=>el.textContent=fmt(o.v)})});});
// vs bars
$$('.vs__bar i').forEach(i=>gsap.fromTo(i,{'--s':0},{'--s':1,duration:1.4,ease:'power3.inOut',scrollTrigger:{trigger:i,start:'top 90%',once:true}}));

// symptom image follower (desktop hover)
if(matchMedia('(hover:hover) and (min-width:901px)').matches){
  const fl=$('#symFloat'), fi=fl.querySelector('img');
  const qx=gsap.quickTo(fl,'x',{duration:.5,ease:'power3'}), qy=gsap.quickTo(fl,'y',{duration:.5,ease:'power3'});
  $('.sym').addEventListener('mousemove',e=>{qx(e.clientX+28);qy(e.clientY-120);});
  $$('.sym__row').forEach(r=>{r.addEventListener('mouseenter',()=>{fi.src=r.dataset.img;gsap.to(fl,{opacity:1,clipPath:'inset(0 0 0% 0)',duration:.45,ease:'power3.out'});});});
  $('.sym').addEventListener('mouseleave',()=>gsap.to(fl,{opacity:0,clipPath:'inset(0 0 100% 0)',duration:.35}));
}

// ANATOMY — main moment
const mm=gsap.matchMedia();
const hot=parts=>{
  $$('#rack .part').forEach(p=>p.classList.toggle('is-hot',parts==='all'||parts.includes(p.dataset.part)));
  $$('#rack .lbl,#legend li').forEach(l=>l.classList.toggle('is-hot',parts==='all'||parts.includes(l.dataset.for)));
};
mm.add('(min-width:901px)',()=>{
  gsap.set('.lbl',{opacity:0}); gsap.set('#legend li',{opacity:.25}); gsap.set('#scanRect',{attr:{width:0}});
  let curStep=-1;
  const setStep=i=>{ if(i===curStep)return; curStep=i;
    stepsLi.forEach((li,k)=>li.classList.toggle('is-on',k===Math.max(i,0)));
    imgs.forEach((im,k)=>im.classList.toggle('is-on',k<=Math.max(i,0)));
    $('#stepNo').textContent=String(Math.max(i,0)+1).padStart(2,'0');
    if(i<0){hot([]);return;}
    const p=stepsLi[i].dataset.part; hot(p==='assembled'||p==='all'?[]:p.split(','));
  };
  setStep(-1); stepsLi[0].classList.add('is-on');
  const tl=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'.anatomy',start:'top top',end:'+=520%',pin:'.anatomy__pin',scrub:.6,anticipatePin:1,
    onUpdate:self=>{const t=self.progress*tl.duration(); setStep(t<2.1?-1:Math.min(6,Math.floor((t-2.1)/1))); }}});
  tl.to('#scanRect',{attr:{width:1040},duration:1,ease:'power1.inOut'},0)
    .addLabel('explode',1);
  Object.entries(explode).forEach(([k,v])=>tl.to(k,{...v,duration:1,ease:'power2.inOut'},1));
  tl.to('.lbl',{opacity:1,duration:.4,stagger:.06},1.5)
    .to('#legend li',{opacity:1,duration:.4,stagger:.05},1.5)
    .to({},{duration:5},2.1);
  // reassemble at step 6
  Object.keys(explode).forEach(k=>tl.to(k,{x:0,y:0,duration:.6,ease:'power2.inOut'},7.2));
  tl.to('.lbl',{opacity:0,duration:.3},7.2).to({},{duration:1.2},7.8);
  return ()=>{};
});
mm.add('(max-width:900px)',()=>{
  gsap.set('.lbl',{opacity:0}); gsap.set('#scanRect',{attr:{width:0}});
  const tl=gsap.timeline({scrollTrigger:{trigger:'#rack',start:'top 85%',end:'bottom 35%',scrub:.5}});
  tl.to('#scanRect',{attr:{width:1040},duration:1});
  Object.entries(explode).forEach(([k,v])=>tl.to(k,{...v,duration:1.2,ease:'power2.inOut'},1));
  tl.to('.lbl',{opacity:1,duration:.4,stagger:.05},1.8);
  gsap.utils.toArray('.msteps li').forEach(li=>gsap.from(li,{opacity:0,y:20,duration:.7,scrollTrigger:{trigger:li,start:'top 90%',once:true}}));
});
addEventListener('load',()=>ScrollTrigger.refresh());
})();
