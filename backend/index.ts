import { router, json, error, requireAuth, requireAdminEmailAllowlist, notifications } from '@appdeploy/sdk';
import { db } from '@appdeploy/sdk';

type ListingInput = { title?: string; category?: string; price?: string; location?: string; description?: string; image?: string; vendor?: string; kind?: string; };
type PostInput = { text?: string; category?: string; };
const clean = (value: unknown, max = 2000) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const listingTable = 'calabar_listings';
const groupTable = 'calabar_groups';
const postTable = 'calabar_posts';
const messageTable = 'calabar_messages';
const friendTable = 'calabar_friend_requests';
const membershipTable = 'calabar_group_memberships';
const reportTable = 'calabar_reports';
const noticeTable = 'calabar_member_notifications';
const ADMIN_EMAILS = ['Princewillobongha@gmail.com'];

async function ownRows(table: string, userId: string, field = 'user_id') {
  const result = await db.list(table, { limit: 500 });
  return result.items.filter((item: any) => item[field] === userId);
}
async function seedGroups() {
  const current = await db.list(groupTable, { limit: 10 });
  if (current.items.length) return current.items;
  const groups = [
    { name: 'Calabar Food Lovers', category: 'Food', description: 'Local dishes, restaurants, recipes and food recommendations.', members: 1280, seeded: true },
    { name: 'Calabar Fashion & Style', category: 'Fashion', description: 'Discover local designers, boutiques, style tips and new drops.', members: 946, seeded: true },
    { name: 'Calabar Jobs & Opportunities', category: 'Jobs', description: 'Share vacancies, gigs, internships and professional opportunities.', members: 2134, seeded: true },
    { name: 'Calabar Buy & Sell', category: 'Marketplace', description: 'A community for trusted local buying, selling and service enquiries.', members: 1760, seeded: true },
  ];
  const ids = await db.add(groupTable, groups);
  return groups.map((g, i) => ({ ...g, id: ids[i] || 'seed-' + i }));
}

