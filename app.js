'use strict';
const state={units:[],map:null,markers:new Map(),returnFocus:null};
const dialog=document.getElementById('tour-dialog');
const frame=document.getElementById('tour-frame');
const closeButton=document.getElementById('close-tour');
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function openTour(id){
  const unit=state.units.find(u=>u.id===id);if(!unit)return;
  state.returnFocus=document.activeElement;
  document.getElementById('tour-title').textContent=unit.name;
  document.getElementById('tour-city').textContent=unit.city+' · TO · TOUR 360°';
  document.getElementById('external-tour').href=unit.url;
  document.getElementById('frame-status').hidden=false;
  frame.title='Tour virtual 360° · '+unit.name;
  const localPreview=['127.0.0.1','localhost'].includes(location.hostname);
  frame.src=localPreview?'/preview-tour/'+unit.id+'/'+(unit.id==='sesc-tocantins-palmas1'?'index.htm':''):unit.url;
  document.body.classList.add('tour-open');
  dialog.showModal();closeButton.focus();
}
function closeTour(){if(dialog.open){frame.src='about:blank';frame.removeAttribute('src');dialog.close();}}
closeButton.addEventListener('click',closeTour);
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeTour();}});
dialog.addEventListener('close',()=>{frame.src='about:blank';frame.removeAttribute('src');document.body.classList.remove('tour-open');state.returnFocus?.focus();});
frame.addEventListener('load',()=>{document.getElementById('frame-status').hidden=true;});
document.addEventListener('click',e=>{const b=e.target.closest('[data-tour]');if(b)openTour(b.dataset.tour);});
function renderUnits(){
  document.getElementById('unit-grid').innerHTML=state.units.map(u=>`<article class="unit-card"><div class="card-photo"><img src="${escapeHTML(u.image)}" alt="Capa do tour virtual de ${escapeHTML(u.name)}" loading="lazy" width="1200" height="630"></div><div class="card-body"><span class="card-city">${escapeHTML(u.city)} · TO</span><h3>${escapeHTML(u.name)}</h3><button class="card-link" type="button" data-tour="${escapeHTML(u.id)}" aria-label="Explorar ${escapeHTML(u.name)} em 360 graus">Explorar em 360° <span aria-hidden="true">↗</span></button></div></article>`).join('');
  document.getElementById('map-list').innerHTML=state.units.map(u=>`<button class="map-list-item" type="button" data-map="${escapeHTML(u.id)}"><span>${u.number}</span>${escapeHTML(u.name)}</button>`).join('');
  document.getElementById('map-list').addEventListener('click',e=>{const b=e.target.closest('[data-map]');if(!b)return;const u=state.units.find(u=>u.id===b.dataset.map);if(!state.map){openTour(u.id);return;}state.map.setView([u.lat,u.lon],15,{animate:!matchMedia('(prefers-reduced-motion: reduce)').matches});updateMarkers();state.markers.get(u.id)?.openPopup();if(innerWidth<760)document.getElementById('map').scrollIntoView({block:'center',behavior:'smooth'});});
}
const icons={Instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r=".5"/>',Facebook:'<path d="M15 21v-8h3l1-4h-4V7c0-2 1-2 4-2V1h-3c-4 0-6 2-6 6v2H7v4h3v8"/>',YouTube:'<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 6 3-6 3Z"/>',LinkedIn:'<path d="M4 9v12M4 3v1M9 21V9h5v2c2-4 7-3 7 2v8M14 11v10"/>',X:'<path d="m3 3 18 18M21 3 3 21"/>'};
function renderSocial(social){document.getElementById('social-links').innerHTML=social.map(s=>`<a class="social-link" href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer" aria-label="Sesc Tocantins no ${escapeHTML(s.name)}, abre em nova aba"><svg viewBox="0 0 24 24" aria-hidden="true">${icons[s.name]||''}</svg>${escapeHTML(s.name)}</a>`).join('');}
let markerLayer;
function unitPopup(u){const div=document.createElement('div');const title=document.createElement('h4');title.className='popup-name';title.textContent=u.name;const city=document.createElement('span');city.className='popup-city';city.textContent=u.city+' · TO';const button=document.createElement('button');button.type='button';button.className='popup-tour';button.dataset.tour=u.id;button.textContent='Entrar no tour 360° ↗';div.append(title,city,button);return div;}
function updateMarkers(){
  if(!state.map)return;markerLayer.clearLayers();state.markers.clear();
  if(state.map.getZoom()<11){
    const groups=Map.groupBy?Map.groupBy(state.units,u=>u.city):state.units.reduce((m,u)=>m.set(u.city,[...(m.get(u.city)||[]),u]),new Map());
    groups.forEach((units,city)=>{const lat=units.reduce((s,u)=>s+u.lat,0)/units.length;const lon=units.reduce((s,u)=>s+u.lon,0)/units.length;const marker=L.marker([lat,lon],{icon:L.divIcon({className:'',html:`<span class="map-marker city-marker">${units.length}</span>`,iconSize:[42,42],iconAnchor:[21,21]}),title:city+': '+units.length+' unidades',alt:city});const left=city==='Paraíso do Tocantins';marker.bindTooltip(city,{permanent:true,direction:left?'left':'right',offset:[left?-15:15,0],className:'map-city-label'});marker.on('click',()=>state.map.fitBounds(units.map(u=>[u.lat,u.lon]),{padding:[50,50],maxZoom:14}));marker.addTo(markerLayer);});
  }else state.units.forEach(u=>{const marker=L.marker([u.lat,u.lon],{icon:L.divIcon({className:'',html:`<span class="map-marker">${u.number}</span>`,iconSize:[37,37],iconAnchor:[18,18]}),title:u.name,alt:u.name});marker.bindPopup(unitPopup(u));marker.addTo(markerLayer);state.markers.set(u.id,marker);});
}
function showAll(){if(state.map)state.map.fitBounds(state.units.map(u=>[u.lat,u.lon]),{padding:[45,55],maxZoom:9});}
function initMap(){
  if(!window.L){document.getElementById('map-error').hidden=false;return;}
  state.map=L.map('map',{scrollWheelZoom:false,zoomControl:true});
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'}).addTo(state.map);
  markerLayer=L.layerGroup().addTo(state.map);state.map.on('zoomend',updateMarkers);showAll();updateMarkers();
  document.getElementById('show-all').addEventListener('click',showAll);
  new ResizeObserver(()=>state.map.invalidateSize()).observe(document.getElementById('map'));
}
fetch('units.json').then(r=>{if(!r.ok)throw Error('Unidades indisponíveis');return r.json();}).then(data=>{state.units=data.units;renderUnits();renderSocial(data.social);initMap();}).catch(()=>{document.getElementById('data-error').hidden=false;});
