import { useEffect, useMemo, useState } from 'react';
import { auth, api } from './lib/supabase';
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
  LogOut,
  ImagePlus,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';

type Listing = {
  id: string;
  title: string;
  category: string;
  price: string;
  location: string;
  description: string;
  image: string;
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
};
const starterListings: Listing[] = [
  {
    id: 'sample-1',
    title: 'Handmade Calabar Beaded Accessories',
    category: 'Fashion',
    price: '₦8,500',
    location: 'Marian Road, Calabar',
    description:
      'Locally crafted statement accessories for everyday looks and special occasions.',
    image:
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=85',
    vendor: 'Mimi Crafts',
    kind: 'Product',
  },
  {
    id: 'sample-2',
    title: 'Fresh Afang Soup & Swallow',
    category: 'Food',
    price: '₦4,000',
    location: 'State Housing, Calabar',
    description:
      'Freshly prepared local meals. Order ahead for pickup or delivery enquiries.',
    image:
      'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85',
    vendor: 'Mama Eno Kitchen',
    kind: 'Food',
  },
  {
    id: 'sample-3',
    title: 'Classic Everyday Sneakers',
    category: 'Fashion',
    price: '₦32,000',
    location: 'Watt Market area',
    description:
      'Clean everyday sneakers in selected sizes. Ask the seller about available sizes.',
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85',
    vendor: 'Fresh Kicks Calabar',
    kind: 'Product',
  },
  {
    id: 'sample-4',
    title: 'Studio & Event Photography',
    category: 'Services',
    price: 'From ₦45,000',
    location: 'Calabar Municipal',
    description:
      'Portraits, birthdays, business content and event coverage by appointment.',
    image:
      'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=900&q=85',
    vendor: 'FrameStory Studio',
    kind: 'Service',
  },
];
const starterGroups: Group[] = [
  {
    id: 'g1',
    name: 'Calabar Food Lovers',
    category: 'Food',
    description: 'Local dishes, restaurants, recipes and food recommendations.',
    members: 1280,
  },
  {
    id: 'g2',
    name: 'Calabar Fashion & Style',
    category: 'Fashion',
    description:
      'Discover local designers, boutiques, style tips and new drops.',
    members: 946,
  },
  {
    id: 'g3',
    name: 'Calabar Jobs & Opportunities',
    category: 'Jobs',
    description:
      'Share vacancies, gigs, internships and professional opportunities.',
    members: 2134,
  },
  {
    id: 'g4',
    name: 'Calabar Buy & Sell',
    category: 'Marketplace',
    description:
      'A community for trusted local buying, selling and service enquiries.',
    members: 1760,
  },
];
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
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>(starterListings);
  const [groups, setGroups] = useState<Group[]>(starterGroups);
  const [posts, setPosts] = useState<Post[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
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
      if (remoteListings.length)
        setListings([
          ...remoteListings,
          ...starterListings.filter(
            s => !remoteListings.some((x: Listing) => x.id === s.id)
          ),
        ]);
      const remoteGroups = g.data?.items || [];
      if (remoteGroups.length) setGroups(remoteGroups);
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
    try {
      const result = await auth.signIn(authEmail, authPassword, authMode);
      setUser(result.user);
      setShowAuth(false);
      setAuthPassword('');
      setNotice((result as any).confirmationRequired ? 'Account created. Check your email to confirm, then sign in.' : 'You are signed in. Welcome to the community!');
    } catch (e: any) {
      setNotice(
        e?.code === 'popup_blocked'
          ? 'Allow pop-ups to finish signing in.'
          : e?.code === 'popup_closed'
            ? 'Sign-in was cancelled.'
            : 'Could not sign in just now. Please try again.'
      );
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
  const saveListing = async () => {
    if (!requireMember('Sign in to publish a listing.')) return;
    if (!form.title.trim() || !form.description.trim()) {
      setNotice('Add a title and description first.');
      return;
    }
    setBusy(true);
    try {
      const result = await api.post('/api/listings', {
        ...form,
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
      setForm({
        title: '',
        category: 'Product',
        price: '',
        location: 'Calabar, Cross River',
        description: '',
        image: '',
      });
      setNotice('Your listing is published.');
    } catch {
      setNotice('We could not publish this listing. Please try again.');
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
      const r = await api.post('/api/posts', {
        text: postText.trim(),
        author: user.name || user.email || 'Community member',
        category: 'Community',
        created_at: new Date().toISOString(),
      });
      setPosts(prev => [r.data.item, ...prev]);
      setPostText('');
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
    if (label.includes('create a group')) {
      setNotice('Group creation is being prepared. Try again shortly.');
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
            src="/resources/calabar-connect-logo.png"
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
          {user ? (
            <button className="profile-pill" onClick={signOut}>
              <span className="avatar">
                {(user.name || user.email || 'M').slice(0, 1).toUpperCase()}
              </span>
              <span>{user.name || 'My account'}</span>
              <LogOut size={15} />
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
          <button
            onClick={() => {
              setShowListingForm(true);
              setMenuOpen(false);
            }}
          >
            List a business or item <Plus size={16} />
          </button>
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
                  onContact={() => interact('contact this vendor')}
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
                  onClick={() => interact('create a group')}
                >
                  <Plus size={17} /> Create a group
                </button>
              </div>
              <div className="group-grid">
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
              </div>
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
                      <div className="feed-avatar">
                        {(p.author || 'C').slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <b>{p.author || 'Community member'}</b>
                        <small>
                          {p.category || 'Community'} ·{' '}
                          {p.created_at
                            ? new Date(p.created_at).toLocaleDateString()
                            : 'Just now'}
                        </small>
                        <p>{p.text}</p>
                        <button
                          className="text-link"
                          onClick={() => interact('reply to this post')}
                        >
                          <MessageCircle size={15} /> Reply
                        </button>
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
                onContact={() => interact('contact this poster')}
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
              src="/calabar-connect-city-logo.png"
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
              <button className="primary-btn full-btn" type="submit"><LogIn size={17} /> {authMode==='signup'?'Create account':'Sign in securely'}</button>
            </form>
            <small className="fine-print">{authMode==='signup'?'Create your free Calabar Connect City account.':'Sign in to save favourites, publish listings and connect.'}</small>
            <button className="text-link auth-switch" onClick={()=>setAuthMode(m=>m==='signin'?'signup':'signin')}>{authMode==='signup'?'Already have an account? Sign in':'New here? Create an account'}</button>
          </div>
        </div>
      )}
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
                Photo URL (optional)
                <input
                  value={form.image}
                  onChange={e => setForm({ ...form, image: e.target.value })}
                  placeholder="Paste an image URL"
                />
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
            <img
              className="detail-image"
              src={
                selectedListing.image ||
                'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
              }
              alt={selectedListing.title}
            />
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
            <button
              className="primary-btn full-btn"
              onClick={() => interact('contact this vendor')}
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
  onContact: () => void;
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
            <img
              src={
                item.image ||
                'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80'
              }
              alt={item.title}
            />
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
              <span className="verified-dot" title="Local listing">
                ✓
              </span>
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
              <button onClick={onContact} aria-label="Contact seller">
                <MessageCircle size={16} />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
