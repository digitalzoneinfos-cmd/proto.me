/* PROTO.ME — tableau de bord admin
   Sécurité : toute écriture passe par Supabase, protégée par les règles RLS de la base
   (seuls les comptes de la table admins, avec 2FA si activée). Le navigateur n'a jamais
   de droit spécial : même si quelqu'un modifie ce fichier, la base refusera. */
(function(){
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CFG=window.PROTOME_CONFIG||{};
const LIVE=!!(CFG.supabaseUrl&&CFG.supabaseAnonKey&&window.supabase&&window.supabase.createClient);
const DEMO=!LIVE&&!!window.PROTOME_DEMO;
const UNCONF=!LIVE&&!DEMO;
const MEDIA_BASE=DEMO?'':'/';
const src=u=>!u?'':/^(https?:|data:|blob:)/.test(u)?u:MEDIA_BASE+String(u).replace(/^\//,'');
const IDLE_MIN=30;
function rootEl(){ let r=document.getElementById('pmRoot'); if(!r){ r=document.createElement('div'); r.id='pmRoot'; r.style.minHeight='100%'; document.body.appendChild(r); } return r; }

/* ---------- icônes ---------- */
const I={
 home:'<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
 cal:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
 inbox:'<path d="M4 13l3-8h10l3 8v6H4z"/><path d="M4 13h5l1 2h4l1-2h5"/>',
 play:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/>',
 star:'<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
 doc:'<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
 img:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
 box:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
 lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
 out:'<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
 ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',
 trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
 up:'<path d="M12 19V5M6 11l6-6 6 6"/>',
 down:'<path d="M12 5v14M6 13l6 6 6-6"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
 eyeoff:'<path d="M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.3 6.3C3.8 8 2 12 2 12s4 7 10 7c1.6 0 3-.4 4.3-1"/>',
 x:'<path d="M6 6l12 12M18 6L6 18"/>',
 upload:'<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 check:'<path d="M5 12l5 5 9-10"/>',
 warn:'<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
 wa:'<path fill="currentColor" stroke="none" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.7-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.4z"/>',
 video:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
 shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
 copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>'
};
const ic=(n,extra='')=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" ${extra}>${I[n]}</svg>`;
const SP='<svg class="spark" viewBox="0 0 24 24"><path d="M12 0c.5 6.6 5.4 11.5 12 12-6.6.5-11.5 5.4-12 12-.5-6.6-5.4-11.5-12-12C6.6 11.5 11.5 6.6 12 0z"/></svg>';

/* ---------- toast & confirmation ---------- */
let tt; function toast(m,err){ const t=$('#toast'); t.textContent=m; t.className='toast on'+(err?' err':''); clearTimeout(tt); tt=setTimeout(()=>t.className='toast',err?4200:2400); }
function confirmBox(title,text,okLabel='Supprimer'){ return new Promise(res=>{ const m=$('#modal'); m.innerHTML=`<div class="box" role="alertdialog" aria-modal="true" aria-labelledby="mT"><h3 id="mT">${esc(title)}</h3><p>${esc(text)}</p><div class="acts"><button class="btn" data-a="0">Annuler</button><button class="btn danger" data-a="1">${esc(okLabel)}</button></div></div>`; m.classList.add('on');
  const done=v=>{ m.classList.remove('on'); document.removeEventListener('keydown',kd); res(v); };
  const kd=e=>{ if(e.key==='Escape') done(false); };
  document.addEventListener('keydown',kd);
  m.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>done(b.dataset.a==='1')); m.onclick=e=>{ if(e.target===m) done(false); }; m.querySelector('[data-a="0"]').focus(); }); }
function errMsg(e){ const m=(e&&(e.message||e.error_description||e.msg))||String(e);
  if(/row-level security|permission denied|42501|JWT|not authorized/i.test(m)) return 'Action refusée : votre session a expiré ou la double authentification est requise. Reconnectez-vous.';
  if(/Failed to fetch|NetworkError/i.test(m)) return 'Connexion impossible. Vérifiez votre internet.';
  if(/exceeded the maximum allowed size|Payload too large|413/i.test(m)) return 'Fichier trop lourd (50 Mo maximum).';
  return m; }

/* =====================================================================
   COUCHE DE DONNÉES : Supabase (réel) ou démonstration (en mémoire)
   ===================================================================== */
let sb=null;
const api={};
if(LIVE){
  sb=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'pm-admin-session',detectSessionInUrl:false}});
  const chk=({data,error})=>{ if(error) throw error; return data; };
  api.list=async(t,{order='position',asc=true,eq}={})=>{ let q=sb.from(t).select('*'); if(eq) q=q.eq(eq[0],eq[1]); if(order) q=q.order(order,{ascending:asc,nullsFirst:false}); return chk(await q); };
  api.count=async(t,eq)=>{ let q=sb.from(t).select('id',{count:'exact',head:true}); if(eq) q=q.eq(eq[0],eq[1]); const {count,error}=await q; if(error) throw error; return count||0; };
  api.save=async(t,row)=>{ const r={...row}; const id=r.id; delete r.id; delete r.created_at; delete r.updated_at;
    if(id) return chk(await sb.from(t).update(r).eq('id',id).select().single());
    return chk(await sb.from(t).insert(r).select().single()); };
  api.del=async(t,id)=>chk(await sb.from(t).delete().eq('id',id));
  api.upload=async(file,folder)=>{ const ext=(file.name.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,'');
    const path=`${folder}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    chk(await sb.storage.from('media').upload(path,file,{cacheControl:'31536000',upsert:false,contentType:mimeOf(file)}));
    return sb.storage.from('media').getPublicUrl(path).data.publicUrl; };
  api.delFile=async url=>{ const m=String(url||'').match(/\/storage\/v1\/object\/public\/media\/(.+)$/); if(!m) return; try{ await sb.storage.from('media').remove([decodeURIComponent(m[1])]); }catch(e){} };
  api.isAdmin=async()=>{ const {data,error}=await sb.rpc('is_admin'); if(error) throw error; return !!data; };
} else {
  /* Mode démonstration : données fictives, rien n'est envoyé nulle part */
  const uid=()=>'d'+Math.random().toString(36).slice(2,10);
  const now=Date.now(), ago=h=>new Date(now-h*3600e3).toISOString();
  const D={
    services:[
      {title:'Logiciels, sites et applications',description:'Des produits numériques complets ou des MVP qui fonctionnent vraiment.',chips:['Application mobile','Site web','Logiciel','E-commerce'],specs:[['Livraison','Produit complet ou MVP'],['Langues','FR · AR · EN']],image_url:'media/phone-vylivora.jpg',is_object:false,bg:'#161616',fg:'#faf7f6',accent:'#ddf160',needs:['Application mobile','Site web'],cta_consult:false},
      {title:'Produits physiques et impression 3D',description:'De la modélisation à la pièce finie.',chips:['Modélisation 3D','Impression 3D','Maquette'],specs:[['Matériaux','PLA, PETG, résine']],image_url:'media/ph-3dmodel.jpg',is_object:false,bg:'#9f8be7',fg:'#ffffff',accent:'#161616',needs:['Produit physique'],cta_consult:false},
      {title:'Études, présentations et vidéo',description:'Étude de marché, business plan, pitch deck, soutenance.',chips:['Étude de marché','Pitch deck'],specs:[],image_url:'media/founder.jpg',is_object:false,bg:'#efeceb',fg:'#161616',accent:'#161616',needs:['Présentation / pitch'],cta_consult:false},
      {title:'Print et supports de salon',description:'Roll-up, bannières, stands, flyers et cartes.',chips:['Roll-up','Flyer'],specs:[['Roll-up','85 × 200 cm']],image_url:'media/ph-rollups.jpg',is_object:false,bg:'#1e1e22',fg:'#faf7f6',accent:'#9f8be7',needs:['Print (roll-up, flyers, cartes)'],cta_consult:false},
      {title:'Design graphique, brand kit et packaging',description:'Logo, charte, modèles et emballages fournis.',chips:['Logo','Packaging'],specs:[],image_url:'media/ph-boxes.jpg',is_object:false,bg:'#ddf160',fg:'#161616',accent:'#161616',needs:['Packaging'],cta_consult:false},
      {title:'Consultation et accompagnement',description:'Des experts pour répondre à vos questions.',chips:['Développeur','Comptable','Juriste'],specs:[],image_url:'media/o-knot.webp',is_object:true,bg:'#2b2350',fg:'#ffffff',accent:'#ddf160',needs:["Consultation d'expert"],cta_consult:true}
    ].map((x,i)=>({id:uid(),position:i+1,published:true,...x})),
    gallery:[['Roll-up','85 × 200 cm','Exemple','media/ph-rollups.jpg'],['Showreel 3D','objets imprimables','Vidéo','media/reel-3d.mp4'],['Packaging','boîtes et emballages','Exemple','media/ph-boxes.jpg'],['Vylivora','écran d\'accueil','Capture réelle','media/screen-vylivora.jpg'],['Cartes de visite','85 × 55 mm','Exemple','media/ph-cards.jpg'],['Modélisation 3D','pièces mécaniques','Exemple','media/ph-3dmodel.jpg'],['Flyer','dépliant','Exemple','media/ph-flyer.jpg'],['Design produit','drone en CAO','Exemple','media/ph-drone.jpg']]
      .map((g,i)=>({id:uid(),position:i+1,title:g[0],caption:g[1],label:g[2],media_url:g[3],media_type:g[3].endsWith('.mp4')?'video':'image',style:'photo',published:true})),
    consultants:[['Développeur senior','Développement'],['Expert-comptable','Comptabilité'],['Juriste d\'affaires','Juridique'],['Médecin conseil','Santé'],['Directeur d\'incubateur','Incubation'],['Expert marketing digital','Marketing']]
      .map((c,i)=>({id:uid(),position:i+1,name:'',role:c[0],domain:c[1],tags:[],bio:'',photo_url:'',revealed:false,published:true})),
    courses:[], lessons:[], course_files:[],
    events:[{id:uid(),title:'Atelier prototypage',description:'Atelier pratique · Places limitées',location:'',starts_at:null,date_revealed:false,image_url:'media/ph-drone.jpg',status:'soon'},{id:uid(),title:'Soirée pitch startups',description:'Présentations et rencontres',location:'',starts_at:null,date_revealed:false,image_url:'media/founder.jpg',status:'soon'}],
    articles:[{id:uid(),title:'5 erreurs à éviter avant votre soutenance',excerpt:'Les pièges les plus fréquents quand on présente un prototype devant un jury.',body:'## Préparez la démo\nTestez votre prototype la veille, sur le même ordinateur.\n\n- Prévoyez une vidéo de secours\n- Chronométrez votre présentation',cover_url:'media/founder.jpg',tags:['Étudiants','Soutenance'],status:'draft',published_at:null,created_at:ago(30)}],
    bookings:[
      {id:uid(),created_at:ago(6),expert:'Juriste d\'affaires',subject:'Protéger ma marque',mode:'Par téléphone',wanted_date:new Date(now).toISOString().slice(0,10),slot:'Soir',name:'Exemple : Karim D.',phone:'+213 555 00 00 07',question:'Comment déposer ma marque en Algérie ?',status:'confirme',admin_note:''},
      {id:uid(),created_at:ago(2),expert:'Expert-comptable',subject:'Créer ma SARL',mode:'En visio',wanted_date:new Date(now+3*864e5).toISOString().slice(0,10),slot:'Matin',name:'Exemple : Yacine B.',phone:'+213 555 00 00 01',question:'Quel statut choisir pour une petite agence ?',status:'nouveau',admin_note:''},
      {id:uid(),created_at:ago(26),expert:'Directeur d\'incubateur',subject:'Préparer un pitch',mode:'Sur place',wanted_date:null,slot:'Après-midi',name:'Exemple : Sara M.',phone:'+213 555 00 00 02',question:'',status:'confirme',admin_note:'Rendez-vous jeudi 14 h.'}],
    briefs:[
      {id:uid(),created_at:ago(9),profile:'Entreprise',needs:['Site web','E-commerce'],stage:'Améliorer un existant',details:{'Plateformes':'Web','Fonctions':'Paiement en ligne, Tableau d\'administration'},budget:'Plus de 500 000 DA',delay:'2 à 3 mois',name:'Exemple : Atlas Meubles',phone:'+213 555 00 00 05',city:'Oran',lang:'Français',idea:'Refaire notre site avec une boutique en ligne.',status:'nouveau',admin_note:''},
      {id:uid(),created_at:ago(120),profile:'Étudiant(e)',needs:['Impression 3D / maquette'],stage:'J\'ai un prototype',details:{'Produit':'Petite (moins de 10 cm) · 1 pièce · PLA'},budget:'Moins de 50 000 DA',delay:'Urgent (moins de 2 semaines)',name:'Exemple : Lina H.',phone:'+213 555 00 00 06',city:'Tizi Ouzou',lang:'Français',idea:'Boîtier pour un capteur Arduino.',status:'gagne',admin_note:'Livré.'},
      {id:uid(),created_at:ago(5),profile:'Étudiant(e)',needs:['Application mobile','Présentation / pitch'],stage:'Juste une idée',details:{'Études':'Master · soutenance le 15/06/2027','Plateformes':'Android'},budget:'50 000 à 150 000 DA',delay:'2 à 3 mois',name:'Exemple : Amine K.',phone:'+213 555 00 00 03',city:'Bouira',lang:'Français',idea:'Une application pour suivre la consommation d\'eau.',status:'nouveau',admin_note:''},
      {id:uid(),created_at:ago(50),profile:'Startup',needs:['Logo / brand kit','Packaging'],stage:'Produit complet à lancer',details:{'Supports':'Logo, Boîtes, Étiquettes'},budget:'150 000 à 500 000 DA',delay:'Sous 1 mois',name:'Exemple : Nour Cosmetics',phone:'+213 555 00 00 04',city:'Alger',lang:'Arabe',idea:'Identité et packaging pour une gamme de savons.',status:'en_cours',admin_note:''}]
  };
  const c1={id:uid(),position:1,category:'business',title:'Lancer son projet : de l\'idée au produit',level:'Débutant',description:'Les étapes clés pour passer d\'une idée à un produit prêt à lancer : prototype, tests et présentation.',cover_url:'media/intro-desktop.jpg',status:'published',instructor_name:'Ouassim Meslaoui',instructor_photo_url:'media/founder.jpg'};
  D.courses=[c1,{id:uid(),position:2,category:'ai',title:'L\'IA au service de votre projet',level:'Débutant',description:'',cover_url:'media/screen-vylivora.jpg',status:'soon'},{id:uid(),position:3,category:'marketing',title:'Marketing digital : trouver ses premiers clients',level:'Débutant',description:'',cover_url:'media/ph-flyer.jpg',status:'soon'},{id:uid(),position:4,category:'design',title:'Créer son brand kit',level:'Tous niveaux',description:'',cover_url:'media/ph-bottles.jpg',status:'soon'},{id:uid(),position:5,category:'proto',title:'Impression 3D de A à Z',level:'Débutant',description:'',cover_url:'media/ph-3dmodel.jpg',status:'soon'}];
  D.lessons=[['Introduction : de l\'idée au produit','media/intro-desktop.mp4',10],['Les étapes du prototypage','media/reel-3d.mp4',12],['Préparer le lancement','media/reel-ambiance.mp4',10]].map((l,i)=>({id:uid(),course_id:c1.id,position:i+1,title:l[0],video_url:l[1],duration_sec:l[2]}));
  D.course_files=[{id:uid(),course_id:c1.id,position:1,title:'Checklist : de l\'idée au produit',file_url:'media/docs/checklist-lancement.pdf',file_name:'checklist-lancement.pdf',mime:'application/pdf',size_bytes:2137}];
  const wait=(v,ms=180)=>new Promise(r=>setTimeout(()=>r(JSON.parse(JSON.stringify(v))),ms));
  api.list=async(t,{order='position',asc=true,eq}={})=>{ let r=D[t].slice(); if(eq) r=r.filter(x=>x[eq[0]]===eq[1]); if(order) r.sort((a,b)=>{ const A=a[order],B=b[order]; if(A==null) return 1; if(B==null) return -1; return (A>B?1:A<B?-1:0)*(asc?1:-1); }); return wait(r); };
  api.count=async(t,eq)=>wait(D[t].filter(x=>!eq||x[eq[0]]===eq[1]).length,40);
  api.save=async(t,row)=>{ const r={...row}; if(r.id){ const i=D[t].findIndex(x=>x.id===r.id); D[t][i]={...D[t][i],...r}; return wait(D[t][i]); } r.id=uid(); r.created_at=new Date().toISOString(); D[t].push(r); return wait(r); };
  api.del=async(t,id)=>{ D[t]=D[t].filter(x=>x.id!==id); if(t==='courses'){ D.lessons=D.lessons.filter(l=>l.course_id!==id); D.course_files=D.course_files.filter(l=>l.course_id!==id); } return wait(true); };
  api.upload=async file=>wait(URL.createObjectURL(file),500);
  api.delFile=async()=>{};
  api.isAdmin=async()=>true;
}

/* =====================================================================
   AUTHENTIFICATION
   ===================================================================== */
let user=null, idleT=null;
const LOCK_KEY='pm-admin-lock';
function lockState(){ try{ return JSON.parse(localStorage.getItem(LOCK_KEY)||'{"n":0,"until":0}'); }catch(e){ return {n:0,until:0}; } }
function setLock(s){ try{ localStorage.setItem(LOCK_KEY,JSON.stringify(s)); }catch(e){} }

function renderLogin(step='pw',info=''){
  rootEl().innerHTML=`${DEMO?demoBar():''}<div class="login">
  <div class="login-art"><div class="brand"><span class="mk">${ic('box')}</span><span>proto.me<br>studio</span></div>
    <div><h1>Espace <em>admin</em></h1><p>Gérez les formations, les événements, les articles, les consultants, la galerie, les services et toutes les demandes reçues.</p></div>
    <div class="secure-note" style="color:#a19b9b">${ic('shield')}<span>Connexion chiffrée. Accès réservé au compte administrateur.</span></div></div>
  <div class="login-box"><form class="login-card" id="lf" novalidate autocomplete="on">
    ${step==='pw'?`<h2>Connexion</h2><p class="sub">Entrez vos identifiants administrateur.</p>
    <label class="fld"><span>Adresse e-mail</span><input class="in" id="lEmail" type="email" autocomplete="username" required value="${DEMO?esc(CFG.adminEmail||'protomecontact@gmail.com'):''}"></label>
    <label class="fld"><span>Mot de passe</span><div class="pw"><input class="in" id="lPw" type="password" autocomplete="current-password" required><button type="button" id="pwT" aria-label="Afficher le mot de passe">${ic('eye')}</button></div></label>`
    :`<h2>Double authentification</h2><p class="sub">Ouvrez votre application d'authentification et saisissez le code à 6 chiffres.</p>
    <label class="fld"><span>Code</span><input class="in code-in" id="lCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]*" required></label>`}
    <div id="lMsg" ${info?'':'hidden'} class="msg ${info?'info':''}">${esc(info)}</div>
    <button class="btn pri big" type="submit" id="lBtn">${step==='pw'?'Se connecter':'Vérifier le code'}</button>
    ${step==='mfa'?'<button class="btn ghost" type="button" id="lBack">Utiliser un autre compte</button>':''}
    <p class="secure-note">${ic('lock')}<span>Après 5 essais incorrects, la connexion est bloquée 15 minutes sur cet appareil. ${DEMO?'':'Supabase limite aussi les tentatives côté serveur.'}</span></p>
  </form></div></div><div class="toast" id="toast" role="status" aria-live="polite"></div><div class="modal" id="modal"></div>`;
  const f=$('#lf'), msg=$('#lMsg'), btn=$('#lBtn');
  const show=(t,cls='err')=>{ msg.hidden=false; msg.className='msg '+cls; msg.textContent=t; };
  if($('#pwT')) $('#pwT').onclick=()=>{ const p=$('#lPw'); const s=p.type==='password'; p.type=s?'text':'password'; $('#pwT').innerHTML=ic(s?'eyeoff':'eye'); $('#pwT').setAttribute('aria-label',s?'Masquer le mot de passe':'Afficher le mot de passe'); };
  if($('#lBack')) $('#lBack').onclick=async()=>{ if(sb) await sb.auth.signOut(); renderLogin(); };
  setTimeout(()=>{ const first=$('#lEmail')&&!$('#lEmail').value?$('#lEmail'):($('#lPw')||$('#lCode')); first&&first.focus(); },50);
  f.onsubmit=async e=>{ e.preventDefault();
    const L=lockState(); if(L.until>Date.now()){ show(`Trop d'essais. Réessayez dans ${Math.ceil((L.until-Date.now())/60000)} min.`); return; }
    btn.disabled=true; btn.innerHTML='<span class="spin"></span>Vérification…';
    try{
      if(step==='pw'){
        const email=$('#lEmail').value.trim().toLowerCase(), pw=$('#lPw').value;
        if(!email||!pw){ throw new Error('Remplissez l\'e-mail et le mot de passe.'); }
        if(DEMO){ await new Promise(r=>setTimeout(r,500)); user={email}; setLock({n:0,until:0}); return startApp(); }
        const {error}=await sb.auth.signInWithPassword({email,password:pw});
        if(error&&(/Fetch|network/i.test(error.name+' '+error.message)||error.status===0)) throw new Error('Connexion au serveur impossible. Vérifiez votre internet et config.js.');
        if(error){ const s=lockState(); s.n++; if(s.n>=5){ s.until=Date.now()+15*60e3; s.n=0; } setLock(s); throw new Error('Identifiants incorrects.'); }
        setLock({n:0,until:0});
        return afterSignIn();
      } else {
        const code=$('#lCode').value.replace(/\D/g,''); if(code.length!==6) throw new Error('Le code contient 6 chiffres.');
        const fs=await sb.auth.mfa.listFactors(); const fac=(fs.data&&fs.data.totp||[]).find(x=>x.status==='verified'); if(!fac) throw new Error('Aucune application d\'authentification trouvée.');
        const ch=await sb.auth.mfa.challenge({factorId:fac.id}); if(ch.error) throw ch.error;
        const v=await sb.auth.mfa.verify({factorId:fac.id,challengeId:ch.data.id,code}); if(v.error){ const s=lockState(); s.n++; if(s.n>=5){ s.until=Date.now()+15*60e3; s.n=0; } setLock(s); throw new Error('Code incorrect ou expiré.'); }
        setLock({n:0,until:0});
        return afterSignIn();
      }
    }catch(err){ show(errMsg(err)); btn.disabled=false; btn.textContent=step==='pw'?'Se connecter':'Vérifier le code'; }
  };
}
async function afterSignIn(){
  const {data:{session}}=await sb.auth.getSession(); if(!session) return renderLogin();
  const aal=await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if(aal.data&&aal.data.nextLevel==='aal2'&&aal.data.currentLevel!=='aal2') return renderLogin('mfa');
  let ok=false; try{ ok=await api.isAdmin(); }catch(e){}
  if(!ok){ await sb.auth.signOut(); return renderLogin('pw','Ce compte n\'a pas accès à l\'espace admin.'); }
  user=session.user; startApp();
}
async function signOut(scope){ clearTimeout(idleT); if(sb){ try{ await sb.auth.signOut(scope?{scope}:undefined); }catch(e){} } user=null; renderLogin('pw','Vous êtes déconnecté.'); }
function armIdle(){ clearTimeout(idleT); idleT=setTimeout(()=>signOut().then(()=>{ const m=$('#lMsg'); if(m){ m.hidden=false; m.className='msg info'; m.textContent='Déconnexion automatique après '+IDLE_MIN+' minutes d\'inactivité.'; } }),IDLE_MIN*60e3); }
['pointerdown','keydown','scroll','touchstart'].forEach(ev=>addEventListener(ev,()=>{ if(user) armIdle(); },{passive:true}));
const demoBar=()=>`<div class="demo-bar">${SP}<span><b>Mode démonstration</b> : données fictives, rien n'est enregistré. Une fois relié à Supabase, seul le compte admin avec son mot de passe peut entrer.</span></div>`;

