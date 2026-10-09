import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, MapPin, Store, Users, MessageCircle, Compass, Plus, ChevronRight, ShieldCheck, Utensils, Shirt, Smartphone, BriefcaseBusiness, Heart, LogIn, LogOut, Menu, X, Sparkles, Clock3 } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const categories = [
  {label:'Food & Drinks',icon:Utensils,accent:'peach'},
  {label:'Fashion',icon:Shirt,accent:'lavender'},
  {label:'Gadgets',icon:Smartphone,accent:'blue'},
  {label:'Services',icon:BriefcaseBusiness,accent:'mint'}
];
const starterVendors = [
 {business_name:'Calabar Kitchen & More',category:'Food & Drinks',area:'Marian',description:'Local favorites, fresh soups and today’s specials.',is_open:true,verified:true,cover_image_url:'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80'},
 {business_name:'Thread Culture',category:'Fashion',area:'State Housing',description:'Everyday looks and statement pieces, selected with care.',is_open:true,verified:false,cover_image_url:'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80'},
 {business_name:'Pocket Tech Calabar',category:'Gadgets',area:'Watt Market',description:'Accessories, smart essentials and helpful local support.',is_open:false,verified:true,cover_image_url:'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80'},
 {business_name:'BrightSide Repairs',category:'Services',area:'Eight Miles',description:'Friendly home and device services from local professionals.',is_open:true,verified:false,cover_image_url:'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80'}
];
const demoGroups = [
 {name:'Calabar Food Lovers',description:'New spots, local dishes and what is cooking today.',members:248,tag:'FOOD'},
 {name:'Calabar Fashion & Style',description:'Looks, designers, drops and style inspiration.',members:192,tag:'STYLE'},
 {name:'Calabar Jobs & Opportunities',description:'Share openings, gigs and useful career leads.',members:516,tag:'CAREER'},
 {name:'Calabar Buy & Sell',description:'A community marketplace for the things we need.',members:384,tag:'MARKET'}
];
const money = n => new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(n || 0);

