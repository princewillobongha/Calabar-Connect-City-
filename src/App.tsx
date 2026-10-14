import { useEffect, useMemo, useRef, useState } from 'react';
import { auth, api, uploadImage, supabase } from './lib/supabase';
import {
  Search,
  Send,
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
  Pin,
  UserRound,
  BadgeCheck,
  Moon,
  Sun,
  Cpu,
  HeartPulse,
  Wrench,
  Eye,
  EyeOff,
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
  is_verified?: boolean;
  order_count?: number;
  view_count?: number;
  pinned_at?: string | null;
  rating_average?: number;
  rating_count?: number;
  available_until?: string | null;
  availability_note?: string;
  sale_status?: 'available' | 'sold';
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
  view_count?: number;
  pinned_at?: string | null;
  shared_by_me?: boolean;
  comment_count?: number;
};
const categories = [
  { name: 'All', icon: ShoppingBag, color: 'sand' },
  { name: 'Food & Restaurants', icon: Utensils, color: 'peach' },
  { name: 'Fashion & Clothing', icon: Shirt, color: 'rose' },
  { name: 'Electronics & Gadgets', icon: Cpu, color: 'blue' },
  { name: 'Beauty & Personal Care', icon: HeartPulse, color: 'rose' },
  { name: 'Repairs & Professional Services', icon: Wrench, color: 'blue' },
  { name: 'Jobs & Opportunities', icon: Sparkles, color: 'green' },
];
function money(value: string) {
  return value || 'Ask for price';
}
function shuffleList<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
export default function App() {
  const [user, setUser] = useState<any>(null);
  const isAdmin = (user?.email || '').toLowerCase() === 'princewillobongha@gmail.com';
  const [, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [active, setActive] = useState('Discover');
  const [darkMode, setDarkMode] = useState(() => { try { return localStorage.getItem('ccc-theme') === 'dark'; } catch { return false; } });
  useEffect(() => { document.documentElement.classList.toggle('dark-mode', darkMode); try { localStorage.setItem('ccc-theme', darkMode ? 'dark' : 'light'); } catch {} }, [darkMode]);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [marketplaceQuery, setMarketplaceQuery] = useState('');
  const [marketplacePeople, setMarketplacePeople] = useState<any[]>([]);
  const [adminListingSearch, setAdminListingSearch] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('');
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showListingForm, setShowListingForm] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [notice, setNotice] = useState('');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [imagePreview, setImagePreview] = useState<{src:string; alt:string} | null>(null);
  const [form, setForm] = useState({
    title: '',
    category: 'Product',
    price: '',
    location: 'Calabar, Cross River',
    description: '',
    image: '',
    availability_note: '',
  });
  const [postText, setPostText] = useState('');
  const [busy, setBusy] = useState(false);
  const [memberPanel, setMemberPanel] = useState<'friends' | 'notifications' | null>(null);
  const [memberItems, setMemberItems] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [verificationSearch, setVerificationSearch] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authPasswordVisible, setAuthPasswordVisible] = useState(false);
  const [authConfirmVisible, setAuthConfirmVisible] = useState(false);
  const [confirmationBusy, setConfirmationBusy] = useState(false);
  const [authMode, setAuthMode] = useState<'signin'|'signup'>('signin');
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [listingImage, setListingImage] = useState<File[]>([]);
  const [postImage, setPostImage] = useState<File|null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [profile, setProfile] = useState<any>({username:'',display_name:'',full_name:'',bio:'',avatar_url:''});
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showPeople, setShowPeople] = useState(false);
  const [peopleQuery, setPeopleQuery] = useState('');
  const [people, setPeople] = useState<any[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminSection, setAdminSection] = useState<'home'|'members'|'safety'|'marketplace'|'announcements'>('home');
  const [adminRestrictionTargetId, setAdminRestrictionTargetId] = useState('');
  const [adminRestrictionItems, setAdminRestrictionItems] = useState<any[]>([]);
  const [adminCommunityPostText, setAdminCommunityPostText] = useState('');
  const [adminCommunityPostImage, setAdminCommunityPostImage] = useState<File|null>(null);
  const [mentionTarget, setMentionTarget] = useState<'community'|'group'|'adminPost'|null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);
  const [mentionRange, setMentionRange] = useState<{start:number;end:number;query:string}|null>(null);
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const [publicProfile, setPublicProfile] = useState<any>(null);
  const [isFollowingProfile, setIsFollowingProfile] = useState(false);
  const [adminProfiles, setAdminProfiles] = useState<any[]>([]);
  const [adminReports, setAdminReports] = useState<any[]>([]);
  const [adminStats,setAdminStats]=useState<any>({members:0,communityPosts:0,groupPosts:0,listings:0,reports:0});
  const [followList,setFollowList]=useState<any>(null);
  const [announcementTitle,setAnnouncementTitle]=useState('');
  const [announcementMessage,setAnnouncementMessage]=useState('');
  const [announcementBusy,setAnnouncementBusy]=useState(false);
  const [announcementHistory,setAnnouncementHistory]=useState<any[]>([]);
  const [selectedAnnouncement,setSelectedAnnouncement]=useState<any>(null);
  const [reportTarget,setReportTarget]=useState<any>(null);const [reportText,setReportText]=useState('');const [reportBusy,setReportBusy]=useState(false);const [reportChat,setReportChat]=useState<any>(null);const [reportChatMessages,setReportChatMessages]=useState<any[]>([]);const [reportChatText,setReportChatText]=useState('');const [showMyReports,setShowMyReports]=useState(false);const [myReports,setMyReports]=useState<any[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupImage, setGroupImage] = useState<File|null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [groupPostText, setGroupPostText] = useState('');
  const [groupPostImage, setGroupPostImage] = useState<File|null>(null);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [postSearchResults, setPostSearchResults] = useState<any[]>([]);
  const [myGroupsOpen, setMyGroupsOpen] = useState(false);
  const [cart, setCart] = useState<Listing[]>(() => { try { return JSON.parse(localStorage.getItem('ccc-cart') || '[]'); } catch { return []; } });
  useEffect(() => { localStorage.setItem('ccc-cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => {
    const id=user?.userId||user?.id; if(!id) { setUnreadNotifications(0); return; }
    let live=true;
    const refresh=async()=>{try{const r=await api.get('/api/notifications');const items=r.data?.items||[];if(live){setUnreadNotifications(items.filter((n:any)=>!n.read).length);if(memberPanel==='notifications')setMemberItems(items);}}catch{}};
    void refresh();
    const channel=supabase.channel('calabar-notifications-'+id).on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:'user_id=eq.'+id},()=>{void refresh();}).subscribe();
    return ()=>{live=false;void supabase.removeChannel(channel);};
  },[user?.userId,user?.id,memberPanel]);
  const overlayStates = { showAuth, showProfile, showAbout, showListingForm, showPostForm, showGroupForm, showCart, showPeople, showAdmin, showSubscriptions, publicProfile:!!publicProfile, selectedListing:!!selectedListing, selectedPost:!!selectedPost, myGroupsOpen };
  const previousOverlayRef = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const previous = previousOverlayRef.current;
    const newlyOpened = Object.keys(overlayStates).find(key => overlayStates[key as keyof typeof overlayStates] && !previous[key]);
    previousOverlayRef.current = overlayStates;
    if (!newlyOpened) return;
    if (newlyOpened !== 'showAuth') setShowAuth(false);
    if (newlyOpened !== 'showProfile') setShowProfile(false);
    if (newlyOpened !== 'showAbout') setShowAbout(false);
    if (newlyOpened !== 'showListingForm') setShowListingForm(false);
    if (newlyOpened !== 'showPostForm') setShowPostForm(false);
    if (newlyOpened !== 'showGroupForm') setShowGroupForm(false);
    if (newlyOpened !== 'showCart') setShowCart(false);
    if (newlyOpened !== 'showPeople') setShowPeople(false);
    if (newlyOpened !== 'showAdmin') setShowAdmin(false);
    if (newlyOpened !== 'showSubscriptions') setShowSubscriptions(false);
    if (newlyOpened !== 'publicProfile') setPublicProfile(null);
    if (newlyOpened !== 'selectedListing') setSelectedListing(null);
    if (newlyOpened !== 'selectedPost') setSelectedPost(null);
    if (newlyOpened !== 'myGroupsOpen') setMyGroupsOpen(false);
    setMemberPanel(null);
  }, [showAuth, showProfile, showAbout, showListingForm, showPostForm, showGroupForm, showCart, showPeople, showAdmin, showSubscriptions, publicProfile, selectedListing, selectedPost, myGroupsOpen]);
  useEffect(()=>{const anyModal=showAuth||showProfile||showAbout||showListingForm||showPostForm||showGroupForm||showCart||showPeople||showAdmin||showSubscriptions||!!publicProfile||!!selectedListing||!!selectedPost||myGroupsOpen;document.body.style.overflow=anyModal?'hidden':'';const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'){setShowAuth(false);setShowProfile(false);setShowAbout(false);setShowListingForm(false);setShowPostForm(false);setShowGroupForm(false);setShowCart(false);setShowPeople(false);setShowAdmin(false);setShowSubscriptions(false);setPublicProfile(null);setSelectedListing(null);setSelectedPost(null);setMyGroupsOpen(false);}};window.addEventListener('keydown',onKey);return()=>{document.body.style.overflow='';window.removeEventListener('keydown',onKey);};},[showAuth,showProfile,showAbout,showListingForm,showPostForm,showGroupForm,showCart,showPeople,showAdmin,showSubscriptions,publicProfile,selectedListing,selectedPost,myGroupsOpen]);
  useEffect(()=>{setSelectedListing(null);setSelectedPost(null);setPublicProfile(null);setShowAuth(false);setShowProfile(false);setShowAbout(false);setShowListingForm(false);setShowPostForm(false);setShowGroupForm(false);setShowCart(false);setShowPeople(false);setShowAdmin(false);setShowSubscriptions(false);setMyGroupsOpen(false);setMemberPanel(null);setMenuOpen(false);},[active]);
  useEffect(()=>{if(active!=='Businesses')return;let live=true;api.get('/api/discover/businesses').then(r=>{if(live)setBusinesses(r.data?.items||[]);}).catch((e:any)=>{if(live)setNotice(e?.message||'Could not load local businesses.');});return()=>{live=false;};},[active]);
  useEffect(() => {
    let live = true;
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const u:any = session.user;
        setUser((previous:any) => ({...u, userId:u.id, email:u.email, name:u.user_metadata?.display_name || u.user_metadata?.full_name || previous?.name || u.email?.split('@')[0] || 'Calabar Member'}));
      } else if (event === 'SIGNED_OUT') setUser(null);
    });
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
      authListener.subscription.unsubscribe();
    };
  }, []);
  const filtered = useMemo(
    () =>
      listings.filter(item => {
        const categoryNeedle = ({
          'Food & Restaurants': 'food',
          'Fashion & Clothing': 'fashion',
          'Electronics & Gadgets': 'gadget',
          'Beauty & Personal Care': 'beauty',
          'Repairs & Professional Services': 'service',
          'Jobs & Opportunities': 'job',
        } as Record<string, string>)[category] || category.toLowerCase();
        const itemCategory = (String(item.category || '') + ' ' + String(item.kind || '') + ' ' + String(item.title || '') + ' ' + String(item.description || '')).toLowerCase();
        const matchesCategory = category === 'All' ||
          itemCategory.includes(categoryNeedle) ||
          (category === 'Electronics & Gadgets' && /electronics|electronic|gadget|phone|computer|laptop/.test(itemCategory)) ||
          (category === 'Beauty & Personal Care' && /beauty|personal care|cosmetic|skincare|hair/.test(itemCategory)) ||
          (category === 'Repairs & Professional Services' && /repair|service|professional/.test(itemCategory));
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
  const filteredMarketplace = useMemo(() => {
    const term = marketplaceQuery.trim().toLowerCase();
    const categoryNeedle = ({'Food & Restaurants':'food','Fashion & Clothing':'fashion','Electronics & Gadgets':'gadget','Beauty & Personal Care':'beauty','Repairs & Professional Services':'service','Jobs & Opportunities':'job'} as Record<string,string>)[category] || category.toLowerCase();
    return listings.filter(item => {
      const categoryText = (String(item.category||'')+' '+String(item.kind||'')).toLowerCase();
      const titleText = String(item.title||'').toLowerCase();
      const matchesCategory = category === 'All' || categoryText.includes(categoryNeedle) ||
        (category === 'Electronics & Gadgets' && /electronics|electronic|gadget|phone|computer|laptop/.test(categoryText+' '+titleText)) ||
        (category === 'Beauty & Personal Care' && /beauty|personal care|cosmetic|skincare|hair/.test(categoryText+' '+titleText)) ||
        (category === 'Repairs & Professional Services' && /repair|service|professional/.test(categoryText+' '+titleText));
      const searchable = [item.title,item.description,item.vendor,item.category,item.kind,item.location].join(' ').toLowerCase();
      return matchesCategory && (!term || searchable.includes(term));
    });
  }, [listings, category, marketplaceQuery]);
  const searchMarketplace = async () => {
    const term = marketplaceQuery.trim();
    if (!term) { setMarketplacePeople([]); return; }
    try {
      const result = await api.get('/api/people?q='+encodeURIComponent(term));
      const selfId = user?.userId || user?.id;
      setMarketplacePeople((result.data?.items||[]).filter((person:any)=>person.id!==selfId));
    } catch {
      setMarketplacePeople([]);
      setNotice('Product results are shown, but matching seller profiles could not be loaded.');
    }
  };
  const signIn = async () => {
    if (busy) return;
    if (!authEmail.trim()) { setNotice('Enter your email address first.'); return; }
    if (authPassword.length < 6) { setNotice('Your password must contain at least 6 characters.'); return; }
    if (authMode === 'signup' && authPassword !== authConfirmPassword) { setNotice('Your passwords do not match. Please check both password fields.'); return; }
    setBusy(true);
    try {
      const result = await auth.signIn(authEmail.trim(), authPassword, authMode);
      if (!(result as any).confirmationRequired) setUser(result.user);
      setShowAuth(false);
      setAuthPassword('');
      setAuthConfirmPassword('');
      setAuthPasswordVisible(false);
      setAuthConfirmVisible(false);
      if((result as any).confirmationRequired) {
        setConfirmationEmail(authEmail.trim());
        setNotice('');
      } else {
        setConfirmationEmail('');
        setNotice('You are signed in. Welcome to the community!');
      }
    } catch (e: any) {
      const message = typeof e?.message === 'string' ? e.message : '';
      setNotice(
        e?.code === 'invalid_credentials'
          ? 'Email or password is incorrect. If you are new, choose Create an account first.'
          : e?.code === 'email_not_confirmed'
            ? 'Your email is not confirmed yet. Open the latest confirmation email and tap its confirmation button.'
            : /already registered|already been registered|user already exists/i.test(message)
              ? 'An account already exists with this email. Sign in instead, or request a fresh confirmation email if you have not confirmed it yet.'
              : message || 'We could not complete authentication. Please check your connection and try again.'
      );
    } finally {
      setBusy(false);
    }
  };
  const resendSignupConfirmation = async () => {
    if (!confirmationEmail || confirmationBusy) return;
    setConfirmationBusy(true);
    try {
      await auth.resendConfirmation(confirmationEmail);
      setNotice('A fresh confirmation link has been sent to '+confirmationEmail+'. Check your inbox and spam folder.');
    } catch (e:any) {
      setNotice(e?.message||'We could not resend the confirmation email. Wait a moment and try again.');
    } finally { setConfirmationBusy(false); }
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
  const searchPeople = async () => { try { const r=await api.get('/api/people?q='+encodeURIComponent(peopleQuery)); setPeople(shuffleList(r.data?.items||[])); } catch { setNotice('Could not search members.'); } };
  const togglePersonFollow = async (person:any) => { if(!requireMember('follow members'))return; try { const r=await api.post('/api/follows/toggle',{followed_id:person.id}); const following=!!r.data?.following; setPeople(prev=>prev.map(p=>p.id===person.id?({...p,is_following:following}):p)); setNotice(following?'You are now following '+(person.display_name||person.username||'this member')+'.':'You unfollowed this member.'); } catch(e:any) { setNotice(e?.message||'Could not update follow status.'); } };
  const sendFriendRequest = async (person:any) => { if(!requireMember('send a friend request'))return; try { if(person.friend_request_direction==='received'&&person.friend_request_id){await api.post('/api/friends/'+person.friend_request_id+'/respond',{accept:true});setPeople(prev=>prev.map(p=>p.id===person.id?({...p,friend_status:'accepted'}):p));setNotice('You are now connected with '+(person.display_name||person.username||'this member')+'.');return;} await api.post('/api/friends/request',{to_id:person.id});setPeople(prev=>prev.map(p=>p.id===person.id?({...p,friend_status:'pending',friend_request_direction:'sent'}):p));setNotice('Friend request sent.'); } catch(e:any) { setNotice(e?.message||'Could not send the friend request.'); } };
  const sendReport = async () => {if(!reportTarget||!requireMember('send a report'))return;const reason=reportText.trim();if(!reason){setNotice('Write your report message first.');return;}setReportBusy(true);try{await api.post('/api/reports',{target_type:reportTarget.type,target_id:reportTarget.id,reason});setReportTarget(null);setReportText('');setNotice('Your report has been successfully sent to the admin. It will be reviewed.');}catch(e:any){setNotice(e?.message||'Could not send your report.');}finally{setReportBusy(false);}};
  const openReportChat = async (report:any) => {setReportChat(report);setReportChatMessages([]);setReportChatText('');try{const res=await api.get('/api/reports/'+report.id+'/messages');setReportChatMessages(res.data?.items||[]);}catch(e:any){setNotice(e?.message||'Could not load report conversation.');}};
  const sendReportReply = async () => {if(!reportChat||!reportChatText.trim())return;try{const res=await api.post('/api/reports/'+reportChat.id+'/messages',{message:reportChatText.trim()});setReportChatMessages(v=>[...v,res.data.item]);setReportChatText('');}catch(e:any){setNotice(e?.message||'Could not send reply.');}};
  useEffect(()=>{if(!reportChat?.id)return;let live=true;const channel=supabase.channel('report-chat-'+reportChat.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'report_messages',filter:'report_id=eq.'+reportChat.id},()=>{if(live)void api.get('/api/reports/'+reportChat.id+'/messages').then((res:any)=>{if(live)setReportChatMessages(res.data?.items||[]);}).catch(()=>{});}).subscribe();return()=>{live=false;void supabase.removeChannel(channel);};},[reportChat?.id]);
  const openMyReports = async () => {if(!requireMember('view your reports'))return;try{const res=await api.get('/api/reports/mine');setMyReports(res.data?.items||[]);setShowMyReports(true);}catch(e:any){setNotice(e?.message||'Could not load your reports.');}};
  const signOut = async () => {try{await auth.signOut();setUser(null);setMemberPanel(null);setMemberItems([]);setShowAuth(false);setShowProfile(false);setShowListingForm(false);setShowPostForm(false);setShowGroupForm(false);setShowCart(false);setShowPeople(false);setShowAdmin(false);setShowSubscriptions(false);setPublicProfile(null);setSelectedListing(null);setSelectedPost(null);setMyGroupsOpen(false);setMenuOpen(false);setNotice('You have signed out.');}catch(e:any){setNotice(e?.message||'Could not sign out.');}};
  const openAdmin = async () => { if((user?.email||'').toLowerCase()!=='princewillobongha@gmail.com'){setNotice('Admin access required.');return;} try {const [profilesResult,reportsResult,announcementsResult]=await Promise.all([api.get('/api/admin/profiles'),api.get('/api/admin/reports'),supabase.from('announcements').select('*').order('created_at',{ascending:false}).limit(20)]);if(announcementsResult.error)throw announcementsResult.error;setAnnouncementHistory(announcementsResult.data||[]);setAdminProfiles(profilesResult.data?.items||[]);setAdminReports(reportsResult.data?.items||[]);try{const counts=await Promise.all([supabase.from('profiles').select('*',{count:'exact',head:true}),supabase.from('community_posts').select('*',{count:'exact',head:true}),supabase.from('community_group_posts').select('*',{count:'exact',head:true}),supabase.from('listings').select('*',{count:'exact',head:true}),supabase.from('moderation_reports').select('*',{count:'exact',head:true})]);setAdminStats({members:counts[0].count||0,communityPosts:counts[1].count||0,groupPosts:counts[2].count||0,listings:counts[3].count||0,reports:counts[4].count||reportsResult.data?.items?.length||0});}catch{setAdminStats({members:profilesResult.data?.items?.length||0,reports:reportsResult.data?.items?.length||0});}setShowAdmin(true);} catch(e:any){setNotice(e?.message||'Could not load admin tools.');} };
  const publishAnnouncement = async () => { if((user?.email||'').toLowerCase()!=='princewillobongha@gmail.com'){setNotice('Admin access required.');return;} const title=announcementTitle.trim(),message=announcementMessage.trim();if(!title||!message){setNotice('Add an announcement title and message first.');return;}if(!window.confirm('Send this announcement to every registered member? Each member will receive one notification.'))return;setAnnouncementBusy(true);try{const {data,error}=await supabase.from('announcements').insert({created_by:user?.userId||user?.id,title,message}).select('*').single();if(error)throw error;setAnnouncementHistory(items=>[data,...items].slice(0,20));setAnnouncementTitle('');setAnnouncementMessage('');setNotice('Announcement sent to all registered members.');}catch(e:any){setNotice(e?.message||'Could not send announcement.');}finally{setAnnouncementBusy(false);}};
  const checkUsernameAvailability = async () => {
    const username=String(profile.username||'').trim().toLowerCase();
    const valid=/^[a-z0-9][a-z0-9_]{1,18}[a-z0-9]$/.test(username);
    if(!valid){setUsernameStatus('Use 3–20 characters: lowercase letters, numbers, and underscores. Start and end with a letter or number.');const base=username.replace(/[^a-z0-9_]/g,'').replace(/^_+|_+$/g,'').slice(0,15)||'member';setUsernameSuggestions([base+'_ng',base+'_01',base+'2026'].filter(x=>x.length>=3&&x.length<=20));return;}
    setUsernameStatus('Checking username availability…');setUsernameSuggestions([]);
    try{const {data,error}=await supabase.from('profiles').select('id').eq('username',username).maybeSingle();if(error){setUsernameStatus('Username format looks good. Availability will be confirmed when you save.');return;}const selfId=user?.userId||user?.id;if(data&&data.id!==selfId){setUsernameStatus('That username is already taken. Choose one of these suggestions or try another.');setUsernameSuggestions([username+'_ng',username+'_01',username.slice(0,16)+'_x'].filter(x=>x.length>=3&&x.length<=20));}else{setUsernameStatus('Username looks available.');}}catch{setUsernameStatus('Username format looks good. Availability will be confirmed when you save.');}
  };
  const saveProfile = async () => {
    const username=String(profile.username||'').trim().toLowerCase();
    if(!/^[a-z0-9][a-z0-9_]{1,18}[a-z0-9]$/.test(username)){setUsernameStatus('Please correct your username before saving.');setNotice('Username must be 3–20 characters using lowercase letters, numbers, and underscores, and cannot start or end with an underscore.');return;}
    try{const {data:existing,error:checkError}=await supabase.from('profiles').select('id').eq('username',username).maybeSingle();const selfId=user?.userId||user?.id;if(!checkError&&existing&&existing.id!==selfId){setUsernameStatus('That username is already taken.');setNotice('That username is already taken. Choose a suggested username or try another.');return;}const r=await api.post('/api/profile',{...profile,username});setProfile(r.data.item);setUser((u:any)=>({...u,name:r.data.item.display_name,username:r.data.item.username,avatar_url:r.data.item.avatar_url,city:r.data.item.city}));setUsernameStatus('');setUsernameSuggestions([]);setShowProfile(false);setNotice('Profile saved.');}catch(e:any){const message=e?.message||'Could not save profile.';if(/username|unique|duplicate|already exists/i.test(message)){setUsernameStatus('That username may already be taken. Try a suggested alternative.');const base=username.slice(0,15);setUsernameSuggestions([base+'_ng',base+'_01',base+'2026'].filter(x=>x.length<=20));setNotice('That username may already be in use. Choose another one.');}else setNotice(message);}
  };
  const refreshMemberRestrictions = async (id:string) => {
    const r=await api.get('/api/admin/restrictions?user_id='+encodeURIComponent(id));
    return r.data?.items||[];
  };
  const applyMemberRestriction = async (targetId:string, restrictionType:'community'|'groups'|'marketplace'|'all') => {
    if(!isAdmin||!targetId)return;
    const labels:Record<string,string>={community:'community posting',groups:'group posting',marketplace:'marketplace listings',all:'all posting'};
    const reason=window.prompt('Reason for restricting '+labels[restrictionType]+':','Repeated spam or rule violation');
    if(reason===null)return;
    if(!reason.trim()){setNotice('Add a reason for this restriction.');return;}
    const duration=window.prompt('Duration in days (1–3650), or type permanent.','7');
    if(duration===null)return;
    const permanent=duration.trim().toLowerCase()==='permanent';
    const days=permanent?null:Number(duration);
    if(!permanent&&(!Number.isInteger(days)||Number(days)<1||Number(days)>3650)){setNotice('Enter a whole number from 1 to 3650, or type permanent.');return;}
    try{
      await api.post('/api/admin/restrictions',{user_id:targetId,restriction_type:restrictionType,reason:reason.trim(),days,permanent});
      const restrictions=await refreshMemberRestrictions(targetId);
      setPublicProfile((p:any)=>p?.id===targetId?({...p,restrictions}):p);
      setNotice('Restriction applied. The member has been notified.');
    }catch(e:any){setNotice(e?.message||'Could not apply this restriction.');}
  };
  const removeMemberRestriction = async (targetId:string, restriction:any) => {
    if(!isAdmin||!restriction?.id)return;
    if(!window.confirm('Remove this '+restriction.restriction_type+' restriction? The member will be able to post in that area again unless another restriction applies.'))return;
    try{
      await api.post('/api/admin/restrictions/'+restriction.id+'/remove',{});
      const restrictions=await refreshMemberRestrictions(targetId);
      setPublicProfile((p:any)=>p?.id===targetId?({...p,restrictions}):p);
      setNotice('Restriction removed.');
    }catch(e:any){setNotice(e?.message||'Could not remove this restriction.');}
  };
  const openPublicProfile = async (id:string, fallback:any=null) => {
    if(!id){setNotice('This member profile is missing its account ID.');return;}
    setSelectedListing(null);setSelectedPost(null);setShowProfile(false);setShowListingForm(false);setShowPostForm(false);setShowCart(false);setShowSubscriptions(false);setShowPeople(false);setShowAdmin(false);setMemberPanel(null);setIsFollowingProfile(!!fallback?.is_following);
    setPublicProfile(fallback?({...fallback,posts:fallback.posts||[],listings:fallback.listings||[],loading:true}):{id,display_name:'Loading profile…',username:'',bio:'',listings:[],posts:[],loading:true});
    try{
      const r=await api.get('/api/profile/'+encodeURIComponent(id));const item=r.data?.item;
      if(item){
        let restrictions:any[]=[];
        if(isAdmin&&id!==(user?.userId||user?.id)){try{restrictions=await refreshMemberRestrictions(id);}catch{}}
        setPublicProfile({...item,loading:false,restrictions});
        setIsFollowingProfile(!!r.data?.is_following);
      }else if(!fallback){setPublicProfile(null);setNotice('This member profile could not be found.');}
    }catch(e:any){
      if(!fallback){setPublicProfile(null);setNotice(e?.message||'Could not load this profile. Please try again.');}
      else{
        let restrictions:any[]=[];
        if(isAdmin&&id!==(user?.userId||user?.id)){try{restrictions=await refreshMemberRestrictions(id);}catch{}}
        setPublicProfile({...fallback,loading:false,restrictions});setNotice('Showing available member details. Some profile information could not be loaded.');
      }
    }
  };
  const openGroup = async (group:any) => { setActive('Groups');setSelectedGroup({...group,loading:true,load_error:''});try{const r=await api.get('/api/groups/'+group.id);setSelectedGroup({...group,...(r.data?.item||{}),loading:false,load_error:''});}catch(e:any){const message=e?.message||'Could not load this group. Tap Retry to try again.';setSelectedGroup({...group,loading:false,load_error:message});setNotice(message);} };
  const joinGroup = async (group:any) => {if(!requireMember('Sign in to join a group.'))return;try{await api.post('/api/groups/'+group.id+'/join',{});await openGroup(group);setNotice('You joined '+group.name+'.');}catch(e:any){setNotice(e?.message||'Could not join this group.');}};
  const createGroupPost = async () => {if(!selectedGroup||!requireMember('Sign in to post in this group.'))return;if(!await canCreateContent('groups'))return;if(!groupPostText.trim()){setNotice('Write something before posting.');return;}setBusy(true);try{const image_url=groupPostImage?await uploadImage(groupPostImage):null;await api.post('/api/groups/'+selectedGroup.id+'/posts',{text:groupPostText.trim(),image_url});setGroupPostText('');setGroupPostImage(null);await openGroup(selectedGroup);setNotice('Your group post is published.');}catch(e:any){setNotice(e?.message||'Could not publish in this group.');}finally{setBusy(false);}};
  const deleteGroupPost = async (post:any) => {if(!selectedGroup||!window.confirm('Delete this post from the group?'))return;try{await api.delete('/api/groups/'+selectedGroup.id+'/posts/'+post.id);await openGroup(selectedGroup);setNotice('Group post deleted.');}catch(e:any){setNotice(e?.message||'Could not delete this group post.');}};
  const removeGroupMember = async (member:any) => {if(!selectedGroup||!window.confirm('Remove this member from the group?'))return;try{await api.delete('/api/groups/'+selectedGroup.id+'/members/'+member.user_id);await openGroup(selectedGroup);setNotice('Member removed from the group.');}catch(e:any){setNotice(e?.message||'Could not remove this member.');}};
  const openPost = async (post:any) => {setSelectedPost(post);};
  const deletePost = async (post:any) => {if(!window.confirm('Delete your post? This cannot be undone.'))return;try{await api.delete('/api/posts/'+post.id);setPosts(v=>v.filter(p=>p.id!==post.id));if(selectedPost?.id===post.id)setSelectedPost(null);setNotice('Post deleted.');}catch(e:any){setNotice(e?.message||'Could not delete this post.');}};
  const deleteListing = async (id:string) => {if(!window.confirm('Remove this listing from the marketplace? This cannot be undone.'))return;try{await api.delete('/api/listings/'+id);setListings(v=>v.filter(item=>item.id!==id));setSelectedListing(null);setNotice('Your listing has been deleted.');}catch(e:any){setNotice(e?.message||'Could not delete this listing.');}};
  const markListingSold = async (item:Listing) => { if(!requireMember('manage your listing'))return; const next=item.sale_status==='sold'?'available':'sold'; const prompt=next==='sold'?'Mark this product as SOLD? It will remain visible until its availability expires.':'Mark this product as available again?'; if(!window.confirm(prompt))return; try { await api.post('/api/listings/'+item.id+'/status',{sale_status:next}); setListings(prev=>prev.map(x=>x.id===item.id?({...x,sale_status:next}):x)); setSelectedListing(p=>p?.id===item.id?({...p,sale_status:next}):p); setNotice(next==='sold'?'Listing marked SOLD.':'Listing marked available again.'); } catch(e:any) { setNotice(e?.message||'Could not update listing status.'); } };
  const deleteGroup = async (group:any) => { if(!group?.id||!group.is_owner)return; if(!window.confirm('Delete this group and its posts? This cannot be undone.'))return; try { await api.delete('/api/groups/'+group.id); setGroups(prev=>prev.filter(g=>g.id!==group.id)); setSelectedGroup(null); setNotice('Group and its posts have been deleted.'); } catch(e:any) { setNotice(e?.message||'Could not delete this group.'); } };
  const toggleGroupPostLike = async (post:any) => {if(!selectedGroup||!requireMember('Sign in to like group posts.'))return;try{await api.post('/api/groups/'+selectedGroup.id+'/posts/'+post.id+'/like',{});await openGroup(selectedGroup);}catch(e:any){setNotice(e?.message||'Could not update group post like.');}};
  const requestSubscription = (months:number,price:number) => {const name=user?.name||'Calabar Connect City member';const message='Hello Calabar Connect City Admin, my name is '+name+'. I would like to request the '+months+'-month verification subscription for ₦'+price.toLocaleString('en-NG')+'. Please share the next steps for payment and verification. Thank you.';window.open('https://wa.me/2349017751552?text='+encodeURIComponent(message),'_blank','noopener,noreferrer');setShowSubscriptions(false);};
  const toggleLike = async (post:any) => {if(!requireMember('Sign in to like posts.'))return;try{const r=await api.post('/api/posts/'+post.id+'/like',{});setPosts(v=>v.map(p=>p.id===post.id?{...p,liked_by_me:!!r.data?.liked,like_count:Math.max(0,(p.like_count||0)+(r.data?.liked?1:-1))}:p));if(selectedPost?.id===post.id)setSelectedPost((p:any)=>({...p,liked_by_me:!!r.data?.liked,like_count:Math.max(0,(p.like_count||0)+(r.data?.liked?1:-1))}));}catch(e:any){setNotice(e?.message||'Could not update like.');}};
  const toggleFollow = async (id:string) => { if(!requireMember('follow members'))return; try { const r=await api.post('/api/follows/toggle',{followed_id:id}); const following=!!r.data?.following; setIsFollowingProfile(following); setPublicProfile((p:any)=>p&&p.id===id?({...p,followers_count:Math.max(0,(p.followers_count||0)+(following?1:-1))}):p); setNotice(following?'You are now following this member.':'You unfollowed this member.'); } catch(e:any) { setNotice(e?.message||'Could not update follow status.'); } };
  const contactSeller = async (listing:Listing) => { if(listing.sale_status==='sold'){setNotice('This item has been marked SOLD by the seller.');return;} if(!requireMember('contact a seller'))return; const popup=window.open('about:blank','_blank'); try { const r=await api.get('/api/listings/'+listing.id+'/contact'); const url=String(r.data?.url||''); if(!url) { popup?.close(); setNotice('This seller has not added a WhatsApp contact yet.'); return; } if(popup) popup.location.href=url; else window.location.href=url; } catch(e:any) { popup?.close(); const message=e?.message||'Could not open seller contact.'; if(message.toLowerCase().includes('not verified')) { window.alert(message); setSelectedListing(null); } else setNotice(message); } };
  const createGroup = async () => { if(!requireMember('Sign in to create a group.'))return; if(groupName.trim().length<3){setNotice('Group name must be at least 3 characters.');return;} setBusy(true); try { const avatar_url=groupImage?await uploadImage(groupImage):null; const r=await api.post('/api/groups',{name:groupName,description:groupDescription,avatar_url}); setGroups(p=>[r.data.item,...p]); setShowGroupForm(false); setGroupName(''); setGroupDescription(''); setGroupImage(null); setNotice('Group created successfully.'); await openGroup(r.data.item); } catch(e:any) { setNotice(e?.message||'Could not create group.'); } finally {setBusy(false);} };
  const canCreateContent = async (restrictionType:'community'|'groups'|'marketplace') => {
    if(isAdmin)return true;
    try{
      const r=await api.get('/api/restrictions/mine');
      const match=(r.data?.items||[]).find((item:any)=>(item.restriction_type==='all'||item.restriction_type===restrictionType)&&(!item.expires_at||new Date(item.expires_at).getTime()>Date.now()));
      if(!match)return true;
      const area=restrictionType==='community'?'community posting':restrictionType==='groups'?'group posting':'marketplace listings';
      const expiry=match.expires_at?' Access returns on '+new Date(match.expires_at).toLocaleString()+'.':' This restriction has no expiry date.';
      setNotice('Your '+area+' is restricted. Reason: '+match.reason+'.'+expiry);
      return false;
    }catch{
      setNotice('We could not verify your posting permissions. Please try again before uploading or publishing.');
      return false;
    }
  };
  const saveListing = async () => {
    if (!requireMember('Sign in to publish a listing.')) return;
    if (!await canCreateContent('marketplace')) return;
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
        available_until: null,
        availability_note: '',
        vendor: user.name || 'Community member',
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
        availability_note: '',
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
    if (!await canCreateContent('community')) return;
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
  const markNotificationRead = async (item:any) => {
    if (!item?.id) return;
    try {
      if (!item.read) await api.post('/api/notifications/'+item.id+'/read', {});
      setMemberItems(items=>items.map((n:any)=>n.id===item.id?{...n,read:true}:n));
      if (!item.read) setUnreadNotifications(value=>Math.max(0,value-1));
    } catch { setNotice('Could not update this notification. Please try again.'); }
  };
  const deleteNotification = async (item:any) => { if(!item?.id)return;try{await api.delete('/api/notifications/'+item.id);setMemberItems(items=>items.filter((n:any)=>n.id!==item.id));if(!item.read)setUnreadNotifications(value=>Math.max(0,value-1));}catch(e:any){setNotice(e?.message||'Could not delete this notification.');} };
  const clearAllNotifications = async () => {if(!memberItems.length)return;if(!window.confirm('Delete all your notifications? This cannot be undone.'))return;try{await api.delete('/api/notifications/clear-all');setMemberItems([]);setUnreadNotifications(0);setNotice('All notifications cleared.');}catch(e:any){setNotice(e?.message||'Could not clear notifications.');}};
  const openNotification = async (item:any) => {
    await markNotificationRead(item);
    setMemberPanel(null);
    setMenuOpen(false);
    const target=String(item?.target_url||'');
    if (target.startsWith('announcement://')) { const parts=String(item?.body||'').split('\n');setSelectedAnnouncement({title:parts.shift()||item?.title||'Calabar Connect City Update',message:parts.join('\n'),created_at:item?.created_at});return; }
    if (target.startsWith('profile://')) { await openPublicProfile(target.slice('profile://'.length)); return; }
    if (target.startsWith('listing://')) {
      const id=target.slice('listing://'.length);
      let listing=listings.find((x:any)=>x.id===id);
      if (!listing) { try { const r=await api.get('/api/listings'); const items=r.data?.items||[]; setListings(items); listing=items.find((x:any)=>x.id===id); } catch {} }
      if (!listing) { setNotice('This listing may have been removed.'); return; }
      setActive('Marketplace');
      window.setTimeout(()=>setSelectedListing(listing as Listing),40);
      return;
    }
    if (target.startsWith('post://')) {
      const id=target.slice('post://'.length);
      let post=posts.find((x:any)=>x.id===id);
      if (!post) { try { const r=await api.get('/api/posts'); const items=r.data?.items||[]; setPosts(items); post=items.find((x:any)=>x.id===id); } catch {} }
      if (!post) { setNotice('This post may have been removed.'); return; }
      setActive('Community');
      window.setTimeout(()=>void openPost(post),40);
      return;
    }
    if (target.startsWith('report://')) {
      const reportId=target.slice('report://'.length);
      try {
        const admin=(user?.email||'').toLowerCase()==='princewillobongha@gmail.com';
        const res=await api.get(admin?'/api/admin/reports':'/api/reports/mine');
        const report=(res.data?.items||[]).find((r:any)=>r.id===reportId);
        if(report){if(admin){setAdminReports(res.data.items||[]);setShowAdmin(true);}await openReportChat(report);return;}
        setNotice('This report conversation could not be found.');
      } catch(e:any){setNotice(e?.message||'Could not open the report conversation.');}
      return;
    }
    if (target.startsWith('group-post://')) {
      const [groupId,postId]=target.slice('group-post://'.length).split('/');
      try {
        const r=await api.get('/api/groups');
        let group=(r.data?.items||[]).find((g:any)=>g.id===groupId);
        if (!group) {
          try { const detail=await api.get('/api/groups/'+groupId); group=detail.data?.item; } catch {}
        }
        if (!group) { setNotice('This group may no longer be available.'); return; }
        await openGroup(group);
        window.setTimeout(()=>document.getElementById('group-post-'+postId)?.scrollIntoView({behavior:'smooth',block:'center'}),180);
      } catch { setNotice('Could not open this group post. Please try again.'); }
    }
  };
  const openMemberPanel = async (kind: 'friends' | 'notifications') => {
    setMenuOpen(false);
    if (!requireMember('Sign in to use member tools.')) return;
    setShowAuth(false); setShowProfile(false); setShowListingForm(false); setShowPostForm(false);
    setShowGroupForm(false); setShowCart(false); setShowPeople(false); setShowAdmin(false);
    setShowSubscriptions(false); setPublicProfile(null); setSelectedListing(null); setSelectedPost(null); setMyGroupsOpen(false);
    setMemberPanel(kind);
    setMemberItems([]);
    try {
      if (kind === 'friends') {
        const peopleResult = await api.get('/api/people');
        setPeople(shuffleList(peopleResult.data?.items || []));
      }
      const path = kind === 'friends' ? '/api/friends' : '/api/notifications';
      const result = await api.get(path);
      setMemberItems(result.data?.items || []);
      if(kind==='notifications')setUnreadNotifications((result.data?.items||[]).filter((n:any)=>!n.read).length);
    } catch {
      setNotice('Could not load this area. Please try again.');
    }
  };
  const interact = (label: string) => {
    if (!requireMember('Sign in to ' + label + '.')) return;
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
    setNotice('You are signed in. Use the People directory and Connections tools to connect with members.');
  };
  const nav = ['Discover', 'Marketplace', 'Community', 'Groups', 'Businesses', 'Jobs'];
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand brand-logo-only" href="#home" aria-label="Calabar Connect City home" onClick={() => {setActive('Discover');setSelectedGroup(null);}}><span className="brand-wordmark">Calabar Connect City</span></a>
  
        <div className="top-actions">
          <button className="icon-btn header-search" aria-label="Search members" onClick={()=>{setActive('Search');setSelectedGroup(null);setMemberPanel(null);setPeopleQuery('');void api.get('/api/people').then(r=>setPeople(shuffleList(r.data?.items||[]))).catch(()=>setNotice('Could not load members. Please try again.'));}}>
            <Search size={19}/>
          </button>
          <button
            className="icon-btn notification"
            aria-label="Notifications"
            onClick={() => void openMemberPanel('notifications')}
            title="Notifications"
          >
            <Bell size={19} /><span className="notification-label">Notifications</span>{unreadNotifications>0&&<span className="notification-count">{unreadNotifications>99?'99+':unreadNotifications}</span>}
          </button>
          {(user?.email||'').toLowerCase()==='princewillobongha@gmail.com' && <button className="icon-btn" aria-label="Admin verification" onClick={()=>void openAdmin()}><ShieldCheck size={19}/></button>}
          {user ? (
            <button className="profile-pill" onClick={() => void openPublicProfile(user?.userId||user?.id)}>
              {user.avatar_url ? <img className="avatar profile-avatar-img" src={user.avatar_url} alt="Profile" /> : <span className="avatar">{(user.name || user.email || 'M').slice(0, 1).toUpperCase()}</span>}
              <span>{user.name || 'My account'}</span>
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
          <button onClick={() => { setShowSubscriptions(true); setMenuOpen(false); }}>Verification subscription <BadgeCheck size={16}/></button>
          <button onClick={() => { setShowCart(true); setMenuOpen(false); }}>Shopping cart ({cart.length}) <ShoppingCart size={16}/></button>
          {user && (
            <button onClick={() => { setMenuOpen(false); void openMyReports(); }}>My reports <ShieldCheck size={16}/></button>
          )}
          {user && (
            <button
              className="danger-link"
              onClick={async () => {
                setMenuOpen(false);
                if (!window.confirm("Delete your account and associated activity permanently?")) return;
                const { data, error } = await supabase.functions.invoke("delete-account", { method: "POST" });
                if (error || data?.error) {
                  setNotice(data?.error || error?.message || "Could not delete account.");
                  return;
                }
                await auth.signOut();
                setUser(null);
                setPosts([]);
                setListings([]);
                setGroups([]);
                setCart([]);
                setNotice("Your account and associated likes and follows have been removed.");
              }}
            >
              Delete account <X size={16}/>
            </button>
          )}
          <button onClick={() => setDarkMode(v => !v)} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>{darkMode ? 'Switch to light mode' : 'Switch to dark mode'} {darkMode ? <Sun size={16}/> : <Moon size={16}/>}</button>
          {user&&<button className="sign-out-link" onClick={()=>{setMenuOpen(false);void signOut();}}>Logout <LogIn size={16}/></button>}
        </div>
      )}
      <div className="page-wrap">
        <aside className="sidebar">
          <div className="side-label">YOUR CALABAR</div>
          {nav.map((item, index) => {
            const Icon = [
              Sparkles,
              ShoppingBag,
              Heart,
              Users,
              Store,
              BriefcaseBusiness,
            ][index] || Sparkles;
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
          <button className={`nav-item ${active === 'Search' ? 'active' : ''}`} onClick={() => { setActive('Search'); setPeopleQuery(''); void api.get('/api/people').then(r=>setPeople(shuffleList(r.data?.items||[]))).catch(()=>setNotice('Could not load members. Please try again.')); }}>
            <Search size={18}/><span>Search</span>
          </button>
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
                  <h1>{memberPanel === 'friends' ? 'Connections' : 'Notifications'}</h1>
                  <p>{memberPanel === 'friends' ? 'Review connection requests.' : 'Updates about your community activity and connections.'}</p>
                </div>
                <button className="ghost-btn" onClick={() => setMemberPanel(null)}>Close <X size={15} /></button>
              </div>
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
                  <label>Find a member<input value={peopleQuery} onChange={e=>setPeopleQuery(e.target.value)} placeholder="Search by name or username" /></label>
                  <div className="member-picker">
                    {people.filter((person:any)=>person.id!==(user?.userId||user?.id)&&((person.display_name||person.full_name||person.username||'').toLowerCase().includes(peopleQuery.toLowerCase()))).slice(0,6).map((person:any)=><button type="button" key={person.id} className={'member-pick-option '+(recipientId===person.id?'selected':'')} onClick={()=>setRecipientId(person.id)}><span className="avatar">{(person.display_name||person.full_name||person.username||'M').slice(0,1).toUpperCase()}</span><span><b>{person.display_name||person.full_name||person.username||'Calabar member'}</b><small>@{person.username||'member'}</small></span><span>{recipientId===person.id?'Selected':'Choose'}</span></button>)}
                    {!people.length&&<small>Loading members or no members found yet.</small>}
                  </div>
                  <button className="primary-btn" disabled={!recipientId}>Send connection request <Users size={16} /></button>
                </form>
              )}
              <div className="member-list">
                {memberPanel==='notifications'&&memberItems.length>0&&<div className="notification-list-actions"><span>{memberItems.length} notifications</span><button className="danger-link" onClick={()=>void clearAllNotifications()}>Clear all</button></div>}
                {memberItems.length ? memberItems.map((item, i) => (
                  <article className={'member-item '+(memberPanel==='notifications'&&!item.read?'notification-unread':'')} key={item.id || i} role={memberPanel==='notifications'?'button':undefined} tabIndex={memberPanel==='notifications'?0:undefined} onKeyDown={e=>{if(memberPanel==='notifications'&&(e.key==='Enter'||e.key===' ')){e.preventDefault();void openNotification(item);}}} onClick={()=>{if(memberPanel==='notifications')void openNotification(item);}}>
                    <b>{item.title || item.from_name || item.sender_name || item.kind || 'Community update'}</b>
                    <p>{item.body || item.text || (item.status ? 'Status: ' + item.status : '')}</p>
                    <small>{item.created_at ? new Date(item.created_at).toLocaleString() : ''}{item.sender_id ? ' · Member ID: ' + (item.sender_id === user?.userId ? item.recipient_id : item.sender_id) : ''}</small>
                    {memberPanel === 'friends' && item.status === 'pending' && item.to_id === user?.userId && (
                      <div className="member-actions">
                        <button className="primary-btn" onClick={async () => { await api.post('/api/friends/' + item.id + '/respond', { accept: true }); await openMemberPanel('friends'); }}>Accept</button>
                        <button className="ghost-btn" onClick={async () => { await api.post('/api/friends/' + item.id + '/respond', { accept: false }); await openMemberPanel('friends'); }}>Decline</button>
                      </div>
                    )}
                    {memberPanel === 'notifications' && <div className="notification-item-actions">{!item.read&&item.id&&<button className="text-link" onClick={async(e)=>{e.stopPropagation();await markNotificationRead(item);}}>Mark as read</button>}<button className="notification-delete-button" aria-label="Delete notification" title="Delete notification" onClick={e=>{e.stopPropagation();void deleteNotification(item);}}><X size={15}/></button></div>}
                  </article>
                )) : (
                  <div className="empty-state"><Bell size={26} /><h3>{memberPanel==='notifications'?'No notifications yet':'No connection requests yet'}</h3><p>{memberPanel==='notifications'?'You’re all caught up. New listings, community posts, group activity and new followers will appear here.':'Connection requests will appear here when members want to connect.'}</p></div>
                )}
              </div>
            </section>
          )}
          {!memberPanel && notice && (
            <div className="notice" role="status">
              <span>{notice}</span>
              {confirmationEmail&&<button className="text-link" onClick={async()=>{try{await auth.resendConfirmation(confirmationEmail);setNotice('A new confirmation email has been sent to '+confirmationEmail+'. Check your inbox and spam folder.');setConfirmationEmail('');}catch(e:any){setNotice(e?.message||'Could not resend the confirmation email. Check Supabase Auth redirect URLs and email settings.');}}}>Resend confirmation email</button>}
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
                    <button className="shop-local-link" onClick={()=>{setActive('Marketplace');setCategory('All');}}><b>Shop local</b><small>Browse products and services in Calabar</small></button>
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
              <section className="section-block explore-city-section">
                <div className="section-heading">
                  <div>
                    <div className="eyebrow muted">MORE AROUND YOUR CITY</div>
                    <h2>Explore Calabar</h2>
                    <p className="section-subtitle">Find people, join conversations and discover local offers.</p>
                  </div>
                </div>
                <div className="category-grid explore-city-grid">
                  <button className="category-card" onClick={()=>{setPeopleQuery('');setActive('Search');void api.get('/api/people').then(r=>setPeople(shuffleList(r.data?.items||[]))).catch(()=>setNotice('Could not load members. Please try again.'));}}>
                    <span className="category-icon blue"><Users size={22}/></span><b>People</b><span>Follow members and add friends <ArrowUpRight size={14}/></span>
                  </button>
                  <button className="category-card" onClick={()=>setActive('Groups')}>
                    <span className="category-icon green"><Users size={22}/></span><b>Community groups</b><span>Join shared interests <ArrowUpRight size={14}/></span>
                  </button>
                  <button className="category-card" onClick={()=>setActive('Community')}>
                    <span className="category-icon rose"><MessageCircle size={22}/></span><b>Community board</b><span>See what people are saying <ArrowUpRight size={14}/></span>
                  </button>
                  <button className="category-card" onClick={()=>setActive('Businesses')}>
                    <span className="category-icon peach"><Store size={22}/></span><b>Local businesses</b><span>Discover shops and services <ArrowUpRight size={14}/></span>
                  </button>
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
                                    onMarkSold={markListingSold}
                  items={listings.slice(0, 4)}
                  onOpen={setSelectedListing}
                  onContact={contactSeller}
                  currentUserId={user?.userId||user?.id}
                  isAdmin={isAdmin}
                  onDelete={deleteListing}
                  onOpenSeller={id=>void openPublicProfile(id)}
                />
                <button className="text-link see-more-marketplace" onClick={()=>setActive('Marketplace')}>See more marketplace listings <ChevronRight size={16}/></button>
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
          {!memberPanel && active === 'Search' && <section className="search-page"><div className="page-title"><div><h1>Calabar Connect City</h1></div></div><form className="search-page-form" onSubmit={e=>{e.preventDefault();void searchPeople();}}><Search size={20}/><input value={peopleQuery} onChange={e=>setPeopleQuery(e.target.value)} placeholder="Search Calabar Connect City"/><button className="primary-btn" type="submit">Search</button></form><div className="search-results-list">{people.filter((person:any)=>person.id!==(user?.userId||user?.id)).map((person:any)=><article className="search-person-card" key={person.id}>{person.avatar_url?<img src={person.avatar_url} alt=""/>:<span className="avatar">{(person.display_name||person.username||'M').slice(0,1).toUpperCase()}</span>}<div><b>{person.display_name||person.full_name||person.username} {person.is_verified&&<BadgeCheck size={15} className="verified-badge"/>}</b><small>@{person.username||'member'}</small><p>{person.bio||person.city||'Calabar Connect City member'}</p><div className="people-card-actions"><button className="primary-btn" onClick={()=>void openPublicProfile(person.id)}>View profile</button><button className="ghost-btn" onClick={()=>void togglePersonFollow(person)}>{person.is_following?'Following · Unfollow':'Follow'}</button></div></div></article>)}{people.length===0&&<div className="empty-state"><Search size={28}/><h3>{peopleQuery?'No members found':'No members yet'}</h3><p>{peopleQuery?'Try a different name or username.':'New members will appear here when they create accounts.'}</p></div>}</div></section>}
          {!memberPanel && active === 'Businesses' && (
            <section className="business-directory-page">
              <div className="page-title">
                <div><div className="eyebrow muted">DISCOVER CALABAR</div><h1>Local businesses & services</h1><p>Explore real businesses and vendors on Calabar Connect City.</p></div>
                <button className="primary-btn" onClick={()=>{if(requireMember('list a business or item'))setShowListingForm(true);}}><Plus size={16}/> List your business</button>
              </div>
              {businesses.length>0?<div className="business-directory-grid">{businesses.map((business:any)=><article className="business-directory-card" key={business.id}>
                <div className="business-directory-image">{business.cover_image_url||business.latest_listing_image?<img src={business.cover_image_url||business.latest_listing_image} alt={business.business_name}/>:<span><Store size={28}/></span>}<small>{business.category||'Local business'}</small></div>
                <div className="business-directory-body"><div className="business-directory-title"><h3>{business.business_name||business.owner_name}</h3>{business.is_verified?<BadgeCheck size={17} className="verified-badge" aria-label="Verified business"/>:<span className="not-verified-badge">Not Verified</span>}</div>
                  <p>{business.description||'A local business on Calabar Connect City.'}</p><div className="business-directory-meta"><MapPin size={14}/>{business.area||business.address||'Calabar, Cross River'}</div><div className="business-directory-meta"><ShoppingBag size={14}/>{business.listing_count||0} active listings</div>
                  <div className="business-directory-actions"><button className="ghost-btn" onClick={()=>void openPublicProfile(business.owner_id)}>View profile</button><button className="primary-btn" onClick={()=>{setQuery(business.business_name||'');setCategory('All');setActive('Marketplace');}}>View listings</button></div>
                </div>
              </article>)}</div>:<div className="empty-state"><Store size={30}/><h3>Local businesses are joining</h3><p>As members create seller profiles, their real businesses will appear here. No demo businesses are shown.</p><button className="primary-btn" onClick={()=>{if(requireMember('list a business or item'))setShowListingForm(true);}}>List the first business</button></div>}
            </section>
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
              <form className="marketplace-search-form" onSubmit={e=>{e.preventDefault();void searchMarketplace();}}><Search size={19}/><input value={marketplaceQuery} onChange={e=>{setMarketplaceQuery(e.target.value);if(!e.target.value.trim())setMarketplacePeople([]);}} placeholder="Search products, vendors or categories — e.g. leather jacket or Topboy Collection" aria-label="Search marketplace products and vendors"/><button className="primary-btn" type="submit">Search</button></form>
              {marketplacePeople.length>0 && marketplaceQuery.trim() && <section className="marketplace-seller-results"><div><h3>Matching people & business profiles</h3><p>Open a seller profile to see their available listings.</p></div><div className="marketplace-seller-list">{marketplacePeople.filter((person:any)=>((person.display_name||'')+' '+(person.full_name||'')+' '+(person.username||'')).toLowerCase().includes(marketplaceQuery.trim().toLowerCase())).slice(0,8).map((person:any)=><button className="marketplace-seller-result" key={person.id} onClick={()=>void openPublicProfile(person.id,person)}>{person.avatar_url?<img src={person.avatar_url} alt=""/>:<span className="avatar">{(person.display_name||person.username||'M').slice(0,1).toUpperCase()}</span>}<span><b>{person.display_name||person.full_name||person.username||'Calabar seller'}</b><small>@{person.username||'member'} · View profile</small></span><ChevronRight size={16}/></button>)}</div></section>}
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
                <span className="result-count">{filteredMarketplace.length} listings</span>
              </div>
              {filteredMarketplace.length ? (
                <ListingGrid
                  onMarkSold={markListingSold}
                  items={filteredMarketplace}
                  onOpen={setSelectedListing}
                  onContact={contactSeller}
                  currentUserId={user?.userId||user?.id}
                  isAdmin={isAdmin}
                  onDelete={deleteListing}
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
                  <article className="group-card" key={g.id} onClick={()=>void openGroup(g)} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();void openGroup(g);}}}>
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
                        <button onClick={e => {e.stopPropagation();void openGroup(g);}}>
                          Open group <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>)}
              {selectedGroup && <section className="group-detail-page">
                <button className="ghost-btn" onClick={()=>setSelectedGroup(null)}>← All groups</button>
                {selectedGroup.loading&&<div className="group-load-state">Opening {selectedGroup.name}…</div>}
                {selectedGroup.load_error&&<div className="group-load-error"><p>{selectedGroup.load_error}</p><button className="primary-btn" onClick={()=>void openGroup(selectedGroup)}>Retry opening group</button></div>}
                <div className="group-profile-hero">{selectedGroup.avatar_url?<img src={selectedGroup.avatar_url} alt="Group"/>:<div className="group-avatar-fallback"><Users size={34}/></div>}<div><h1>{selectedGroup.name}</h1><p>{selectedGroup.description||'A community space for local members.'}</p><small>{selectedGroup.members||0} members</small></div>{selectedGroup.is_owner&&<label className="group-avatar-change">Change group photo<input type="file" accept="image/*" onChange={async e=>{const f=e.target.files?.[0];if(f)try{const avatar_url=await uploadImage(f);await api.post('/api/groups/'+selectedGroup.id+'/update',{avatar_url,description:selectedGroup.description});await openGroup(selectedGroup);setNotice('Group photo updated.');}catch(err:any){setNotice(err?.message||'Could not update group photo.');}}}/></label>}</div>
                {selectedGroup.is_owner&&<button className="danger-outline-btn group-delete-button" onClick={()=>void deleteGroup(selectedGroup)}><X size={16}/> Delete group</button>}
                {!selectedGroup.is_member&&!selectedGroup.is_owner&&<button className="primary-btn" onClick={()=>void joinGroup(selectedGroup)}>Join group</button>}
                {selectedGroup.is_member||selectedGroup.is_owner ? <div className="group-composer"><h3>Write a post</h3><textarea value={groupPostText} onChange={e=>setGroupPostText(e.target.value)} placeholder="Share with the group… Use @username to tag a member."/><div className="composer-actions"><label className="ghost-btn">Add photo<input type="file" accept="image/*" onChange={e=>setGroupPostImage(e.target.files?.[0]||null)}/></label>{groupPostImage&&<small>{groupPostImage.name}</small>}<button className="primary-btn" disabled={busy} onClick={()=>void createGroupPost()}>{busy?'Posting…':'Post to group'}</button></div></div>:<p className="muted">Join this group to read and publish group posts.</p>}
                <div className="group-post-list">{[...(selectedGroup.posts||[])].sort((a:any,b:any)=>Number(!!b.pinned_at)-Number(!!a.pinned_at)).map((gp:any)=><article id={'group-post-'+gp.id} className={'feed-card group-post-card '+(gp.pinned_at?'feed-card-pinned':'')} key={gp.id}>{gp.pinned_at&&<span className="post-pin-indicator" aria-label="Pinned post" title="Pinned post"><Pin size={17}/></span>}<button className="feed-avatar feed-avatar-button" onClick={()=>void openPublicProfile(gp.author_id)}>{gp.avatar_url?<img src={gp.avatar_url} alt=""/>:(gp.author||'M').slice(0,1)}</button><div><button className="post-author-link" onClick={()=>void openPublicProfile(gp.author_id)}>{gp.author} {gp.is_verified&&<BadgeCheck size={15} className="verified-badge"/>}</button><small>{new Date(gp.created_at).toLocaleString()}</small><p>{gp.text}</p>{gp.image_url&&<img className="post-photo" src={gp.image_url} alt="Group post"/>}<div className="post-actions"><button className={'text-link '+(gp.liked_by_me?'liked-action':'')} onClick={()=>void toggleGroupPostLike(gp)}><Heart size={16} fill={gp.liked_by_me?'currentColor':'none'}/> {gp.liked_by_me?'Liked':'Like'} <span>{gp.like_count||0}</span></button><button className="text-link" onClick={()=>{setReportTarget({type:'group_post',id:gp.id,label:'group post'});setReportText('');}}>Report</button>{(user?.email||'').toLowerCase()==='princewillobongha@gmail.com'&&<button className="text-link" onClick={async()=>{try{const z=await api.post('/api/groups/'+selectedGroup.id+'/posts/'+gp.id+'/pin',{});await openGroup(selectedGroup);setNotice(z.data?.pinned?'Group post pinned.':'Group post unpinned.');}catch(e:any){setNotice(e?.message||'Could not pin group post.');}}}>{gp.pinned_at?'Unpin':'Pin post'}</button>}{(((user?.email||'').toLowerCase()==='princewillobongha@gmail.com')||selectedGroup.is_owner||gp.author_id===user?.userId||gp.author_id===user?.id)&&<button className="text-link danger-link" onClick={()=>void deleteGroupPost(gp)}>Delete post</button>}</div></div></article>)}{!(selectedGroup.posts||[]).length&&<div className="empty-state"><Users size={25}/><h3>No posts yet</h3><p>Be the first to post in this group.</p></div>}</div>
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
                  [...posts].sort((a,b)=>Number(!!b.pinned_at)-Number(!!a.pinned_at)).map(p => (
                    <article className={'feed-card '+(p.pinned_at?'feed-card-pinned':'')} key={p.id} onClick={e=>{if(!(e.target as HTMLElement).closest('button,input,form,a'))void openPost(p);}} onKeyDown={e=>{if(e.key==='Enter'&&!(e.target as HTMLElement).closest('button,input,form,a'))void openPost(p);}} tabIndex={0}>
                      {p.pinned_at&&<span className="post-pin-indicator" aria-label="Pinned post" title="Pinned post"><Pin size={17}/></span>}
                      <button className="feed-avatar feed-avatar-button" aria-label={'View '+(p.author||'member')+' profile'} onClick={()=>p.author_id&&void openPublicProfile(p.author_id)}>{p.avatar_url ? <img src={p.avatar_url} alt="" /> : (p.author || 'C').slice(0, 1).toUpperCase()}</button>
                      <div>
                        <button className="post-author-link" onClick={()=>p.author_id&&void openPublicProfile(p.author_id)}>{p.author || 'Community member'} {p.is_verified && <BadgeCheck size={16} className="verified-badge" aria-label="Verified account"/>}</button>
                        <small>
                          {p.category || 'Community'} ·{' '}
                          {p.created_at
                            ? new Date(p.created_at).toLocaleDateString()
                            : 'Just now'}
                        </small>
                        <p className="post-open-text" role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'){void openPost(p);}}} onClick={()=>void openPost(p)}>{p.text}</p>
                        {p.image_url && <img className="post-photo post-open-image" onClick={()=>void openPost(p)} src={p.image_url} alt="Community post" />}
                        <div className="post-actions"><button className={'text-link '+(p.liked_by_me?'liked-action':'')} onClick={()=>void toggleLike(p)}><Heart size={16} fill={p.liked_by_me?'currentColor':'none'}/> {p.liked_by_me?'Liked':'Like'} <span>{p.like_count||0}</span></button><button className="text-link" onClick={()=>{if(requireMember('report posts')){setReportTarget({type:'community_post',id:p.id,label:'community post'});setReportText('');}}}><ShieldCheck size={15}/> Report</button>{(user?.email||'').toLowerCase()==='princewillobongha@gmail.com'&&<button className="text-link" onClick={async()=>{try{const z=await api.post('/api/posts/'+p.id+'/pin',{});setPosts(v=>v.map(x=>x.id===p.id?({...x,pinned_at:z.data?.pinned?new Date().toISOString():null}):x));setNotice(z.data?.pinned?'Post pinned.':'Post unpinned.');}catch(e:any){setNotice(e?.message||'Could not pin post.');}}}>{p.pinned_at?'Unpin':'Pin post'}</button>}{(((user?.email||'').toLowerCase()==='princewillobongha@gmail.com')||p.author_id===user?.userId||p.author_id===user?.id)&&<button className="text-link danger-link" onClick={()=>void deletePost(p)}>Delete</button>}</div>
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
                  onRate={(item,rating)=>void rateListingVendor(item,rating)}
                  onMarkSold={markListingSold}
                items={listings.filter(
                  l => l.category === 'Jobs' || l.kind === 'Job'
                )}
                onOpen={setSelectedListing}
                onContact={contactSeller}
                  currentUserId={user?.userId||user?.id}
                  isAdmin={isAdmin}
                  onDelete={deleteListing}
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
          { n: 'Search', i: Search },
          { n: 'Community', i: MessageCircle },
          { n: 'Groups', i: Users },
        ].map(({ n, i: Icon }) => (
          <button
            key={n}
            className={active === n ? 'selected' : ''}
            onClick={() => { setActive(n); if(n==='Search'){setPeopleQuery('');void api.get('/api/people').then(r=>setPeople(shuffleList(r.data?.items||[]))).catch(()=>setNotice('Could not load members. Please try again.'));} }}
          >
            <Icon size={20} />
            <span>{n}</span>
          </button>
        ))}
      </nav>
      {showAbout && <div className="modal-backdrop" onClick={() => setShowAbout(false)}><div className="modal form-modal about-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowAbout(false)}><X size={18}/></button><div className="eyebrow muted">ABOUT US</div><h2>Calabar Connect City</h2><p>Calabar Connect City brings people, local businesses, community conversations, groups, jobs and marketplace discoveries together in Calabar, Cross River State.</p><p>Our goal is to make it easier for residents to discover trusted local services, connect with neighbours and share useful community updates.</p><button className="primary-btn full-btn" onClick={() => setShowAbout(false)}>Back to Calabar Connect City</button></div></div>}
      {showAuth && (
        <div className="modal-backdrop" onClick={() => setShowAuth(false)}>
          <div className="modal auth-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAuth(false)}>
              <X size={18} />
            </button>
            <div className="modal-wordmark" aria-label="Calabar Connect City">Calabar Connect City</div>
            <span className="eyebrow muted">WELCOME TO YOUR CITY</span>
            <h2>Come on in.</h2>
            <p>
              Sign in to save favourites, publish listings, join groups and
              connect with the community.
            </p>
            <form className="auth-form" onSubmit={e => { e.preventDefault(); void signIn(); }}>
              <label>Email address<input type="email" autoComplete="email" required value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="you@example.com" /></label>
              <label>Password<div className="password-input-wrap"><input type={authPasswordVisible?'text':'password'} autoComplete={authMode==='signup'?'new-password':'current-password'} minLength={6} required value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="At least 6 characters" /><button type="button" className="password-visibility-toggle" onClick={()=>setAuthPasswordVisible(v=>!v)} aria-label={authPasswordVisible?'Hide password':'Show password'} title={authPasswordVisible?'Hide password':'Show password'}>{authPasswordVisible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
              {authMode==='signup'&&<label>Confirm password<div className="password-input-wrap"><input type={authConfirmVisible?'text':'password'} autoComplete="new-password" minLength={6} required value={authConfirmPassword} onChange={e=>setAuthConfirmPassword(e.target.value)} placeholder="Enter the same password again" /><button type="button" className="password-visibility-toggle" onClick={()=>setAuthConfirmVisible(v=>!v)} aria-label={authConfirmVisible?'Hide confirmation password':'Show confirmation password'} title={authConfirmVisible?'Hide password':'Show password'}>{authConfirmVisible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>}
              <button className="primary-btn full-btn" type="submit" disabled={busy}><LogIn size={17} /> {busy ? 'Please wait…' : authMode==='signup'?'Create account':'Sign in securely'}</button>
            </form>
            <small className="fine-print">{authMode==='signup'?'Create your free Calabar Connect City account.':'Sign in to save favourites, publish listings and connect.'}</small>
            <button type="button" className="text-link auth-switch" onClick={()=>{setAuthMode(m=>m==='signin'?'signup':'signin');setAuthConfirmPassword('');setAuthPasswordVisible(false);setAuthConfirmVisible(false);}}>{authMode==='signup'?'Already have an account? Sign in':'New here? Create an account'}</button>
          </div>
        </div>
      )}
      {confirmationEmail && <div className="modal-backdrop confirmation-success-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirmation-success-title"><div className="modal form-modal confirmation-success-modal" onClick={e=>e.stopPropagation()}><div className="confirmation-success-icon"><Send size={24}/></div><span className="eyebrow muted">ONE LAST STEP</span><h2 id="confirmation-success-title">Check your email</h2><p>We’ve sent an account confirmation link to <strong>{confirmationEmail}</strong>.</p><p>Open the email and tap <strong>Confirm your email</strong> to activate your Calabar Connect City account. If you don’t see it, check your spam or junk folder.</p><button className="primary-btn full-btn" onClick={()=>{setConfirmationEmail('');setAuthEmail(confirmationEmail);setAuthMode('signin');setShowAuth(true);}}>I’ll confirm, then sign in</button><button className="ghost-btn full-btn" disabled={confirmationBusy} onClick={()=>void resendSignupConfirmation()}>{confirmationBusy?'Sending confirmation…':'Resend confirmation link'}</button><button className="text-link full-btn" onClick={()=>setConfirmationEmail('')}>Close</button></div></div>}
      {showPeople && <div className="modal-backdrop" onClick={()=>setShowPeople(false)}><div className="modal form-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowPeople(false)}><X size={18}/></button><h2>Find people</h2><form onSubmit={e=>{e.preventDefault();void searchPeople();}}><label>Search by username<input value={peopleQuery} onChange={e=>setPeopleQuery(e.target.value)} placeholder="Enter a username" required/></label><button className="primary-btn full-btn" type="submit">Search members</button></form><div className="member-list">{people.map((person:any)=><article className="member-item" key={person.id}>{person.avatar_url&&<button className="people-result-avatar-button" aria-label={'Open '+(person.display_name||person.username||'member')+' profile'} onClick={()=>{setShowPeople(false);void openPublicProfile(person.id,person);}}><img className="profile-preview" src={person.avatar_url} alt=""/></button>}<b>{person.display_name||person.username} {person.is_verified&&<BadgeCheck size={16} className="verified-badge"/>}</b><p>@{person.username}</p><button className="primary-btn" onClick={()=>{setShowPeople(false);void openPublicProfile(person.id,person);}}>View profile</button></article>)}</div></div></div>}
      {showAdmin && <div className="modal-backdrop" onClick={()=>setShowAdmin(false)}><div className="modal form-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowAdmin(false)}><X size={18}/></button><div className="admin-dashboard-heading"><div><div className="eyebrow muted">ADMIN CONTROL CENTRE</div><h2>Admin dashboard</h2><p>Manage members, announcements, marketplace listings, verification and reports.</p></div><button className="ghost-btn" onClick={()=>void openAdmin()}>Refresh dashboard</button></div><div className="admin-stats-grid"><div className="admin-stat-card"><span>Members</span><strong>{adminStats.members}</strong><small>Registered accounts</small></div><div className="admin-stat-card"><span>Community posts</span><strong>{adminStats.communityPosts}</strong><small>Public feed</small></div><div className="admin-stat-card"><span>Group posts</span><strong>{adminStats.groupPosts}</strong><small>Group activity</small></div><div className="admin-stat-card"><span>Marketplace</span><strong>{adminStats.listings}</strong><small>Listings</small></div><div className="admin-stat-card"><span>Reports</span><strong>{adminStats.reports}</strong><small>Items requiring review</small></div></div><section className="admin-capacity-panel"><div><span className="eyebrow muted">PLATFORM HEALTH</span><h3>Community size & capacity</h3><p>There is no single fixed member limit shown here. Capacity depends on your hosting plan, database quotas, storage, traffic, and how efficiently the app handles requests. Monitor provider usage and test with realistic traffic before a major launch.</p></div><div className="admin-capacity-metrics"><span><b>{adminStats.members}</b><small>Registered members</small></span><span><b>{adminStats.listings}</b><small>Marketplace listings</small></span><span><b>{adminStats.reports}</b><small>Reports recorded</small></span></div></section><section className="admin-announcements"><h3>Send announcement to everyone</h3><p>Members receive one notification each. Replies are disabled for announcements.</p><label>Announcement title<input value={announcementTitle} onChange={e=>setAnnouncementTitle(e.target.value)} maxLength={100} placeholder="e.g. New community update"/></label><label>Message for all members<textarea value={announcementMessage} onChange={e=>setAnnouncementMessage(e.target.value)} maxLength={2000} rows={4} placeholder="Write the update you want everyone to see."/></label><button className="primary-btn" disabled={announcementBusy||!announcementTitle.trim()||!announcementMessage.trim()} onClick={()=>void publishAnnouncement()}>{announcementBusy?'Sending…':'Send to everyone'} <Send size={16}/></button>{announcementHistory.length>0&&<div className="announcement-history"><b>Recent announcements</b>{announcementHistory.map((a:any)=><article className="member-item" key={a.id}><b>{a.title}</b><p>{a.message}</p><small>{a.created_at?new Date(a.created_at).toLocaleString():''}</small></article>)}</div>}</section><section className="admin-management-section"><div className="admin-section-heading"><div><h3>Marketplace oversight</h3><p>Review current listings and remove suspicious or prohibited items.</p></div><span>{listings.length} loaded</span></div><label>Search listings<input value={adminListingSearch} onChange={e=>setAdminListingSearch(e.target.value)} placeholder="Search by product or seller name"/></label><div className="admin-listing-management">{listings.filter((item:any)=>((item.title||'')+' '+(item.vendor||'')+' '+(item.category||'')).toLowerCase().includes(adminListingSearch.toLowerCase())).slice(0,20).map((item:any)=><article className="admin-listing-row" key={item.id}>{item.image&&<img src={item.image} alt=""/>}<div><b>{item.title}</b><p>{item.vendor} · {item.category}</p><small>{item.price} · {item.sale_status==='sold'?'Sold':'Available'}</small></div><div className="admin-listing-actions"><button className="ghost-btn" onClick={()=>{setShowAdmin(false);setSelectedListing(item);}}>View</button><button className="danger-link" onClick={()=>void deleteListing(item.id)}>Remove</button></div></article>)}{!listings.length&&<p className="muted">No marketplace listings are currently loaded.</p>}</div></section><section className="admin-management-section"><div className="admin-section-heading"><div><h3>Member management & verification</h3><p>Find members and manage their verification status.</p></div><span>{adminProfiles.length} profiles</span></div><label>Search members<input value={verificationSearch} onChange={e=>setVerificationSearch(e.target.value)} placeholder="Search by display name or username"/></label>{adminProfiles.filter((person:any)=>((person.display_name||'')+' '+(person.username||'')).toLowerCase().includes(verificationSearch.toLowerCase())).map((person:any)=><article className="member-item" key={person.id}><b>{person.display_name||person.username||'Member'} {person.is_verified&&<BadgeCheck size={16} className="verified-badge"/>}</b><p>@{person.username||'no username'}</p><button className="ghost-btn" onClick={()=>{setShowAdmin(false);void openPublicProfile(person.id,person);}}>View profile</button>{person.is_verified&&person.verified_until&&<small>Verification remaining: {Math.max(0,Math.ceil((new Date(person.verified_until).getTime()-Date.now())/86400000))} day(s)</small>}<button className="primary-btn" onClick={async()=>{try{let days=30;if(!person.is_verified){const raw=window.prompt('How many days should verification last? (1–3650)',String(person.verified_days||30));if(raw===null)return;days=Number(raw);if(!Number.isInteger(days)||days<1||days>3650){setNotice('Enter a whole number between 1 and 3650 days.');return;}}await api.post('/api/admin/verify',{user_id:person.id,verified:!person.is_verified,days});setAdminProfiles(p=>p.map(x=>x.id===person.id?{...x,is_verified:!person.is_verified,verified_days:!person.is_verified?days:null,verified_until:!person.is_verified?new Date(Date.now()+days*86400000).toISOString():null}:x));setNotice('Verification status updated.');}catch(e:any){setNotice(e?.message||'Could not update verification.');}}}>{person.is_verified?'Remove blue badge':'Verify member'}</button></article>)}</section><section className="admin-management-section"><div className="admin-section-heading"><div><h3>Safety & moderation</h3><p>Review the reporter, the person or content reported, and the case outcome. Deleted reports can be restored.</p></div><span>{adminReports.filter((r:any)=>!r.deleted_at&&(r.status==='open'||r.status==='pending')).length} open</span></div><h3>Content reports</h3>{adminReports.filter((r:any)=>!r.deleted_at).length===0?<p>No reports to review.</p>:adminReports.filter((r:any)=>!r.deleted_at).map((report:any)=><article className="member-item" key={report.id}><b>{report.target_type} · {report.status}</b><p>Reported by: <strong>{report.reporter_name||'Unknown member'}</strong> (@{report.reporter?.username||'no username'})</p><p>Reported person: <strong>{report.reported_user_name||'Unknown member'}</strong>{report.reported_user?.username?' (@'+report.reported_user.username+')':''}</p>{report.target_title&&<p>Reported item: <strong>{report.target_title}</strong></p>}{report.target_content&&<blockquote className="report-content-preview">{String(report.target_content).slice(0,500)}</blockquote>}<p>Reason: {report.reason}</p><small>{report.details||'No additional explanation'} · {report.created_at?new Date(report.created_at).toLocaleString():''}</small>{report.reported_user_id&&<button className="ghost-btn" onClick={()=>{setShowAdmin(false);void openPublicProfile(report.reported_user_id,report.reported_user||null);}}>View reported person's profile</button>}<button className="ghost-btn" onClick={()=>void openReportChat(report)}>Open report conversation / Reply</button>{['community_post','group_post','marketplace_listing'].includes(report.target_type)&&<button className="danger-link" onClick={async()=>{if(!window.confirm('Remove the reported content? This cannot be undone.'))return;try{await api.post('/api/admin/reports/'+report.id+'/remove-content',{});setAdminReports(rs=>rs.map(x=>x.id===report.id?{...x,status:'resolved'}:x));if(report.target_type==='community_post')setPosts(items=>items.filter((p:any)=>p.id!==report.target_id));if(report.target_type==='marketplace_listing')setListings(items=>items.filter((p:any)=>p.id!==report.target_id));if(report.target_type==='group_post')setSelectedGroup((g:any)=>g?({...g,posts:(g.posts||[]).filter((p:any)=>p.id!==report.target_id)}):g);setNotice('Reported content removed and report marked reviewed.');}catch(e:any){setNotice(e?.message||'Could not remove reported content.');}}}>Remove reported content</button>}{(report.status==='open'||report.status==='pending')&&<button className="primary-btn" onClick={async()=>{try{await api.post('/api/admin/reports/'+report.id+'/resolve',{});setAdminReports(rs=>rs.map(x=>x.id===report.id?{...x,status:'resolved'}:x));setNotice('Report marked as reviewed.');}catch(e:any){setNotice(e?.message||'Could not update report.');}}}>Mark reviewed</button>}<button className="danger-link" onClick={async()=>{if(!window.confirm('Move this report to Deleted reports? You can restore it later.'))return;try{await api.post('/api/admin/reports/'+report.id+'/delete',{});setAdminReports(rs=>rs.map(x=>x.id===report.id?{...x,deleted_at:new Date().toISOString()}:x));setNotice('Report moved to Deleted reports.');}catch(e:any){setNotice(e?.message||'Could not delete report.');}}}>Delete report</button></article>)}</section><section className="admin-management-section"><div className="admin-section-heading"><div><h3>Deleted reports</h3><p>These reports are hidden from the active queue and can be restored.</p></div><span>{adminReports.filter((r:any)=>!!r.deleted_at).length}</span></div>{adminReports.filter((r:any)=>!!r.deleted_at).length===0?<p>No deleted reports.</p>:adminReports.filter((r:any)=>!!r.deleted_at).map((report:any)=><article className="member-item" key={report.id}><b>{report.target_type} · {report.status}</b><p>Reported by: <strong>{report.reporter_name||'Unknown member'}</strong></p><p>Reported person: <strong>{report.reported_user_name||'Unknown member'}</strong></p><p>{report.reason}</p><button className="primary-btn" onClick={async()=>{try{await api.post('/api/admin/reports/'+report.id+'/restore',{});setAdminReports(rs=>rs.map(x=>x.id===report.id?{...x,deleted_at:null}:x));setNotice('Report restored to the active queue.');}catch(e:any){setNotice(e?.message||'Could not restore report.');}}}>Restore report</button></article>)}</section></div></div>}
       {imagePreview && <div className="image-preview-backdrop" onClick={()=>setImagePreview(null)} role="presentation"><button type="button" className="image-preview-close" onClick={()=>setImagePreview(null)} aria-label="Close photo preview"><X size={22}/></button><img className="image-preview-full" src={imagePreview.src} alt={imagePreview.alt} onClick={e=>e.stopPropagation()}/></div>}
        {selectedAnnouncement && <div className="modal-backdrop announcement-modal-backdrop" onClick={()=>setSelectedAnnouncement(null)}><div className="modal form-modal announcement-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setSelectedAnnouncement(null)}><X size={18}/></button><div className="eyebrow muted">CALABAR CONNECT CITY UPDATE</div><h2>{selectedAnnouncement.title}</h2><p className="announcement-message">{selectedAnnouncement.message}</p><small>{selectedAnnouncement.created_at?new Date(selectedAnnouncement.created_at).toLocaleString():''}</small><button className="primary-btn full-btn" onClick={()=>setSelectedAnnouncement(null)}>Got it</button></div></div>}
      {reportTarget && <div className="modal-backdrop" onClick={()=>setReportTarget(null)}><div className="modal form-modal report-compose-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setReportTarget(null)}><X size={18}/></button><h2>Report {reportTarget.label||'content'}</h2><p>Your private report goes only to the admin. After sending, you can continue the conversation in My reports.</p><form className="report-compose" onSubmit={e=>{e.preventDefault();void sendReport();}}><textarea value={reportText} onChange={e=>setReportText(e.target.value)} placeholder="Write your report to the admin…" rows={4} required/><button className="primary-btn report-send-button" type="submit" disabled={reportBusy||!reportText.trim()} aria-label="Send report"><Send size={18}/>{reportBusy?' Sending…':' Send report'}</button></form></div></div>}
      {showMyReports && <div className="modal-backdrop" onClick={()=>setShowMyReports(false)}><div className="modal form-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowMyReports(false)}><X size={18}/></button><h2>My reports</h2>{myReports.length?myReports.map((report:any)=><article className="member-item" key={report.id}><b>{report.target_type} · {report.status}</b><p>{report.reason}</p><button className="primary-btn" onClick={()=>{setShowMyReports(false);void openReportChat(report);}}>Open conversation / Reply</button></article>):<p>You have not sent any reports yet.</p>}</div></div>}
      {reportChat && <div className="modal-backdrop" onClick={()=>setReportChat(null)}><div className="modal form-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setReportChat(null)}><X size={18}/></button><h2>Private report conversation</h2><p>Visible only to the reporting member and the admin.</p><div className="report-chat-messages">{reportChatMessages.map((m:any)=><p key={m.id}><b>{m.sender_id===user?.userId||m.sender_id===user?.id?'You':(user?.email||'').toLowerCase()==='princewillobongha@gmail.com'?'Reporting member':'Admin'}</b><br/>{m.message}<small>{new Date(m.created_at).toLocaleString()}</small></p>)}</div><form onSubmit={e=>{e.preventDefault();void sendReportReply();}}><textarea value={reportChatText} onChange={e=>setReportChatText(e.target.value)} placeholder="Reply to this report…" required/><button className="primary-btn full-btn" type="submit"><Send size={16}/> Send reply</button></form></div></div>}
      {followList && <div className="modal-backdrop" onClick={()=>setFollowList(null)}><div className="modal form-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setFollowList(null)}><X size={18}/></button><h2>{followList.title}</h2>{followList.items.map((p:any)=><button className="my-group-choice" key={p.id} onClick={()=>{setFollowList(null);void openPublicProfile(p.id,p);}}>{p.avatar_url?<img src={p.avatar_url} alt=""/>:<span className="avatar">{(p.display_name||p.username||'M').slice(0,1)}</span>}<span><b>{p.display_name||p.username||'Member'}</b><small>@{p.username||'member'}</small></span><ChevronRight size={16}/></button>)}{!followList.items.length&&<p>No members here yet.</p>}</div></div>}
      {showSubscriptions && <div className="modal-backdrop" onClick={()=>setShowSubscriptions(false)}><div className="modal form-modal subscription-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowSubscriptions(false)}><X size={18}/></button><h2>Verification subscription</h2> <div className="subscription-plans"><button className="subscription-plan" onClick={()=>requestSubscription(2,3500)}><b>2 months</b><strong>₦3,500</strong><span>Request verification</span></button><button className="subscription-plan" onClick={()=>requestSubscription(6,8500)}><b>6 months</b><strong>₦8,500</strong><span>Request verification</span></button><button className="subscription-plan" onClick={()=>requestSubscription(12,22500)}><b>12 months · Yearly</b><strong>₦22,500</strong><span>Request verification</span></button></div></div></div>}
      {showCart && <div className="modal-backdrop" onClick={()=>setShowCart(false)}><div className="modal form-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowCart(false)}><X size={18}/></button><h2>Your cart</h2>{cart.length===0?<div className="empty-state"><ShoppingCart size={26}/><h3>Your cart is empty</h3><p>Open a marketplace item and add it to your cart.</p></div>:<>{cart.map((item,i)=><div className="cart-row" key={item.id+'-'+i}>{item.image&&<img src={item.image} alt={item.title}/>}<div><b>{item.title}</b><p>{item.price}</p></div><button className="text-link" onClick={()=>setCart(v=>v.filter((_,idx)=>idx!==i))}>Remove</button></div>)}<button className="primary-btn full-btn" onClick={()=>{setShowCart(false);setNotice('Cart items are saved on this device. Contact the seller from each listing to arrange your order.');}}>Continue</button></>}</div></div>}
      {selectedPost && <div className="modal-backdrop" onClick={()=>setSelectedPost(null)}><div className="modal post-detail-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setSelectedPost(null)}><X size={18}/></button><div className="post-detail-author">{selectedPost.pinned_at&&<span className="post-pin-indicator detail-pin-indicator" aria-label="Pinned post" title="Pinned post"><Pin size={17}/></span>}<button className="post-detail-avatar-button" onClick={()=>selectedPost.author_id&&void openPublicProfile(selectedPost.author_id)}>{selectedPost.avatar_url?<img src={selectedPost.avatar_url} alt=""/>:<span className="avatar">{(selectedPost.author||'M').slice(0,1).toUpperCase()}</span>}</button><div><button className="post-author-link" onClick={()=>selectedPost.author_id&&void openPublicProfile(selectedPost.author_id)}>{selectedPost.author||'Calabar member'} {selectedPost.is_verified&&<BadgeCheck size={16} className="verified-badge"/>}</button><small>{selectedPost.created_at?new Date(selectedPost.created_at).toLocaleString():'Just now'}</small></div></div><p className="post-detail-text">{selectedPost.text}</p>{selectedPost.image_url&&<img className="post-detail-image" src={selectedPost.image_url} alt="Post"/>}<div className="post-actions post-detail-actions"><button className={'text-link '+(selectedPost.liked_by_me?'liked-action':'')} onClick={()=>void toggleLike(selectedPost)}><Heart size={17} fill={selectedPost.liked_by_me?'currentColor':'none'}/> {selectedPost.liked_by_me?'Liked':'Like'} {selectedPost.like_count||0}</button><button className="text-link" onClick={()=>{setReportTarget({type:'community_post',id:selectedPost.id,label:'community post'});setSelectedPost(null);}}>Report</button>{(user?.email||'').toLowerCase()==='princewillobongha@gmail.com'&&<button className="text-link" onClick={async()=>{try{const z=await api.post('/api/posts/'+selectedPost.id+'/pin',{});const pinnedAt=z.data?.pinned?new Date().toISOString():null;setSelectedPost((p:any)=>({...p,pinned_at:pinnedAt}));setPosts(items=>items.map((p:any)=>p.id===selectedPost.id?({...p,pinned_at:pinnedAt}):p));setNotice(z.data?.pinned?'Post pinned.':'Post unpinned.');}catch(e:any){setNotice(e?.message||'Could not pin post.');}}}>{selectedPost.pinned_at?'Unpin':'Pin post'}</button>}{(((user?.email||'').toLowerCase()==='princewillobongha@gmail.com')||selectedPost.author_id===user?.userId||selectedPost.author_id===user?.id)&&<button className="text-link danger-link" onClick={()=>void deletePost(selectedPost)}>Delete post</button>}</div><p className="muted">Comments and reshares are disabled on Calabar Connect City.</p></div></div>}
      {myGroupsOpen && <div className="modal-backdrop" onClick={()=>setMyGroupsOpen(false)}><div className="modal form-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setMyGroupsOpen(false)}><X size={18}/></button><h2>My groups</h2><p>Choose a group you have joined to open its community.</p>{memberItems.map((g:any)=><button className="my-group-choice" key={g.id} onClick={()=>{setMyGroupsOpen(false);void openGroup(g);}}>{g.avatar_url?<img src={g.avatar_url} alt=""/>:<span className="avatar"><Users size={16}/></span>}<span><b>{g.name}</b><small>{g.description||'Community group'}</small></span><ChevronRight size={16}/></button>)}{!memberItems.length&&<p>You have not joined any groups yet.</p>}</div></div>}
      {showProfile && <div className="modal-backdrop" onClick={()=>setShowProfile(false)}><div className="modal form-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowProfile(false)}><X size={18}/></button><h2>Edit profile</h2>{profile.avatar_url&&<img src={profile.avatar_url} className="profile-preview" alt="Profile"/>}<label>Profile picture<input type="file" accept="image/*" onChange={async e=>{const f=e.target.files?.[0];if(f)try{const avatarUrl=await uploadImage(f);setProfile((p:any)=>({...p,avatar_url:avatarUrl}));}catch(err:any){setNotice(err?.message||'Image upload failed.');}}}/></label><label>Username<input value={profile.username||''} onChange={e=>{setProfile((p:any)=>({...p,username:e.target.value.toLowerCase().replace(/\s+/g,'_')}));setUsernameStatus('');setUsernameSuggestions([]);}} onBlur={()=>void checkUsernameAvailability()} minLength={3} maxLength={20} autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-describedby="username-help" required/><small id="username-help" className={'username-validation '+(usernameStatus.includes('taken')||usernameStatus.includes('Use ')||usernameStatus.includes('correct')?'username-invalid':'')}>{usernameStatus||'3–20 characters. Use lowercase letters, numbers and underscores.'}</small>{usernameSuggestions.length>0&&<div className="username-suggestions"><span>Try one of these:</span>{usernameSuggestions.map(suggestion=><button type="button" key={suggestion} onClick={()=>{setProfile((p:any)=>({...p,username:suggestion}));setUsernameStatus('');setUsernameSuggestions([]);}}>{suggestion}</button>)}</div>}</label><label>Display name<input value={profile.display_name||''} onChange={e=>setProfile((p:any)=>({...p,display_name:e.target.value}))} required/></label><label>Bio<textarea value={profile.bio||''} onChange={e=>setProfile((p:any)=>({...p,bio:e.target.value}))}/></label><label>Location<input value={profile.city||profile.location||''} onChange={e=>setProfile((p:any)=>({...p,city:e.target.value,location:e.target.value}))} placeholder="Calabar, Cross River"/></label><label>WhatsApp phone number or link<input value={profile.whatsapp_url||''} onChange={e=>setProfile((p:any)=>({...p,whatsapp_url:e.target.value}))} placeholder="+2348012345678 or https://wa.me/234..."/><small className="fine-print">Used privately for Contact seller on your listings; it is not displayed on your public profile.</small></label><button className="primary-btn full-btn" onClick={()=>void saveProfile()}>Save profile</button></div></div>}
      {publicProfile && <div className="modal-backdrop" onClick={()=>setPublicProfile(null)}><div className="modal public-profile-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setPublicProfile(null)}><X size={18}/></button><div className="public-profile-cover"/>{publicProfile.avatar_url&&<button type="button" className="public-profile-avatar-button" onClick={()=>setImagePreview({src:publicProfile.avatar_url,alt:(publicProfile.display_name||publicProfile.username||'Member')+' profile photo'})} aria-label="Open profile photo"><img src={publicProfile.avatar_url} className="public-profile-avatar" alt="Profile"/></button>}<h2>{publicProfile.display_name||publicProfile.username||'Calabar member'} {publicProfile.is_verified&&<BadgeCheck size={20} className="verified-badge"/>}</h2><p className="profile-handle">@{publicProfile.username||'member'}</p><p>{publicProfile.bio||'No bio added yet.'}</p><p className="profile-location"><MapPin size={15}/>{publicProfile.city||'Calabar, Cross River'}</p><div className="profile-follow-counts"><button onClick={async()=>{try{const {data:rows,error}=await supabase.from('community_follows').select('follower_id').eq('followed_id',publicProfile.id);if(error)throw error;const ids=(rows||[]).map((x:any)=>x.follower_id);const {data:ps,error:pe}=ids.length?await supabase.from('profiles').select('id,username,display_name,avatar_url,is_verified').in('id',ids):{data:[],error:null};if(pe)throw pe;setPublicProfile(null);setFollowList({title:'Followers',items:ps||[]});}catch(e:any){setNotice(e?.message||'Could not load followers.');}}}><b>{publicProfile.followers_count||0}</b> Followers</button><button onClick={async()=>{try{const {data:rows,error}=await supabase.from('community_follows').select('followed_id').eq('follower_id',publicProfile.id);if(error)throw error;const ids=(rows||[]).map((x:any)=>x.followed_id);const {data:ps,error:pe}=ids.length?await supabase.from('profiles').select('id,username,display_name,avatar_url,is_verified').in('id',ids):{data:[],error:null};if(pe)throw pe;setPublicProfile(null);setFollowList({title:'Following',items:ps||[]});}catch(e:any){setNotice(e?.message||'Could not load following.');}}}><b>{publicProfile.following_count||0}</b> Following</button><span><b>{publicProfile.order_count||0}</b> Orders</span></div>{(publicProfile.id===user?.userId||publicProfile.id===user?.id)&&<button className="ghost-btn full-btn" onClick={async()=>{try{const r=await api.get('/api/profile');setProfile(r.data?.item||publicProfile);}catch{setProfile(publicProfile);}setShowProfile(true);}}>Edit profile</button>}{publicProfile.id!==user?.userId&&publicProfile.id!==user?.id&&<button className="primary-btn full-btn" onClick={()=>void toggleFollow(publicProfile.id)}>{isFollowingProfile?'Following · Unfollow':'Follow member'}</button>}{publicProfile.id!==user?.userId&&publicProfile.id!==user?.id&&<button className="ghost-btn full-btn" onClick={()=>{setReportTarget({type:'profile',id:publicProfile.id,label:'member profile'});setReportText('');setPublicProfile(null);}}>Report this profile <ShieldCheck size={16}/></button>}{isAdmin&&publicProfile.id!==(user?.userId||user?.id)&&<section className="admin-management-section member-restriction-panel"><div className="admin-section-heading"><div><h3>Manage posting restrictions</h3><p>Apply a targeted restriction or restore access. Members are notified with the reason and expiry.</p></div></div>{(publicProfile.restrictions||[]).length>0?<div className="active-restrictions-list"><b>Active restrictions</b>{(publicProfile.restrictions||[]).map((restriction:any)=><article className="member-item" key={restriction.id}><b>{({community:'Community posting',groups:'Group posting',marketplace:'Marketplace listings',all:'All posting'} as Record<string,string>)[restriction.restriction_type]||restriction.restriction_type}</b><p>{restriction.reason}</p><small>{restriction.expires_at?'Expires '+new Date(restriction.expires_at).toLocaleString():'No expiry date'}</small><button className="ghost-btn" onClick={()=>void removeMemberRestriction(publicProfile.id,restriction)}>Remove restriction</button></article>)}</div>:<p>No active posting restrictions.</p>}<div className="profile-restriction-actions"><button className="ghost-btn" onClick={()=>void applyMemberRestriction(publicProfile.id,'community')}>Restrict community posting</button><button className="ghost-btn" onClick={()=>void applyMemberRestriction(publicProfile.id,'groups')}>Restrict group posting</button><button className="ghost-btn" onClick={()=>void applyMemberRestriction(publicProfile.id,'marketplace')}>Restrict marketplace listings</button><button className="danger-link" onClick={()=>void applyMemberRestriction(publicProfile.id,'all')}>Restrict all posting</button></div></section>}{(publicProfile.listings||[]).length>0&&<><h3>Marketplace listings</h3>{(publicProfile.listings||[]).map((listing:any)=><article className="profile-listing-item" key={listing.id} onClick={()=>{setPublicProfile(null);setSelectedListing(listings.find((x:any)=>x.id===listing.id)||null);}}>{listing.image&&<img src={listing.image} alt={listing.title}/>}<div><h4>{listing.title}</h4><b>{money(listing.price)}</b><p>{listing.description}</p><small>{listing.location}</small></div></article>)}</>}<h3>Posts</h3>{(publicProfile.posts||[]).map((post:any)=><article className="member-item profile-post-item" key={post.id} onClick={()=>{setPublicProfile(null);void openPost({...post,author:publicProfile.display_name||publicProfile.username,author_id:publicProfile.id,avatar_url:publicProfile.avatar_url,is_verified:publicProfile.is_verified});}}><p>{post.text}</p>{post.image_url&&<img className="post-photo" src={post.image_url} alt="Post"/>}<small>{post.created_at?new Date(post.created_at).toLocaleDateString():'Recently'} · ♥ {post.like_count||0}</small><button className="text-link" onClick={e=>{e.stopPropagation();setPublicProfile(null);void openPost({...post,author:publicProfile.display_name||publicProfile.username,author_id:publicProfile.id,avatar_url:publicProfile.avatar_url,is_verified:publicProfile.is_verified});}}>Open post</button></article>)}{!(publicProfile.posts||[]).length&&<p>No public posts yet.</p>}</div></div>}
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
                    <option>Food & Restaurants</option>
                    <option>Fashion & Clothing</option>
                    <option>Electronics & Gadgets</option>
                    <option>Beauty & Personal Care</option>
                    <option>Repairs & Professional Services</option>
                    <option>Jobs & Opportunities</option>
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
              <p className="fine-print">Your listing stays available until you mark it sold or remove it. Contact seller is enabled only for verified sellers.</p>
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
                  placeholder="Ask a question, share a tip or recommend a local business... Use @username to tag a member."
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
            {selectedListing.image ? <button type="button" className="detail-image-button" onClick={()=>setImagePreview({src:selectedListing.image,alt:selectedListing.title})} aria-label={'View photo of '+selectedListing.title}><img className="detail-image" src={selectedListing.image} alt={selectedListing.title}/></button> : <div className="detail-image listing-no-image">No product photo uploaded</div>}
            <span className="eyebrow muted">
              {selectedListing.category} · LOCAL LISTING
            </span>
            <h2>{selectedListing.title}</h2>
            {selectedListing.sale_status==='sold'&&<span className="sold-status-inline">SOLD</span>}
            <div className="detail-price">{money(selectedListing.price)}</div>
            {selectedListing.vendor_owner_id===(user?.userId||user?.id)&&<button className="listing-status-button" onClick={()=>void markListingSold(selectedListing)}>{selectedListing.sale_status==='sold'?'Mark available again':'Mark as SOLD'}</button>}
            <p>{selectedListing.description}</p>
            <div className="detail-meta">
              <MapPin size={16} />
              {selectedListing.location || 'Calabar, Cross River'}
            </div>
            <div className="detail-meta"><Store size={16}/><button className="vendor-name-link" onClick={()=>selectedListing.vendor_owner_id&&void openPublicProfile(selectedListing.vendor_owner_id)}>{selectedListing.vendor||'Local vendor'}</button></div>
            {(selectedListing.images||[]).slice(1).map((imageUrl,i)=><button type="button" key={imageUrl+i} className="detail-gallery-button" onClick={()=>setImagePreview({src:imageUrl,alt:selectedListing.title+' photo '+(i+2)})} aria-label={'View '+selectedListing.title+' photo '+(i+2)}><img className="detail-gallery-image" src={imageUrl} alt={selectedListing.title+' photo '+(i+2)}/></button>)}
            <button className="ghost-btn full-btn" disabled={selectedListing.sale_status==='sold'} onClick={() => { if(requireMember('add items to your cart')) { setCart(v=>v.some(item=>item.id===selectedListing.id)?v:[...v,selectedListing]); setNotice(cart.some(item=>item.id===selectedListing.id)?'This product is already in your cart.':'Added to cart.'); } }}>{selectedListing.sale_status==='sold'?'Sold · unavailable':'Add to cart'} <ShoppingCart size={16}/></button>
            <button
              className="primary-btn full-btn"
              disabled={selectedListing.sale_status==='sold'}
              onClick={() => void contactSeller(selectedListing)}
            >
              <MessageCircle size={17} /> {selectedListing.sale_status==='sold'?'Item sold':'Contact seller'}
            </button>
            <button className="ghost-btn full-btn" onClick={()=>{setReportTarget({type:'marketplace_listing',id:selectedListing.id,label:'marketplace listing'});setReportText('');setSelectedListing(null);}}>Report listing <ShieldCheck size={16}/></button>
            <small className="fine-print">
              Always verify details with the seller before making payment.
            </small>
          </div>
        </div>
      )}
      <nav className="bottom-nav" aria-label="Primary navigation">
        <button className={active==='Discover'?'active':''} onClick={()=>{setActive('Discover');setSelectedGroup(null);setMemberPanel(null);}}><Sparkles size={19}/><span>Home</span></button>
        <button className={active==='Community'?'active':''} onClick={()=>{setActive('Community');setSelectedGroup(null);setMemberPanel(null);}}><Heart size={19}/><span>Community</span></button>
        <button className={active==='Marketplace'?'active':''} onClick={()=>{setActive('Marketplace');setSelectedGroup(null);setMemberPanel(null);}}><ShoppingBag size={19}/><span>Market</span></button>
        <button className={memberPanel==='notifications'?'active':''} onClick={()=>void openMemberPanel('notifications')}><Bell size={19}/><span>Notifications</span>{unreadNotifications>0&&<i className="bottom-notification-count">{unreadNotifications>99?'99+':unreadNotifications}</i>}</button>
        <button onClick={()=>{if(!user){setShowAuth(true);return;}void openPublicProfile(user?.userId||user?.id);}}><UserRound size={19}/><span>Profile</span></button>
      </nav>
      <footer className="site-footer">
        <div className="site-footer-copy"><span>© 2026 Calabar Connect City</span><span>Built for local discovery in Calabar, Cross River State.</span></div>
        <nav className="site-footer-links" aria-label="About and contact">
          <button type="button" onClick={() => setShowAbout(true)}>About</button>
          <a href="mailto:Princewillobongha@gmail.com">Contact</a>
          <button type="button" onClick={() => setNotice('Safety first: report suspicious listings and never share your passwords or one-time codes.')}>Safety & trust</button>
        </nav>
      </footer>
    </div>
  );
}
function ListingGrid({
  items,
  onOpen,
  onContact,
  onOpenSeller,
  onMarkSold,
  onDelete,
  currentUserId,
  isAdmin = false,
}: {
  items: Listing[];
  onOpen: (l: Listing) => void;
  onContact: (item: Listing) => void;
  onOpenSeller: (id: string) => void;
  onMarkSold: (item:Listing) => void;
  onRate?: (item: Listing, rating: number) => void;
  currentUserId?: string;
  isAdmin?: boolean;
  onDelete: (id:string) => void;
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
            {item.sale_status==='sold'&&<span className="listing-sold-badge">SOLD</span>}
          </button>
          <div className="listing-body">
            <div className="listing-vendor">
              <button className="vendor-avatar vendor-profile-button" onClick={()=>item.vendor_owner_id&&onOpenSeller(item.vendor_owner_id)} aria-label={'View '+item.vendor+' profile'}>{item.vendor.slice(0,1)}</button>
              <button className="vendor-name-link" onClick={()=>item.vendor_owner_id&&onOpenSeller(item.vendor_owner_id)}>{item.vendor}</button>{item.is_verified?<BadgeCheck size={15} className="verified-badge" aria-label="Verified seller"/>:<span className="not-verified-badge">Not Verified</span>}
            </div>
            <button className="listing-title" onClick={() => onOpen(item)}>
              {item.title}
            </button>
            <p>{item.description}</p>
            <div className="listing-location">
              <MapPin size={14} />
              {item.location}
            </div>
            {item.availability_note&&<p className="listing-availability">{item.availability_note}</p>}
            {item.available_until&&<small className="listing-availability">Available until {new Date(item.available_until).toLocaleString()}</small>}
            <small className="listing-order-count">{item.order_count||0} orders</small>
            <div className="listing-bottom">
              <b>{money(item.price)}</b>
              <div className="listing-actions"><button className="listing-contact-button" disabled={item.sale_status==='sold'} onClick={() => onContact(item)} aria-label="Contact seller">{item.sale_status==='sold'?'Sold':<MessageCircle size={16}/>}</button>{(item.vendor_owner_id===currentUserId||isAdmin)&&<>{item.vendor_owner_id===currentUserId&&<button className="listing-status-button" onClick={()=>void onMarkSold(item)} aria-label={item.sale_status==='sold'?'Mark available':'Mark sold'}>{item.sale_status==='sold'?'Mark available':'Mark sold'}</button>}<button className="listing-delete-button" onClick={()=>onDelete(item.id)} aria-label={isAdmin?'Admin delete listing':'Delete my listing'} title={isAdmin?'Admin delete listing':'Delete listing'}><X size={16}/></button></>}</div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