/* =====================================================================
   APPLICATION
   ===================================================================== */
const NAV=[
 {k:'overview',l:'Vue d\'ensemble',i:'home'},
 {g:'Demandes'},
 {k:'bookings',l:'Réservations',i:'cal',badge:'bookings'},
 {k:'briefs',l:'Briefs projets',i:'inbox',badge:'briefs'},
 {g:'Contenu du site'},
 {k:'courses',l:'Formations',i:'play'},
 {k:'events',l:'Événements',i:'star'},
 {k:'articles',l:'Articles',i:'doc'},
 {k:'consultants',l:'Consultants',i:'user'},
 {k:'gallery',l:'Galerie',i:'img'},
 {k:'services',l:'Services',i:'box'},
 {g:'Compte'},
 {k:'security',l:'Sécurité',i:'shield'}];
let view='overview';
function startApp(){
  armIdle();
  const email=(user&&user.email)||'';
  rootEl().innerHTML=`${DEMO?demoBar():''}<div class="app">
   <aside class="side" id="side" aria-label="Navigation admin">
     <div class="brand"><span class="mk">${ic('box')}</span><span>proto.me<br>admin</span></div>
     <nav class="nav" id="nav">${NAV.map(n=>n.g?`<div class="nav-lb">${n.g}</div>`:`<a href="#${n.k}" data-k="${n.k}">${ic(n.i)}${n.l}${n.badge?`<span class="cnt" data-badge="${n.badge}" hidden>0</span>`:''}</a>`).join('')}</nav>
     <div class="side-foot">
       <div class="who"><i>${esc(email.charAt(0).toUpperCase()||'A')}</i><span style="min-width:0"><b>${esc(email)}</b>Administrateur</span></div>
       <a href="/" target="_blank" rel="noopener">${ic('ext')}Voir le site</a>
       <button type="button" id="soBtn">${ic('out')}Se déconnecter</button>
     </div>
   </aside>
   <main class="main" id="main" tabindex="-1"></main>
  </div>
  <div class="scrim" id="scrim"></div>
  <aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="drT" aria-hidden="true"></aside>
  <div class="modal" id="modal"></div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>`;
  $('#soBtn').onclick=()=>signOut();
  rootEl().addEventListener('click',e=>{ if(e.target.closest('[data-burger]')){ $('#side').classList.toggle('on'); $('#scrim').classList.toggle('on'); } });
  $('#nav').onclick=e=>{ const a=e.target.closest('a[data-k]'); if(!a) return; e.preventDefault(); go(a.dataset.k); $('#side').classList.remove('on'); };
  $('#scrim').onclick=()=>{ closeDrawer(); $('#side').classList.remove('on'); };
  if(!window.__pmHash){ window.__pmHash=1; addEventListener('hashchange',()=>{ if(!user) return;  const k=location.hash.slice(1); if(k&&k!==view&&NAV.some(n=>n.k===k)) go(k,true); }); }
  const h=location.hash.slice(1); go(NAV.some(n=>n.k===h)?h:'overview',true);
  refreshBadges();
}
function topBar(title,sub,acts=''){ return `<div class="top"><button class="ib burger" type="button" aria-label="Ouvrir le menu" data-burger>${ic('menu')}</button><div><h1>${title}</h1>${sub?`<div class="sub">${sub}</div>`:''}</div><div class="acts">${acts}</div></div>`; }
function go(k,noHash){ view=k; $$('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.k===k)); if(!noHash) history.replaceState(null,'','#'+k); $('#scrim').classList.remove('on'); const m=$('#main'); m.scrollTop=0; scrollTo(0,0); (VIEWS[k]||VIEWS.overview)(m); }
async function refreshBadges(){ try{ for(const t of ['bookings','briefs']){ const n=await api.count(t,['status','nouveau']); const b=document.querySelector(`[data-badge="${t}"]`); if(b){ b.textContent=n; b.hidden=!n; } } }catch(e){} }
const loading=n=>Array.from({length:n},()=>'<div class="skel"></div>').join('');
const fmtD=d=>{ if(!d) return ''; const x=new Date(d); return x.toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}); };
const fmtDT=d=>{ if(!d) return ''; const x=new Date(d); return x.toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})+' · '+x.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}); };
const ago=d=>{ const s=(Date.now()-new Date(d))/1000; if(s<60) return 'à l\'instant'; if(s<3600) return 'il y a '+Math.floor(s/60)+' min'; if(s<86400) return 'il y a '+Math.floor(s/3600)+' h'; return 'il y a '+Math.floor(s/86400)+' j'; };
const thumb=(u,type)=>!u?ic('img'):(type==='video'||/\.(mp4|webm)(\?|$)/i.test(u))?`<video src="${esc(src(u))}" muted preload="metadata"></video>`:`<img src="${esc(src(u))}" alt="" loading="lazy">`;
const waLink=(phone,text)=>'https://wa.me/'+String(phone||'').replace(/\D/g,'')+(text?'?text='+encodeURIComponent(text):'');

