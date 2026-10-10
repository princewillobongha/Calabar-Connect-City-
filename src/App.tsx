import { useEffect, useMemo, useState } from 'react';
import { auth, api, uploadImage } from './lib/supabase';
import {
  Search,
  MapPin,
  Menu,
  Bell,
  MessageCircle,
  Heart,
  Store,
  Users,
  ShoppingBag,
  BriefcaseBusiness,
  Utensils,
  Shirt,
  Plus,
  ChevronRight,
  X,
  LogIn,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
  ShoppingCart,
  Bookmark,
  UserRound,
  BadgeCheck,
} from 'lucide-react';

type Listing = {
  id: string;
  title: string;
  category: string;
  price: string;
  location: string;
  description: string;
  image: string;
  images?: string[];
  vendor: string;
  kind: string;
};
type Group = {
  id: string;
  name: string;
  category: string;
  description: string;
  members: number;
};
type Post = {
  id: string;
  text: string;
  author: string;
  created_at: string;
  category: string;
  image_url?: string | null;
  author_id?: string;
  is_verified?: boolean;
  avatar_url?: string | null;
};
const categories = [
  { name: 'All', icon: ShoppingBag, color: 'sand' },
  { name: 'Food', icon: Utensils, color: 'peach' },
  { name: 'Fashion', icon: Shirt, color: 'rose' },
  { name: 'Services', icon: BriefcaseBusiness, color: 'blue' },
  { name: 'Jobs', icon: Sparkles, color: 'green' },
];
function money(value: string) {
  return value || 'Ask for price';
}
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [saved, setSaved] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('ccc-saved') || '[]'); } catch { return []; } });
  const [active, setActive] = useState('Discover');
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showListingForm, setShowListingForm] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [notice, setNotice] = useState('');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [form, setForm] = useState({
    title: '',
    category: 'Product',
    price: '',
    location: 'Calabar, Cross River',
    description: '',
    image: '',
    whatsapp_url: '',
  });
  const [postText, setPostText] = useState('');
  const [busy, setBusy] = useState(false);
  const [memberPanel, setMemberPanel] = useState<'messages' | 'friends' | 'notifications' | null>(null);
  const [memberItems, setMemberItems] = useState<any[]>([]);
  const [recipientId, setRecipientId] = useState('');
  const [memberText, setMemberText] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin'|'signup'>('signin');
  const [listingImage, setListingImage] = useState<File[]>([]);
  const [postImage, setPostImage] = useState<File|null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<any>({username:'',display_name:'',full_name:'',bio:'',avatar_url:''});
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showPeople, setShowPeople] = useState(false);
  const [peopleQuery, setPeopleQuery] = useState('');
  const [people, setPeople] = useState<any[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [publicProfile, setPublicProfile] = useState<any>(null);
  const [isFollowingProfile, setIsFollowingProfile] = useState(false);
  const [adminProfiles, setAdminProfiles] = useState<any[]>([]);
  const [adminReports, setAdminReports] = useState<any[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [openComments, setOpenComments] = useState<string|null>(null);
  const [comments, setComments] = useState<Record<string,any[]>>({});
  const [commentText, setCommentText] = useState<Record<string,string>>({});
  const [cart, setCart] = useState<Listing[]>(() => { try { return JSON.parse(localStorage.getItem('ccc-cart') || '[]'); } catch { return []; } });
  useEffect(() => { localStorage.setItem('ccc-cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('ccc-saved', JSON.stringify(saved)); }, [saved]);
  useEffect(() => {
    let live = true;
    Promise.all([
      auth.getUser().catch(() => null),
      api.get('/api/listings').catch(() => ({ data: { items: [] } })),
      api.get('/api/groups').catch(() => ({ data: { items: [] } })),
      api.get('/api/posts').catch(() => ({ data: { items: [] } })),
    ]).then(([u, l, g, p]) => {
      if (!live) return;
      if (u) setUser(u);
      const remoteListings = l.data?.items || [];
      setListings(remoteListings);
      const remoteGroups = g.data?.items || [];
      setGroups(remoteGroups);
      setPosts(p.data?.items || []);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, []);
  const filtered = useMemo(
    () =>
      listings.filter(item => {
        const matchesCategory =
          category === 'All' ||
          item.category.toLowerCase().includes(category.toLowerCase()) ||
          item.kind.toLowerCase().includes(category.toLowerCase());
        const text = (
          item.title +
          ' ' +
          item.description +
          ' ' +
          item.location +
          ' ' +
          item.vendor
        ).toLowerCase();
        return matchesCategory && text.includes(query.toLowerCase());
      }),
    [listings, category, query]
  );
  const signIn = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await auth.signIn(authEmail.trim(), authPassword, authMode);
      if (!(result as any).confirmationRequired) setUser(result.user);
      setShowAuth(false);
      setAuthPassword('');
      setNotice((result as any).confirmationRequired ? 'Account created. Check your email to confirm, then sign in.' : 'You are signed in. Welcome to the community!');
    } catch (e: any) {
      const message = typeof e?.message === 'string' ? e.message : '';
      setNotice(
        e?.code === 'invalid_credentials'
          ? 'Email or password is incorrect. If you are new, choose Create an account first.'
          : e?.code === 'email_not_confirmed'
            ? 'Please confirm your email using the latest confirmation email before signing in.'
            : message || 'Authentication failed. Please check your connection and try again.'
      );
    } finally {
      setBusy(false);
    }
  };
  const signOut = async () => {
    await auth.signOut();
    setUser(null);
    setNotice('You have signed out.');
  };
  const requireMember = (message: string) => {
    if (!user) {
      setNotice(message);
      setShowAuth(true);
      return false;
    }
    return true;
  };
  useEffect(() => { localStorage.setItem('ccc-cart', JSON.stringify(cart)); }, [cart]);
  const searchPeople = async () => { try { const r=await api.get('/api/people?q='+encodeURIComponent(peopleQuery)); setPeople(r.data?.items||[]); } catch { setNotice('Could not search members.'); } };
  const openAdmin = async () => { if((user?.email||'').toLowerCase()!=='princewillobongha@gmail.com'){setNotice('Admin access required.');return;} try {const [profilesResult,reportsResult]=await Promise.all([api.get('/api/admin/profiles'),api.get('/api/admin/reports')]);setAdminProfiles(profilesResult.data?.items||[]);setAdminReports(reportsResult.data?.items||[]);setShowAdmin(true);} catch(e:any){setNotice(e?.message||'Could not load admin tools.');} };
  const saveProfile = async () => { try { const r=await api.post('/api/profile',profile); setProfile(r.data.item); setUser((u:any)=>({...u,name:r.data.item.display_name,username:r.data.item.username,avatar_url:r.data.item.avatar_url})); setShowProfile(false); setNotice('Profile saved.'); } catch(e:any) { setNotice(e?.message||'Could not save profile.'); } };
  const openPublicProfile = async (id:string) => { try { const r=await api.get('/api/profile/'+id); setPublicProfile(r.data?.item||null); setIsFollowingProfile(!!r.data?.is_following); } catch(e:any) { setNotice(e?.message||'Could not load this profile.'); } };
  const toggleFollow = async (id:string) => { if(!requireMember('follow members'))return; try { const r=await api.post('/api/follows/toggle',{followed_id:id}); setIsFollowingProfile(!!r.data?.following); setNotice(r.data?.following?'You are now following this member.':'You unfollowed this member.'); } catch(e:any) { setNotice(e?.message||'Could not update follow status.'); } };
  const contactSeller = async (listing:Listing) => { const popup=window.open('about:blank','_blank'); try { const r=await api.get('/api/listings/'+listing.id+'/contact'); const url=String(r.data?.url||''); if(!url) { popup?.close(); setNotice('This seller has not added a WhatsApp contact yet.'); return; } if(popup) popup.location.href=url; else window.location.href=url; } catch(e:any) { popup?.close(); setNotice(e?.message||'Could not open seller contact.'); } };
  const loadComments = async (id:string) => { setOpenComments(id); try { const r=await api.get('/api/comments/'+id); setComments(p=>({...p,[id]:r.data?.items||[]})); } catch { setNotice('Could not load replies.'); } };
  const addComment = async (id:string) => { if(!requireMember('Sign in to reply.'))return; const text=(commentText[id]||'').trim(); if(!text)return; try { await api.post('/api/comments/'+id,{text}); setCommentText(p=>({...p,[id]:''})); await loadComments(id); } catch(e:any) { setNotice(e?.message||'Could not post reply.'); } };
  const createGroup = async () => { if(!requireMember('Sign in to create a group.'))return; if(groupName.trim().length<3){setNotice('Group name must be at least 3 characters.');return;} setBusy(true); try { const r=await api.post('/api/groups',{name:groupName,description:groupDescription}); setGroups(p=>[r.data.item,...p]); setShowGroupForm(false); setGroupName(''); setGroupDescription(''); setNotice('Group created successfully.'); } catch(e:any) { setNotice(e?.message||'Could not create group.'); } finally {setBusy(false);} };
  const saveListing = async () => {
    if (!requireMember('Sign in to publish a listing.')) return;
    if (!form.title.trim() || !form.description.trim()) {
      setNotice('Add a title and description first.');
      return;
    }
    setBusy(true);
    try {
      const imageUrls = listingImage.length ? await Promise.all(listingImage.map(file=>uploadImage(file))) : (form.image ? [form.image] : []);
      const result = await api.post('/api/listings', {
        ...form,
        image: imageUrls[0] || '',
        image_urls: imageUrls,
        whatsapp_url: form.whatsapp_url.trim(),
        vendor: user.name || user.email || 'Community member',
        kind: form.category,
        created_at: new Date().toISOString(),
      });
      const created = result.data?.item;
      if (created) setListings(prev => [created, ...prev]);
      else
        setListings(prev => [
          {
            ...form,
            id: 'local-' + Date.now(),
            vendor: user.name || 'Community member',
            kind: form.category,
          } as Listing,
          ...prev,
        ]);
      setShowListingForm(false);
      setListingImage([]);
      setForm({
        title: '',
        category: 'Product',
        price: '',
        location: 'Calabar, Cross River',
        description: '',
        image: '',
        whatsapp_url: '',
      });
      setNotice('Your listing is published.');
    } catch (e:any) {
      setNotice(e?.message || 'We could not publish this listing. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  const publishPost = async () => {
    if (!requireMember('Sign in to join the conversation.')) return;
    if (!postText.trim()) {
      setNotice('Write something before posting.');
      return;
    }
    setBusy(true);
    try {
      const imageUrl = postImage ? await uploadImage(postImage) : null;
      const r = await api.post('/api/posts', {
        text: postText.trim(),
        image_url: imageUrl,
        author: user.name || user.email || 'Community member',
        category: 'Community',
        created_at: new Date().toISOString(),
      });
      setPosts(prev => [r.data.item, ...prev]);
      setPostText('');
      setPostImage(null);
      setShowPostForm(false);
      setNotice('Your community update is live.');
    } catch {
      setNotice('Could not publish your update. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  const openMemberPanel = async (kind: 'messages' | 'friends' | 'notifications') => {
    if (!requireMember('Sign in to use member tools.')) return;
    setMemberPanel(kind);
    setMemberItems([]);
    try {
      const path = kind === 'messages' ? '/api/messages' : kind === 'friends' ? '/api/friends' : '/api/notifications';
      const result = await api.get(path);
      setMemberItems(result.data?.items || []);
    } catch {
      setNotice('Could not load this area. Please try again.');
    }
  };
  const interact = (label: string) => {
    if (!requireMember('Sign in to ' + label + '.')) return;
    if (label.includes('message')) { void openMemberPanel('messages'); return; }
    if (label.includes('notification')) { void openMemberPanel('notifications'); return; }
    if (label.startsWith('join ')) {
      const name = label.slice(5);
      const group = groups.find(g => g.name === name);
      if (!group) { setNotice('This group is not available right now.'); return; }
      void api.post('/api/groups/' + group.id + '/join', {})
        .then(() => setNotice('You joined ' + name + '.'))
        .catch(() => setNotice('Could not join this group. Please try again.'));
      return;
    }
    setNotice('You are signed in. Please use the Messages or Connections tools to contact members safely.');
  };
  const sendMemberMessage = async () => {
    if (!recipientId.trim() || !memberText.trim()) {
      setNotice('Enter the recipient member ID and a message.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/api/messages', { recipient_id: recipientId.trim(), text: memberText.trim() });
      setMemberText('');
      setNotice('Message sent.');
      await openMemberPanel('messages');
    } catch {
      setNotice('Could not send your message. Check the member ID and try again.');
    } finally {
      setBusy(false);
    }
  };
  const nav = ['Discover', 'Marketplace', 'Community', 'Groups', 'Jobs'];
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" onClick={() => setActive('Discover')}>
          <img
            src="/calabar-connect-city-logo.jpg"
            alt="Calabar Connect City logo"
          />
          <span>
            <b>CALABAR CONNECT</b>
            <small>YOUR CITY, CONNECTED</small>
          </span>
        </a>
        <div className="top-search">
          <Search size={18} />
          <input
            aria-label="Search Calabar"
            placeholder="Find vendors, food, services, jobs..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setActive('Marketplace');
            }}
          />
          <kbd>⌕</kbd>
        </div>
        <div className="top-actions">
          <button
            className="icon-btn notification"
            aria-label="Notifications"
            onClick={() => void openMemberPanel('notifications')}
          >
            <Bell size={19} />
          </button>
          <button
            className="icon-btn"
            aria-label="Messages"
            onClick={() => void openMemberPanel('messages')}
          >
            <MessageCircle size={19} />
          </button>
          <button className="icon-btn" aria-label="Find people by username" onClick={()=>setShowPeople(true)}><UserRound size={19}/></button>
          {(user?.email||'').toLowerCase()==='princewillobongha@gmail.com' && <button className="icon-btn" aria-label="Admin verification" onClick={()=>void openAdmin()}><ShieldCheck size={19}/></button>}
          {user ? (
            <button className="profile-pill" onClick={async () => { try { const r=await api.get("/api/profile"); setProfile(r.data?.item || {username:user?.email?.split("@")[0]||"",display_name:user?.name||"",full_name:"",bio:"",avatar_url:""}); } catch {} setShowProfile(true); }}>
              {user.avatar_url ? <img className="avatar profile-avatar-img" src={user.avatar_url} alt="Profile" /> : <span className="avatar">{(user.name || user.email || 'M').slice(0, 1).toUpperCase()}</span>}
              <span>{user.name || 'My account'}</span>
              <UserRound size={15} />
            </button>
          ) : (
            <button className="sign-in" onClick={() => setShowAuth(true)}>
              <LogIn size={16} /> Sign in
            </button>
          )}
          <button
            className="icon-btn mobile-menu"
            aria-label="Open menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {menuOpen && (
        <div className="mobile-panel">
          {nav.map(n => (
            <button
              key={n}
              onClick={() => {
                setActive(n);
                setMenuOpen(false);
              }}
            >
              {n}
              <ChevronRight size={16} />
            </button>
          ))}
          <button onClick={() => { setShowListingForm(true); setMenuOpen(false); }}>List a business or item <Plus size={16} /></button>
          <button onClick={async () => { if(!user){setShowAuth(true);return;} try {const r=await api.get('/api/profile');setProfile(r.data?.item||{username:user?.email?.split('@')[0]||'',display_name:user?.name||'',full_name:'',bio:'',avatar_url:''});}catch{} setShowProfile(true);setMenuOpen(false);}}>My profile <UserRound size={16}/></button>
          <button onClick={() => { setActive("Marketplace"); setMenuOpen(false); setNotice(saved.length ? "Your saved items are marked with a heart in the marketplace." : "Tap the heart on any marketplace listing to save it."); }}>Saved items ({saved.length}) <Heart size={16}/></button>
          <button onClick={() => { setShowCart(true); setMenuOpen(false); }}>Shopping cart ({cart.length}) <ShoppingCart size={16}/></button>
          <button onClick={() => { setShowPeople(true); setMenuOpen(false); }}>Find people <UserRound size={16}/></button>
          <button onClick={() => { void openMemberPanel('messages'); setMenuOpen(false); }}>Messages <MessageCircle size={16}/></button>
          {(user?.email||'').toLowerCase()==='princewillobongha@gmail.com' && <button onClick={() => { void openAdmin(); setMenuOpen(false); }}>Admin verification <ShieldCheck size={16}/></button>}
        </div>
      )}
      <div className="page-wrap">
        <aside className="sidebar">
          <div className="side-label">YOUR CALABAR</div>
          {nav.map((item, index) => {
            const Icon = [
              Sparkles,
              ShoppingBag,
              MessageCircle,
              Users,
              BriefcaseBusiness,
            ][index];
            return (
              <button
                key={item}
                className={`nav-item ${active === item ? 'active' : ''}`}
                onClick={() => {
                  setActive(item);
                  if (item === 'Marketplace') setCategory('All');
                  if (item === 'Jobs') setCategory('Jobs');
                }}
              >
                <Icon size={18} />
                <span>{item}</span>
                {item === 'Community' ? <i>LIVE</i> : null}
              </button>
            );
          })}
          <div className="side-divider" />
          <div className="side-label">COMMUNITY GROUPS</div>
          {groups.slice(0, 4).map(group => (
            <button
              key={group.id}
              className="group-mini"
              onClick={() => setActive('Groups')}
            >
              <span className="group-dot">{group.name.slice(0, 1)}</span>
              <span>{group.name}</span>
            </button>
          ))}
          <button className="see-groups" onClick={() => setActive('Groups')}>
            Explore all groups <ArrowUpRight size={15} />
          </button>
          <div className="sidebar-promo">
            <Sparkles size={19} />
            <b>Make local connections.</b>
            <p>
              Find your people, support local businesses, and grow together.
            </p>
            <button onClick={() => requireMember('join the Calabar community')}>
              Join the community <ChevronRight size={15} />
            </button>
          </div>
          <div className="side-foot">
            Made for Calabar, with care.
            <br />© Calabar Connect City
          </div>
        </aside>
        <main className="main-content">
          {memberPanel && (
            <section className="member-panel">
              <div className="page-title">
                <div>
                  <div className="eyebrow muted">YOUR ACCOUNT</div>
                  <h1>{memberPanel === 'messages' ? 'Private messages' : memberPanel === 'friends' ? 'Connections' : 'Notifications'}</h1>
                  <p>{memberPanel === 'messages' ? 'Send and review messages with other members.' : memberPanel === 'friends' ? 'Review connection requests.' : 'Updates about messages and connection requests.'}</p>
                </div>
                <button className="ghost-btn" onClick={() => setMemberPanel(null)}>Close <X size={15} /></button>
              </div>
              {memberPanel === 'messages' && (
                <form className="member-compose" onSubmit={e => { e.preventDefault(); void sendMemberMessage(); }}>
                  <label>Recipient member ID<input value={recipientId} onChange={e => setRecipientId(e.target.value)} placeholder="Paste the member ID" required /></label>
                  <label>Message<textarea value={memberText} onChange={e => setMemberText(e.target.value)} placeholder="Write a respectful message..." required rows={3} /></label>
                  <button className="primary-btn" disabled={busy}>Send message <MessageCircle size={16} /></button>
                </form>
              )}
              {memberPanel === 'friends' && (
                <form className="member-compose" onSubmit={async e => {
                  e.preventDefault();
                  if (!recipientId.trim()) return;
                  try {
                    await api.post('/api/friends/request', { to_id: recipientId.trim() });
                    setRecipientId('');
                    setNotice('Connection request sent.');
                    await openMemberPanel('friends');
                  } catch { setNotice('Could not send connection request.'); }
                }}>
                  <label>Member ID to connect with<input value={recipientId} onChange={e => setRecipientId(e.target.value)} placeholder="Paste the member ID" required /></label>
                  <button className="primary-btn">Send connection request <Users size={16} /></button>
                </form>
              )}
              <div className="member-list">
                {memberItems.length ? memberItems.map((item, i) => (
                  <article className="member-item" key={item.id || i}>
                    <b>{item.title || item.from_name || item.sender_name || item.kind || 'Community update'}</b>
                    <p>{item.body || item.text || (item.status ? 'Status: ' + item.status : '')}</p>
                    <small>{item.created_at ? new Date(item.created_at).toLocaleString() : ''}{item.sender_id ? ' · Member ID: ' + (item.sender_id === user?.userId ? item.recipient_id : item.sender_id) : ''}</small>
                    {memberPanel === 'friends' && item.status === 'pending' && item.to_id === user?.userId && (
                      <div className="member-actions">
                        <button className="primary-btn" onClick={async () => { await api.post('/api/friends/' + item.id + '/respond', { accept: true }); await openMemberPanel('friends'); }}>Accept</button>
                        <button className="ghost-btn" onClick={async () => { await api.post('/api/friends/' + item.id + '/respond', { accept: false }); await openMemberPanel('friends'); }}>Decline</button>
                      </div>
                    )}
                    {memberPanel === 'notifications' && !item.read && item.id && <button className="text-link" onClick={async () => { await api.post('/api/notifications/' + item.id + '/read', {}); await openMemberPanel('notifications'); }}>Mark as read</button>}
                  </article>
                )) : (
                  <div className="empty-state"><MessageCircle size={26} /><h3>No items yet</h3><p>Messages, connection requests and notifications will appear here.</p></div>
                )}
              </div>
            </section>
          )}
          {!memberPanel && notice && (
            <div className="notice" role="status">
              <span>{notice}</span>
              <button
                aria-label="Dismiss message"
                onClick={() => setNotice('')}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {!memberPanel && active === 'Discover' && (
            <>
              <section className="hero">
                <div className="hero-copy">
                  <div className="eyebrow">
                    <span className="pulse" /> CALABAR'S LOCAL COMMUNITY
                  </div>
                  <h1>
                    Your city.
                    <br />
                    <em>Your people.</em>
                    <br />
                    Your next discovery.
                  </h1>
                  <p>
                    Meet the people behind local businesses, discover what's
                    happening around you, and make Calabar feel a little
                    smaller.
                  </p>
                  <div className="hero-buttons">
                    <button
                      className="primary-btn"
                      onClick={() => {
                        setActive('Marketplace');
                        setCategory('All');
                      }}
                    >
                      Explore marketplace <ArrowUpRight size={17} />
                    </button>
                    <button
                      className="ghost-btn"
                      onClick={() => {
                        setActive('Community');
                      }}
                    >
                      Join the conversation
                    </button>
                  </div>
                  <div className="hero-proof">
                    <div className="proof-avatars">
                      <span>U</span>
                      <span>F</span>
                      <span>C</span>
                      <span>+</span>
                    </div>
                    <span>
                      <b>Local first.</b> Community always.
                    </span>
                  </div>
                </div>
                <div className="hero-visual">
                  <div className="hero-image-main">
                    <img
                      src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1100&q=90"
                      alt="Welcoming local restaurant atmosphere"
                    />
                    <div className="image-label">
                      <MapPin size={15} />
                      <span>
                        <b>Discover Calabar</b>
                        <small>Good things are closer than you think.</small>
                      </span>
                    </div>
                  </div>
                  <div className="floating-card">
                    <span className="float-icon">
                      <Store size={18} />
                    </span>
                    <span>
                      <b>Shop local</b>
                      <small>Meet the makers</small>
                    </span>
                    <span className="float-arrow">
                      <ArrowUpRight size={15} />
                    </span>
                  </div>
                  <div className="hero-sparkle">✳</div>
                </div>
              </section>
              <section className="section-block">
                <div className="section-heading">
                  <div>
                    <div className="eyebrow muted">
                      A LITTLE BIT OF EVERYTHING
                    </div>
                    <h2>What are you looking for?</h2>
                  </div>
                  <button
                    className="text-link"
                    onClick={() => {
                      setActive('Marketplace');
                      setCategory('All');
                    }}
                  >
                    View everything <ChevronRight size={16} />
                  </button>
                </div>
                <div className="category-grid">
                  {categories
                    .filter(c => c.name !== 'All')
                    .map(c => (
                      <button
                        className="category-card"
                        key={c.name}
                        onClick={() => {
                          setCategory(c.name);
                          setActive('Marketplace');
                        }}
                      >
                        <span className={'category-icon ' + c.color}>
                          <c.icon size={22} />
                        </span>
                        <b>{c.name}</b>
                        <span>
                          Explore {c.name.toLowerCase()}{' '}
                          <ArrowUpRight size={14} />
                        </span>
                      </button>
                    ))}
                </div>
              </section>
              <section className="section-block">
                <div className="section-heading">
                  <div>
                    <div className="eyebrow muted">HANDPICKED FOR YOU</div>
                    <h2>Discover local favourites</h2>
                  </div>
                  <button
                    className="text-link"
                    onClick={() => setActive('Marketplace')}
                  >
                    Browse marketplace <ChevronRight size={16} />
                  </button>
                </div>
                <ListingGrid
                  items={listings.slice(0, 4)}
                  saved={saved}
                  onSave={id => {
                    if (requireMember('save listings'))
                      setSaved(p =>
                        p.includes(id) ? p.filter(x => x !== id) : [...p, id]
                      );
                  }}
                  onOpen={setSelectedListing}
                  onContact={contactSeller}
                />
              </section>
              <section className="community-banner">
                <div className="banner-icon">
                  <Users size={23} />
                </div>
                <div>
                  <span className="eyebrow">MORE THAN A MARKETPLACE</span>
                  <h2>Good things happen when we connect.</h2>
                  <p>
                    Ask a question, share a recommendation, or find your next
                    opportunity in the community.
                  </p>
                </div>
                <button
                  className="light-btn"
                  onClick={() => setActive('Community')}
                >
                  Meet the community <ArrowUpRight size={16} />
                </button>
              </section>
            </>
          )}
          {!memberPanel && active === 'Marketplace' && (
            <>
              <div className="page-title">
                <div>
                  <div className="eyebrow muted">BUY LOCAL. GROW LOCAL.</div>
                  <h1>Calabar marketplace</h1>
                  <p>
                    Products, food and services from people around your city.
                  </p>
                </div>
                <button
                  className="primary-btn"
                  onClick={() => {
                    if (requireMember('publish a listing'))
                      setShowListingForm(true);
                  }}
                >
                  <Plus size={17} /> Create listing
                </button>
              </div>
              <div className="filter-row">
                {categories.map(c => (
                  <button
                    key={c.name}
                    className={
                      'filter-chip ' + (category === c.name ? 'chosen' : '')
                    }
                    onClick={() => setCategory(c.name)}
                  >
                    {c.name}
                  </button>
                ))}
                <span className="result-count">{filtered.length} listings</span>
              </div>
              {filtered.length ? (
                <ListingGrid
                  items={filtered}
                  saved={saved}
                  onSave={id => {
                    if (requireMember('save listings'))
                      setSaved(p =>
                        p.includes(id) ? p.filter(x => x !== id) : [...p, id]
                      );
                  }}
                  onOpen={setSelectedListing}
                  onContact={() => interact('contact this vendor')}
                />
              ) : (
                <div className="empty-state">
                  <Search size={30} />
                  <h3>No matches yet</h3>
                  <p>
                    Try another search or category. Local listings are growing.
                  </p>
                  <button
                    className="ghost-btn"
                    onClick={() => {
                      setQuery('');
                      setCategory('All');
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </>
          )}
          {!memberPanel && active === 'Groups' && (
            <>
              <div className="page-title">
                <div>
                  <div className="eyebrow muted">FIND YOUR PEOPLE</div>
                  <h1>Community groups</h1>
                  <p>
                    Shared interests. Local knowledge. Stronger connections.
                  </p>
                </div>
                <button
                  className="primary-btn"
                  onClick={() => { if(requireMember('Sign in to create a group.')) setShowGroupForm(true); }}
                >
                  <Plus size={17} /> Create a group
                </button>
              </div>
              {groups.length===0 ? <div className="empty-state"><Users size={28}/><h3>No groups yet</h3><p>Create the first community group.</p><button className="primary-btn" onClick={()=>{if(requireMember('Sign in to create a group.'))setShowGroupForm(true);}}>Create a group</button></div> : <div className="group-grid">
                {groups.map((g, i) => (
                  <article className="group-card" key={g.id}>
                    <div className={'group-art art-' + i}>
                      <Users size={28} />
                      <span>{g.category}</span>
                    </div>
                    <div className="group-card-body">
                      <h3>{g.name}</h3>
                      <p>{g.description}</p>
                      <div className="group-card-foot">
                        <span>
                          <Users size={15} />
                          {Number(g.members || 0).toLocaleString()} members
                        </span>
                        <button onClick={() => interact('join ' + g.name)}>
                          Join group <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>}
            </>
          )}
          {!memberPanel && active === 'Community' && (
            <>
              <div className="page-title">
                <div>
                  <div className="eyebrow muted">THE CITY SQUARE</div>
                  <h1>Community board</h1>
                  <p>
                    Questions, recommendations and updates from around Calabar.
                  </p>
                </div>
                <button
                  className="primary-btn"
                  onClick={() => {
                    if (requireMember('post to the community'))
                      setShowPostForm(true);
                  }}
                >
                  <Plus size={17} /> Write a post
                </button>
              </div>
              <div className="community-intro">
                <div className="community-avatar">
                  <MessageCircle size={23} />
                </div>
                <div>
                  <b>What's happening in your Calabar?</b>
                  <p>
                    Share a useful tip, ask the community, or give a local
                    business a shout-out.
                  </p>
                </div>
                <button
                  className="ghost-btn"
                  onClick={() => {
                    if (requireMember('post to the community'))
                      setShowPostForm(true);
                  }}
                >
                  Start a post
                </button>
              </div>
              <div className="feed-list">
                {posts.length ? (
                  posts.map(p => (
                    <article className="feed-card" key={p.id}>
                      <button className="feed-avatar feed-avatar-button" aria-label={'View '+(p.author||'member')+' profile'} onClick={()=>p.author_id&&void openPublicProfile(p.author_id)}>{p.avatar_url ? <img src={p.avatar_url} alt="" /> : (p.author || 'C').slice(0, 1).toUpperCase()}</button>
                      <div>
                        <button className="post-author-link" onClick={()=>p.author_id&&void openPublicProfile(p.author_id)}>{p.author || 'Community member'} {p.is_verified && <BadgeCheck size={16} className="verified-badge" aria-label="Verified account"/>}</button>
                        <small>
                          {p.category || 'Community'} ·{' '}
                          {p.created_at
                            ? new Date(p.created_at).toLocaleDateString()
                            : 'Just now'}
                        </small>
                        <p>{p.text}</p>
                        {p.image_url && <img className="post-photo" src={p.image_url} alt="Community post" />}
                        <div className="post-actions"><button className="text-link" onClick={()=>{if(!requireMember('like posts'))return;void api.post('/api/posts/'+p.id+'/like',{}).then(r=>setNotice(r.data?.liked?'You liked this post.':'Like removed.')).catch(()=>setNotice('Could not like post.'));}}><Heart size={15}/> Like</button><button className="text-link" onClick={()=>{if(!requireMember('report posts'))return;const reason=window.prompt('Why are you reporting this post?');if(reason?.trim())void api.post('/api/reports',{target_type:'community_post',target_id:p.id,reason:reason.trim()}).then(()=>setNotice('Report submitted to the admin team.')).catch(()=>setNotice('Could not submit report.'));}}><ShieldCheck size={15}/> Report</button><button className="text-link" onClick={()=>openComments===p.id?setOpenComments(null):void loadComments(p.id)}><MessageCircle size={15}/> Reply</button><button className="text-link" onClick={()=>setSaved(v=>v.includes("post:"+p.id)?v.filter(x=>x!=="post:"+p.id):[...v,"post:"+p.id])}><Bookmark size={15}/> Bookmark</button><button className="text-link" onClick={()=>void api.post('/api/posts/'+p.id+'/share',{}).then(async()=>{const r=await api.get('/api/posts');setPosts(r.data?.items||[]);setNotice('Post reshared.');}).catch(()=>setNotice('Could not reshare post.'))}><ArrowUpRight size={15}/> Reshare</button></div>
                        {openComments===p.id && <div className="comment-thread">{(comments[p.id]||[]).map((cm:any)=><p key={cm.id}><button className="post-author-link" onClick={()=>cm.author_id&&void openPublicProfile(cm.author_id)}>{cm.author_profile?.display_name||cm.author_profile?.username||'Member'}</button>: {cm.text}</p>)}<form onSubmit={e=>{e.preventDefault();void addComment(p.id);}}><input value={commentText[p.id]||''} onChange={e=>setCommentText(v=>({...v,[p.id]:e.target.value}))} placeholder="Write a reply..." required/><button type="submit" className="primary-btn">Reply</button></form></div>}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">
                    <MessageCircle size={28} />
                    <h3>Be the first to start a conversation</h3>
                    <p>
                      Good recommendations and helpful local knowledge start
                      with one post.
                    </p>
                    <button
                      className="primary-btn"
                      onClick={() => {
                        if (requireMember('post to the community'))
                          setShowPostForm(true);
                      }}
                    >
                      Write the first post
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          {!memberPanel && active === 'Jobs' && (
            <>
              <div className="page-title">
                <div>
                  <div className="eyebrow muted">OPPORTUNITY LIVES HERE</div>
                  <h1>Jobs & opportunities</h1>
                  <p>Find local roles, gigs and ways to grow your career.</p>
                </div>
                <button
                  className="primary-btn"
                  onClick={() => {
                    if (requireMember('share a job opportunity')) {
                      setForm(f => ({
                        ...f,
                        category: 'Jobs',
                        title: '',
                        description: '',
                      }));
                      setShowListingForm(true);
                    }
                  }}
                >
                  <Plus size={17} /> Post an opportunity
                </button>
              </div>
              <div className="jobs-note">
                <BriefcaseBusiness size={22} />
                <div>
                  <b>Know of an opening in Calabar?</b>
                  <p>
                    Share a vacancy or gig with the community. Please verify job
                    details directly with the poster before sharing personal
                    information or paying any fees.
                  </p>
                </div>
              </div>
              <ListingGrid
                items={listings.filter(
                  l => l.category === 'Jobs' || l.kind === 'Job'
                )}
                saved={saved}
                onSave={id => {
                  if (requireMember('save listings'))
                    setSaved(p =>
                      p.includes(id) ? p.filter(x => x !== id) : [...p, id]
                    );
                }}
                onOpen={setSelectedListing}
                onContact={contactSeller}
              />
            </>
          )}
        </main>
        <aside className="rightbar">
          <div className="welcome-card">
            <div className="welcome-top">
              <span className="welcome-sun">✳</span>
              <span className="eyebrow">WELCOME TO THE CITY</span>
            </div>
            <h3>
              Calabar is better
              <br />
              when we're connected.
            </h3>
            <p>Discover people, places and opportunities right around you.</p>
            <button
              onClick={() => {
                if (!user) setShowAuth(true);
                else setActive('Community');
              }}
            >
              {user ? 'Explore your community' : 'Join Calabar Connect'}{' '}
              <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="right-section">
            <div className="right-heading">
              <h3>Popular groups</h3>
              <button onClick={() => setActive('Groups')}>See all</button>
            </div>
            {groups.slice(0, 3).map((g, i) => (
              <button
                className="popular-group"
                key={g.id}
                onClick={() => setActive('Groups')}
              >
                <span className={'popular-symbol ps-' + i}>
                  {g.name.slice(0, 1)}
                </span>
                <span>
                  <b>{g.name}</b>
                  <small>
                    {Number(g.members || 0).toLocaleString()} members
                  </small>
                </span>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
          <div className="right-section">
            <div className="right-heading">
              <h3>Community pulse</h3>
              <span className="live-dot">LIVE</span>
            </div>
            <div className="pulse-row">
              <span className="pulse-mark pm-green">
                <Store size={16} />
              </span>
              <span>
                <b>Support local businesses</b>
                <small>Discover independent sellers</small>
              </span>
            </div>
            <div className="pulse-row">
              <span className="pulse-mark pm-purple">
                <Users size={16} />
              </span>
              <span>
                <b>Find your community</b>
                <small>Join a group that feels like you</small>
              </span>
            </div>
            <div className="pulse-row">
              <span className="pulse-mark pm-orange">
                <BriefcaseBusiness size={16} />
              </span>
              <span>
                <b>Stay opportunity-ready</b>
                <small>Explore jobs and local services</small>
              </span>
            </div>
          </div>
          <div className="safety-card">
            <ShieldCheck size={20} />
            <div>
              <b>Connect thoughtfully</b>
              <p>
                Meet in public places, verify sellers, and never share passwords
                or payment codes.
              </p>
              <button
                onClick={() =>
                  setNotice(
                    'Safety tip: verify listings, meet safely, and never send passwords or one-time codes.'
                  )
                }
              >
                Safety tips <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </aside>
      </div>
      <nav className="mobile-bottom">
        {[
          { n: 'Discover', i: Sparkles },
          { n: 'Marketplace', i: ShoppingBag },
          { n: 'Community', i: MessageCircle },
          { n: 'Groups', i: Users },
        ].map(({ n, i: Icon }) => (
          <button
            key={n}
            className={active === n ? 'selected' : ''}
            onClick={() => setActive(n)}
          >
            <Icon size={20} />
            <span>{n}</span>
          </button>
        ))}
      </nav>
      {showAuth && (
        <div className="modal-backdrop" onClick={() => setShowAuth(false)}>
          <div className="modal auth-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAuth(false)}>
              <X size={18} />
            </button>
            <img
              className="modal-logo"
              src="/calabar-connect-city-logo.jpg"
              alt="Calabar Connect City"
            />
            <span className="eyebrow muted">WELCOME TO YOUR CITY</span>
            <h2>Come on in.</h2>
            <p>
              Sign in to save favourites, publish listings, join groups and
              connect with the community.
            </p>
            <form className="auth-form" onSubmit={e => { e.preventDefault(); void signIn(); }}>
              <label>Email address<input type="email" autoComplete="email" required value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="you@example.com" /></label>
              <label>Password<input type="password" autoComplete={authMode==='signup'?'new-password':'current-password'} minLength={6} required value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="At least 6 characters" /></label>
              <button className="primary-btn full-btn" type="submit" disabled={busy}><LogIn size={17} /> {busy ? 'Please wait…' : authMode==='signup'?'Create account':'Sign in securely'}</button>
            </form>
            <small className="fine-print">{authMode==='signup'?'Create your free Calabar Connect City account.':'Sign in to save favourites, publish listings and connect.'}</small>
            <button type="button" className="text-link auth-switch" onClick={()=>setAuthMode(m=>m==='signin'?'signup':'signin')}>{authMode==='signup'?'Already have an account? Sign in':'New here? Create an account'}</button>
          </div>
        </div>
      )}
      {showPeople && <div className="modal-backdrop" onClick={()=>setShowPeople(false)}><div className="modal form-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowPeople(false)}><X size={18}/></button><h2>Find people</h2><form onSubmit={e=>{e.preventDefault();void searchPeople();}}><label>Search by username<input value={peopleQuery} onChange={e=>setPeopleQuery(e.target.value)} placeholder="Enter a username" required/></label><button className="primary-btn full-btn" type="submit">Search members</button></form><div className="member-list">{people.map((person:any)=><article className="member-item" key={person.id}>{person.avatar_url&&<img className="profile-preview" src={person.avatar_url} alt=""/>}<b>{person.display_name||person.username} {person.is_verified&&<BadgeCheck size={16} className="verified-badge"/>}</b><p>@{person.username}</p><button className="primary-btn" onClick={()=>{setShowPeople(false);void openPublicProfile(person.id);}}>View profile</button></article>)}</div></div></div>}
      {showAdmin && <div className="modal-backdrop" onClick={()=>setShowAdmin(false)}><div className="modal form-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowAdmin(false)}><X size={18}/></button><h2>Member verification</h2><p>Only the designated admin can grant or remove the blue verified badge.</p>{adminProfiles.map((person:any)=><article className="member-item" key={person.id}><b>{person.display_name||person.username||'Member'} {person.is_verified&&<BadgeCheck size={16} className="verified-badge"/>}</b><p>@{person.username||'no username'}</p><button className="primary-btn" onClick={async()=>{try{await api.post('/api/admin/verify',{user_id:person.id,verified:!person.is_verified});setAdminProfiles(p=>p.map(x=>x.id===person.id?{...x,is_verified:!person.is_verified}:x));setNotice('Verification status updated.');}catch(e:any){setNotice(e?.message||'Could not update verification.');}}}>{person.is_verified?'Remove blue badge':'Verify member'}</button></article>)}<h3>Content reports</h3>{adminReports.length===0?<p>No reports to review.</p>:adminReports.map((report:any)=><article className="member-item" key={report.id}><b>{report.target_type} · {report.status}</b><p>{report.reason}</p><small>{report.details||report.target_id||'No extra details'} · {report.created_at?new Date(report.created_at).toLocaleString():''}</small>{report.status==='open'&&<button className="primary-btn" onClick={async()=>{try{await api.post('/api/admin/reports/'+report.id+'/resolve',{});setAdminReports(rs=>rs.map(x=>x.id===report.id?{...x,status:'reviewed'}:x));setNotice('Report marked as reviewed.');}catch(e:any){setNotice(e?.message||'Could not update report.');}}}>Mark reviewed</button>}</article>)}</div></div>}
      {showCart && <div className="modal-backdrop" onClick={()=>setShowCart(false)}><div className="modal form-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowCart(false)}><X size={18}/></button><h2>Your cart</h2>{cart.length===0?<div className="empty-state"><ShoppingCart size={26}/><h3>Your cart is empty</h3><p>Open a marketplace item and add it to your cart.</p></div>:<>{cart.map((item,i)=><div className="cart-row" key={item.id+'-'+i}>{item.image&&<img src={item.image} alt={item.title}/>}<div><b>{item.title}</b><p>{item.price}</p></div><button className="text-link" onClick={()=>setCart(v=>v.filter((_,idx)=>idx!==i))}>Remove</button></div>)}<button className="primary-btn full-btn" onClick={()=>{setShowCart(false);setNotice('Cart items are saved on this device. Contact the seller from each listing to arrange your order.');}}>Continue</button></>}</div></div>}
      {showProfile && <div className="modal-backdrop" onClick={()=>setShowProfile(false)}><div className="modal form-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowProfile(false)}><X size={18}/></button><h2>Edit profile</h2>{profile.avatar_url&&<img src={profile.avatar_url} className="profile-preview" alt="Profile"/>}<label>Profile picture<input type="file" accept="image/*" onChange={async e=>{const f=e.target.files?.[0];if(f)try{const avatarUrl=await uploadImage(f);setProfile((p:any)=>({...p,avatar_url:avatarUrl}));}catch(err:any){setNotice(err?.message||'Image upload failed.');}}}/></label><label>Username<input value={profile.username||''} onChange={e=>setProfile((p:any)=>({...p,username:e.target.value}))} required/></label><label>Display name<input value={profile.display_name||''} onChange={e=>setProfile((p:any)=>({...p,display_name:e.target.value}))} required/></label><label>Full name<input value={profile.full_name||''} onChange={e=>setProfile((p:any)=>({...p,full_name:e.target.value}))}/></label><label>Bio<textarea value={profile.bio||''} onChange={e=>setProfile((p:any)=>({...p,bio:e.target.value}))}/></label><button className="primary-btn full-btn" onClick={()=>void saveProfile()}>Save profile</button></div></div>}
      {publicProfile && <div className="modal-backdrop" onClick={()=>setPublicProfile(null)}><div className="modal form-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setPublicProfile(null)}><X size={18}/></button>{publicProfile.avatar_url&&<img src={publicProfile.avatar_url} className="profile-preview" alt="Profile"/>}<h2>{publicProfile.display_name||publicProfile.username||'Calabar member'} {publicProfile.is_verified&&<BadgeCheck size={20} className="verified-badge"/>}</h2><p>@{publicProfile.username||'member'}</p>{publicProfile.full_name&&<p>{publicProfile.full_name}</p>}<p>{publicProfile.bio||'No bio added yet.'}</p><button className="primary-btn full-btn" onClick={()=>void toggleFollow(publicProfile.id)}>{isFollowingProfile?'Following · Unfollow':'Follow member'}</button><h3>Community posts</h3>{(publicProfile.posts||[]).map((post:any)=><article className="member-item" key={post.id}><p>{post.text}</p>{post.image_url&&<img className="post-photo" src={post.image_url} alt="Post"/>}<small>{post.created_at?new Date(post.created_at).toLocaleDateString():'Recently'}</small></article>)}{!(publicProfile.posts||[]).length&&<p>No public posts yet.</p>}</div></div>}
      {showGroupForm && <div className="modal-backdrop" onClick={()=>setShowGroupForm(false)}><div className="modal form-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowGroupForm(false)}><X size={18}/></button><h2>Create a group</h2><label>Group name<input value={groupName} onChange={e=>setGroupName(e.target.value)} required/></label><label>Description<textarea value={groupDescription} onChange={e=>setGroupDescription(e.target.value)}/></label><button className="primary-btn full-btn" disabled={busy} onClick={()=>void createGroup()}>{busy?'Creating…':'Create group'}</button></div></div>}
      {showListingForm && (
        <div
          className="modal-backdrop"
          onClick={() => setShowListingForm(false)}
        >
          <div className="modal form-modal" onClick={e => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowListingForm(false)}
            >
              <X size={18} />
            </button>
            <span className="eyebrow muted">SHARE WITH CALABAR</span>
            <h2>Create a listing</h2>
            <p>Help your neighbours discover what you offer.</p>
            <form
              onSubmit={e => {
                e.preventDefault();
                saveListing();
              }}
            >
              <label>
                Listing title
                <input
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="What are you offering?"
                />
              </label>
              <div className="form-row">
                <label>
                  Category
                  <select
                    value={form.category}
                    onChange={e =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    <option>Product</option>
                    <option>Food</option>
                    <option>Fashion</option>
                    <option>Services</option>
                    <option>Jobs</option>
                  </select>
                </label>
                <label>
                  Price
                  <input
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    placeholder="e.g. ₦15,000"
                  />
                </label>
              </div>
              <label>
                Location in Calabar
                <input
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="Neighbourhood or area"
                />
              </label>
              <label>
                Seller WhatsApp link or international phone number
                <input type="text" value={form.whatsapp_url} onChange={e=>setForm({...form,whatsapp_url:e.target.value})} placeholder="https://wa.me/234... or 234..." />
                <small className="fine-print">Used when a buyer taps Contact seller; it is not printed on the listing.</small>
              </label>
              <label>
                Product photos (select multiple)
                <input type="file" accept="image/*" multiple onChange={e=>setListingImage(Array.from(e.target.files||[]))} />
                {listingImage.length>0&&<small>{listingImage.length} photo(s) selected</small>}
              </label>
              <label>
                Description
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={e =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Tell people a little more..."
                />
              </label>
              <button className="primary-btn full-btn" disabled={busy}>
                {busy ? 'Publishing…' : 'Publish listing'}{' '}
                <ArrowUpRight size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
      {showPostForm && (
        <div className="modal-backdrop" onClick={() => setShowPostForm(false)}>
          <div className="modal form-modal" onClick={e => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowPostForm(false)}
            >
              <X size={18} />
            </button>
            <span className="eyebrow muted">THE CITY SQUARE</span>
            <h2>Share with the community</h2>
            <p>Useful, kind and local — that's the spirit.</p>
            <form
              onSubmit={e => {
                e.preventDefault();
                publishPost();
              }}
            >
              <label>
                Your update
                <textarea
                  rows={5}
                  required
                  value={postText}
                  onChange={e => setPostText(e.target.value)}
                  placeholder="Ask a question, share a tip or recommend a local business..."
                />
              </label>
              <label>Attach a photo<input type="file" accept="image/*" onChange={e=>setPostImage(e.target.files?.[0]||null)} /></label>
              <button className="primary-btn full-btn" disabled={busy}>
                {busy ? 'Publishing…' : 'Publish update'}{' '}
                <ArrowUpRight size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
      {selectedListing && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedListing(null)}
        >
          <div
            className="modal detail-modal"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSelectedListing(null)}
            >
              <X size={18} />
            </button>
            {selectedListing.image ? <img className="detail-image" src={selectedListing.image} alt={selectedListing.title}/> : <div className="detail-image listing-no-image">No product photo uploaded</div>}
            <span className="eyebrow muted">
              {selectedListing.category} · LOCAL LISTING
            </span>
            <h2>{selectedListing.title}</h2>
            <div className="detail-price">{money(selectedListing.price)}</div>
            <p>{selectedListing.description}</p>
            <div className="detail-meta">
              <MapPin size={16} />
              {selectedListing.location || 'Calabar, Cross River'}
            </div>
            <div className="detail-meta">
              <Store size={16} />
              {selectedListing.vendor || 'Local vendor'}
            </div>
            {(selectedListing.images||[]).slice(1).map((imageUrl,i)=><img key={imageUrl+i} className="detail-gallery-image" src={imageUrl} alt={selectedListing.title+' photo '+(i+2)}/>)}
            <button className="ghost-btn full-btn" onClick={() => { if(requireMember('add items to your cart')) { setCart(v=>[...v,selectedListing]); setNotice('Added to cart.'); } }}>Add to cart <ShoppingCart size={16}/></button>
            <button
              className="primary-btn full-btn"
              onClick={() => void contactSeller(selectedListing)}
            >
              <MessageCircle size={17} /> Contact seller
            </button>
            <small className="fine-print">
              Always verify details with the seller before making payment.
            </small>
          </div>
        </div>
      )}
      <footer className="site-footer">
        <span>© 2026 Calabar Connect City</span>
        <span>Built for local discovery in Calabar, Cross River State.</span>
        <button
          onClick={() =>
            setNotice(
              'Safety first: report suspicious listings and never share your passwords or one-time codes.'
            )
          }
        >
          Safety & trust
        </button>
      </footer>
    </div>
  );
}
function ListingGrid({
  items,
  saved,
  onSave,
  onOpen,
  onContact,
}: {
  items: Listing[];
  saved: string[];
  onSave: (id: string) => void;
  onOpen: (l: Listing) => void;
  onContact: (item: Listing) => void;
}) {
  return (
    <div className="listing-grid">
      {items.map((item, i) => (
        <article className="listing-card" key={item.id}>
          <button
            className="listing-image"
            onClick={() => onOpen(item)}
            aria-label={'View ' + item.title}
          >
            {item.image ? <img src={item.image} alt={item.title}/> : <span className="listing-no-image">No photo uploaded</span>}
            <span className="listing-tag">{item.category}</span>
          </button>
          <button
            className={'save-btn ' + (saved.includes(item.id) ? 'saved' : '')}
            aria-label="Save listing"
            onClick={() => onSave(item.id)}
          >
            <Heart
              size={17}
              fill={saved.includes(item.id) ? 'currentColor' : 'none'}
            />
          </button>
          <div className="listing-body">
            <div className="listing-vendor">
              <span className="vendor-avatar">{item.vendor.slice(0, 1)}</span>
              <span>{item.vendor}</span>

            </div>
            <button className="listing-title" onClick={() => onOpen(item)}>
              {item.title}
            </button>
            <p>{item.description}</p>
            <div className="listing-location">
              <MapPin size={14} />
              {item.location}
            </div>
            <div className="listing-bottom">
              <b>{money(item.price)}</b>
              <button onClick={() => onContact(item)} aria-label="Contact seller">
                <MessageCircle size={16} />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
