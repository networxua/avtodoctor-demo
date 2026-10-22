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

// mobile symptom picker (≤900px): chips + one clean card, built from the same list
(function(){
  const rows=$$('.sym__row'); if(!rows.length) return;
  const D=rows.map(r=>({no:r.querySelector('.sym__i').textContent,short:r.dataset.short,s:r.querySelector('.sym__s').textContent,c:r.querySelector('.sym__c').textContent,
    pl:r.querySelector('.sym__p').childNodes[0].textContent.trim(),pb:r.querySelector('.sym__p b').textContent,img:r.dataset.img}));
  const w=document.createElement('div'); w.className='symm';
  w.innerHTML=`<div class="symm__chips" role="tablist" aria-label="Оберіть симптом">${D.map((d,i)=>`<button class="symm__chip" role="tab" type="button" aria-selected="${i?'false':'true'}" data-i="${i}"><i>${d.no}</i>${d.short}</button>`).join('')}</div>
  <article class="symm__card" role="tabpanel" aria-live="polite">
    <div class="symm__img"><img alt="" src="${D[0].img}" loading="lazy"><span class="symm__no mono"></span></div>
    <div class="symm__body"><h3></h3><span class="symm__lbl mono">Що це може означати</span><p class="symm__cause"></p>
      <div class="symm__price"><span class="mono"></span><b></b></div>
      <button class="btn btn--red symm__cta" type="button">Записатися на діагностику</button></div>
  </article>
  <div class="symm__nav"><button type="button" class="symm__prev" aria-label="Попередній симптом">←</button><div class="symm__dots">${D.map(()=>'<i></i>').join('')}</div><button type="button" class="symm__next" aria-label="Наступний симптом">→</button></div>`;
  $('.sym').after(w);
  const chips=$$('.symm__chip',w), card=$('.symm__card',w), img=$('.symm__img img',w), dots=$$('.symm__dots i',w);
  let cur=0;
  const fill=i=>{const d=D[i]; img.src=d.img; $('.symm__no',w).textContent='Симптом '+d.no; $('h3',w).textContent=d.s; $('.symm__cause',w).textContent=d.c; $('.symm__price span',w).textContent=d.pl; $('.symm__price b',w).textContent=d.pb;
    chips.forEach((c,k)=>c.setAttribute('aria-selected',k===i?'true':'false')); dots.forEach((t,k)=>t.classList.toggle('on',k===i));};
  const show=(i,dir=1)=>{ i=(i+D.length)%D.length; if(i===cur&&card.dataset.ready) return; const prev=cur; cur=i; card.dataset.ready=1;
    if(window.gsap&&!RM&&prev!==i){ gsap.to(card,{opacity:0,x:-18*dir,duration:.18,ease:'power2.in',onComplete:()=>{fill(i);gsap.fromTo(card,{opacity:0,x:18*dir},{opacity:1,x:0,duration:.35,ease:'power3.out'});}}); }
    else fill(i); };
  fill(0); card.dataset.ready=1;
  chips.forEach((c,k)=>c.addEventListener('click',()=>show(k,k>cur?1:-1)));
  $('.symm__prev',w).addEventListener('click',()=>show(cur-1,-1)); $('.symm__next',w).addEventListener('click',()=>show(cur+1,1));
  let tx=0,ty=0; card.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY;},{passive:true});
  card.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty; if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.3) show(cur+(dx<0?1:-1),dx<0?1:-1);},{passive:true});
  $('.symm__cta',w).addEventListener('click',()=>window.AvdBot&&window.AvdBot.open({book:D[cur].s}));
})();

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

if(RM){ setExploded(); gsap.set('#steer',{opacity:1}); $$('[data-count]').forEach(el=>el.textContent=fmt(+el.dataset.count)); return; }