/* ---------- configuration des statuts ---------- */
const ST={
 bookings:{nouveau:['Nouveau','p-lav'],confirme:['Confirmé','p-ok'],termine:['Terminé','p-mute'],annule:['Annulé','p-bad']},
 briefs:{nouveau:['Nouveau','p-lav'],en_cours:['En cours','p-info'],gagne:['Gagné','p-ok'],perdu:['Perdu','p-bad']},
 courses:{draft:['Brouillon','p-mute'],soon:['Bientôt','p-warn'],published:['Publiée','p-ok']},
 events:{draft:['Brouillon','p-mute'],soon:['Prochainement','p-warn'],published:['Publié','p-ok'],past:['Passé','p-mute']},
 articles:{draft:['Brouillon','p-mute'],published:['Publié','p-ok']}
};
const pill=(t,s)=>{ const v=(ST[t]||{})[s]||[s,'p-mute']; return `<span class="pill ${v[1]}">${esc(v[0])}</span>`; };
const pubPill=p=>p?'<span class="pill p-ok">Visible</span>':'<span class="pill p-mute">Masqué</span>';

/* =====================================================================
   VUES
   ===================================================================== */
const VIEWS={};

VIEWS.overview=async m=>{
  const h=new Date().getHours(); const hi=h<12?'Bonjour':h<18?'Bon après-midi':'Bonsoir';
  const today=new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
  m.innerHTML=topBar(hi,`${today.charAt(0).toUpperCase()+today.slice(1)} · voici ce qui se passe sur PROTO.ME.`,`<a class="btn" href="/" target="_blank" rel="noopener">${ic('ext')}Voir le site</a>`)+`
   <div class="stats" id="ovS">${loading(4)}</div>
   <div class="ov-grid">
     <div class="panel ov-chart"><h3>Demandes reçues <span class="hint" style="font-weight:500">30 derniers jours</span><span class="legend"><i class="lg-a"></i>Réservations<i class="lg-b"></i>Briefs</span></h3><div id="ovC" class="chart">${loading(1)}</div></div>
     <div class="panel"><h3>Prochains rendez-vous <button class="btn sm" data-go="bookings">Agenda</button></h3><div id="ovA" class="agenda-mini">${loading(2)}</div></div>
     <div class="panel"><h3>Dernières demandes <button class="btn sm" data-go="briefs">Tout voir</button></h3><div class="list" id="ovR">${loading(3)}</div></div>
     <div style="display:grid;gap:16px;align-content:start">
       <div class="panel"><h3>Briefs par étape</h3><div id="ovP"></div></div>
       <div class="panel"><h3>Besoins les plus demandés</h3><div id="ovN" class="bars"></div></div>
     </div>
     <div class="panel ov-quick"><h3>Actions rapides</h3><div class="quick">
       <button data-new="courses"><i>${ic('play')}</i>Nouvelle formation</button><button data-new="events"><i>${ic('star')}</i>Nouvel événement</button>
       <button data-new="articles"><i>${ic('doc')}</i>Nouvel article</button><button data-new="gallery"><i>${ic('img')}</i>Ajouter à la galerie</button>
       <button data-new="consultants"><i>${ic('user')}</i>Nouveau consultant</button><button data-new="services"><i>${ic('box')}</i>Nouveau service</button></div></div>
   </div>`;
  m.onclick=e=>{ const g=e.target.closest('[data-go]'); if(g){ e.preventDefault(); return go(g.dataset.go); }
    const n=e.target.closest('[data-new]'); if(n){ go(n.dataset.new); setTimeout(()=>openEditor(n.dataset.new,null),250); }
    const r=e.target.closest('[data-req]'); if(r){ const [t,id]=r.dataset.req.split(':'); go(t); setTimeout(()=>selectRequest&&selectRequest(id),400); } };
  let bk=[],br=[],co=0,ar=0;
  try{ [bk,br,co,ar]=await Promise.all([api.list('bookings',{order:'created_at',asc:false}),api.list('briefs',{order:'created_at',asc:false}),api.count('courses',['status','published']),api.count('articles',['status','published'])]); }catch(e){ toast(errMsg(e),true); }
  const day=86400e3, now=Date.now(), d0=new Date(); d0.setHours(0,0,0,0);
  const inRange=(x,a,b)=>{ const t=new Date(x.created_at).getTime(); return t>=a&&t<b; };
  const m30=[...bk,...br].filter(x=>inRange(x,now-30*day,now+day)).length, p30=[...bk,...br].filter(x=>inRange(x,now-60*day,now-30*day)).length;
  const delta=p30?Math.round((m30-p30)/p30*100):(m30?100:0);
  const nb=bk.filter(x=>x.status==='nouveau').length, nf=br.filter(x=>x.status==='nouveau').length;
  const upcoming=bk.filter(x=>['nouveau','confirme'].includes(x.status)&&x.wanted_date&&new Date(x.wanted_date+'T23:59')>=d0).sort((a,b)=>a.wanted_date.localeCompare(b.wanted_date));
  $('#ovS').innerHTML=`<a class="stat ${nb?'hot':''}" href="#bookings" data-go="bookings"><span>Réservations à traiter</span><b>${nb}</b><small>${bk.length} au total</small></a>
    <a class="stat ${nf?'hot':''}" href="#briefs" data-go="briefs"><span>Briefs à traiter</span><b>${nf}</b><small>${br.length} au total</small></a>
    <a class="stat" href="#bookings" data-go="bookings"><span>Demandes sur 30 jours</span><b>${m30}</b><small class="${delta>=0?'trend-up':'trend-down'}">${delta>=0?'▲':'▼'} ${Math.abs(delta)} % vs mois précédent</small></a>
    <a class="stat" href="#courses" data-go="courses"><span>En ligne sur le site</span><b>${co+ar}</b><small>${co} formation${co>1?'s':''} · ${ar} article${ar>1?'s':''}</small></a>`;
  // graphique 30 jours
  const days=[...Array(30)].map((_,i)=>{ const s=d0.getTime()-(29-i)*day; return {s,a:bk.filter(x=>inRange(x,s,s+day)).length,b:br.filter(x=>inRange(x,s,s+day)).length}; });
  const max=Math.max(2,...days.map(d=>d.a+d.b)), W=600,H=170,pb=22,bw=W/30;
  const ticks=[0,Math.ceil(max/2),max];
  $('#ovC').innerHTML=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Demandes par jour sur 30 jours">
    ${ticks.map(t=>{ const y=(H-pb)-(t/max)*(H-pb-10); return `<line x1="0" x2="${W}" y1="${y}" y2="${y}" class="grid"/><text x="2" y="${y-3}" class="ax">${t}</text>`; }).join('')}
    ${days.map((d,i)=>{ const ha=(d.a/max)*(H-pb-10), hb=(d.b/max)*(H-pb-10), x=i*bw+bw*.18, w=bw*.64, y0=H-pb;
      return `<g><title>${new Date(d.s).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})} : ${d.a} réservation${d.a>1?'s':''}, ${d.b} brief${d.b>1?'s':''}</title>${hb?`<rect x="${x}" y="${y0-hb}" width="${w}" height="${hb}" rx="3" class="bar-b"/>`:''}${ha?`<rect x="${x}" y="${y0-hb-ha}" width="${w}" height="${ha}" rx="3" class="bar-a"/>`:''}${!ha&&!hb?`<rect x="${x}" y="${y0-2}" width="${w}" height="2" rx="1" class="bar-0"/>`:''}</g>`; }).join('')}
    ${[0,10,20,29].map(i=>`<text x="${i*bw+bw/2}" y="${H-5}" text-anchor="middle" class="ax">${new Date(days[i].s).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</text>`).join('')}</svg>`;
  // agenda
  const dlab=d=>{ const x=new Date(d+'T12:00'); return [x.toLocaleDateString('fr-FR',{day:'2-digit'}),x.toLocaleDateString('fr-FR',{month:'short'}).replace('.','')]; };
  $('#ovA').innerHTML=upcoming.length?upcoming.slice(0,5).map(x=>{ const [dd,mm]=dlab(x.wanted_date); return `<div class="ag-item" data-req="bookings:${x.id}"><span class="ag-date"><b>${dd}</b>${mm}</span><span class="tt"><b>${esc(x.name)}</b><span>${esc([x.expert||'Expert à conseiller',x.slot,x.mode].filter(Boolean).join(' · '))}</span></span>${pill('bookings',x.status)}</div>`; }).join(''):`<div class="empty sm"><b>Aucun rendez-vous à venir</b>Les demandes avec une date apparaîtront ici.</div>`;
  // dernières demandes
  const all=[...bk.map(x=>({...x,_t:'bookings'})),...br.map(x=>({...x,_t:'briefs'}))].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,6);
  $('#ovR').innerHTML=all.length?all.map(x=>`<div class="mini-row" data-req="${x._t}:${x.id}">${avatar(x.name,x.status)}<span class="tt"><b>${esc(x.name)}</b><span>${x._t==='bookings'?'Consultation · '+esc(x.expert||'À conseiller'):'Brief · '+esc((x.needs||[]).join(', '))}</span></span><span class="when">${ago(x.created_at)}</span></div>`).join(''):`<div class="empty sm"><b>Aucune demande pour l'instant</b>Les réservations et les briefs envoyés depuis le site apparaîtront ici.</div>`;
  // pipeline
  const P=Object.entries(ST.briefs).map(([k,v])=>[k,v,br.filter(x=>x.status===k).length]); const tot=br.length||1;
  $('#ovP').innerHTML=`<div class="pipe">${P.map(([k,v,n])=>n?`<i class="${v[1]}" style="flex:${n}" title="${v[0]} : ${n}"></i>`:'').join('')||'<i class="p-mute" style="flex:1"></i>'}</div><div class="pipe-lg">${P.map(([k,v,n])=>`<span><i class="${v[1]}"></i>${v[0]} <b>${n}</b></span>`).join('')}</div>`;
  // besoins
  const cnt={}; br.forEach(x=>(x.needs||[]).forEach(n=>cnt[n]=(cnt[n]||0)+1)); const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,6); const tm=top.length?top[0][1]:1;
  $('#ovN').innerHTML=top.length?top.map(([n,c])=>`<div class="hb"><span>${esc(n)}</span><i><em style="width:${c/tm*100}%"></em></i><b>${c}</b></div>`).join(''):'<p class="hint" style="margin:0">Pas encore de brief reçu.</p>';
};
const AVC=['#9f8be7','#ddf160','#7fd4ff','#ffb547','#f28fb1','#8fe3b0'];
function avatar(name,status){ const n=String(name||'?').replace(/^Exemple\s*:\s*/,''); const ini=n.split(/\s+/).map(w=>w.charAt(0)).join('').slice(0,2).toUpperCase()||'?'; let h=0; for(const ch of n) h=(h*31+ch.charCodeAt(0))%997;
  return `<span class="av" style="--av:${AVC[h%AVC.length]}">${esc(ini)}${status==='nouveau'?'<em class="dot" title="Nouveau"></em>':''}</span>`; }