export default function App(){
 const [session,setSession] = useState(null);
 const [profile,setProfile] = useState(null);
 const [authOpen,setAuthOpen] = useState(false);
 const [authMode,setAuthMode] = useState('signup');
 const [authKind,setAuthKind] = useState('member');
 const [email,setEmail] = useState('');
 const [password,setPassword] = useState('');
 const [displayName,setDisplayName] = useState('');
 const [notice,setNotice] = useState('');
 const [busy,setBusy] = useState(false);
 const [vendors,setVendors] = useState([]);
 const [listings,setListings] = useState([]);
 const [groups,setGroups] = useState([]);
 const [query,setQuery] = useState('');
 const [category,setCategory] = useState('All');
 const [section,setSection] = useState('Discover');
 const [mobileMenu,setMobileMenu] = useState(false);
 const [showVendorForm,setShowVendorForm] = useState(false);
 const [businessName,setBusinessName] = useState('');
 const [businessCategory,setBusinessCategory] = useState('Food & Drinks');
 const [businessArea,setBusinessArea] = useState('Marian');
 const [businessDescription,setBusinessDescription] = useState('');
 const [businessPhoto,setBusinessPhoto] = useState(null);
 const [itemPhoto,setItemPhoto] = useState(null);
 const [showGroupForm,setShowGroupForm] = useState(false);
 const [groupName,setGroupName] = useState('');
 const [groupDescription,setGroupDescription] = useState('');
 const [groupVisibility,setGroupVisibility] = useState('public');
 const [showListingForm,setShowListingForm] = useState(false);
 const [itemTitle,setItemTitle] = useState('');
 const [itemPrice,setItemPrice] = useState('');
 const [itemCategory,setItemCategory] = useState('Food & Drinks');
 const [itemDescription,setItemDescription] = useState('');
 const [myVendor,setMyVendor] = useState(null);

 useEffect(()=>{
   if(!supabase){ setNotice('Connect this project to its own Supabase URL and publishable key to enable accounts and live data.'); return; }
   supabase.auth.getSession().then(({data})=>setSession(data.session));
   const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>setSession(next));
   return ()=>subscription.unsubscribe();
 },[]);
 useEffect(()=>{
   if(!supabase) return;
   let alive=true;
   async function load(){
    const [{data:vs},{data:ls},{data:gs}]=await Promise.all([
      supabase.from('vendors').select('*').order('created_at',{ascending:false}),
      supabase.from('listings').select('*').order('created_at',{ascending:false}).limit(12),
      supabase.from('community_groups').select('*,group_members(count)').eq('visibility','public').order('created_at',{ascending:false}).limit(12)
    ]);
    if(!alive)return;
    setVendors(vs?.length?vs:[]);
    setListings(ls||[]);
    setGroups(gs||[]);
   }
   load();
   return ()=>{alive=false};
 },[session]);
 useEffect(()=>{
  if(!supabase||!session?.user)return;
  supabase.from('profiles').select('*').eq('id',session.user.id).maybeSingle().then(({data})=>setProfile(data));
  supabase.from('vendors').select('*').eq('owner_id',session.user.id).maybeSingle().then(({data})=>setMyVendor(data));
 },[session]);
 const visibleVendors=useMemo(()=>{
  const source=vendors.length?vendors:starterVendors;
  return source.filter(v=>{
   const text=[v.business_name,v.category,v.area,v.description].join(' ').toLowerCase();
   return text.includes(query.toLowerCase())&&(category==='All'||v.category===category);
  });
 },[vendors,query,category]);
 async function authenticate(e){
  e.preventDefault(); setBusy(true); setNotice('');
  if(!supabase){setNotice('Supabase is not connected yet. Add the project environment variables first.');setBusy(false);return;}
  try{
   if(authMode==='signup'){
    const {data,error}=await supabase.auth.signUp({email,password,options:{data:{display_name:displayName||email.split('@')[0],member_kind:authKind,username:(displayName||email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g,'_')}}});
    if(error)throw error;
    setNotice(data.session?'Your account is ready. Welcome to the city.':'Account created. Check your email to confirm your address, then sign in.');
   }else{
    const {error}=await supabase.auth.signInWithPassword({email,password}); if(error)throw error; setAuthOpen(false);
   }
  }catch(err){setNotice(err.message||'Could not complete sign in.');}finally{setBusy(false);}
 }
 async function signOut(){await supabase?.auth.signOut();setProfile(null);setMyVendor(null);}
 async function uploadImage(file,folder){
  if(!file||!supabase||!session?.user)return null;
  if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)){throw new Error('Please choose a JPG, PNG, WEBP or GIF image.');}
  if(file.size>10*1024*1024)throw new Error('Images must be 10 MB or smaller.');
  const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]/g,'-');
  const path=session.user.id+'/'+folder+'/'+Date.now()+'-'+safe;
  const {error}=await supabase.storage.from('calabar-connect-media').upload(path,file,{upsert:false,contentType:file.type});
  if(error)throw error;
  return supabase.storage.from('calabar-connect-media').getPublicUrl(path).data.publicUrl;
 }
 async function createVendor(e){
  e.preventDefault(); if(!requireAuth())return;
  try{
   const cover_image_url=await uploadImage(businessPhoto,'vendors');
   const slug=businessName.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')+'-'+session.user.id.slice(0,5);
   const {data,error}=await supabase.from('vendors').insert({owner_id:session.user.id,business_name:businessName,slug,category:businessCategory,area:businessArea,description:businessDescription,cover_image_url}).select().single();
   if(error)throw error; setMyVendor(data);setVendors(v=>[data,...v]);setShowVendorForm(false);setNotice('Your vendor profile is live. Add your first listing next.');
  }catch(err){setNotice(err.message||'Could not create vendor profile.');}
 }
 async function createListing(e){
  e.preventDefault(); if(!requireAuth()||!myVendor)return;
  try{
   const imageUrl=await uploadImage(itemPhoto,'listings');
   const {data,error}=await supabase.from('listings').insert({vendor_id:myVendor.id,title:itemTitle,price_ngn:Number(itemPrice),category:itemCategory,description:itemDescription,image_urls:imageUrl?[imageUrl]:[]}).select().single();
   if(error)throw error;setListings(l=>[data,...l]);setShowListingForm(false);setItemTitle('');setItemPrice('');setItemDescription('');setItemPhoto(null);setNotice('Your listing is published.');
  }catch(err){setNotice(err.message||'Could not publish listing.');}
 }
 async function createGroup(e){
  e.preventDefault();if(!requireAuth())return;
  const slug=groupName.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  const {data,error}=await supabase.from('community_groups').insert({owner_id:session.user.id,name:groupName,slug,description:groupDescription,visibility:groupVisibility}).select().single();
  if(error){setNotice(error.message);return;}
  const memberError=await supabase.from('group_members').insert({group_id:data.id,user_id:session.user.id,role:'owner',status:'active'});
  setGroups(g=>[data,...g]);setShowGroupForm(false);setGroupName('');setGroupDescription('');setNotice(memberError.error?'Group created. Membership setup needs attention.':'Your group is live. Invite your friends to join.');
 }
 function requireAuth(){if(!session){setAuthOpen(true);setAuthMode('signup');return false;}return true}
 async function joinGroup(g){
  if(!requireAuth())return;
  const {error}=await supabase.from('group_members').insert({group_id:g.id,user_id:session.user.id,status:g.visibility==='private'?'requested':'active'});
  setNotice(error?error.message:(g.visibility==='private'?'Request sent to group moderators.':'You joined the group.'));
 }
 async function sendEnquiry(v){
  if(!requireAuth())return;
  const message=window.prompt('What would you like to ask this vendor?'); if(!message?.trim())return;
  const {error}=await supabase.from('vendor_enquiries').insert({vendor_id:v.id,customer_id:session.user.id,message:message.trim()});
  setNotice(error?error.message:'Enquiry sent. The vendor can respond through their dashboard.');
 }
 const go=s=>{setSection(s);setMobileMenu(false);window.scrollTo({top:0,behavior:'smooth'});};
 const openAuth=(mode='signup')=>{setAuthMode(mode);setAuthOpen(true);setNotice('');};
 const NavItem=({name,icon:Icon})=><button className={'nav-item '+(section===name?'active':'')} onClick={()=>go(name)}><Icon size={18}/><span>{name}</span></button>;
 return <div className="app-shell">
  <header className="topbar">
   <button className="brand" onClick={()=>go('Discover')} aria-label="Calabar Connect City home"><span className="brand-mark">C<span>+</span></span><span className="brand-copy"><strong>Calabar Connect</strong><small>CITY · COMMUNITY · COMMERCE</small></span></button>
   <div className="top-search"><Search size={18}/><input value={query} onChange={e=>{setQuery(e.target.value);setSection('Discover')}} placeholder="Find vendors, services, food..." /><kbd>⌘ K</kbd></div>
   <div className="top-actions">{session?<><button className="icon-btn" title="Messages" onClick={()=>go('Messages')}><MessageCircle size={19}/></button><button className="profile-chip" onClick={()=>go('Profile')}>{(profile?.display_name||session.user.email||'M').slice(0,1).toUpperCase()}</button><button className="outline-btn" onClick={signOut}><LogOut size={16}/> Sign out</button></>:<><button className="text-btn" onClick={()=>openAuth('login')}>Log in</button><button className="primary-btn small" onClick={()=>openAuth('signup')}>Join the city <ChevronRight size={16}/></button></>}</div>
   <button className="mobile-menu" onClick={()=>setMobileMenu(!mobileMenu)}>{mobileMenu?<X/>:<Menu/>}</button>
  </header>
  <div className="layout">
   <aside className={'sidebar '+(mobileMenu?'open':'')}>
    <div className="city-status"><span className="live-dot"/><span><b>CALABAR, NIGERIA</b><small>Your city is alive</small></span></div>
    <div className="nav-label">YOUR SPACE</div><NavItem name="Discover" icon={Compass}/><NavItem name="Vendors" icon={Store}/><NavItem name="Community" icon={Users}/><NavItem name="Messages" icon={MessageCircle}/>
    <div className="nav-label space-top">YOUR ACCOUNT</div><NavItem name="Saved" icon={Heart}/><NavItem name="Profile" icon={Users}/>
    <div className="sidebar-card"><div className="sparkle"><Sparkles size={18}/></div><b>Make your business known.</b><p>Meet new customers across Calabar.</p><button onClick={()=>{if(requireAuth())setShowVendorForm(true)}}>Become a vendor <ChevronRight size={15}/></button></div>
    <div className="sidebar-footer">Built for the city we call home.<br/><span>CALABAR CONNECT CITY © 2026</span></div>
   </aside>
   <main className="main-content">
    {notice&&<div className="notice"><span>{notice}</span><button onClick={()=>setNotice('')}><X size={16}/></button></div>}
    {section==='Discover'&&<><section className="hero">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"/> THE CITY, CONNECTED</div><h1>Good things<br/>happen <em>locally.</em></h1><p>Discover the people, places and small businesses that make Calabar special. Your next favorite is closer than you think.</p><div className="hero-actions"><button className="primary-btn" onClick={()=>go('Vendors')}>Explore local vendors <ChevronRight size={17}/></button><button className="hero-link" onClick={()=>{if(requireAuth())setShowVendorForm(true)}}>I run a business <Plus size={16}/></button></div><div className="hero-trust"><div className="avatar-stack"><span>F</span><span>T</span><span>J</span><span>+</span></div><span><b>Made for Calabar</b><small>People first. Local always.</small></span></div></div>
      <div className="hero-visual"><div className="hero-image"></div><div className="floating-card location-float"><MapPin size={16}/><span><b>Calabar, Cross River</b><small>Find it around the corner</small></span></div><div className="floating-card pulse-float"><span className="live-dot"/><span><b>Local life, live</b><small>Discover who's open today</small></span></div><div className="hero-image-caption">01 — OUR CITY, OUR PEOPLE</div></div>
    </section>
    <section className="section-block"><div className="section-heading"><div><span className="kicker">START EXPLORING</span><h2>What are you looking for?</h2><p>A little of everything, right here in town.</p></div><button className="view-all" onClick={()=>go('Vendors')}>All categories <ChevronRight size={16}/></button></div><div className="category-grid">{categories.map(c=><button key={c.label} className={'category-tile '+c.accent} onClick={()=>{setCategory(c.label);go('Vendors')}}><span className="category-icon"><c.icon size={21}/></span><b>{c.label}</b><span className="tile-arrow"><ChevronRight size={16}/></span></button>)}</div></section>
    <section className="section-block"><div className="section-heading"><div><span className="kicker">GOOD PEOPLE, GREAT FINDS</span><h2>Local favorites</h2><p>Meet businesses worth knowing.</p></div><button className="view-all" onClick={()=>go('Vendors')}>Explore vendors <ChevronRight size={16}/></button></div><div className="vendor-grid">{visibleVendors.slice(0,4).map((v,i)=><VendorCard key={v.id||v.business_name} vendor={v} onContact={()=>sendEnquiry(v)} onOpen={()=>go('Vendors')}/>)}</div>{!visibleVendors.length&&<Empty text="No matches just yet. Try another search or category."/>}</section>
    <section className="community-banner"><div className="banner-orb"></div><div><span className="kicker light">MORE THAN A MARKETPLACE</span><h2>Your people are here.</h2><p>Find your circles, share what matters, and make the city feel a little smaller.</p><button className="light-btn" onClick={()=>go('Community')}>Meet the community <ChevronRight size={16}/></button></div><div className="banner-art"><div className="art-circle a1">C</div><div className="art-circle a2">F</div><div className="art-circle a3">J</div><div className="art-circle a4">T</div><div className="art-center"><Users size={28}/></div></div></section>
    <section className="section-block"><div className="section-heading"><div><span className="kicker">FIND YOUR CIRCLE</span><h2>Community groups</h2><p>Shared interests make good connections.</p></div><button className="view-all" onClick={()=>go('Community')}>Browse groups <ChevronRight size={16}/></button></div><div className="group-grid">{(groups.length?groups:demoGroups).slice(0,4).map((g,i)=><GroupCard key={g.id||g.name} group={g} index={i} onJoin={()=>g.id?joinGroup(g):openAuth('signup')}/>)}</div></section></>}
    {section==='Vendors'&&<><PageHeading kicker="LOCAL DIRECTORY" title="Find your next favorite." subtitle="Independent businesses, useful services and good finds around Calabar."/><div className="filter-row"><button className={category==='All'?'filter active':'filter'} onClick={()=>setCategory('All')}>All vendors</button>{categories.map(c=><button key={c.label} className={category===c.label?'filter active':'filter'} onClick={()=>setCategory(c.label)}>{c.label}</button>)}<span className="results-count">{visibleVendors.length} results</span></div><div className="vendor-grid">{visibleVendors.map(v=><VendorCard key={v.id||v.business_name} vendor={v} onContact={()=>sendEnquiry(v)} onOpen={()=>{}}/>)}</div>{!visibleVendors.length&&<Empty text="No vendors match this search yet. Try a different category or check back soon."/>}<button className="vendor-cta" onClick={()=>{if(requireAuth())setShowVendorForm(true)}}><Plus size={18}/> List your business on Calabar Connect</button></>}
    {section==='Community'&&<><PageHeading kicker="PEOPLE MAKE THE CITY" title="Find your people." subtitle="Join conversations around food, fashion, work and everyday Calabar life."/><div className="community-tools"><div><Users size={20}/><span><b>Open community</b><small>Join groups and get to know people who share your interests.</small></span></div><button className="primary-btn" onClick={()=>{if(requireAuth())setShowGroupForm(true)}}><Plus size={17}/> Create a group</button></div><div className="group-grid large">{(groups.length?groups:demoGroups).map((g,i)=><GroupCard key={g.id||g.name} group={g} index={i} onJoin={()=>g.id?joinGroup(g):openAuth('signup')}/>)}</div><div className="safety-note"><ShieldCheck size={19}/><span><b>Keep the community welcoming.</b><br/>Block or report unwanted behavior. Share only information you feel comfortable making public.</span></div></>}
    {section==='Messages'&&<><PageHeading kicker="YOUR CONVERSATIONS" title="Messages." subtitle="Keep up with vendors and people you meet in the city."/><div className="empty-panel"><div className="empty-icon"><MessageCircle size={25}/></div><h3>Your conversations start here.</h3><p>Message a vendor from their profile or connect with community members to start a conversation.</p><button className="primary-btn" onClick={()=>go('Vendors')}>Explore vendors <ChevronRight size={16}/></button>{!session&&<button className="text-btn" onClick={()=>openAuth('signup')}>Create an account to message</button>}</div></>}
    {section==='Saved'&&<><PageHeading kicker="YOUR SHORTLIST" title="Saved for later." subtitle="Keep the vendors and finds you want to come back to."/><div className="empty-panel"><div className="empty-icon"><Heart size={25}/></div><h3>Your favorites, all together.</h3><p>Saving vendors and products will be available once you sign in.</p><button className="primary-btn" onClick={()=>session?go('Vendors'):openAuth('signup')}>{session?'Explore vendors':'Join the city'} <ChevronRight size={16}/></button></div></>}
    {section==='Profile'&&<><PageHeading kicker="YOUR CALABAR PROFILE" title={profile?.display_name||'Your profile.'} subtitle={profile?.bio||'A place for your name, your people and your local story.'}/>{session?<div className="profile-panel"><div className="profile-avatar">{(profile?.display_name||session.user.email||'M').slice(0,1).toUpperCase()}</div><div><h3>{profile?.display_name||session.user.email}</h3><p>{profile?.username?'@'+profile.username:'Calabar Connect member'} · {profile?.member_kind==='vendor'?'Vendor':'Community Member'}</p><p>{session.user.email}</p></div><button className="outline-btn" onClick={()=>setNotice('Profile editing will be added in the next build.')}>Edit profile</button></div>:<div className="empty-panel"><div className="empty-icon"><Users size={25}/></div><h3>Your profile, your city.</h3><p>Sign in to manage your profile, friendships and vendor account.</p><button className="primary-btn" onClick={()=>openAuth('signup')}>Create account <ChevronRight size={16}/></button></div>}{session&&<div className="dashboard-grid"><div className="dashboard-card"><Store/><h3>Vendor dashboard</h3><p>{myVendor?'Manage your storefront and listings.':'Bring your business to the local community.'}</p><button className="view-all" onClick={()=>myVendor?setShowListingForm(true):setShowVendorForm(true)}>{myVendor?'Add a listing':'Become a vendor'} <ChevronRight size={15}/></button></div><div className="dashboard-card"><Users/><h3>Friends & groups</h3><p>Build your circle and find community spaces.</p><button className="view-all" onClick={()=>go('Community')}>Explore community <ChevronRight size={15}/></button></div></div>}</>}
    <footer className="mobile-footer"><span>CALABAR CONNECT CITY</span><span>Made for the city we call home.</span></footer>
   </main>
  </div>
  {authOpen&&<div className="modal-backdrop" onClick={()=>setAuthOpen(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setAuthOpen(false)}><X size={18}/></button><div className="modal-brand">C<span>+</span></div><span className="kicker">YOUR CITY IS CALLING</span><h2>{authMode==='signup'?'Join Calabar Connect.':'Welcome back.'}</h2><p>{authMode==='signup'?'Meet your local community, discover vendors and start connecting.':'Pick up where you left off in the city.'}</p><div className="auth-switch"><button className={authMode==='signup'?'selected':''} onClick={()=>setAuthMode('signup')}>Create account</button><button className={authMode==='login'?'selected':''} onClick={()=>setAuthMode('login')}>Log in</button></div><form onSubmit={authenticate} className="stack-form">{authMode==='signup'&&<><label>Your name<input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="How should we call you?" required/></label><label>I'm joining as<select value={authKind} onChange={e=>setAuthKind(e.target.value)}><option value="member">Community Member</option><option value="vendor">Vendor / Business owner</option></select></label></>}<label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters" minLength="6" required/></label><button className="primary-btn full" disabled={busy}>{busy?'Please wait…':authMode==='signup'?'Create my account':'Log in'} <ChevronRight size={16}/></button></form><small className="fine-print">By continuing, you agree to be respectful and help keep our community safe.</small></div></div>}
  {showVendorForm&&<div className="modal-backdrop" onClick={()=>setShowVendorForm(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowVendorForm(false)}><X size={18}/></button><span className="kicker">LOCAL BUSINESS PROFILE</span><h2>Put your business on the map.</h2><p>Tell Calabar what you do. You can add photos and products from your dashboard.</p><form className="stack-form" onSubmit={createVendor}><label>Business name<input value={businessName} onChange={e=>setBusinessName(e.target.value)} required placeholder="Your shop or service name"/></label><label>Category<select value={businessCategory} onChange={e=>setBusinessCategory(e.target.value)}>{categories.map(c=><option key={c.label}>{c.label}</option>)}</select></label><label>Area in Calabar<input value={businessArea} onChange={e=>setBusinessArea(e.target.value)} required placeholder="e.g. Marian, Watt Market"/></label><label>Short description<textarea value={businessDescription} onChange={e=>setBusinessDescription(e.target.value)} placeholder="What should customers know?" rows="3"/></label><label>Business cover photo (optional)<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>setBusinessPhoto(e.target.files?.[0]||null)}/></label><button className="primary-btn full">Create vendor profile <ChevronRight size={16}/></button></form></div></div>}
  {showGroupForm&&<div className="modal-backdrop" onClick={()=>setShowGroupForm(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowGroupForm(false)}><X size={18}/></button><span className="kicker">COMMUNITY SPACE</span><h2>Create your group.</h2><p>Bring people together around something you care about.</p><form className="stack-form" onSubmit={createGroup}><label>Group name<input value={groupName} onChange={e=>setGroupName(e.target.value)} required maxLength="70" placeholder="e.g. Calabar Weekend Plans"/></label><label>Description<textarea value={groupDescription} onChange={e=>setGroupDescription(e.target.value)} rows="3" maxLength="300" placeholder="What is this group about?"/></label><label>Who can join?<select value={groupVisibility} onChange={e=>setGroupVisibility(e.target.value)}><option value="public">Public — anyone can join</option><option value="private">Private — members request access</option></select></label><button className="primary-btn full">Create group <ChevronRight size={16}/></button></form></div></div>}
  {showListingForm&&<div className="modal-backdrop" onClick={()=>setShowListingForm(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowListingForm(false)}><X size={18}/></button><span className="kicker">YOUR STOREFRONT</span><h2>Add a product or menu item.</h2><p>Give customers clear details and an accurate price.</p><form className="stack-form" onSubmit={createListing}><label>Item name<input value={itemTitle} onChange={e=>setItemTitle(e.target.value)} required placeholder="Name of product, meal or service"/></label><label>Price in naira<input type="number" min="0" value={itemPrice} onChange={e=>setItemPrice(e.target.value)} required placeholder="e.g. 4500"/></label><label>Category<select value={itemCategory} onChange={e=>setItemCategory(e.target.value)}>{categories.map(c=><option key={c.label}>{c.label}</option>)}</select></label><label>Description<textarea value={itemDescription} onChange={e=>setItemDescription(e.target.value)} rows="3" placeholder="Describe this item"/></label><label>Product or menu photo (optional)<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>setItemPhoto(e.target.files?.[0]||null)}/></label><button className="primary-btn full">Publish listing <ChevronRight size={16}/></button></form></div></div>}
 </div>;
}

function VendorCard({vendor:v,onContact,onOpen}){
 const [saved,setSaved]=useState(false);
 return <article className="vendor-card"><button className="vendor-image-wrap" onClick={onOpen}><img src={v.cover_image_url||'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80'} alt={v.business_name}/><span className={'open-badge '+(v.is_open?'open':'closed')}><span/> {v.is_open?'Open today':'Currently offline'}</span><button className={'save-button '+(saved?'saved':'')} onClick={e=>{e.stopPropagation();setSaved(!saved)}} aria-label="Save vendor"><Heart size={16} fill={saved?'currentColor':'none'}/></button></button><div className="vendor-card-body"><div className="vendor-meta"><span>{v.category}</span>{v.verified&&<span className="verified"><ShieldCheck size={13}/> VERIFIED</span>}</div><h3>{v.business_name}</h3><p className="vendor-description">{v.description||'Discover this local business in Calabar.'}</p><div className="vendor-location"><MapPin size={14}/>{v.area||v.address||'Calabar, Cross River'}</div><div className="vendor-card-bottom"><span className="vendor-rating"><span>★</span> New locally</span><button className="contact-btn" onClick={onContact}>Contact <MessageCircle size={14}/></button></div></div></article>
}
function GroupCard({group:g,index,onJoin}){
 const classes=['group-art coral','group-art lilac','group-art ocean','group-art green'];
 const Icon=[Utensils,Shirt,BriefcaseBusiness,Store][index%4];
 return <article className="group-card"><div className={classes[index%4]}><span className="group-tag">{g.tag||'COMMUNITY'}</span><div className="group-illustration"><Icon size={42}/></div><div className="group-art-index">0{index+1}</div></div><div className="group-card-body"><h3>{g.name}</h3><p>{g.description}</p><div className="group-card-bottom"><span><Users size={14}/> {g.members||g.group_members?.[0]?.count||0} members</span><button onClick={onJoin}>Join group <ChevronRight size={14}/></button></div></div></article>
}
function PageHeading({kicker,title,subtitle}){return <section className="page-heading"><span className="kicker">{kicker}</span><h1>{title}</h1><p>{subtitle}</p></section>}
function Empty({text}){return <div className="empty-inline"><Search size={20}/><p>{text}</p></div>}