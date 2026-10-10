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
  vendor_owner_id?: string;
};
type Group = {
  id: string;
  name: string;
  category: string;
  description: string;
  members: number;
  avatar_url?: string | null;
  owner_id?: string;
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
  like_count?: number;
  liked_by_me?: boolean;
  share_count?: number;
  shared_by_me?: boolean;
  comment_count?: number;
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
  const [groupImage, setGroupImage] = useState<File|null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [groupPostText, setGroupPostText] = useState('');
  const [groupPostImage, setGroupPostImage] = useState<File|null>(null);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [postSearchResults, setPostSearchResults] = useState<any[]>([]);
  const [myGroupsOpen, setMyGroupsOpen] = useState(false);
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
  const saveProfile = async () => { try { const r=await api.post('/api/profile',profile); setProfile(r.data.item); setUser((u:any)=>({...u,name:r.data.item.display_name,username:r.data.item.username,avatar_url:r.data.item.avatar_url,city:r.data.item.city})); setShowProfile(false); setNotice('Profile saved.'); } catch(e:any) { setNotice(e?.message||'Could not save profile.'); } };
  const openPublicProfile = async (id:string) => { try { const r=await api.get('/api/profile/'+id); setPublicProfile(r.data?.item||null); setIsFollowingProfile(!!r.data?.is_following); } catch(e:any) { setNotice(e?.message||'Could not load this profile.'); } };
  const openGroup = async (group:any) => { setActive('Groups');setSelectedGroup({...group,loading:true});try{const r=await api.get('/api/groups/'+group.id);setSelectedGroup(r.data?.item||group);}catch(e:any){setSelectedGroup({...group,loading:false});setNotice(e?.message||'Could not open this group.');} };
  const joinGroup = async (group:any) => {if(!requireMember('Sign in to join a group.'))return;try{await api.post('/api/groups/'+group.id+'/join',{});await openGroup(group);setNotice('You joined '+group.name+'.');}catch(e:any){setNotice(e?.message||'Could not join this group.');}};
  const createGroupPost = async () => {if(!selectedGroup||!requireMember('Sign in to post in this group.'))return;if(!groupPostText.trim()){setNotice('Write something before posting.');return;}setBusy(true);try{const image_url=groupPostImage?await uploadImage(groupPostImage):null;await api.post('/api/groups/'+selectedGroup.id+'/posts',{text:groupPostText.trim(),image_url});setGroupPostText('');setGroupPostImage(null);await openGroup(selectedGroup);setNotice('Your group post is published.');}catch(e:any){setNotice(e?.message||'Could not publish in this group.');}finally{setBusy(false);}};
  const deleteGroupPost = async (post:any) => {if(!selectedGroup||!window.confirm('Delete this post from the group?'))return;try{await api.delete('/api/groups/'+selectedGroup.id+'/posts/'+post.id);await openGroup(selectedGroup);setNotice('Group post deleted.');}catch(e:any){setNotice(e?.message||'Could not delete this group post.');}};
  const removeGroupMember = async (member:any) => {if(!selectedGroup||!window.confirm('Remove this member from the group?'))return;try{await api.delete('/api/groups/'+selectedGroup.id+'/members/'+member.user_id);await openGroup(selectedGroup);setNotice('Member removed from the group.');}catch(e:any){setNotice(e?.message||'Could not remove this member.');}};
  const openPost = async (post:any) => {setSelectedPost(post);await loadComments(post.id);};
  const deletePost = async (post:any) => {if(!window.confirm('Delete your post? This cannot be undone.'))return;try{await api.delete('/api/posts/'+post.id);setPosts(v=>v.filter(p=>p.id!==post.id));if(selectedPost?.id===post.id)setSelectedPost(null);setNotice('Post deleted.');}catch(e:any){setNotice(e?.message||'Could not delete this post.');}};
  const toggleReshare = async (post:any) => {if(!requireMember('Sign in to reshare posts.'))return;try{if(post.shared_by_me)await api.delete('/api/posts/'+post.id+'/share');else await api.post('/api/posts/'+post.id+'/share',{});const r=await api.get('/api/posts');setPosts(r.data?.items||[]);setSelectedPost((p:any)=>p&&p.id===post.id?({...p,shared_by_me:!post.shared_by_me,share_count:Math.max(0,(p.share_count||0)+(post.shared_by_me?-1:1))}):p);setNotice(post.shared_by_me?'Reshare removed.':'Post reshared.');}catch(e:any){setNotice(e?.message||'Could not update reshare.');}};
  const toggleLike = async (post:any) => {if(!requireMember('Sign in to like posts.'))return;try{const r=await api.post('/api/posts/'+post.id+'/like',{});setPosts(v=>v.map(p=>p.id===post.id?{...p,liked_by_me:!!r.data?.liked,like_count:Math.max(0,(p.like_count||0)+(r.data?.liked?1:-1))}:p));if(selectedPost?.id===post.id)setSelectedPost((p:any)=>({...p,liked_by_me:!!r.data?.liked,like_count:Math.max(0,(p.like_count||0)+(r.data?.liked?1:-1))}));}catch(e:any){setNotice(e?.message||'Could not update like.');}};
  const toggleFollow = async (id:string) => { if(!requireMember('follow members'))return; try { const r=await api.post('/api/follows/toggle',{followed_id:id}); const following=!!r.data?.following; setIsFollowingProfile(following); setPublicProfile((p:any)=>p&&p.id===id?({...p,followers_count:Math.max(0,(p.followers_count||0)+(following?1:-1))}):p); setNotice(following?'You are now following this member.':'You unfollowed this member.'); } catch(e:any) { setNotice(e?.message||'Could not update follow status.'); } };
  const contactSeller = async (listing:Listing) => { const popup=window.open('about:blank','_blank'); try { const r=await api.get('/api/listings/'+listing.id+'/contact'); const url=String(r.data?.url||''); if(!url) { popup?.close(); setNotice('This seller has not added a WhatsApp contact yet.'); return; } if(popup) popup.location.href=url; else window.location.href=url; } catch(e:any) { popup?.close(); setNotice(e?.message||'Could not open seller contact.'); } };
  const loadComments = async (id:string) => { setOpenComments(id); try { const r=await api.get('/api/comments/'+id); setComments(p=>({...p,[id]:r.data?.items||[]})); } catch { setNotice('Could not load replies.'); } };
  const addComment = async (id:string) => { if(!requireMember('Sign in to reply.'))return; const text=(commentText[id]||'').trim(); if(!text)return; try { await api.post('/api/comments/'+id,{text}); setCommentText(p=>({...p,[id]:''})); await loadComments(id); } catch(e:any) { setNotice(e?.message||'Could not post reply.'); } };
  const createGroup = async () => { if(!requireMember('Sign in to create a group.'))return; if(groupName.trim().length<3){setNotice('Group name must be at least 3 characters.');return;} setBusy(true); try { const avatar_url=groupImage?await uploadImage(groupImage):null; const r=await api.post('/api/groups',{name:groupName,description:groupDescription,avatar_url}); setGroups(p=>[r.data.item,...p]); setShowGroupForm(false); setGroupName(''); setGroupDescription(''); setGroupImage(null); setNotice('Group created successfully.'); await openGroup(r.data.item); } catch(e:any) { setNotice(e?.message||'Could not create group.'); } finally {setBusy(false);} };
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
        <a className="brand brand-logo-only" href="#home" aria-label="Calabar Connect City home" onClick={() => {setActive('Discover');setSelectedGroup(null);}}><img src="/calabar-connect-city-logo.svg" alt="Calabar Connect City" /></a>
  
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
          {(user?.email||'').toLowerCase()==='princewillobongha@gmail.com' && <button className="icon-btn" aria-label="Admin verification" onClick={()=>void openAdmin()}><ShieldCheck size={19}/></button>}
          {user ? (
            <button className="profile-pill" onClick={() => void openPublicProfile(user?.userId||user?.id)}>
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
          <button onClick={() => {if(!user){setShowAuth(true);return;}setMenuOpen(false);void openPublicProfile(user?.userId||user?.id);}}>My profile <UserRound size={16}/></button>
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
          <button className={'nav-item '+(active==='Search'?'active':'')} onClick={()=>{setActive('Search');setPeopleQuery('');setPeople([]);}}><Search size={18}/><span>Search people</span></button>
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
                    <button className="shop-local-link" onClick={()=>{if(!requireMember('Sign in to view your groups.'))return;void api.get('/api/groups/mine').then(r=>{const mine=r.data?.items||[];if(!mine.length){setNotice('You have not joined any groups yet. Open Groups to discover and join one.');setActive('Groups');return;}setMemberItems(mine);setMemberPanel(null);setShowPeople(false);setActive('Groups');setMyGroupsOpen(true);}).catch((e:any)=>setNotice(e?.message||'Could not load your groups.'));}}><b>Shop local</b><small>Choose one of your groups</small></button>
                    <span className="float-arrow"><ArrowUpRight size={15} /></span>
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
                  onOpenSeller={id=>void openPublicProfile(id)}
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
          {!memberPanel && active === 'Search' && <section className="search-page"><div className="page-title"><div><div className="eyebrow muted">FIND YOUR PEOPLE</div><h1>Search Calabar Connect City</h1><p>Search every member by username, display name or full name.</p></div></div><form className="search-page-form" onSubmit={e=>{e.preventDefault();void searchPeople();}}><Search size={20}/><input value={peopleQuery} onChange={e=>setPeopleQuery(e.target.value)} placeholder="Search people by name or @username"/><button className="primary-btn" type="submit">Search</button></form><div className="search-results-list">{people.map((person:any)=><article className="search-person-card" key={person.id}>{person.avatar_url?<img src={person.avatar_url} alt=""/>:<span className="avatar">{(person.display_name||person.username||'M').slice(0,1).toUpperCase()}</span>}<div><b>{person.display_name||person.full_name||person.username} {person.is_verified&&<BadgeCheck size={15} className="verified-badge"/>}</b><small>@{person.username||'member'}</small><p>{person.bio||person.city||'Calabar Connect City member'}</p></div><button className="primary-btn" onClick={()=>void openPublicProfile(person.id)}>View profile</button></article>)}{people.length===0&&<div className="empty-state"><Search size={28}/><h3>Find your people</h3><p>Enter a name or username above and tap Search.</p></div>}</div></section>}
          {!memberPanel && active === 'Search' && <section className="search-page"><div className="page-title"><div><div className="eyebrow muted">FIND YOUR PEOPLE</div><h1>Search Calabar Connect City</h1><p>Search every member by username, display name or full name.</p></div></div><form className="search-page-form" onSubmit={e=>{e.preventDefault();void searchPeople();}}><Search size={20}/><input value={peopleQuery} onChange={e=>setPeopleQuery(e.target.value)} placeholder="Search people by name or @username"/><button className="primary-btn" type="submit">Search</button></form><div className="search-results-list">{people.map((person:any)=><article className="search-person-card" key={person.id}>{person.avatar_url?<img src={person.avatar_url} alt=""/>:<span className="avatar">{(person.display_name||person.username||'M').slice(0,1).toUpperCase()}</span>}<div><b>{person.display_name||person.full_name||person.username} {person.is_verified&&<BadgeCheck size={15} className="verified-badge"/>}</b><small>@{person.username||'member'}</small><p>{person.bio||person.city||'Calabar Connect City member'}</p></div><button className="primary-btn" onClick={()=>void openPublicProfile(person.id)}>View profile</button></article>)}{people.length===0&&<div className="empty-state"><Search size={28}/><h3>Find your people</h3><p>Enter a name or username above and tap Search.</p></div>}</div></section>}
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
                  onContact={contactSeller}
                  onOpenSeller={id=>void openPublicProfile(id)}
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
              {!selectedGroup && <div className="page-title">
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
              </div>}
              {!selectedGroup && (groups.length===0 ? <div className="empty-state"><Users size={28}/><h3>No groups yet</h3><p>Create the first community group.</p><button className="primary-btn" onClick={()=>{if(requireMember('Sign in to create a group.'))setShowGroupForm(true);}}>Create a group</button></div> : <div className="group-grid">
                {groups.map((g, i) => (
                  <article className="group-card" key={g.id}>
                    <div className={'group-art art-' + i}>
                      {g.avatar_url ? <img className="group-card-avatar" src={g.avatar_url} alt={g.name}/> : <Users size={28}/>}
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
                        <button onClick={() => void openGroup(g)}>
                          Open group <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>)}
              {selectedGroup && <section className="group-detail-page">
                <button className="ghost-btn" onClick={()=>setSelectedGroup(null)}>← All groups</button>
                <div className="group-profile-hero">{selectedGroup.avatar_url?<img src={selectedGroup.avatar_url} alt="Group"/>:<div className="group-avatar-fallback"><Users size={34}/></div>}<div><h1>{selectedGroup.name}</h1><p>{selectedGroup.description||'A community space for local members.'}</p><small>{selectedGroup.members||0} members</small></div>{selectedGroup.is_owner&&<label className="group-avatar-change">Change group photo<input type="file" accept="image/*" onChange={async e=>{const f=e.target.files?.[0];if(f)try{const avatar_url=await uploadImage(f);await api.post('/api/groups/'+selectedGroup.id+'/update',{avatar_url,description:selectedGroup.description});await openGroup(selectedGroup);setNotice('Group photo updated.');}catch(err:any){setNotice(err?.message||'Could not update group photo.');}}}/></label>}</div>
                {!selectedGroup.is_member&&!selectedGroup.is_owner&&<button className="primary-btn" onClick={()=>void joinGroup(selectedGroup)}>Join group</button>}
                {selectedGroup.is_member||selectedGroup.is_owner ? <div className="group-composer"><h3>Write a post</h3><textarea value={groupPostText} onChange={e=>setGroupPostText(e.target.value)} placeholder={'Share something with '+selectedGroup.name+'…'}/><div className="composer-actions"><label className="ghost-btn">Add photo<input type="file" accept="image/*" onChange={e=>setGroupPostImage(e.target.files?.[0]||null)}/></label>{groupPostImage&&<small>{groupPostImage.name}</small>}<button className="primary-btn" disabled={busy} onClick={()=>void createGroupPost()}>{busy?'Posting…':'Post to group'}</button></div></div>:<p className="muted">Join this group to read and publish group posts.</p>}
                <div className="group-post-list">{(selectedGroup.posts||[]).map((gp:any)=><article className="feed-card group-post-card" key={gp.id}><button className="feed-avatar feed-avatar-button" onClick={()=>void openPublicProfile(gp.author_id)}>{gp.avatar_url?<img src={gp.avatar_url} alt=""/>:(gp.author||'M').slice(0,1)}</button><div><button className="post-author-link" onClick={()=>void openPublicProfile(gp.author_id)}>{gp.author} {gp.is_verified&&<BadgeCheck size={15} className="verified-badge"/>}</button><small>{new Date(gp.created_at).toLocaleString()}</small><p>{gp.text}</p>{gp.image_url&&<img className="post-photo" src={gp.image_url} alt="Group post"/>}{(selectedGroup.is_owner||gp.author_id===user?.userId||gp.author_id===user?.id)&&<button className="text-link danger-link" onClick={()=>void deleteGroupPost(gp)}>Delete post</button>}</div></article>)}{!(selectedGroup.posts||[]).length&&<div className="empty-state"><Users size={25}/><h3>No posts yet</h3><p>Be the first to post in this group.</p></div>}</div>
                {selectedGroup.is_owner&&<div className="group-members-panel"><h3>Manage members</h3>{(selectedGroup.member_list||[]).map((m:any)=><div className="group-member-row" key={m.user_id}><button className="post-author-link" onClick={()=>void openPublicProfile(m.user_id)}>{m.profile?.display_name||m.profile?.username||'Member'} {m.role==='owner'?'· Admin':''}</button>{m.user_id!==user?.userId&&m.user_id!==user?.id&&<button className="text-link danger-link" onClick={()=>void removeGroupMember(m)}>Remove</button>}</div>)}</div>}
              </section>}
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
              <div className="community-intro"><div className="community-avatar"><MessageCircle size={23}/></div><div><b>What's happening in your Calabar?</b><p>Share a tip, ask a question, or give a local business a shout-out.</p></div></div>
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
                        <p className="post-open-text" onClick={()=>void openPost(p)}>{p.text}</p>
                        {p.image_url && <img className="post-photo post-open-image" onClick={()=>void openPost(p)} src={p.image_url} alt="Community post" />}
                        <div className="post-actions"><button className={'text-link '+(p.liked_by_me?'liked-action':'')} onClick={()=>void toggleLike(p)}><Heart size={16} fill={p.liked_by_me?'currentColor':'none'}/> Like <span>{p.like_count||0}</span></button><button className="text-link" onClick={()=>{if(!requireMember('report posts'))return;const reason=window.prompt('Why are you reporting this post?');if(reason?.trim())void api.post('/api/reports',{target_type:'community_post',target_id:p.id,reason:reason.trim()}).then(()=>setNotice('Report submitted to the admin team.')).catch(()=>setNotice('Could not submit report.'));}}><ShieldCheck size={15}/> Report</button><button className="text-link" onClick={()=>void openPost(p)}><MessageCircle size={15}/> Comment <span>{p.comment_count||0}</span></button><button className="text-link" onClick={()=>setSaved(v=>v.includes("post:"+p.id)?v.filter(x=>x!=="post:"+p.id):[...v,"post:"+p.id])}><Bookmark size={15}/> Bookmark</button><button className={'text-link '+(p.shared_by_me?'liked-action':'')} onClick={()=>void toggleReshare(p)}><ArrowUpRight size={15}/> {p.shared_by_me?'Undo reshare':'Reshare'} <span>{p.share_count||0}</span></button>{(p.author_id===user?.userId||p.author_id===user?.id)&&<button className="text-link danger-link" onClick={()=>void deletePost(p)}>Delete</button>}</div>
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
                  onOpenSeller={id=>void openPublicProfile(id)}
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
                onClick={() => void openGroup(g)}
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
      {selectedPost && <div className="modal-backdrop" onClick={()=>setSelectedPost(null)}><div className="modal post-detail-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setSelectedPost(null)}><X size={18}/></button><div className="post-detail-author">{selectedPost.avatar_url?<img src={selectedPost.avatar_url} alt=""/>:<span className="avatar">{(selectedPost.author||'M').slice(0,1).toUpperCase()}</span>}<div><b>{selectedPost.author||'Calabar member'} {selectedPost.is_verified&&<BadgeCheck size={16} className="verified-badge"/>}</b><small>{selectedPost.created_at?new Date(selectedPost.created_at).toLocaleString():'Just now'}</small></div></div><p className="post-detail-text">{selectedPost.text}</p>{selectedPost.image_url&&<img className="post-detail-image" src={selectedPost.image_url} alt="Post"/>}<div className="post-actions post-detail-actions"><button className={'text-link '+(selectedPost.liked_by_me?'liked-action':'')} onClick={()=>void toggleLike(selectedPost)}><Heart size={17} fill={selectedPost.liked_by_me?'currentColor':'none'}/> Like {selectedPost.like_count||0}</button><button className="text-link" onClick={()=>void toggleReshare(selectedPost)}><ArrowUpRight size={16}/> {selectedPost.shared_by_me?'Undo reshare':'Reshare'} {selectedPost.share_count||0}</button>{(selectedPost.author_id===user?.userId||selectedPost.author_id===user?.id)&&<button className="text-link danger-link" onClick={()=>void deletePost(selectedPost)}>Delete post</button>}</div><h3>Comments</h3><div className="comment-thread post-detail-comments">{(comments[selectedPost.id]||[]).map((cm:any)=><div className="comment-row" key={cm.id}>{cm.author_profile?.avatar_url&&<img src={cm.author_profile.avatar_url} alt=""/>}<div><button className="post-author-link" onClick={()=>cm.author_id&&void openPublicProfile(cm.author_id)}>{cm.author_profile?.display_name||cm.author_profile?.username||'Member'}</button><p>{cm.text}</p></div></div>)}{!(comments[selectedPost.id]||[]).length&&<p>No comments yet. Start the conversation.</p>}<form onSubmit={e=>{e.preventDefault();void addComment(selectedPost.id);}}><input value={commentText[selectedPost.id]||''} onChange={e=>setCommentText(v=>({...v,[selectedPost.id]:e.target.value}))} placeholder="Write a comment…" required/><button className="primary-btn" type="submit">Reply</button></form></div></div></div>}
      {myGroupsOpen && <div className="modal-backdrop" onClick={()=>setMyGroupsOpen(false)}><div className="modal form-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setMyGroupsOpen(false)}><X size={18}/></button><h2>My groups</h2><p>Choose a group you have joined to open its community.</p>{memberItems.map((g:any)=><button className="my-group-choice" key={g.id} onClick={()=>{setMyGroupsOpen(false);void openGroup(g);}}>{g.avatar_url?<img src={g.avatar_url} alt=""/>:<span className="avatar"><Users size={16}/></span>}<span><b>{g.name}</b><small>{g.description||'Community group'}</small></span><ChevronRight size={16}/></button>)}{!memberItems.length&&<p>You have not joined any groups yet.</p>}</div></div>}
      {showProfile && <div className="modal-backdrop" onClick={()=>setShowProfile(false)}><div className="modal form-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowProfile(false)}><X size={18}/></button><h2>Edit profile</h2>{profile.avatar_url&&<img src={profile.avatar_url} className="profile-preview" alt="Profile"/>}<label>Profile picture<input type="file" accept="image/*" onChange={async e=>{const f=e.target.files?.[0];if(f)try{const avatarUrl=await uploadImage(f);setProfile((p:any)=>({...p,avatar_url:avatarUrl}));}catch(err:any){setNotice(err?.message||'Image upload failed.');}}}/></label><label>Username<input value={profile.username||''} onChange={e=>setProfile((p:any)=>({...p,username:e.target.value}))} required/></label><label>Display name<input value={profile.display_name||''} onChange={e=>setProfile((p:any)=>({...p,display_name:e.target.value}))} required/></label><label>Full name<input value={profile.full_name||''} onChange={e=>setProfile((p:any)=>({...p,full_name:e.target.value}))}/></label><label>Bio<textarea value={profile.bio||''} onChange={e=>setProfile((p:any)=>({...p,bio:e.target.value}))}/></label><label>Location<input value={profile.city||profile.location||''} onChange={e=>setProfile((p:any)=>({...p,city:e.target.value,location:e.target.value}))} placeholder="Calabar, Cross River"/></label><label>WhatsApp phone number or link<input value={profile.whatsapp_url||''} onChange={e=>setProfile((p:any)=>({...p,whatsapp_url:e.target.value}))} placeholder="+2348012345678 or https://wa.me/234..."/><small className="fine-print">Used privately for Contact seller on your listings; it is not displayed on your public profile.</small></label><button className="primary-btn full-btn" onClick={()=>void saveProfile()}>Save profile</button></div></div>}
      {publicProfile && <div className="modal-backdrop" onClick={()=>setPublicProfile(null)}><div className="modal public-profile-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setPublicProfile(null)}><X size={18}/></button><div className="public-profile-cover"/>{publicProfile.avatar_url&&<img src={publicProfile.avatar_url} className="public-profile-avatar" alt="Profile"/>}<h2>{publicProfile.display_name||publicProfile.username||'Calabar member'} {publicProfile.is_verified&&<BadgeCheck size={20} className="verified-badge"/>}</h2><p className="profile-handle">@{publicProfile.username||'member'}</p>{publicProfile.full_name&&<p>{publicProfile.full_name}</p>}<p>{publicProfile.bio||'No bio added yet.'}</p><p className="profile-location"><MapPin size={15}/>{publicProfile.city||'Calabar, Cross River'}</p><div className="profile-follow-counts"><span><b>{publicProfile.followers_count||0}</b> Followers</span><span><b>{publicProfile.following_count||0}</b> Following</span></div>{(publicProfile.id===user?.userId||publicProfile.id===user?.id)&&<button className="ghost-btn full-btn" onClick={()=>{setProfile({...publicProfile,city:publicProfile.city||'Calabar'});setShowProfile(true);}}>Edit profile</button>}{publicProfile.id!==user?.userId&&publicProfile.id!==user?.id&&<button className="primary-btn full-btn" onClick={()=>void toggleFollow(publicProfile.id)}>{isFollowingProfile?'Following · Unfollow':'Follow member'}</button>}<h3>Posts</h3>{(publicProfile.posts||[]).map((post:any)=><article className="member-item profile-post-item" key={post.id} onClick={()=>void openPost({...post,author:publicProfile.display_name||publicProfile.username,author_id:publicProfile.id,avatar_url:publicProfile.avatar_url,is_verified:publicProfile.is_verified})}><p>{post.text}</p>{post.image_url&&<img className="post-photo" src={post.image_url} alt="Post"/>}<small>{post.created_at?new Date(post.created_at).toLocaleDateString():'Recently'} · ♥ {post.like_count||0} · {post.share_count||0} reshares</small><button className="text-link" onClick={e=>{e.stopPropagation();void openPost({...post,author:publicProfile.display_name||publicProfile.username,author_id:publicProfile.id,avatar_url:publicProfile.avatar_url,is_verified:publicProfile.is_verified});}}>Open post & comments</button></article>)}{!(publicProfile.posts||[]).length&&<p>No public posts yet.</p>}</div></div>}
      {showGroupForm && <div className="modal-backdrop" onClick={()=>setShowGroupForm(false)}><div className="modal form-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowGroupForm(false)}><X size={18}/></button><h2>Create a group</h2><label>Group name<input value={groupName} onChange={e=>setGroupName(e.target.value)} required/></label><label>Description<textarea value={groupDescription} onChange={e=>setGroupDescription(e.target.value)}/></label><label>Group profile picture<input type="file" accept="image/*" onChange={e=>setGroupImage(e.target.files?.[0]||null)}/></label>{groupImage&&<small>{groupImage.name}</small>}<button className="primary-btn full-btn" disabled={busy} onClick={()=>void createGroup()}>{busy?'Creating…':'Create group'}</button></div></div>}
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
            <div className="detail-meta"><Store size={16}/><button className="vendor-name-link" onClick={()=>selectedListing.vendor_owner_id&&void openPublicProfile(selectedListing.vendor_owner_id)}>{selectedListing.vendor||'Local vendor'}</button></div>
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
      <nav className="bottom-nav" aria-label="Primary navigation"><button className={active==='Discover'?'active':''} onClick={()=>{setActive('Discover');setSelectedGroup(null);}}><Sparkles size={19}/><span>Home</span></button><button className={active==='Marketplace'?'active':''} onClick={()=>{setActive('Marketplace');setSelectedGroup(null);}}><ShoppingBag size={19}/><span>Market</span></button><button className={active==='Search'?'active':''} onClick={()=>{setActive('Search');setSelectedGroup(null);setPeopleQuery('');setPeople([]);}}><Search size={21}/><span>Search</span></button><button className={active==='Community'?'active':''} onClick={()=>{setActive('Community');setSelectedGroup(null);}}><Heart size={19}/><span>Community</span></button><button className={active==='Groups'?'active':''} onClick={()=>{setActive('Groups');setSelectedGroup(null);}}><Users size={19}/><span>Groups</span></button></nav>
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
  onOpenSeller,
}: {
  items: Listing[];
  saved: string[];
  onSave: (id: string) => void;
  onOpen: (l: Listing) => void;
  onContact: (item: Listing) => void;
  onOpenSeller: (id: string) => void;
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
              <button className="vendor-avatar vendor-profile-button" onClick={()=>item.vendor_owner_id&&onOpenSeller(item.vendor_owner_id)} aria-label={'View '+item.vendor+' profile'}>{item.vendor.slice(0,1)}</button>
              <button className="vendor-name-link" onClick={()=>item.vendor_owner_id&&onOpenSeller(item.vendor_owner_id)}>{item.vendor}</button>
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