/* ---------- boîtes de réception : réservations & briefs ---------- */
let selectRequest=null;
const TPL={
 bookings:[['Confirmer le rendez-vous',r=>`Bonjour ${clean(r.name)}, c'est PROTO.ME. Votre consultation${r.expert?' avec notre '+r.expert.toLowerCase():''} est confirmée${r.wanted_date?' le '+fmtD(r.wanted_date):''}${r.slot?' ('+r.slot.toLowerCase()+')':''}. Nous vous envoyons les détails juste après.`],
           ['Proposer une autre date',r=>`Bonjour ${clean(r.name)}, merci pour votre demande de consultation. Le créneau demandé n'est plus disponible : quelles autres dates vous conviendraient ?`],
           ['Demander des précisions',r=>`Bonjour ${clean(r.name)}, merci pour votre demande. Pour bien préparer la consultation, pouvez-vous nous en dire un peu plus sur votre question ?`]],
 briefs:[['Accuser réception',r=>`Bonjour ${clean(r.name)}, merci pour votre brief envoyé sur PROTO.ME. Nous l'étudions et revenons vers vous très vite.`],
         ['Proposer un appel',r=>`Bonjour ${clean(r.name)}, merci pour votre projet ! Pouvons-nous en parler 15 minutes par téléphone ou en visio ? Quel moment vous arrange ?`],
         ['Demander des précisions',r=>`Bonjour ${clean(r.name)}, merci pour votre brief. Pour préparer un devis précis, pourriez-vous nous préciser vos attentes et votre date limite ?`]]
};
const clean=n=>String(n||'').replace(/^Exemple\s*:\s*/,'');
function inbox(t){ return async m=>{
  const isB=t==='bookings';
  const title=isB?'Réservations':'Briefs projets';
  const sub=isB?'Demandes de consultation envoyées depuis la page Consultants.':'Demandes de projet envoyées depuis le formulaire du site.';
  const modes=isB?[['list','Liste'],['agenda','Agenda']]:[['list','Liste'],['board','Tableau']];
  let mode=(()=>{ try{ return localStorage.getItem('pm-mode-'+t)||'list'; }catch(e){ return 'list'; } })();
  m.innerHTML=topBar(title,sub,`<div class="seg" id="ibM">${modes.map(x=>`<button type="button" data-m="${x[0]}">${x[1]}</button>`).join('')}</div><button class="btn" type="button" id="ibX">${ic('down')}Exporter (CSV)</button>`)+
   `<div class="toolbar"><div class="tabs" id="ibT"></div><label class="search">${ic('search')}<input id="ibQ" type="search" placeholder="Nom, téléphone, sujet…" aria-label="Rechercher"></label></div><div id="ibBody">${loading(4)}</div>`;
  let rows=[], f='all', q='', sel=null;
  const reload=async keep=>{ try{ rows=await api.list(t,{order:'created_at',asc:false}); }catch(e){ toast(errMsg(e),true); } draw(keep); refreshBadges(); };
  const filtered=()=>{ const ql=q.toLowerCase(); return rows.filter(r=>(f==='all'||r.status===f)&&(!ql||JSON.stringify(r).toLowerCase().includes(ql))); };
  const summary=r=>isB?[r.expert||'Expert à conseiller',r.mode,r.wanted_date?fmtD(r.wanted_date):''].filter(Boolean).join(' · '):[r.profile,(r.needs||[]).slice(0,3).join(', ')].filter(Boolean).join(' · ');
  const card=r=>`<button type="button" class="ib-item ${sel===r.id?'on':''} ${r.status==='nouveau'?'unread':''}" data-id="${r.id}">${avatar(r.name,r.status)}<span class="tt"><b>${esc(r.name)}</b><span>${esc(summary(r))}</span></span><span class="ib-meta"><span class="when">${ago(r.created_at)}</span>${pill(t,r.status)}</span></button>`;
  function draw(keep){
    $$('#ibM button').forEach(b=>b.classList.toggle('on',b.dataset.m===mode));
    $('#ibT').innerHTML=[['all','Toutes',rows.length],...Object.keys(ST[t]).map(s=>[s,ST[t][s][0],rows.filter(r=>r.status===s).length])].map(x=>`<button type="button" data-f="${x[0]}" class="${f===x[0]?'on':''}">${x[1]}<em>${x[2]}</em></button>`).join('');
    $('#ibT').hidden=mode==='board';
    const L=filtered(), B=$('#ibBody');
    if(!rows.length){ B.innerHTML=`<div class="empty"><b>Aucune demande pour l'instant</b>Les nouvelles demandes envoyées depuis le site apparaîtront ici automatiquement.</div>`; return; }
    if(mode==='board'){ const cols=Object.entries(ST.briefs); const ql=q.toLowerCase(); const LL=rows.filter(r=>!ql||JSON.stringify(r).toLowerCase().includes(ql));
      B.innerHTML=`<div class="board">${cols.map(([k,v])=>{ const it=LL.filter(r=>r.status===k); return `<section class="col" data-col="${k}"><header><span class="pill ${v[1]}">${v[0]}</span><em>${it.length}</em></header><div class="col-list">${it.map(r=>`<article class="kcard" draggable="true" data-id="${r.id}">${avatar(r.name,r.status)}<div class="tt"><b>${esc(r.name)}</b><span>${esc((r.needs||[]).join(', '))}</span><span class="kmeta">${r.budget?`<span>${esc(r.budget)}</span>`:''}<span>${ago(r.created_at)}</span></span></div></article>`).join('')||'<p class="col-empty">Glissez une carte ici</p>'}</div></section>`; }).join('')}</div><p class="hint">Glissez une carte d'une colonne à l'autre pour changer son étape. Cliquez dessus pour voir le détail.</p>`;
      bindBoard(); return; }
    if(mode==='agenda'){ const d0=new Date(); d0.setHours(0,0,0,0); const D=86400e3;
      const grp=r=>{ if(!r.wanted_date) return 'Date à définir'; const t0=new Date(r.wanted_date+'T00:00').getTime(), diff=Math.round((t0-d0.getTime())/D);
        if(diff<0) return 'Passés'; if(diff===0) return "Aujourd'hui"; if(diff===1) return 'Demain'; if(diff<7) return 'Cette semaine'; return 'Plus tard'; };
      const order=["Aujourd'hui",'Demain','Cette semaine','Plus tard','Date à définir','Passés'];
      const G={}; L.forEach(r=>(G[grp(r)]=G[grp(r)]||[]).push(r)); Object.values(G).forEach(a=>a.sort((x,y)=>(x.wanted_date||'9').localeCompare(y.wanted_date||'9')));
      B.innerHTML=`<div class="split"><div class="split-list">${order.filter(k=>G[k]).map(k=>`<div class="ag-group"><h4>${k}<em>${G[k].length}</em></h4>${G[k].map(card).join('')}</div>`).join('')||'<div class="empty sm"><b>Rien ici</b>Aucune demande ne correspond.</div>'}</div><div class="split-detail" id="ibD"></div></div>`; }
    else B.innerHTML=`<div class="split"><div class="split-list">${L.map(card).join('')||'<div class="empty sm"><b>Rien ici</b>Aucune demande ne correspond au filtre.</div>'}</div><div class="split-detail" id="ibD"></div></div>`;
    const D=$('#ibD'); if(!D) return;
    const cur=keep&&sel&&L.find(r=>r.id===sel)?sel:(innerWidth>1100&&L[0]?L[0].id:null);
    if(cur&&innerWidth>1100){ sel=cur; detail(L.find(r=>r.id===cur),D); $$('.ib-item').forEach(x=>x.classList.toggle('on',x.dataset.id===cur)); }
    else if(D) D.innerHTML=`<div class="empty sm" style="margin:auto"><b>Sélectionnez une demande</b>Son détail s'affichera ici.</div>`;
  }
  function open(id){ const r=rows.find(x=>x.id===id); if(!r) return; sel=id; $$('.ib-item').forEach(x=>x.classList.toggle('on',x.dataset.id===id));
    if(innerWidth>1100&&$('#ibD')&&mode!=='board') detail(r,$('#ibD'));
    else { openDrawer(`${isB?'Réservation':'Brief'}`,'<div id="ibDD"></div>'); detail(r,$('#ibDD'),true); } }
  selectRequest=id=>{ if(view===t) open(id); };
  function detail(r,box,inDrawer){
    const L=filtered(), idx=L.findIndex(x=>x.id===r.id);
    const kv=(a)=>a.filter(x=>x[1]).map(x=>`<div><dt>${esc(x[0])}</dt><dd>${esc(x[1])}</dd></div>`).join('');
    const phone=String(r.phone||''), digits=phone.replace(/\D/g,'');
    box.innerHTML=`<div class="rq">
      <div class="rq-head">${avatar(r.name,r.status)}<div class="tt"><b>${esc(clean(r.name))}</b><span>${isB?'Demande de consultation':'Brief projet'} · reçu ${ago(r.created_at)} · ${fmtDT(r.created_at)}</span></div>
        ${inDrawer?'':`<div class="rq-nav"><button class="ib" type="button" data-nav="-1" aria-label="Demande précédente" ${idx<=0?'disabled':''}>${ic('up')}</button><button class="ib" type="button" data-nav="1" aria-label="Demande suivante" ${idx<0||idx>=L.length-1?'disabled':''}>${ic('down')}</button></div>`}</div>
      <div class="rq-status"><span class="hint">Étape</span><div class="seg wide" id="rqS">${Object.entries(ST[t]).map(([k,v])=>`<button type="button" data-s="${k}" class="${r.status===k?'on':''}">${v[0]}</button>`).join('')}</div></div>
      <div class="rq-contact"><div><span class="hint">WhatsApp</span><b>${esc(phone)}</b></div>${r.city?`<div><span class="hint">Ville</span><b>${esc(r.city)}</b></div>`:''}${r.lang?`<div><span class="hint">Langue</span><b>${esc(r.lang)}</b></div>`:''}
        <div class="rq-acts"><a class="btn wa sm" href="${esc(waLink(phone,''))}" target="_blank" rel="noopener">${ic('wa')}WhatsApp</a><a class="btn sm" href="tel:${esc(digits?'+'+digits:'')}">Appeler</a><button class="btn sm" type="button" id="rqC">${ic('copy')}Copier</button></div></div>
      ${isB?`<div class="rq-card"><h4>Rendez-vous demandé</h4><div class="rq-big">${r.wanted_date?`<span class="ag-date lg"><b>${new Date(r.wanted_date+'T12:00').toLocaleDateString('fr-FR',{day:'2-digit'})}</b>${new Date(r.wanted_date+'T12:00').toLocaleDateString('fr-FR',{month:'short'}).replace('.','')}</span>`:`<span class="ag-date lg muted"><b>?</b>date</span>`}<div><b>${esc(r.expert||'Expert à conseiller')}</b><span>${esc([r.wanted_date?new Date(r.wanted_date+'T12:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}):'Date à définir',r.slot,r.mode].filter(Boolean).join(' · '))}</span></div></div><dl class="detail">${kv([['Sujet',r.subject]])}</dl></div>
        ${r.question?`<div class="rq-card"><h4>Question du client</h4><blockquote>${esc(r.question)}</blockquote></div>`:''}`
      :`<div class="rq-card"><h4>Le projet</h4><div class="rq-chips">${(r.needs||[]).map(n=>`<span class="chip2">${esc(n)}</span>`).join('')}</div><div class="rq-facts"><div><span>Profil</span><b>${esc(r.profile||'—')}</b></div><div><span>Étape</span><b>${esc(r.stage||'—')}</b></div><div><span>Budget</span><b>${esc(r.budget||'À discuter')}</b></div><div><span>Délai</span><b>${esc(r.delay||'—')}</b></div></div></div>
        ${Object.keys(r.details||{}).length?`<div class="rq-card"><h4>Détails donnés</h4><dl class="detail">${kv(Object.entries(r.details||{}))}</dl></div>`:''}
        ${r.idea?`<div class="rq-card"><h4>Description du projet</h4><blockquote>${esc(r.idea)}</blockquote></div>`:''}`}
      <div class="rq-card"><h4>Répondre rapidement</h4><div class="tpl">${TPL[t].map((x,i)=>`<a class="tpl-b" href="${esc(waLink(phone,x[1](r)))}" target="_blank" rel="noopener" data-tpl="${i}">${ic('wa')}${x[0]}</a>`).join('')}</div></div>
      <div class="rq-card"><h4>Note interne <span class="hint" style="font-weight:500">visible seulement par l'admin</span></h4><textarea class="in" id="rqN" maxlength="1000" placeholder="ex. Rappeler jeudi, devis envoyé…">${esc(r.admin_note)}</textarea><div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px"><span class="hint" id="rqNs"></span><button class="btn sm pri" type="button" id="rqNb">Enregistrer la note</button></div></div>
      <div style="display:flex;justify-content:flex-end"><button class="btn danger sm" type="button" id="rqD">${ic('trash')}Supprimer la demande</button></div>
    </div>`;
    box.querySelector('#rqS').onclick=async e=>{ const b=e.target.closest('button'); if(!b||b.classList.contains('on')) return; const s=b.dataset.s;
      try{ await api.save(t,{id:r.id,status:s}); r.status=s; toast('Étape : '+ST[t][s][0]); box.querySelectorAll('#rqS button').forEach(x=>x.classList.toggle('on',x===b)); const row=rows.find(x=>x.id===r.id); if(row) row.status=s; draw(true); refreshBadges(); }catch(err){ toast(errMsg(err),true); } };
    box.querySelector('#rqC').onclick=()=>{ try{ navigator.clipboard.writeText(phone).then(()=>toast('Numéro copié'),()=>toast(phone)); }catch(e){ toast(phone); } };
    const saveNote=async()=>{ const v=box.querySelector('#rqN').value.slice(0,1000); if(v===r.admin_note) return; try{ await api.save(t,{id:r.id,admin_note:v}); r.admin_note=v; const row=rows.find(x=>x.id===r.id); if(row) row.admin_note=v; box.querySelector('#rqNs').textContent='Note enregistrée'; drawerDirty=false; }catch(err){ toast(errMsg(err),true); } };
    box.querySelector('#rqNb').onclick=saveNote; box.querySelector('#rqN').onblur=saveNote;
    box.querySelector('#rqD').onclick=async()=>{ if(!await confirmBox('Supprimer cette demande ?','Elle sera effacée définitivement de la base.')) return; try{ await api.del(t,r.id); toast('Demande supprimée'); if(inDrawer) closeDrawer(true); sel=null; reload(); }catch(err){ toast(errMsg(err),true); } };
    box.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{ const n=L[idx+(+b.dataset.nav)]; if(n){ open(n.id); const el=document.querySelector(`.ib-item[data-id="${n.id}"]`); el&&el.scrollIntoView({block:'nearest'}); } });
  }
  function bindBoard(){ let dragId=null;
    $$('.kcard').forEach(c=>{ c.ondragstart=e=>{ dragId=c.dataset.id; c.classList.add('drag'); try{ e.dataTransfer.setData('text/plain',dragId); e.dataTransfer.effectAllowed='move'; }catch(_){} }; c.ondragend=()=>c.classList.remove('drag'); c.onclick=()=>open(c.dataset.id); });
    $$('.col').forEach(col=>{ col.ondragover=e=>{ e.preventDefault(); col.classList.add('over'); }; col.ondragleave=()=>col.classList.remove('over');
      col.ondrop=async e=>{ e.preventDefault(); col.classList.remove('over'); const id=dragId||e.dataTransfer.getData('text/plain'); const s=col.dataset.col; const r=rows.find(x=>x.id===id); if(!r||r.status===s) return;
        const old=r.status; r.status=s; draw(); try{ await api.save(t,{id,status:s}); toast('Étape : '+ST[t][s][0]); refreshBadges(); }catch(err){ r.status=old; draw(); toast(errMsg(err),true); } }; }); }
  $('#ibM').onclick=e=>{ const b=e.target.closest('button'); if(!b) return; mode=b.dataset.m; try{ localStorage.setItem('pm-mode-'+t,mode); }catch(_){} draw(true); };
  $('#ibT').onclick=e=>{ const b=e.target.closest('button'); if(b){ f=b.dataset.f; draw(true); } };
  $('#ibQ').oninput=e=>{ q=e.target.value; draw(true); };
  $('#ibBody').onclick=e=>{ const it=e.target.closest('.ib-item'); if(it) open(it.dataset.id); };
  $('#ibX').onclick=()=>{ const L=filtered(); if(!L.length) return toast('Rien à exporter');
    const cols=isB?[['created_at','Reçue le'],['status','Étape'],['name','Nom'],['phone','WhatsApp'],['expert','Expert'],['subject','Sujet'],['mode','Format'],['wanted_date','Date souhaitée'],['slot','Moment'],['question','Question'],['admin_note','Note']]
      :[['created_at','Reçu le'],['status','Étape'],['name','Nom'],['phone','WhatsApp'],['city','Ville'],['profile','Profil'],['needs','Besoins'],['stage','Avancement'],['budget','Budget'],['delay','Délai'],['details','Détails'],['idea','Projet'],['lang','Langue'],['admin_note','Note']];
    const cell=v=>{ if(Array.isArray(v)) v=v.join(', '); else if(v&&typeof v==='object') v=Object.entries(v).map(x=>x.join(' : ')).join(' | '); v=String(v==null?'':v); if(/^[=+\-@]/.test(v)) v="'"+v; return '"'+v.replace(/"/g,'""')+'"'; };
    const csv='﻿'+[cols.map(c=>cell(c[1])).join(';'),...L.map(r=>cols.map(c=>cell(c[0]==='status'?ST[t][r.status][0]:c[0]==='created_at'?fmtDT(r.created_at):r[c[0]])).join(';'))].join('\r\n');
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); a.download=`protome-${t}-${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500); toast('Export prêt : '+L.length+' ligne'+(L.length>1?'s':'')); };
  if(!isB) $$('#ibM button').forEach(()=>{});
  await reload();
}; }
VIEWS.bookings=inbox('bookings'); VIEWS.briefs=inbox('briefs');
async function openRequest(t,id){ go(t); setTimeout(()=>selectRequest&&selectRequest(id),450); }

/* ---------- définition des contenus modifiables ---------- */
const LEVELS=['Débutant','Intermédiaire','Avancé','Tous niveaux'];
const CCATS=[['ai','Intelligence artificielle'],['marketing','Marketing'],['business','Business development'],['design','Design'],['prog','Programmation'],['proto','Prototypage & 3D'],['legal','Juridique & finance'],['other','Autres']];
const catName=k=>(CCATS.find(c=>c[0]===k)||[0,''])[1];
const FEM=['formation'];
const vowel=w=>/^[aeiouéèêh]/i.test(w);
const ce=w=>FEM.includes(w)?'cette':vowel(w)?'cet':'ce';
const nouveau=w=>FEM.includes(w)?'Nouvelle':vowel(w)?'Nouvel':'Nouveau';
const un=w=>FEM.includes(w)?'une':'un';
const aucun=w=>FEM.includes(w)?'Aucune':'Aucun';
const DEF={
 courses:{title:'Formations',sub:'Créez des formations, ajoutez et réorganisez les vidéos de chaque leçon.',one:'formation',layout:'cards',order:'position',folder:'formations',
   card:x=>({img:x.cover_url,t:x.title,s:[catName(x.category),x.level,x.instructor_name].filter(Boolean).join(' · '),pill:pill('courses',x.status)}),
   fields:[{k:'title',l:'Titre',t:'text',req:1,max:140},{row:[{k:'category',l:'Catégorie',t:'select',opts:CCATS},{k:'level',l:'Niveau',t:'select',opts:LEVELS.map(v=>[v,v])}]},{row:[{k:'status',l:'Statut',t:'select',opts:[['draft','Brouillon (invisible sur le site)'],['soon','Bientôt (visible, verrouillée)'],['published','Publiée (accessible)']]}]},{k:'description',l:'Petite description (affichée sur la carte de la formation)',t:'textarea',max:300,hint:'2 ou 3 phrases : ce que l\'élève va apprendre.'},{k:'cover_url',l:'Image de couverture',t:'media',accept:'image'},{sect:'Formateur'},{k:'instructor_name',l:'Nom du formateur',t:'text',max:80},{k:'instructor_photo_url',l:'Photo du formateur',t:'media',accept:'image'}],
   defaults:{level:'Débutant',status:'draft',category:'other'}},
 events:{title:'Événements',sub:'Les événements que PROTO.ME organise ou auxquels il participe.',one:'événement',layout:'rows',order:'starts_at',
   row:x=>({img:x.image_url,t:x.title,s:[x.starts_at?fmtDT(x.starts_at):'Date à annoncer',x.location].filter(Boolean).join(' · '),pill:pill('events',x.status)}),folder:'evenements',
   fields:[{k:'title',l:'Titre',t:'text',req:1,max:120},{k:'status',l:'Statut',t:'select',opts:[['draft','Brouillon (invisible)'],['soon','Prochainement'],['published','Publié (date et détails)'],['past','Passé']]},{k:'description',l:'Description',t:'textarea',max:800},{row:[{k:'starts_at',l:'Date et heure',t:'datetime'},{k:'location',l:'Lieu',t:'text',max:120}]},{k:'date_revealed',l:'Afficher la date sur le site',t:'toggle',hint:'Désactivé : la date reste floutée.'},{k:'image_url',l:'Image',t:'media',accept:'image'}],
   defaults:{status:'soon',date_revealed:false}},
 articles:{title:'Articles',sub:'Rédigez et publiez des articles sur le site.',one:'article',layout:'rows',order:'created_at',asc:false,folder:'articles',
   row:x=>({img:x.cover_url,t:x.title,s:(x.status==='published'&&x.published_at?'Publié le '+fmtD(x.published_at):'Créé le '+fmtD(x.created_at))+((x.tags||[]).length?' · '+x.tags.join(', '):''),pill:pill('articles',x.status)}),
   fields:[{k:'title',l:'Titre',t:'text',req:1,max:160},{k:'status',l:'Statut',t:'select',opts:[['draft','Brouillon (invisible)'],['published','Publié']]},{k:'excerpt',l:'Résumé (affiché sur la carte)',t:'textarea',max:300},{k:'cover_url',l:'Image de couverture',t:'media',accept:'image'},{k:'tags',l:'Thèmes',t:'tags'},{k:'body',l:'Texte de l\'article',t:'article',max:40000}],
   defaults:{status:'draft',tags:[]}},
 consultants:{title:'Consultants',sub:'Ajoutez, dévoilez ou retirez les experts proposés en consultation.',one:'consultant',layout:'cards',order:'position',folder:'consultants',
   card:x=>({img:x.photo_url||'media/team-'+(((x.position||1)-1)%8+1)+'.jpg',blur:!x.revealed,t:x.revealed&&x.name?x.name:x.role,s:x.revealed?x.role:'Nom masqué · '+(x.domain||''),pill:x.revealed?'<span class="pill p-ok">Dévoilé</span>':'<span class="pill p-warn">Bientôt</span>'}),
   fields:[{row:[{k:'role',l:'Spécialité',t:'text',req:1,max:80},{k:'domain',l:'Domaine',t:'text',max:40}]},{k:'name',l:'Nom et prénom',t:'text',max:80,hint:'Visible sur le site seulement si le profil est dévoilé.'},{k:'photo_url',l:'Photo',t:'media',accept:'image'},{k:'tags',l:'Sujets traités',t:'tags'},{k:'bio',l:'Présentation',t:'textarea',max:600},{k:'revealed',l:'Dévoiler le nom et la photo sur le site',t:'toggle'},{k:'published',l:'Afficher ce consultant',t:'toggle'}],
   defaults:{revealed:false,published:true,tags:[]}},
 gallery:{title:'Galerie',sub:'Photos et vidéos de la galerie de l\'atelier.',one:'élément',layout:'cards',order:'position',folder:'galerie',drop:true,
   card:x=>({img:x.media_url,type:x.media_type,obj:x.style!=='photo',t:x.title||'Sans titre',s:x.caption,tag:x.label}),
   fields:[{k:'media_url',l:'Photo ou vidéo',t:'media',accept:'both',req:1},{row:[{k:'title',l:'Titre',t:'text',max:80},{k:'caption',l:'Légende',t:'text',max:120}]},{row:[{k:'label',l:'Étiquette',t:'select',opts:[['','Aucune'],['Exemple','Exemple'],['Capture réelle','Capture réelle'],['Vidéo','Vidéo'],['Nouveau','Nouveau']]},{k:'style',l:'Affichage',t:'select',opts:[['photo','Photo plein cadre'],['obj-lav','Objet sur fond lavande'],['obj-lime','Objet sur fond citron'],['obj-ink','Objet sur fond noir']]}]},{k:'published',l:'Visible sur le site',t:'toggle'}],
   defaults:{style:'photo',label:'',published:true}},
 services:{title:'Services',sub:'Les services affichés dans le slider de la page d\'accueil.',one:'service',layout:'rows',order:'position',folder:'services',
   row:x=>({img:x.image_url,t:x.title,s:`<span class="swatch"><i style="background:${esc(x.bg)}"></i><i style="background:${esc(x.fg)}"></i><i style="background:${esc(x.accent)}"></i></span>${esc((x.chips||[]).slice(0,4).join(', '))}`,html:1,pill:pubPill(x.published)}),
   fields:[{k:'title',l:'Titre',t:'text',req:1,max:120},{k:'description',l:'Description',t:'textarea',max:600},{k:'image_url',l:'Image',t:'media',accept:'image'},{k:'is_object',l:'Image détourée (objet 3D sur fond coloré)',t:'toggle'},{k:'chips',l:'Mots-clés',t:'tags'},{k:'specs',l:'Caractéristiques',t:'kv'},{k:'colors',t:'colors'},{k:'needs',l:'Besoins pré-cochés dans le formulaire',t:'tags',hint:'Doivent correspondre aux choix du formulaire, ex. « Site web ».'},{k:'cta_consult',l:'Ajouter le bouton « Voir les consultants »',t:'toggle'},{k:'published',l:'Visible sur le site',t:'toggle'}],
   defaults:{bg:'#161616',fg:'#faf7f6',accent:'#ddf160',published:true,chips:[],specs:[],needs:[],is_object:false,cta_consult:false}}
};

function listView(t){ return async m=>{
  const d=DEF[t];
  m.innerHTML=topBar(d.title,d.sub,`<button class="btn pri" type="button" id="addB">${ic('plus')}${d.one==='élément'?'Ajouter à la galerie':'Ajouter '+un(d.one)+' '+d.one}</button>`)+(d.drop?`<label class="drop" id="drop"><input type="file" id="dropIn" accept="image/*,video/mp4,video/webm" multiple hidden>${ic('upload','style="width:26px;height:26px"')}<div><b>Glissez vos photos et vidéos ici</b> ou cliquez pour les choisir. Elles sont ajoutées directement à la galerie.</div></label>`:'')+`<div class="toolbar lsearch"><span class="count" id="lvCount"></span><label class="search">${ic('search')}<input id="lvQ" type="search" placeholder="Rechercher…" aria-label="Rechercher"></label></div><div class="${d.layout==='cards'?'cards':'list'}" id="lv">${loading(4)}</div>`;
  $('#addB').onclick=()=>openEditor(t,null);
  m.querySelector('#lvQ').oninput=e=>{ q=e.target.value; draw(); };
  let items=[], q='';
  const load=async()=>{ try{ items=await api.list(t,{order:d.order,asc:d.asc!==false}); }catch(e){ toast(errMsg(e),true); } draw(); };
  const draw=()=>{ const lv=$('#lv'); if(!lv) return;
    if(!items.length){ lv.className=''; lv.innerHTML=`<div class="empty"><b>${aucun(d.one)} ${d.one} pour l'instant</b>Ajoutez le premier, il apparaîtra sur le site une fois publié.<br><button class="btn pri" type="button" data-add>${ic('plus')}Ajouter</button></div>`; lv.querySelector('[data-add]').onclick=()=>openEditor(t,null); return; }
    lv.className=d.layout==='cards'?'cards':'list';
    const reord=d.order==='position'&&!q; const ql=q.toLowerCase(); const shown=ql?items.filter(x=>JSON.stringify(x).toLowerCase().includes(ql)):items;
    const pub=items.filter(x=>('published' in x)?x.published:['published','soon'].includes(x.status)).length;
    $('#lvCount').textContent=`${items.length} au total · ${pub} visible${pub>1?'s':''} sur le site`;
    if(!shown.length){ lv.innerHTML='<div class="empty sm" style="grid-column:1/-1"><b>Aucun résultat</b>Essayez un autre mot.</div>'; return; }
    lv.innerHTML=shown.map(x=>{ const i=items.indexOf(x); const acts=`${reord?`<button class="ib" type="button" data-up="${i}" aria-label="Monter" ${i===0?'disabled':''}>${ic('up')}</button><button class="ib" type="button" data-down="${i}" aria-label="Descendre" ${i===items.length-1?'disabled':''}>${ic('down')}</button>`:''}<button class="ib" type="button" data-edit="${x.id}" aria-label="Modifier">${ic('edit')}</button><button class="ib bad" type="button" data-del="${x.id}" aria-label="Supprimer">${ic('trash')}</button>`;
      if(d.layout==='cards'){ const c=d.card(x); const vis=('published' in x)?`<label class="sw" title="Visible sur le site"><input type="checkbox" data-pub="${x.id}" ${x.published?'checked':''}><i></i></label>`:'';
        return `<article class="card"><div class="cv ${c.obj?'obj':''} ${c.blur?'blur':''}" data-edit="${x.id}">${c.img?thumb(c.img,c.type):ic('img')}${c.pill||''}${c.tag?`<span class="tag2">${esc(c.tag)}</span>`:''}</div><div class="cb"><b>${esc(c.t)}</b><span>${esc(c.s||'')}</span></div><div class="cf">${vis?vis.replace('class="sw"','class="sw"'):'<span class="sw"></span>'}${acts}</div></article>`; }
      const r=d.row(x); return `<div class="row"><div class="th">${r.img?thumb(r.img):ic('img')}</div><div class="tt" data-edit="${x.id}" style="cursor:pointer"><b>${esc(r.t)}</b><span>${r.html?r.s:esc(r.s||'')}</span></div>${r.pill||''}<div class="ac">${acts}</div></div>`; }).join('');
  };
  $('#lv').onclick=async e=>{
    const ed=e.target.closest('[data-edit]'); if(ed){ return openEditor(t,items.find(x=>x.id===ed.dataset.edit),load); }
    const del=e.target.closest('[data-del]'); if(del){ const x=items.find(y=>y.id===del.dataset.del); if(!await confirmBox(`Supprimer ${ce(d.one)} ${d.one} ?`,t==='courses'?'La formation et toutes ses leçons seront supprimées définitivement.':'Cette action est définitive.')) return;
      try{ await api.del(t,x.id); ['media_url','image_url','cover_url','photo_url'].forEach(k=>x[k]&&api.delFile(x[k])); toast('Supprimé'); load(); }catch(err){ toast(errMsg(err),true); } return; }
    const up=e.target.closest('[data-up]'), dn=e.target.closest('[data-down]');
    if(up||dn){ const i=+(up?up.dataset.up:dn.dataset.down), j=up?i-1:i+1; const a=items[i], b=items[j]; if(!a||!b) return;
      const pa=a.position, pb=b.position===pa?pa+(up?-1:1):b.position;
      try{ await Promise.all([api.save(t,{id:a.id,position:pb}),api.save(t,{id:b.id,position:pa})]); load(); }catch(err){ toast(errMsg(err),true); } }
  };
  $('#lv').onchange=async e=>{ const p=e.target.closest('[data-pub]'); if(!p) return; try{ await api.save(t,{id:p.dataset.pub,published:p.checked}); toast(p.checked?'Visible sur le site':'Masqué du site'); const it=items.find(x=>x.id===p.dataset.pub); if(it) it.published=p.checked; }catch(err){ p.checked=!p.checked; toast(errMsg(err),true); } };
  if(d.drop){ const dz=$('#drop'), di=$('#dropIn');
    const add=async files=>{ files=[...files].filter(f=>/^(image|video)\//.test(f.type)); if(!files.length) return; let pos=Math.max(0,...items.map(x=>x.position||0));
      dz.innerHTML=`<span class="spin"></span> Envoi de ${files.length} fichier${files.length>1?'s':''}…`;
      for(const f of files){ try{ checkFile(f,'both'); const url=await api.upload(f,d.folder); await api.save('gallery',{position:++pos,title:f.name.replace(/\.[^.]+$/,'').slice(0,80),caption:'',label:'',media_url:url,media_type:f.type.startsWith('video')?'video':'image',style:'photo',published:true}); }catch(err){ toast(f.name+' : '+errMsg(err),true); } }
      toast('Galerie mise à jour'); go('gallery',true); };
    dz.ondragover=e=>{ e.preventDefault(); dz.classList.add('over'); }; dz.ondragleave=()=>dz.classList.remove('over');
    dz.ondrop=e=>{ e.preventDefault(); dz.classList.remove('over'); add(e.dataTransfer.files); };
    di.onchange=()=>add(di.files); }
  m._reload=load; load();
}; }
['courses','events','articles','consultants','gallery','services'].forEach(t=>VIEWS[t]=listView(t));

/* ---------- fichiers ---------- */
const MAXB=50*1024*1024;
const DOCX={pdf:['application/pdf','PDF'],doc:['application/msword','Word'],docx:['application/vnd.openxmlformats-officedocument.wordprocessingml.document','Word'],xls:['application/vnd.ms-excel','Excel'],xlsx:['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Excel'],ppt:['application/vnd.ms-powerpoint','PowerPoint'],pptx:['application/vnd.openxmlformats-officedocument.presentationml.presentation','PowerPoint'],csv:['text/csv','CSV']};
const extOf=n=>String(n||'').split('?')[0].split('.').pop().toLowerCase();
function mimeOf(f){ const e=DOCX[extOf(f.name)]; return e?e[0]:(f.type||'application/octet-stream'); }
const fsz=b=>!b?'':b<1024?b+' o':b<1048576?Math.round(b/1024)+' Ko':(b/1048576).toFixed(1).replace('.',',')+' Mo';
function checkFile(f,accept){ if(accept==='doc'){ if(!DOCX[extOf(f.name)]) throw new Error('Formats acceptés : PDF, Word, Excel, PowerPoint, CSV.'); if(f.size>MAXB) throw new Error('Fichier trop lourd (50 Mo maximum).'); return; }
  const okI=/^image\/(jpeg|png|webp|gif|avif)$/.test(f.type), okV=/^video\/(mp4|webm)$/.test(f.type);
  if(accept==='image'&&!okI) throw new Error('Formats acceptés : JPG, PNG, WebP, GIF, AVIF.');
  if(accept==='video'&&!okV) throw new Error('Formats acceptés : MP4 ou WebM.');
  if(accept==='both'&&!okI&&!okV) throw new Error('Format non pris en charge.');
  if(f.size>MAXB) throw new Error('Fichier trop lourd (50 Mo maximum). Compressez-le avant l\'envoi.'); }
const videoDuration=file=>new Promise(res=>{ const v=document.createElement('video'); v.preload='metadata'; v.onloadedmetadata=()=>{ res(Math.round(v.duration||0)); URL.revokeObjectURL(v.src); }; v.onerror=()=>res(0); v.src=URL.createObjectURL(file); });

/* ---------- tiroir ---------- */
let drawerDirty=false;
function openDrawer(title,body,foot){ const d=$('#drawer'); d.innerHTML=`<div class="dr-head"><h2 id="drT">${title}</h2><button class="ib" type="button" id="drX" aria-label="Fermer">${ic('x')}</button></div><div class="dr-body" id="drB">${body}</div>${foot?`<div class="dr-foot">${foot}</div>`:''}`;
  d.classList.add('on'); d.setAttribute('aria-hidden','false'); $('#scrim').classList.add('on'); drawerDirty=false;
  $('#drX').onclick=()=>closeDrawer(); d.oninput=e=>{ if(!e.target.closest('#lsBox,#dcBox')) drawerDirty=true; }; setTimeout(()=>{ const f=d.querySelector('.dr-body input:not([type=file]):not([type=checkbox]),.dr-body textarea'); f&&f.focus(); },120); }
async function closeDrawer(force){ const d=$('#drawer'); if(!d||!d.classList.contains('on')) return; if(drawerDirty&&!force&&!await confirmBox('Quitter sans enregistrer ?','Vos modifications seront perdues.','Quitter')) return; d.classList.remove('on'); d.setAttribute('aria-hidden','true'); $('#scrim').classList.remove('on'); drawerDirty=false; }
addEventListener('keydown',e=>{ if(e.key==='Escape'&&$('#drawer')&&$('#drawer').classList.contains('on')&&!$('#modal').classList.contains('on')) closeDrawer(); });

/* ---------- champs ---------- */
function fieldHTML(f,x){ const v=x[f.k]; const id='f_'+f.k;
  if(f.sect) return `<div class="sect">${esc(f.sect)}</div>`;
  if(f.row) return `<div class="${f.row.length===3?'three':'two'}">${f.row.map(g=>fieldHTML(g,x)).join('')}</div>`;
  const lab=`<span>${esc(f.l)}${f.req?' <b>*</b>':''}</span>`; const hint=f.hint?`<span class="hint">${esc(f.hint)}</span>`:'';
  switch(f.t){
   case 'text': return `<label class="fld">${lab}<input class="in" id="${id}" data-k="${f.k}" value="${esc(v)}" ${f.max?`maxlength="${f.max}"`:''}>${hint}</label>`;
   case 'textarea': return `<label class="fld">${lab}<textarea class="in" id="${id}" data-k="${f.k}" ${f.max?`maxlength="${f.max}"`:''}>${esc(v)}</textarea>${hint}</label>`;
   case 'select': return `<label class="fld">${lab}<select class="in" id="${id}" data-k="${f.k}">${f.opts.map(o=>`<option value="${esc(o[0])}" ${String(v??'')===o[0]?'selected':''}>${esc(o[1])}</option>`).join('')}</select>${hint}</label>`;
   case 'toggle': return `<div class="fld"><label class="sw"><input type="checkbox" id="${id}" data-k="${f.k}" ${v?'checked':''}><i></i>${esc(f.l)}</label>${hint}</div>`;
   case 'datetime': { let s=''; if(v){ const d=new Date(v); s=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16); } return `<label class="fld">${lab}<input class="in" type="datetime-local" id="${id}" data-k="${f.k}" value="${s}"></label>`; }
   case 'tags': return `<div class="fld">${lab}<div class="tagin" data-tags="${f.k}">${(v||[]).map(t=>`<span>${esc(t)}<button type="button" aria-label="Retirer">${ic('x','style="width:12px;height:12px"')}</button></span>`).join('')}<input placeholder="Écrire puis Entrée" aria-label="${esc(f.l)}"></div>${hint}</div>`;
   case 'kv': return `<div class="fld">${lab}<div class="kv" data-kv="${f.k}">${(v||[]).map(p=>kvRow(p[0],p[1])).join('')}</div><button class="btn sm" type="button" data-kvadd="${f.k}" style="justify-self:start">${ic('plus')}Ajouter une ligne</button></div>`;
   case 'colors': return `<div class="fld"><span>Couleurs de la diapositive</span><div class="colors">${[['bg','Fond'],['fg','Texte'],['accent','Bouton']].map(([k,l])=>`<label class="colorin" title="${l}"><input type="color" data-color="${k}" value="${esc(x[k]||'#000000')}"><input type="text" data-colortxt="${k}" value="${esc(x[k]||'')}" maxlength="7" aria-label="${l}"></label>`).join('')}</div><div class="svprev" id="svPrev"></div></div>`;
   case 'media': return `<div class="fld">${lab}<div class="up" data-media="${f.k}" data-accept="${f.accept}"><div class="pv">${v?thumb(v):ic(f.accept==='video'?'video':'img')}</div><div class="uc"><div class="row2"><label class="btn sm">${ic('upload')}${v?'Remplacer':'Envoyer un fichier'}<input type="file" hidden accept="${f.accept==='image'?'image/*':f.accept==='video'?'video/mp4,video/webm':'image/*,video/mp4,video/webm'}"></label>${v?`<button class="btn sm ghost" type="button" data-clear>Retirer</button>`:''}</div><input class="in" data-k="${f.k}" value="${esc(v)}" placeholder="ou collez un lien (https://…)" aria-label="Lien du fichier"><span class="hint">${f.accept==='image'?'JPG, PNG ou WebP':'Photo ou vidéo MP4'} · 50 Mo maximum</span></div></div></div>`;
   case 'article': return `<div class="fld">${lab}<div class="md-help">Mise en forme : <code>## Titre</code> pour un intertitre, <code>- texte</code> pour une liste, une ligne vide entre deux paragraphes, <code>**gras**</code>.</div><textarea class="in long" id="${id}" data-k="${f.k}" maxlength="${f.max}">${esc(v)}</textarea><div style="display:flex;justify-content:space-between;align-items:center"><span class="hint" id="artCnt"></span><button class="btn sm" type="button" id="artPv">${ic('eye')}Aperçu</button></div><div class="art-prev" id="artPrev" hidden></div></div>`;
  } return ''; }
const kvRow=(a='',b='')=>`<div class="kr"><input class="in" value="${esc(a)}" placeholder="ex. Matériaux" maxlength="40"><input class="in" value="${esc(b)}" placeholder="ex. PLA, PETG" maxlength="80"><button class="ib bad" type="button" data-kvdel aria-label="Retirer la ligne">${ic('x')}</button></div>`;
function mdToHtml(t){ const lines=String(t||'').split(/\n/); let out='',list=false,para=[];
  const inl=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  const flush=()=>{ if(para.length){ out+=`<p>${inl(para.join(' '))}</p>`; para=[]; } };
  for(const l of lines){ const s=l.trim();
    if(/^##\s+/.test(s)){ flush(); if(list){out+='</ul>';list=false;} out+=`<h3>${inl(s.replace(/^##\s+/,''))}</h3>`; }
    else if(/^-\s+/.test(s)){ flush(); if(!list){out+='<ul>';list=true;} out+=`<li>${inl(s.replace(/^-\s+/,''))}</li>`; }
    else if(!s){ flush(); if(list){out+='</ul>';list=false;} }
    else { if(list){out+='</ul>';list=false;} para.push(s); } }
  flush(); if(list) out+='</ul>'; return out; }

function bindFields(root,x,d){
  root.querySelectorAll('[data-tags]').forEach(box=>{ const inp=box.querySelector('input');
    const add=()=>{ const v=inp.value.trim().replace(/,$/,''); if(!v) return; v.split(',').map(s=>s.trim()).filter(Boolean).forEach(s=>{ const sp=document.createElement('span'); sp.innerHTML=`${esc(s.slice(0,60))}<button type="button" aria-label="Retirer">${ic('x','style="width:12px;height:12px"')}</button>`; box.insertBefore(sp,inp); }); inp.value=''; drawerDirty=true; };
    inp.onkeydown=e=>{ if(e.key==='Enter'||e.key===','){ e.preventDefault(); add(); } else if(e.key==='Backspace'&&!inp.value){ const l=inp.previousElementSibling; l&&l.remove(); } };
    inp.onblur=add; box.onclick=e=>{ const b=e.target.closest('span button'); if(b){ b.parentElement.remove(); drawerDirty=true; } else inp.focus(); }; });
  root.querySelectorAll('[data-kvadd]').forEach(b=>b.onclick=()=>{ const kv=root.querySelector(`[data-kv="${b.dataset.kvadd}"]`); kv.insertAdjacentHTML('beforeend',kvRow()); kv.lastElementChild.querySelector('input').focus(); });
  root.addEventListener('click',e=>{ const k=e.target.closest('[data-kvdel]'); if(k){ k.parentElement.remove(); drawerDirty=true; } });
  root.querySelectorAll('[data-media]').forEach(box=>{ const fi=box.querySelector('input[type=file]'), url=box.querySelector('input[data-k]'), pv=box.querySelector('.pv');
    const show=u=>{ pv.innerHTML=u?thumb(u):ic('img'); };
    url.oninput=()=>show(url.value.trim());
    const clr=box.querySelector('[data-clear]'); if(clr) clr.onclick=()=>{ url.value=''; show(''); drawerDirty=true; };
    fi.onchange=async()=>{ const f=fi.files[0]; if(!f) return; try{ checkFile(f,box.dataset.accept); }catch(e){ return toast(e.message,true); }
      pv.innerHTML='<span class="spin"></span>'; try{ const u=await api.upload(f,(d&&d.folder)||'divers'); url.value=u; show(u); drawerDirty=true; box.dataset.type=f.type.startsWith('video')?'video':'image'; toast('Fichier envoyé'); }catch(e){ show(url.value); toast(errMsg(e),true); } fi.value=''; }; });
  root.querySelectorAll('[data-color]').forEach(c=>{ const k=c.dataset.color, tx=root.querySelector(`[data-colortxt="${k}"]`);
    c.oninput=()=>{ tx.value=c.value; svPrev(); }; tx.oninput=()=>{ if(/^#[0-9a-f]{6}$/i.test(tx.value)){ c.value=tx.value; svPrev(); } }; });
  const svPrev=()=>{ const p=root.querySelector('#svPrev'); if(!p) return; const g=k=>root.querySelector(`[data-color="${k}"]`).value; const t=(root.querySelector('[data-k="title"]')||{}).value||'Titre du service';
    p.style.background=g('bg'); p.style.color=g('fg'); p.innerHTML=`<b>${esc(t)}</b><span>Aperçu des couleurs de la diapositive</span><em style="background:${g('accent')};color:${g('bg')}">Demander ce service</em>`; };
  svPrev(); const tt=root.querySelector('[data-k="title"]'); if(tt) tt.addEventListener('input',svPrev);
  const ap=root.querySelector('#artPv'); if(ap){ const ta=root.querySelector('[data-k="body"]'), pr=root.querySelector('#artPrev'), cnt=root.querySelector('#artCnt');
    const upd=()=>{ cnt.textContent=ta.value.length.toLocaleString('fr-FR')+' / 40 000 caractères'; if(!pr.hidden) pr.innerHTML=mdToHtml(ta.value); };
    ta.oninput=upd; ap.onclick=()=>{ pr.hidden=!pr.hidden; ap.innerHTML=ic(pr.hidden?'eye':'eyeoff')+(pr.hidden?'Aperçu':'Masquer l\'aperçu'); upd(); }; upd(); }
}
function readFields(root,d,x){ const out={};
  const flat=[]; d.fields.forEach(f=>f.sect?0:f.row?flat.push(...f.row):flat.push(f));
  for(const f of flat){
    if(f.t==='toggle') out[f.k]=root.querySelector(`[data-k="${f.k}"]`).checked;
    else if(f.t==='tags') out[f.k]=[...root.querySelectorAll(`[data-tags="${f.k}"] span`)].map(s=>s.textContent.trim()).filter(Boolean).slice(0,20);
    else if(f.t==='kv') out[f.k]=[...root.querySelectorAll(`[data-kv="${f.k}"] .kr`)].map(r=>[...r.querySelectorAll('input')].map(i=>i.value.trim())).filter(p=>p[0]||p[1]).slice(0,8);
    else if(f.t==='colors'){ ['bg','fg','accent'].forEach(k=>{ const v=root.querySelector(`[data-colortxt="${k}"]`).value.trim(); out[k]=/^#[0-9a-f]{6}$/i.test(v)?v.toLowerCase():x[k]; }); }
    else if(f.t==='datetime'){ const v=root.querySelector(`[data-k="${f.k}"]`).value; out[f.k]=v?new Date(v).toISOString():null; }
    else if(f.t==='media'){ const box=root.querySelector(`[data-media="${f.k}"]`); const v=box.querySelector('input[data-k]').value.trim();
      if(v&&!/^(https:\/\/|media\/|\/media\/|blob:)/.test(v)) throw new Error('Le lien du fichier doit commencer par https://');
      out[f.k]=v; if(f.k==='media_url'){ out.media_type=box.dataset.type||(/\.(mp4|webm)(\?|$)/i.test(v)?'video':'image'); } }
    else { const el=root.querySelector(`[data-k="${f.k}"]`); out[f.k]=el.value.trim(); }
    if(f.req&&(out[f.k]===''||out[f.k]==null)) throw new Error(`Le champ « ${f.l} » est obligatoire.`);
  }
  return out; }

async function openEditor(t,x,reload){
  const d=DEF[t]; const isNew=!x; x=x?{...x}:{...d.defaults};
  openDrawer(isNew?`${nouveau(d.one)} ${d.one}`:esc(x.title||x.role||'Modifier'),
   `<form id="edF" novalidate style="display:grid;gap:16px">${d.fields.map(f=>fieldHTML(f,x)).join('')}</form>${t==='courses'?`<div class="sect">Leçons (vidéos YouTube)</div><div id="lsBox">${isNew?'<div class="msg info">Enregistrez d\'abord la formation, puis ajoutez ses vidéos ici.</div>':loading(2)}</div><div class="sect">Documents à télécharger</div><div id="dcBox">${isNew?'<div class="msg info">Enregistrez d\'abord la formation, puis joignez ses documents ici.</div>':loading(1)}</div>`:''}`,
   `${isNew?'':`<button class="btn danger" type="button" id="edD">${ic('trash')}Supprimer</button>`}<span class="grow"></span><button class="btn" type="button" id="edC">Annuler</button><button class="btn pri" type="button" id="edS">${isNew?'Créer':'Enregistrer'}</button>`);
  const root=$('#drB'); bindFields(root,x,d);
  $('#edC').onclick=()=>closeDrawer();
  const after=()=>{ if(reload) reload(); else if(view===t) go(t,true); };
  $('#edS').onclick=async()=>{ const b=$('#edS'); let data; try{ data=readFields(root,d,x); }catch(e){ return toast(e.message,true); }
    if(t==='articles'&&data.status==='published'&&!x.published_at) data.published_at=new Date().toISOString();
    if(isNew&&'position' in (d.order==='position'?{position:1}:{})){ try{ const all=await api.list(t,{order:'position',asc:false}); data.position=((all[0]&&all[0].position)||0)+1; }catch(e){} }
    b.disabled=true; b.innerHTML='<span class="spin"></span>Enregistrement…';
    try{ const saved=await api.save(t,isNew?data:{id:x.id,...data}); toast(isNew?'Créé':'Enregistré'); drawerDirty=false; after();
      if(t==='courses'&&isNew){ openEditor(t,saved,reload); toast('Formation créée : ajoutez maintenant les vidéos'); } else closeDrawer(true);
    }catch(e){ toast(errMsg(e),true); b.disabled=false; b.textContent=isNew?'Créer':'Enregistrer'; } };
  if(!isNew) $('#edD').onclick=async()=>{ if(!await confirmBox(`Supprimer ${ce(d.one)} ${d.one} ?`,t==='courses'?'La formation et toutes ses leçons seront supprimées définitivement.':'Cette action est définitive.')) return; try{ await api.del(t,x.id); toast('Supprimé'); closeDrawer(true); after(); }catch(e){ toast(errMsg(e),true); } };
  if(t==='courses'&&!isNew){ lessonsManager(x); docsManager(x); }
}

/* ---------- documents d'une formation ---------- */
async function docsManager(course){
  const box=$('#dcBox'); let L=[];
  const load=async()=>{ try{ L=await api.list('course_files',{order:'position',eq:['course_id',course.id]}); }catch(e){ toast(errMsg(e),true); } draw(); };
  const draw=()=>{ if(!document.body.contains(box)) return;
    box.innerHTML=`<div class="docs-l">${L.map((f,i)=>{ const e=extOf(f.file_name||f.file_url), k=(DOCX[e]||[0,'Fichier'])[1];
      return `<div class="doc-r"><span class="doc-b t-${esc(k.toLowerCase())}">${esc(e.toUpperCase().slice(0,4)||'DOC')}</span>
      <div class="lt"><input class="in" data-dt="${f.id}" value="${esc(f.title)}" maxlength="140" aria-label="Titre du document ${i+1}"><small>${esc(k)}${f.size_bytes?' · '+fsz(f.size_bytes):''} · ${esc(f.file_name||'')}</small></div>
      <div class="ac" style="display:flex"><a class="ib" href="${esc(src(f.file_url))}" target="_blank" rel="noopener" aria-label="Ouvrir le document">${ic('ext')}</a><button class="ib" type="button" data-du="${i}" aria-label="Monter" ${i===0?'disabled':''}>${ic('up')}</button><button class="ib" type="button" data-dd="${i}" aria-label="Descendre" ${i===L.length-1?'disabled':''}>${ic('down')}</button><button class="ib bad" type="button" data-dx="${f.id}" aria-label="Supprimer le document">${ic('trash')}</button></div></div>`; }).join('')}</div>
      <label class="doc-drop" id="dcDrop"><input type="file" id="dcIn" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv" hidden>
        <span class="doc-ic">${ic('upload')}</span><span><b>Glissez vos fichiers ici</b> ou cliquez pour choisir<br><small>PDF, Word, Excel, PowerPoint, CSV · 50 Mo maximum</small></span></label>
      <p class="hint" style="margin:0">${L.length?'Les élèves les verront sous la formation, avec un bouton « Télécharger ».':'Aucun document : rien ne s\'affichera sous la formation.'}</p>`;
    const inp=$('#dcIn'), dz=$('#dcDrop');
    inp.onchange=()=>send([...inp.files]);
    dz.ondragover=e=>{ e.preventDefault(); dz.classList.add('over'); }; dz.ondragleave=()=>dz.classList.remove('over');
    dz.ondrop=e=>{ e.preventDefault(); dz.classList.remove('over'); send([...e.dataTransfer.files]); };
  };
  const send=async files=>{ if(!files.length) return; const dz=$('#dcDrop'); dz.classList.add('busy'); let pos=Math.max(0,...L.map(f=>f.position||0)), n=0;
    for(const f of files){ try{ checkFile(f,'doc'); const url=await api.upload(f,'documents');
      await api.save('course_files',{course_id:course.id,position:++pos,title:f.name.replace(/\.[^.]+$/,'').replace(/[-_]+/g,' ').slice(0,140)||'Document',file_url:url,file_name:f.name.slice(0,200),mime:mimeOf(f),size_bytes:f.size}); n++; }catch(err){ toast(f.name+' : '+errMsg(err),true); } }
    if(n) toast(n>1?n+' documents ajoutés':'Document ajouté'); load(); };
  box.onchange=async e=>{ const t=e.target; if(!t.dataset.dt) return;
    try{ if(!t.value.trim()) throw new Error('Le titre du document est obligatoire.'); await api.save('course_files',{id:t.dataset.dt,title:t.value.trim()}); toast('Titre enregistré'); }catch(err){ toast(errMsg(err),true); } };
  box.onclick=async e=>{ const u=e.target.closest('[data-du]'), d=e.target.closest('[data-dd]'), x=e.target.closest('[data-dx]');
    if(u||d){ const i=+(u?u.dataset.du:d.dataset.dd), j=u?i-1:i+1; const a=L[i], b=L[j]; if(!a||!b) return; try{ await Promise.all([api.save('course_files',{id:a.id,position:b.position}),api.save('course_files',{id:b.id,position:a.position===b.position?a.position+(u?-1:1):a.position})]); load(); }catch(err){ toast(errMsg(err),true); } }
    if(x){ const f=L.find(y=>y.id===x.dataset.dx); if(!await confirmBox('Supprimer ce document ?','Il ne sera plus téléchargeable sur le site.')) return; try{ await api.del('course_files',f.id); api.delFile(f.file_url); toast('Document supprimé'); load(); }catch(err){ toast(errMsg(err),true); } } };
  load();
}
/* ---------- leçons d'une formation (liens YouTube) ---------- */
function ytListId(u){ const m=String(u||'').match(/[?&]list=([A-Za-z0-9_-]{12,})/); return m?m[1]:''; }
function ytId(u){ u=String(u||'').trim(); const m=u.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/); return m?m[1]:''; }
const ytThumb=id=>`https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
async function ytTitle(url){ try{ const r=await fetch('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent(url)); if(!r.ok) return ''; const j=await r.json(); return String(j.title||'').slice(0,140); }catch(e){ return ''; } }
async function lessonsManager(course){
  const box=$('#lsBox'); let L=[];
  const load=async()=>{ try{ L=await api.list('lessons',{order:'position',eq:['course_id',course.id]}); }catch(e){ toast(errMsg(e),true); } draw(); };
  const vis=l=>{ if(!ytId(l.video_url)&&ytListId(l.video_url)) return `<span class="yt-tag">Playlist</span>`; const id=ytId(l.video_url); if(id) return `<img src="${ytThumb(id)}" alt="" loading="lazy"><span class="yt-tag">YouTube</span>`; if(l.video_url) return `<video src="${esc(src(l.video_url))}" muted preload="metadata"></video>`; return ic('video'); };
  const draw=()=>{ if(!document.body.contains(box)) return;
    box.innerHTML=`<div class="lessons">${L.map((l,i)=>`<div class="lesson" data-id="${l.id}"><span class="n">${i+1}</span><div class="vp">${vis(l)}</div>
      <div class="lt"><input class="in" data-lt="${l.id}" value="${esc(l.title)}" maxlength="140" aria-label="Titre de la leçon ${i+1}"><input class="in" data-lu2="${l.id}" value="${esc(l.video_url)}" placeholder="https://youtu.be/…" aria-label="Lien YouTube de la leçon ${i+1}">${l.video_url&&!ytId(l.video_url)&&!/\.(mp4|webm)/i.test(l.video_url)?'<small class="bad-t">Lien YouTube non reconnu</small>':''}</div>
      <div class="ac" style="display:flex">${ytId(l.video_url)?`<a class="ib" href="https://youtu.be/${ytId(l.video_url)}" target="_blank" rel="noopener" aria-label="Ouvrir sur YouTube">${ic('ext')}</a>`:''}<button class="ib" type="button" data-lu="${i}" aria-label="Monter" ${i===0?'disabled':''}>${ic('up')}</button><button class="ib" type="button" data-ld="${i}" aria-label="Descendre" ${i===L.length-1?'disabled':''}>${ic('down')}</button><button class="ib bad" type="button" data-lx="${l.id}" aria-label="Supprimer la leçon">${ic('trash')}</button></div></div>`).join('')||'<p class="hint" style="margin:0">Aucune leçon pour l\'instant.</p>'}</div>
      <div class="ls-add"><b>Ajouter une leçon</b><div class="ls-add-row"><input class="in" id="lsUrl" placeholder="Collez le lien YouTube (https://youtu.be/…)" aria-label="Lien YouTube"><input class="in" id="lsTitle" placeholder="Titre de la leçon" maxlength="140" aria-label="Titre de la leçon"><button class="btn pri" type="button" id="lsAdd">${ic('plus')}Ajouter</button></div>
      <div class="ls-prev" id="lsPrev" hidden></div>
      <p class="hint">Sur YouTube, mettez la vidéo en <b>« Non répertoriée »</b> : elle ne sera visible que depuis votre site. Les élèves suivent les leçons dans l'ordre, sans pouvoir avancer la vidéo.</p></div>`;
    const u=$('#lsUrl'), ti=$('#lsTitle'), pv=$('#lsPrev');
    u.oninput=async()=>{ const lid=ytListId(u.value); if(lid){ pv.hidden=false; pv.innerHTML=`<span><b>Playlist reconnue.</b> Toutes ses vidéos seront ajoutées sur le site, dans l'ordre de YouTube.${ytId(u.value)?' (Pour n\'ajouter que cette vidéo, retirez la partie « &list=… » du lien.)':''}</span>`; if(!ti.value.trim()) ti.value='Playlist YouTube'; return; }
      const id=ytId(u.value); if(!id){ pv.hidden=!u.value.trim(); pv.innerHTML=u.value.trim()?'<span class="bad-t">Ce lien ne ressemble pas à une vidéo YouTube.</span>':''; return; }
      pv.hidden=false; pv.innerHTML=`<img src="${ytThumb(id)}" alt=""><span>Vidéo reconnue <b>${id}</b></span>`; if(!ti.value.trim()){ const tt=await ytTitle(u.value); if(tt&&!ti.value.trim()) ti.value=tt; } };
    $('#lsAdd').onclick=async()=>{ const lid=ytListId(u.value); if(lid){ const b=$('#lsAdd'); b.disabled=true; try{ await api.save('lessons',{course_id:course.id,position:Math.max(0,...L.map(l=>l.position||0))+1,title:ti.value.trim()||'Playlist YouTube',video_url:'https://www.youtube.com/playlist?list='+lid,duration_sec:0}); toast('Playlist ajoutée'); load(); }catch(e){ toast(errMsg(e),true); b.disabled=false; } return; }
      const id=ytId(u.value); if(!id) return toast('Collez un lien YouTube ou une playlist valide.',true); const title=ti.value.trim()||('Leçon '+(L.length+1));
      const b=$('#lsAdd'); b.disabled=true; try{ await api.save('lessons',{course_id:course.id,position:Math.max(0,...L.map(l=>l.position||0))+1,title,video_url:'https://youtu.be/'+id,duration_sec:0}); toast('Leçon ajoutée'); load(); }catch(e){ toast(errMsg(e),true); b.disabled=false; } };
    ti.onkeydown=u.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); $('#lsAdd').click(); } };
  };
  box.onchange=async e=>{ const t=e.target;
    if(t.dataset.lt){ try{ if(!t.value.trim()) throw new Error('Le titre de la leçon est obligatoire.'); await api.save('lessons',{id:t.dataset.lt,title:t.value.trim()}); toast('Titre enregistré'); }catch(err){ toast(errMsg(err),true); } }
    if(t.dataset.lu2){ const lid=ytListId(t.value); if(lid){ try{ await api.save('lessons',{id:t.dataset.lu2,video_url:'https://www.youtube.com/playlist?list='+lid}); toast('Lien enregistré'); load(); }catch(err){ toast(errMsg(err),true); } return; } const id=ytId(t.value); if(!id) return toast('Lien YouTube non reconnu.',true); try{ await api.save('lessons',{id:t.dataset.lu2,video_url:'https://youtu.be/'+id}); toast('Lien enregistré'); load(); }catch(err){ toast(errMsg(err),true); } } };
  box.onclick=async e=>{ const u=e.target.closest('[data-lu]'), d=e.target.closest('[data-ld]'), x=e.target.closest('[data-lx]');
    if(u||d){ const i=+(u?u.dataset.lu:d.dataset.ld), j=u?i-1:i+1; const a=L[i], b=L[j]; if(!a||!b) return; try{ await Promise.all([api.save('lessons',{id:a.id,position:b.position}),api.save('lessons',{id:b.id,position:a.position===b.position?a.position+(u?-1:1):a.position})]); load(); }catch(err){ toast(errMsg(err),true); } }
    if(x){ const l=L.find(y=>y.id===x.dataset.lx); if(!await confirmBox('Supprimer cette leçon ?','Elle sera retirée de la formation.')) return; try{ await api.del('lessons',l.id); if(l.video_url&&!ytId(l.video_url)) api.delFile(l.video_url); toast('Leçon supprimée'); load(); }catch(err){ toast(errMsg(err),true); } } };
  load();
}

/* ---------- sécurité ---------- */
VIEWS.security=async m=>{
  m.innerHTML=topBar('Sécurité','Protégez l\'accès à votre espace admin.')+`<div class="grid2"><div style="display:grid;gap:16px">
   <div class="panel"><h3>${ic('lock','style="width:18px;height:18px"')}Double authentification (2FA)</h3><div id="mfaB">${loading(1)}</div></div>
   <div class="panel"><h3>${ic('shield','style="width:18px;height:18px"')}Changer le mot de passe</h3><form id="pwF" novalidate style="display:grid;gap:12px">
     <label class="fld"><span>Nouveau mot de passe</span><div class="pw"><input class="in" id="np1" type="password" autocomplete="new-password" minlength="12"><button type="button" id="npT" aria-label="Afficher">${ic('eye')}</button></div></label>
     <div class="meter"><i id="npM"></i></div><span class="hint" id="npH">12 caractères minimum, avec majuscules, chiffres et symboles.</span>
     <label class="fld"><span>Confirmer</span><input class="in" id="np2" type="password" autocomplete="new-password"></label>
     <button class="btn pri" type="submit" style="justify-self:start">Mettre à jour</button></form></div></div>
   <div style="display:grid;gap:16px;align-content:start">
   <div class="panel"><h3>Checklist</h3><div class="checks" id="chk"></div></div>
   <div class="panel"><h3>Sessions</h3><p class="hint" style="margin:0 0 12px">Déconnexion automatique après ${IDLE_MIN} minutes d'inactivité. Vous pouvez aussi fermer toutes les sessions ouvertes, sur tous les appareils.</p><button class="btn danger" type="button" id="soAll">${ic('out')}Déconnecter tous les appareils</button></div></div></div>`;
  $('#soAll').onclick=async()=>{ if(!await confirmBox('Déconnecter tous les appareils ?','Vous devrez vous reconnecter partout, y compris ici.','Déconnecter')) return; signOut('global'); };
  $('#npT').onclick=()=>{ const p=$('#np1'); p.type=p.type==='password'?'text':'password'; };
  const score=p=>{ let s=0; if(p.length>=12) s++; if(p.length>=16) s++; if(/[A-Z]/.test(p)&&/[a-z]/.test(p)) s++; if(/\d/.test(p)) s++; if(/[^A-Za-z0-9]/.test(p)) s++; return s; };
  $('#np1').oninput=e=>{ const s=score(e.target.value); const c=['var(--bad)','var(--bad)','var(--warn)','var(--warn)','var(--ok)','var(--ok)'][s]; $('#npM').style.width=(s/5*100)+'%'; $('#npM').style.background=c; $('#npH').textContent=['Trop court','Faible','Moyen','Correct','Fort','Très fort'][s]+' · 12 caractères minimum, avec majuscules, chiffres et symboles.'; };
  $('#pwF').onsubmit=async e=>{ e.preventDefault(); const a=$('#np1').value, b=$('#np2').value;
    if(a.length<12||score(a)<4) return toast('Choisissez un mot de passe plus fort (12 caractères, majuscules, chiffres, symboles).',true);
    if(a!==b) return toast('Les deux mots de passe ne correspondent pas.',true);
    if(DEMO){ toast('Mode démonstration : rien n\'est modifié'); return; }
    const {error}=await sb.auth.updateUser({password:a}); if(error) return toast(errMsg(error),true); $('#pwF').reset(); $('#npM').style.width='0'; toast('Mot de passe mis à jour'); };
  let mfaOn=false;
  const mfaDraw=async()=>{ const B=$('#mfaB');
    if(DEMO){ B.innerHTML=`<p class="hint" style="margin:0 0 12px">Ajoute un code à 6 chiffres, généré par une application comme Google Authenticator, en plus du mot de passe.</p><div class="msg info">Disponible une fois le site relié à Supabase.</div>`; return chk(); }
    const {data}=await sb.auth.mfa.listFactors(); const f=(data&&data.totp||[]).find(x=>x.status==='verified'); mfaOn=!!f;
    if(f){ B.innerHTML=`<div class="msg ok" style="margin-bottom:12px">La double authentification est active. Un code est demandé à chaque connexion.</div><button class="btn danger" type="button" id="mfaOff">Désactiver</button>`;
      $('#mfaOff').onclick=async()=>{ if(!await confirmBox('Désactiver la 2FA ?','Votre compte ne sera protégé que par le mot de passe.','Désactiver')) return; const r=await sb.auth.mfa.unenroll({factorId:f.id}); if(r.error) return toast(errMsg(r.error),true); toast('2FA désactivée'); mfaDraw(); }; }
    else { B.innerHTML=`<p class="hint" style="margin:0 0 12px">Ajoute un code à 6 chiffres, généré par une application comme Google Authenticator ou Authy, en plus du mot de passe. Fortement recommandé.</p><button class="btn lime" type="button" id="mfaOn">Activer la 2FA</button>`;
      $('#mfaOn').onclick=async()=>{ const old=(data&&data.totp||[]).filter(x=>x.status!=='verified'); for(const o of old) await sb.auth.mfa.unenroll({factorId:o.id});
        const r=await sb.auth.mfa.enroll({factorType:'totp',friendlyName:'PROTO.ME admin '+Date.now()}); if(r.error) return toast(errMsg(r.error),true);
        B.innerHTML=`<div class="qr"><img src="${esc(r.data.totp.qr_code)}" alt="QR code à scanner"><div style="display:grid;gap:10px"><b>1. Scannez ce QR code</b><span class="hint">avec Google Authenticator ou Authy. Clé manuelle : <code style="word-break:break-all">${esc(r.data.totp.secret)}</code></span><b>2. Saisissez le code affiché</b><input class="in code-in" id="mfaC" inputmode="numeric" maxlength="6" autocomplete="one-time-code"><button class="btn pri" type="button" id="mfaV">Confirmer</button></div></div>`;
        $('#mfaV').onclick=async()=>{ const code=$('#mfaC').value.replace(/\D/g,''); const ch=await sb.auth.mfa.challenge({factorId:r.data.id}); if(ch.error) return toast(errMsg(ch.error),true); const v=await sb.auth.mfa.verify({factorId:r.data.id,challengeId:ch.data.id,code}); if(v.error) return toast('Code incorrect, réessayez.',true); toast('2FA activée'); mfaDraw(); }; }; }
    chk(); };
  const chk=()=>{ const items=[[!DEMO,'Site relié à Supabase','Les données sont protégées par les règles de la base.'],[mfaOn,'Double authentification','Activez-la ci-contre.'],[location.protocol==='https:'||DEMO,'Connexion HTTPS','Vercel la fournit automatiquement.'],[true,'Inscriptions publiques','À désactiver dans Supabase (voir le guide).',1]];
    $('#chk').innerHTML=items.map(([ok,t,s,manual])=>`<div class="check ${ok&&!manual?'ok':'todo'}"><i>${ic(ok&&!manual?'check':'warn')}</i><div><b>${t}</b><span>${s}</span></div></div>`).join(''); };
  mfaDraw();
};

/* =====================================================================
   DÉMARRAGE
   ===================================================================== */
async function boot(){
  if(UNCONF){ rootEl().innerHTML=`<div class="unconf"><div class="box"><div class="brand" style="color:var(--fg)"><span class="mk" style="background:var(--fg);color:var(--bg)">${ic('box')}</span><span>proto.me<br>admin</span></div><h1>Espace admin pas encore relié</h1><p class="hint" style="font-size:15px;margin:0">Pour activer la connexion, remplissez le fichier <b>config.js</b> avec l'adresse et la clé de votre projet Supabase, puis republiez le site.</p><ol><li>Supabase › Project Settings › API</li><li>Copiez « Project URL » et la clé « anon public »</li><li>Collez-les dans config.js, puis republiez sur Vercel</li></ol></div></div>`; return; }
  if(DEMO){ renderLogin('pw'); return; }
  sb.auth.onAuthStateChange(ev=>{ if(ev==='SIGNED_OUT'&&user){ user=null; renderLogin('pw','Session terminée. Reconnectez-vous.'); } });
  const {data:{session}}=await sb.auth.getSession();
  if(session) afterSignIn(); else renderLogin('pw');
}
if(document.body) boot(); else document.addEventListener('DOMContentLoaded',boot);
})();