// hero intro
gsap.from('.hero__title .line>span',{yPercent:110,duration:1.2,ease:'power4.out',stagger:.09,delay:.15});
gsap.from('.hero__aside',{opacity:0,y:24,duration:1,ease:'power3.out',delay:.6,stagger:.12});
gsap.fromTo('.hero__video',{scale:1.12},{scale:1,duration:2.2,ease:'power2.out'});
const hm=gsap.matchMedia();
hm.add('(min-width:901px)',()=>{
  // pinned hero: frame closes in, title lines drift apart, overlay darkens
  const tl=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'.hero',start:'top top',end:'+=75%',pin:true,scrub:.5,anticipatePin:1}});
  tl.fromTo('.hero__media',{clipPath:'inset(0% 0% 0% 0%)'},{clipPath:'inset(9% 4% 22% 46%)'},0)
    .fromTo('.hero__video',{scale:1},{scale:1.18},0)
    .to('.hero__title',{y:-24},0)
    
    .to('.hero__aside',{y:-30},0);
});
hm.add('(max-width:900px)',()=>{
  gsap.to('.hero__media',{yPercent:22,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
  gsap.to('.hero__title',{yPercent:-12,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
});
// header: hide on scroll down, show on scroll up
ScrollTrigger.create({start:120,end:'max',onUpdate:self=>{ if(document.body.classList.contains('menu-open')) return; hdr.classList.toggle('is-hidden',self.direction===1&&self.scroll()>400); }});

// STEER BAND: scroll drives the steering wheel → shaft → tie rods
(function(){
  const sw=$('#sw'); if(!sw) return; const deg=$('#steerDeg'); const q={p:0};
  const apply=p=>{ const a=Math.sin(p*Math.PI*3)*(1-Math.abs(p-.5)*.6)*150; const x=a/150*26;
    gsap.set(sw,{rotation:a,svgOrigin:'500 92'}); gsap.set(['#bShaft','#bTieL','#bTieR'],{x}); gsap.set('#bBootL',{scaleX:1-x/48,svgOrigin:'330 248'}); gsap.set('#bBootR',{scaleX:1+x/48,svgOrigin:'670 248'});
    gsap.set('#bWheelL',{rotation:x*.6,svgOrigin:'144 322'}); gsap.set('#bWheelR',{rotation:x*.6,svgOrigin:'856 322'});
    deg.textContent=(a>0?'+':a<0?'−':'')+Math.abs(Math.round(a))+'°'; };
  gsap.from('#steer .bs',{opacity:0,duration:.8,stagger:.03,ease:'power2.out',scrollTrigger:{trigger:'.band',start:'top 75%',once:true}});
  ScrollTrigger.create({trigger:'.band',start:'top bottom',end:'bottom top',onUpdate:self=>gsap.to(q,{p:self.progress,duration:.4,ease:'power2.out',overwrite:true,onUpdate:()=>apply(q.p)})});
  $$('.band__row').forEach(r=>gsap.fromTo(r,{xPercent:r.dataset.dir>0?-30:0},{xPercent:r.dataset.dir>0?0:-30,ease:'none',scrollTrigger:{trigger:'.band',start:'top bottom',end:'bottom top',scrub:true}}));
})();

// headline word reveal
$$('.h2[data-reveal]').forEach(h=>{ if(h.children.length) return; const words=h.textContent.trim().split(/\s+/);
  h.innerHTML=words.map(w=>`<span class="w"><span>${w}</span></span>`).join(' '); h.classList.add('is-split'); h.removeAttribute('data-reveal');
  gsap.from(h.querySelectorAll('.w>span'),{yPercent:105,duration:1,ease:'power4.out',stagger:.045,scrollTrigger:{trigger:h,start:'top 86%',once:true}}); });
// reveals
$$('[data-reveal]').forEach(el=>gsap.to(el,{opacity:1,y:0,duration:1.1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%',once:true}}));
gsap.utils.toArray('.spec>div,.sym__row,.brands__list li,.counts>div,.ct__info>div').forEach(el=>gsap.from(el,{opacity:0,y:18,duration:.8,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 92%',once:true}}));
// image clip reveals
$$('.sp__imgwrap,.store__img').forEach(el=>{el.classList.add('clipr'); gsap.to(el,{clipPath:'inset(0% 0% 0% 0%)',ease:'none',scrollTrigger:{trigger:el,start:'top 95%',end:'top 35%',scrub:.6}});});
// parallax
$$('[data-parallax]').forEach(img=>gsap.fromTo(img,{yPercent:-7},{yPercent:7,ease:'none',scrollTrigger:{trigger:img.parentElement,start:'top bottom',end:'bottom top',scrub:true}}));
// counters
// odometer counters: each digit rolls on its own reel
$$('[data-count]').forEach(el=>{
  const str=fmt(+el.dataset.count); el.setAttribute('aria-label',str); el.textContent='';
  const reels=[];
  [...str].forEach(ch=>{ if(/\d/.test(ch)){ const o=document.createElement('span'); o.className='odo'; o.setAttribute('aria-hidden','true');
      const r=document.createElement('span'); r.className='odo__r'; r.innerHTML=Array.from({length:20},(_,k)=>`<span>${k%10}</span>`).join(''); o.appendChild(r); el.appendChild(o); reels.push([r,+ch]); }
    else el.appendChild(document.createTextNode(ch)); });
  ScrollTrigger.create({trigger:el,start:'top 90%',once:true,onEnter:()=>reels.forEach(([r,d],k)=>gsap.fromTo(r,{yPercent:0},{yPercent:-(10+d)*5,duration:1.4+k*.18,ease:'power4.out',delay:k*.04}))});
});
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
