(async()=>{
 const cfg=window.MARINOS_CONFIG||{};
 const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
 const lang=(localStorage.getItem('marinos-lang')||document.documentElement.lang||cfg.defaultLanguage||'tr').slice(0,2);
 const tr=(item,key)=>lang==='en'?(item[key+'_en']||item[key]):item[key];
 const money=n=>new Intl.NumberFormat(lang==='en'?'en-US':'tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(n);
 const event=(name,params={})=>{ if(typeof window.gtag==='function') window.gtag('event',name,params); };
 const setDynamicLinks=()=>{
  $$('[data-whatsapp]').forEach(a=>a.href=`https://wa.me/${cfg.whatsapp}`);
  $$('[data-phone]').forEach(a=>a.href=`tel:${cfg.phone}`);
  $$('[data-maps]').forEach(a=>a.href=cfg.maps);
  $$('[data-instagram]').forEach(a=>a.href=cfg.instagram);
 };
 setDynamicLinks();
 const switcher=$('[data-lang]');
 if(switcher){switcher.value=lang;switcher.onchange=()=>{localStorage.setItem('marinos-lang',switcher.value);event('language_change',{language:switcher.value});location.reload()}}
 if(cfg.analytics?.ga4MeasurementId){
   const s=document.createElement('script');s.async=true;s.src=`https://www.googletagmanager.com/gtag/js?id=${cfg.analytics.ga4MeasurementId}`;document.head.appendChild(s);
   window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config',cfg.analytics.ga4MeasurementId,{anonymize_ip:true});
 }
 document.addEventListener('click',e=>{
   const a=e.target.closest('a'); if(!a)return;
   if(a.matches('[data-whatsapp],.order,#modalOrder')) event('whatsapp_click',{link_url:a.href});
   else if(a.matches('[data-phone]')) event('phone_click',{link_url:a.href});
   else if(a.matches('[data-maps]')) event('directions_click',{link_url:a.href});
   else if(a.matches('[data-instagram]')) event('instagram_click',{link_url:a.href});
 });
 const grid=$('#menuGrid');
 if(grid){
   try{
    const data=await fetch('/data/menu.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('menu');return r.json()});
    const filters=$('#filters'), search=$('#search'); let current=sessionStorage.getItem('marinos-preselect')||'Tümü'; sessionStorage.removeItem('marinos-preselect');
    const cats=['Tümü',...new Set(data.map(x=>x.cat))];
    filters.innerHTML=cats.map(c=>`<button class="filter ${c===current?'active':''}" data-cat="${c}">${lang==='en'&&c==='Tümü'?'All':c}</button>`).join('');
    const image=item=>`<picture><source srcset="/assets/images/${item.img}.webp?v=402" type="image/webp"><img src="/assets/images/${item.img}.jpg?v=402" alt="${tr(item,'name')}" loading="lazy" decoding="async" width="1400" height="1100"></picture>`;
    const render=()=>{const q=(search?.value||'').toLocaleLowerCase('tr');const list=data.filter(x=>(current==='Tümü'||x.cat===current)&&(`${x.name} ${x.name_en} ${x.desc} ${x.tags.join(' ')}`).toLocaleLowerCase('tr').includes(q));grid.innerHTML=list.length?list.map(item=>`<article class="card" data-id="${item.id}">${image(item)}<div class="card-body"><div class="card-top"><h3>${tr(item,'name')}</h3><span class="price">${money(item.price)}</span></div><div class="gram">${item.gram||'&nbsp;'}</div><p class="desc">${tr(item,'desc')}</p><div class="card-actions"><a class="order" target="_blank" rel="noopener" data-product="${item.id}" href="https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent((lang==='en'?'Hello, I would like to order: ':'Merhaba, sipariş vermek istiyorum: ')+tr(item,'name'))}">${lang==='en'?'Order':'Sipariş Ver'}</a><button class="detail" data-detail="${item.id}">${lang==='en'?'Details':'İçeriği Gör'}</button></div></div></article>`).join(''):`<div class="empty">${lang==='en'?'No products found.':'Ürün bulunamadı.'}</div>`;};
    filters.onclick=e=>{const b=e.target.closest('[data-cat]');if(!b)return;current=b.dataset.cat;$$('.filter',filters).forEach(x=>x.classList.toggle('active',x===b));event('menu_filter',{category:current});render()};if(search)search.oninput=render;render();event('menu_view',{items:data.length});
    const modal=$('#productModal');grid.onclick=e=>{const b=e.target.closest('[data-detail]');if(!b)return;const item=data.find(x=>x.id===b.dataset.detail);if(!item)return;$('#modalImage').src=`/assets/images/${item.img}.jpg`;$('#modalImage').alt=tr(item,'name');$('#modalName').textContent=tr(item,'name');$('#modalGram').textContent=item.gram||'';$('#modalDesc').textContent=tr(item,'desc');$('#modalPrice').textContent=money(item.price);$('#modalOrder').href=`https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent((lang==='en'?'Hello, I would like to order: ':'Merhaba, sipariş vermek istiyorum: ')+tr(item,'name'))}`;modal.classList.add('open');document.body.classList.add('modal-open');event('view_item',{item_id:item.id,item_name:item.name,price:item.price,currency:'TRY'})};
    const close=()=>{modal.classList.remove('open');document.body.classList.remove('modal-open')};$$('[data-close]',modal).forEach(x=>x.onclick=close);modal.onclick=e=>{if(e.target===modal)close()};document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
   }catch(err){grid.innerHTML='<div class="empty">Menü geçici olarak yüklenemedi. Lütfen sayfayı yenileyin.</div>';console.error(err)}
 }
 const reviews=$('#reviews');
 if(reviews){
   try{
    let payload=null;
    if(cfg.reviews?.apiEndpoint){payload=await fetch(cfg.reviews.apiEndpoint).then(r=>{if(!r.ok)throw Error('reviews api');return r.json()})}
    if(!payload)payload=await fetch('/data/reviews.json').then(r=>r.json());
    const list=payload.reviews||payload.fallback||[];
    reviews.innerHTML=list.map(x=>`<article class="review"><div class="stars" aria-label="${x.rating||5} yıldız">${'★'.repeat(x.rating||5)}</div><strong>${x.author}</strong><p>${x.text}</p></article>`).join('');
   }catch(err){reviews.hidden=true;console.error(err)}
 }
})();