export const handler = router({
  'GET /api/_healthcheck': [async () => json({ ok: true, app: 'Calabar Connect City' })],
  'GET /api/listings': [async () => {
    const result = await db.list(listingTable, { limit: 80 });
    return json({ items: result.items.sort((a: any, b: any) => String(b.created_at || '').localeCompare(String(a.created_at || ''))) });
  }],
  'POST /api/listings': [requireAuth(), async ({ body, user }) => {
    const input = (body || {}) as ListingInput;
    const title = clean(input.title, 120);
    const description = clean(input.description, 1500);
    if (!title || !description) return error('A title and description are required.', 400);
    const record = { title, description, category: clean(input.category, 40) || 'Product', price: clean(input.price, 80) || 'Ask for price', location: clean(input.location, 120) || 'Calabar, Cross River', image: clean(input.image, 1000), vendor: clean(input.vendor, 100) || user?.name || 'Community member', owner_id: user!.userId, owner_email: user!.email || '', kind: clean(input.kind, 40) || 'Product', created_at: new Date().toISOString() };
    const [id] = await db.add(listingTable, [record]);
    if (!id) return error('Could not save this listing.', 500);
    return json({ item: { ...record, id } }, 201);
  }],
  'GET /api/groups': [async () => json({ items: await seedGroups() })],
  'POST /api/groups': [requireAuth(), async ({ body, user }) => {
    const input = (body || {}) as { name?: string; category?: string; description?: string };
    const name = clean(input.name, 100);
    if (!name) return error('A group name is required.', 400);
    const record = { name, category: clean(input.category, 40) || 'Community', description: clean(input.description, 500), members: 1, owner_id: user!.userId, created_at: new Date().toISOString() };
    const [id] = await db.add(groupTable, [record]);
    if (!id) return error('Could not create the group.', 500);
    await db.add(membershipTable, [{ group_id: id, user_id: user!.userId, role: 'owner', joined_at: new Date().toISOString() }]);
    return json({ item: { ...record, id } }, 201);
  }],
  'POST /api/groups/:id/join': [requireAuth(), async ({ params, user }) => {
    const rows = await ownRows(membershipTable, user!.userId);
    if (rows.some((r: any) => r.group_id === params.id)) return json({ ok: true, already_member: true });
    await db.add(membershipTable, [{ group_id: params.id, user_id: user!.userId, role: 'member', joined_at: new Date().toISOString() }]);
    const groups = await db.list(groupTable, { limit: 200 });
    const group: any = groups.items.find((g: any) => g.id === params.id);
    if (group) await db.update(groupTable, [{ id: params.id, record: { ...group, members: Number(group.members || 0) + 1 } }]);
    return json({ ok: true });
  }],
  'GET /api/groups/mine': [requireAuth(), async ({ user }) => json({ items: await ownRows(membershipTable, user!.userId) })],
  'GET /api/posts': [async () => {
    const result = await db.list(postTable, { limit: 60 });
    return json({ items: result.items.sort((a: any, b: any) => String(b.created_at || '').localeCompare(String(a.created_at || ''))) });
  }],
  'POST /api/posts': [requireAuth(), async ({ body, user }) => {
    const input = (body || {}) as PostInput;
    const text = clean(input.text, 2000);
    if (!text) return error('Write an update before publishing.', 400);
    const record = { text, author: user!.name || user!.email || 'Community member', author_id: user!.userId, category: clean(input.category, 40) || 'Community', created_at: new Date().toISOString() };
    const [id] = await db.add(postTable, [record]);
    if (!id) return error('Could not publish your update.', 500);
    return json({ item: { ...record, id } }, 201);
  }],
  'GET /api/messages': [requireAuth(), async ({ user }) => {
    const result = await db.list(messageTable, { limit: 500 });
    const items = result.items.filter((m: any) => m.sender_id === user!.userId || m.recipient_id === user!.userId).sort((a: any, b: any) => String(a.created_at).localeCompare(String(b.created_at)));
    return json({ items });
  }],
  'POST /api/messages': [requireAuth(), async ({ body, user }) => {
    const input = (body || {}) as { recipient_id?: string; text?: string };
    const recipient = clean(input.recipient_id, 120);
    const text = clean(input.text, 2000);
    if (!recipient || recipient === user!.userId) return error('Choose another member to message.', 400);
    if (!text) return error('Write a message first.', 400);
    const record = { sender_id: user!.userId, sender_name: user!.name || user!.email || 'Member', recipient_id: recipient, text, created_at: new Date().toISOString(), read: false };
    const [id] = await db.add(messageTable, [record]);
    await db.add(noticeTable, [{ user_id: recipient, title: 'New message', body: 'You received a new community message.', kind: 'message', created_at: new Date().toISOString(), read: false }]);
    try { await notifications.send({ userIds: [recipient], notification: { title: 'New Calabar Connect message', body: 'You received a new community message.' }, data: { kind: 'message' } }); } catch {}
    return json({ item: { ...record, id } }, 201);
  }],
  'GET /api/friends': [requireAuth(), async ({ user }) => {
    const result = await db.list(friendTable, { limit: 500 });
    return json({ items: result.items.filter((r: any) => r.from_id === user!.userId || r.to_id === user!.userId) });
  }],
  'POST /api/friends/request': [requireAuth(), async ({ body, user }) => {
    const input = (body || {}) as { to_id?: string };
    const toId = clean(input.to_id, 120);
    if (!toId || toId === user!.userId) return error('Choose another member.', 400);
    const result = await db.list(friendTable, { limit: 500 });
    const existing = result.items.find((r: any) => (r.from_id === user!.userId && r.to_id === toId) || (r.from_id === toId && r.to_id === user!.userId));
    if (existing) return json({ item: existing, message: 'A connection request or connection already exists.' });
    const record = { from_id: user!.userId, from_name: user!.name || user!.email || 'Member', to_id: toId, status: 'pending', created_at: new Date().toISOString() };
    const [id] = await db.add(friendTable, [record]);
    await db.add(noticeTable, [{ user_id: toId, title: 'Connection request', body: 'Someone wants to connect with you on Calabar Connect City.', kind: 'friend_request', created_at: new Date().toISOString(), read: false }]);
    try { await notifications.send({ userIds: [toId], notification: { title: 'New connection request', body: 'Someone wants to connect with you on Calabar Connect City.' }, data: { kind: 'friend_request' } }); } catch {}
    return json({ item: { ...record, id } }, 201);
  }],
  'POST /api/friends/:id/respond': [requireAuth(), async ({ body, params, user }) => {
    const input = (body || {}) as { accept?: boolean };
    const result = await db.list(friendTable, { limit: 500 });
    const request: any = result.items.find((r: any) => r.id === params.id && r.to_id === user!.userId);
    if (!request) return error('Connection request not found.', 404);
    const status = input.accept ? 'accepted' : 'declined';
    await db.update(friendTable, [{ id: params.id, record: { ...request, status, updated_at: new Date().toISOString() } }]);
    return json({ ok: true, status });
  }],
  'GET /api/notifications': [requireAuth(), async ({ user }) => {
    const items = await ownRows(noticeTable, user!.userId);
    return json({ items: items.sort((a: any, b: any) => String(b.created_at).localeCompare(String(a.created_at))) });
  }],
  'POST /api/notifications/:id/read': [requireAuth(), async ({ params, user }) => {
    const items = await ownRows(noticeTable, user!.userId);
    if (!items.some((n: any) => n.id === params.id)) return error('Notification not found.', 404);
    const notice: any = items.find((n: any) => n.id === params.id);
    await db.update(noticeTable, [{ id: params.id, record: { ...notice, read: true } }]);
    return json({ ok: true });
  }],
  'POST /api/reports': [requireAuth(), async ({ body, user }) => {
    const input = (body || {}) as { target_type?: string; target_id?: string; reason?: string; details?: string };
    const reason = clean(input.reason, 120);
    if (!reason) return error('Choose a report reason.', 400);
    const record = { reporter_id: user!.userId, target_type: clean(input.target_type, 40) || 'community_content', target_id: clean(input.target_id, 120), reason, details: clean(input.details, 1000), status: 'open', created_at: new Date().toISOString() };
    const [id] = await db.add(reportTable, [record]);
    return json({ item: { ...record, id } }, 201);
  }],
  'GET /api/reports/mine': [requireAuth(), async ({ user }) => json({ items: await ownRows(reportTable, user!.userId, 'reporter_id') })],
  'GET /api/admin/reports': [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS), async () => {
    const result = await db.list(reportTable, { limit: 500 });
    return json({ items: result.items.sort((a: any, b: any) => String(b.created_at || '').localeCompare(String(a.created_at || ''))) });
  }],
});