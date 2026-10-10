import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
export const supabase = createClient(
  supabaseUrl || 'https://moejannssmjupdvkcofw.supabase.co',
  supabaseKey || 'sb_publishable_60YiAMNciYl-5UjEj0jYFA_LajRkki3',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

const fail = (message: string): never => { throw new Error(message); };
const ensure = <T,>(data: T | null, error: any): T => { if (error) fail(error.message || 'Supabase request failed'); return data as T; };
const currentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) fail('Please sign in to continue.');
  return data.user;
};
const profileName = (u: any) => u?.user_metadata?.display_name || u?.user_metadata?.full_name || u?.email?.split('@')[0] || 'Calabar Member';
const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'local-business';
const asItem = (x: any) => ({...x, id:x.id, title:x.title, category:x.category, price: x.price_ngn ? '₦'+Number(x.price_ngn).toLocaleString('en-NG') : 'Ask for price', location:x.vendor?.address || x.vendor?.area || 'Calabar, Cross River', description:x.description || '', images:Array.isArray(x.image_urls)?x.image_urls:[], image:x.image_urls?.[0] || x.vendor?.cover_image_url || '', vendor:x.vendor?.business_name || 'Calabar vendor', kind:x.category || 'Product'});
export async function uploadImage(file: File) {
  const user = await currentUser();
  if (!file.type.startsWith('image/')) fail('Choose an image file.');
  const ext = (file.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase();
  const key = user.id + '/' + crypto.randomUUID() + '.' + ext;
  const { error } = await supabase.storage.from('community-media').upload(key, file, { upsert: false, contentType: file.type });
  if (error) fail(error.message);
  return supabase.storage.from('community-media').getPublicUrl(key).data.publicUrl;
}
async function get(path: string) {
  if (path === '/api/listings') {
    const {data,error}=await supabase.from('listings').select('*, vendor:vendors(id,business_name,address,area,cover_image_url)').eq('is_available',true).order('created_at',{ascending:false}).limit(100);
    return {data:{items:ensure(data,error).map(asItem)}};
  }
  const contactMatch = path.match(/^\/api\/listings\/([^/]+)\/contact$/);
  if (contactMatch) {
    const {data:listing,error:listingError}=await supabase.from('listings').select('vendor_id').eq('id',contactMatch[1]).single();
    if(listingError) fail(listingError.message);
    const {data:vendor,error}=await supabase.from('vendors').select('whatsapp_url').eq('id',listing.vendor_id).maybeSingle();
    if(error) fail(error.message);
    let url=String(vendor?.whatsapp_url||'').trim();
    if(url && /^\+?[0-9\s()-]+$/.test(url)) url='https://wa.me/'+url.replace(/\D/g,'');
    if(url && !/^https:\/\/(wa\.me\/|api\.whatsapp\.com\/)/i.test(url)) fail('Seller WhatsApp contact is not a valid WhatsApp link.');
    return {data:{url}};
  }
  if (path === '/api/groups') {
    const {data,error}=await supabase.from('community_groups').select('*').eq('visibility','public').order('created_at',{ascending:true});
    const items=ensure(data,error).map((g:any)=>({id:g.id,name:g.name,category:g.name.toLowerCase().includes('food')?'Food':g.name.toLowerCase().includes('fashion')?'Fashion':g.name.toLowerCase().includes('job')?'Jobs':'Community',description:g.description||'',members:0}));
    return {data:{items}};
  }
  if (path.startsWith('/api/people')) {
    const q = new URLSearchParams(path.split('?')[1] || '').get('q') || '';
    const {data,error}=await supabase.from('profiles').select('id,username,display_name,avatar_url,bio,is_verified').ilike('username','%'+q.replace(/[%_]/g,'')+'%').limit(30);
    return {data:{items:ensure(data,error)}};
  }
  const publicProfileMatch = path.match(/^\/api\/profile\/([^/]+)$/);
  if (publicProfileMatch) {
    const user=await currentUser();
    const targetId=publicProfileMatch[1];
    const {data,error}=await supabase.from('profiles').select('id,username,display_name,full_name,avatar_url,bio,is_verified,created_at').eq('id',targetId).single();
    if(error) fail(error.message);
    const {data:posts,error:postError}=await supabase.from('community_posts').select('id,text,image_url,created_at').eq('author_id',targetId).order('created_at',{ascending:false}).limit(30);
    if(postError) fail(postError.message);
    const {data:follow,error:followError}=await supabase.from('community_follows').select('follower_id').eq('follower_id',user.id).eq('followed_id',targetId).maybeSingle();
    if(followError) fail(followError.message);
    return {data:{item:{...data,posts:posts||[]},is_following:!!follow}};
  }
  if (path === '/api/profile') {
    const user=await currentUser();
    const {data,error}=await supabase.from('profiles').select('*').eq('id',user.id).maybeSingle();
    if(error) fail(error.message);
    return {data:{item:data || {id:user.id,username:user.email?.split('@')[0] || '',display_name:profileName(user),avatar_url:'',bio:''}}};
  }
  if (path.startsWith('/api/comments/')) {
    const postId=path.split('/')[3];
    const {data,error}=await supabase.from('community_comments').select('*, author_profile:profiles!community_comments_author_id_fkey(username,display_name,avatar_url,is_verified)').eq('post_id',postId).order('created_at',{ascending:true});
    return {data:{items:ensure(data,error)}};
  }
  if (path === '/api/posts') {
    const {data,error}=await supabase.from('community_posts').select('*, author_profile:profiles!community_posts_author_id_fkey(display_name,username,is_verified,avatar_url)').order('created_at',{ascending:false}).limit(80);
    return {data:{items:ensure(data,error).map((p:any)=>({id:p.id,text:p.text,image_url:p.image_url||null,author:p.author_profile?.display_name||p.author_profile?.username||'Calabar Member',author_id:p.author_id,is_verified:!!p.author_profile?.is_verified,avatar_url:p.author_profile?.avatar_url||null,category:p.category,created_at:p.created_at}))}};
  }
  const user=await currentUser();
  if (path === '/api/messages') {
    const {data:convos,error:ce}=await supabase.from('conversations').select('id,user_a,user_b').or('user_a.eq.'+user.id+',user_b.eq.'+user.id);
    const rows=ensure(convos,ce)||[]; if(!rows.length)return {data:{items:[]}};
    const {data,error}=await supabase.from('messages').select('*, sender:profiles!messages_sender_id_fkey(display_name)').in('conversation_id',rows.map((x:any)=>x.id)).order('created_at',{ascending:true}).limit(300);
    return {data:{items:ensure(data,error).map((m:any)=>{const c=rows.find((x:any)=>x.id===m.conversation_id);return {...m,text:m.body,sender_id:m.sender_id,sender_name:m.sender?.display_name||'Member',recipient_id:c?.user_a===user.id?c?.user_b:c?.user_a,read:!!m.read_at};})}};
  }
  if (path === '/api/friends') {
    const {data,error}=await supabase.from('friend_requests').select('*, sender:profiles!friend_requests_sender_id_fkey(display_name,username), receiver:profiles!friend_requests_receiver_id_fkey(display_name,username)').or('sender_id.eq.'+user.id+',receiver_id.eq.'+user.id).order('created_at',{ascending:false});
    return {data:{items:ensure(data,error).map((x:any)=>({id:x.id,from_id:x.sender_id,to_id:x.receiver_id,from_name:x.sender?.display_name||x.sender?.username||'Member',to_name:x.receiver?.display_name||x.receiver?.username||'Member',status:x.status,created_at:x.created_at}))}};
  }
  if (path === '/api/notifications') {
    const {data,error}=await supabase.from('notifications').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100);
    return {data:{items:ensure(data,error).map((n:any)=>({...n,read:!!n.read_at}))}};
  }
  if (path === '/api/admin/profiles') {
    if ((user.email||'').toLowerCase() !== 'princewillobongha@gmail.com') fail('Admin access required.');
    const {data,error}=await supabase.from('profiles').select('id,username,display_name,avatar_url,is_verified').order('created_at',{ascending:false}).limit(200);
    return {data:{items:ensure(data,error)}};
  }
  if (path === '/api/admin/reports') {
    if ((user.email||'').toLowerCase() !== 'princewillobongha@gmail.com') fail('Admin access required.');
    const {data,error}=await supabase.from('moderation_reports').select('*').order('created_at',{ascending:false}).limit(300);
    return {data:{items:ensure(data,error)}};
  }
  if (path === '/api/reports/mine') {
    const {data,error}=await supabase.from('moderation_reports').select('*').eq('reporter_id',user.id).order('created_at',{ascending:false});
    return {data:{items:ensure(data,error)}};
  }
  if (path === '/api/groups/mine') {
    const {data,error}=await supabase.from('group_members').select('*').eq('user_id',user.id);
    return {data:{items:ensure(data,error)}};
  }
  fail('Unsupported API route: '+path);
}
async function post(path: string, body: any) {
  const user=await currentUser();
  if(path==='/api/listings'){
    let {data:vendor,error:ve}=await supabase.from('vendors').select('*').eq('owner_id',user.id).maybeSingle();
    if(ve) fail(ve.message);
    if(!vendor){
      const name=profileName(user);
      const {data,error}=await supabase.from('vendors').insert({owner_id:user.id,business_name:name,slug:slugify(name)+'-'+user.id.slice(0,8),category:body.category||'General',description:body.description||'',address:body.location||'Calabar, Cross River',area:body.location||'Calabar',whatsapp_url:body.whatsapp_url||null}).select('*').single();
      vendor=ensure(data,error);
    } else if(body.whatsapp_url) {
      const {error}=await supabase.from('vendors').update({whatsapp_url:body.whatsapp_url,updated_at:new Date().toISOString()}).eq('id',vendor.id).eq('owner_id',user.id);
      if(error) fail(error.message);
    }
    const numeric=Number(String(body.price||'').replace(/[^0-9.]/g,''))||0;
    const {data,error}=await supabase.from('listings').insert({vendor_id:vendor.id,title:body.title,description:body.description,price_ngn:numeric,image_urls:Array.isArray(body.image_urls)?body.image_urls:(body.image?[body.image]:[]),category:body.category||'Product'}).select('*, vendor:vendors(*)').single();
    return {data:{item:asItem(ensure(data,error))}};
  }
  const reportResolveMatch=path.match(/^\/api\/admin\/reports\/([^/]+)\/resolve$/);
  if(reportResolveMatch){
    if((user.email||'').toLowerCase()!=='princewillobongha@gmail.com') fail('Admin access required.');
    const {data,error}=await supabase.from('moderation_reports').update({status:'reviewed',reviewed_at:new Date().toISOString()}).eq('id',reportResolveMatch[1]).select('*').single();
    return {data:{item:ensure(data,error)}};
  }
  if(path==='/api/admin/verify'){
    if ((user.email||'').toLowerCase() !== 'princewillobongha@gmail.com') fail('Admin access required.');
    const {data,error}=await supabase.from('profiles').update({is_verified:!!body.verified,updated_at:new Date().toISOString()}).eq('id',body.user_id).select('id,is_verified').single();
    return {data:{item:ensure(data,error)}};
  }
  if(path==='/api/profile'){
    const username=String(body.username||'').trim().toLowerCase().replace(/^@/,'');
    if(!/^[a-z0-9_.]{3,24}$/.test(username)) fail('Username must be 3–24 characters using letters, numbers, dots or underscores.');
    const {data,error}=await supabase.from('profiles').upsert({id:user.id,username,display_name:String(body.display_name||'').trim()||username,full_name:String(body.full_name||'').trim()||null,bio:String(body.bio||'').trim(),avatar_url:body.avatar_url||null,updated_at:new Date().toISOString()},{onConflict:'id'}).select('*').single();
    return {data:{item:ensure(data,error)}};
  }
  if(path==='/api/follows/toggle'){
    const followedId=String(body.followed_id||'').trim();
    if(!followedId||followedId===user.id) fail('Choose another member to follow.');
    const {data:existing,error:lookupError}=await supabase.from('community_follows').select('follower_id').eq('follower_id',user.id).eq('followed_id',followedId).maybeSingle();
    if(lookupError) fail(lookupError.message);
    if(existing){const {error}=await supabase.from('community_follows').delete().eq('follower_id',user.id).eq('followed_id',followedId);if(error)fail(error.message);return {data:{following:false}};}
    const {error}=await supabase.from('community_follows').insert({follower_id:user.id,followed_id:followedId});if(error)fail(error.message);return {data:{following:true}};
  }
  if(path==='/api/groups'){
    const name=String(body.name||'').trim();
    if(name.length<3) fail('Group name must be at least 3 characters.');
    const slug=slugify(name)+'-'+user.id.slice(0,6);
    const {data,error}=await supabase.from('community_groups').insert({owner_id:user.id,name,slug,description:String(body.description||'').trim(),visibility:body.visibility==='private'?'private':'public'}).select('*').single();
    const group=ensure(data,error);
    const {error:memberError}=await supabase.from('group_members').insert({group_id:group.id,user_id:user.id,role:'owner',status:'active'});
    if(memberError) fail('Group was created but membership could not be added: '+memberError.message);
    return {data:{item:{id:group.id,name:group.name,description:group.description||'',members:1,category:'Community'}}};
  }
  if(path.startsWith('/api/comments/')){
    const postId=path.split('/')[3];
    const {data,error}=await supabase.from('community_comments').insert({post_id:postId,author_id:user.id,text:String(body.text||'').trim(),image_url:body.image_url||null}).select('*, author_profile:profiles!community_comments_author_id_fkey(username,display_name,avatar_url,is_verified)').single();
    return {data:{item:ensure(data,error)}};
  }
  const reactionMatch=path.match(/^\/api\/posts\/([^/]+)\/like$/);
  if(reactionMatch){
    const postId=reactionMatch[1];
    const {data:existing,error:ee}=await supabase.from('community_post_reactions').select('*').eq('post_id',postId).eq('user_id',user.id).maybeSingle();
    if(ee) fail(ee.message);
    if(existing){const {error}=await supabase.from('community_post_reactions').delete().eq('post_id',postId).eq('user_id',user.id);if(error)fail(error.message);return {data:{liked:false}};}
    const {error}=await supabase.from('community_post_reactions').insert({post_id:postId,user_id:user.id});if(error)fail(error.message);return {data:{liked:true}};
  }
  if(path.startsWith('/api/posts/')&&path.endsWith('/share')){
    const postId=path.split('/')[3];
    const {data:original,error:oe}=await supabase.from('community_posts').select('text,image_url,category').eq('id',postId).single();
    if(oe) fail(oe.message);
    const {data:existingShare,error:shareLookupError}=await supabase.from('community_post_shares').select('post_id').eq('post_id',postId).eq('user_id',user.id).maybeSingle();
    if(shareLookupError) fail(shareLookupError.message);
    if(existingShare) return {data:{ok:true,alreadyShared:true}};
    const {error}=await supabase.from('community_post_shares').insert({post_id:postId,user_id:user.id});
    if(error) fail(error.message);
    const {data:repost,error:re}=await supabase.from('community_posts').insert({author_id:user.id,text:original.text,image_url:original.image_url,category:'Repost'}).select('id').single();
    if(re) fail(re.message);
    return {data:{ok:true,item:{id:repost.id,original_post_id:postId}}};
  }
  if(path==='/api/posts'){
    const {data,error}=await supabase.from('community_posts').insert({author_id:user.id,text:body.text,image_url:body.image_url||null,category:body.category||'Community'}).select('*, author_profile:profiles!community_posts_author_id_fkey(display_name,username,avatar_url,is_verified)').single();
    const p=ensure(data,error);return {data:{item:{id:p.id,text:p.text,image_url:p.image_url||null,author:p.author_profile?.display_name||profileName(user),author_id:p.author_id,avatar_url:p.author_profile?.avatar_url||null,is_verified:!!p.author_profile?.is_verified,category:p.category,created_at:p.created_at}}};
  }
  if(path.startsWith('/api/groups/')&&path.endsWith('/join')){
    const id=path.split('/')[3];
    const {data:existing,error:lookupError}=await supabase.from('group_members').select('group_id').eq('group_id',id).eq('user_id',user.id).maybeSingle();
    if(lookupError) fail(lookupError.message);
    if(existing) return {data:{ok:true,alreadyJoined:true}};
    const {error}=await supabase.from('group_members').insert({group_id:id,user_id:user.id,role:'member',status:'active'});
    if(error) fail(error.message);return {data:{ok:true}};
  }
  if(path==='/api/messages'){
    const recipient=String(body.recipient_id||'').trim();
    if(!recipient||recipient===user.id) fail('Choose another member ID.');
    const [a,b]=[user.id,recipient].sort();
    let {data:conversation,error:ce}=await supabase.from('conversations').select('*').eq('user_a',a).eq('user_b',b).maybeSingle();
    if(ce) fail(ce.message);
    if(!conversation){const {data,error}=await supabase.from('conversations').insert({user_a:a,user_b:b}).select('*').single();conversation=ensure(data,error);}
    const {data,error}=await supabase.from('messages').insert({conversation_id:conversation.id,sender_id:user.id,body:body.text}).select('*').single();
    const m=ensure(data,error);
    await supabase.from('notifications').insert({user_id:recipient,actor_id:user.id,kind:'message',title:'New message',body:'You received a new community message.'});
    return {data:{item:{...m,text:m.body,sender_id:user.id,sender_name:profileName(user),recipient_id:recipient,read:false}}};
  }
  if(path==='/api/friends/request'){
    const to=String(body.to_id||'').trim(); if(!to||to===user.id) fail('Choose another member.');
    const {data:existing,error:ee}=await supabase.from('friend_requests').select('*').or('and(sender_id.eq.'+user.id+',receiver_id.eq.'+to+'),and(sender_id.eq.'+to+',receiver_id.eq.'+user.id+')').maybeSingle();
    if(ee) fail(ee.message);if(existing)return {data:{item:existing}};
    const {data,error}=await supabase.from('friend_requests').insert({sender_id:user.id,receiver_id:to}).select('*').single();
    const req=ensure(data,error);
    await supabase.from('notifications').insert({user_id:to,actor_id:user.id,kind:'friend_request',title:'Connection request',body:'Someone wants to connect with you.'});
    return {data:{item:{id:req.id,from_id:req.sender_id,to_id:req.receiver_id,status:req.status,created_at:req.created_at}}};
  }
  const match=path.match(/^\/api\/friends\/([^/]+)\/respond$/);
  if(match){
    const accept=!!body.accept;
    const {data,error}=await supabase.from('friend_requests').update({status:accept?'accepted':'declined',updated_at:new Date().toISOString()}).eq('id',match[1]).eq('receiver_id',user.id).select('*').single();
    const req=ensure(data,error);
    if(accept){await supabase.from('friendships').upsert({user_a:[req.sender_id,req.receiver_id].sort()[0],user_b:[req.sender_id,req.receiver_id].sort()[1]},{onConflict:'user_a,user_b'});}
    return {data:{ok:true,status:req.status}};
  }
  const notification=path.match(/^\/api\/notifications\/([^/]+)\/read$/);
  if(notification){
    const {error}=await supabase.from('notifications').update({read_at:new Date().toISOString()}).eq('id',notification[1]).eq('user_id',user.id);
    if(error) fail(error.message);return {data:{ok:true}};
  }
  if(path==='/api/reports'){
    const {data,error}=await supabase.from('moderation_reports').insert({reporter_id:user.id,target_type:body.target_type||'community_content',target_id:body.target_id||null,reason:body.reason,details:body.details||''}).select('*').single();
    return {data:{item:ensure(data,error)}};
  }
  fail('Unsupported API route: '+path);
}
export const auth = {
  async getUser(){
    const {data}=await supabase.auth.getUser();
    if(!data.user)return null;
    const {data:profile}=await supabase.from('profiles').select('username,display_name,full_name,avatar_url,bio,is_verified').eq('id',data.user.id).maybeSingle();
    return {userId:data.user.id,email:data.user.email,name:profile?.display_name||profileName(data.user),username:profile?.username||'',avatar_url:profile?.avatar_url||'',bio:profile?.bio||'',is_verified:!!profile?.is_verified,...data.user};
  },
  async signIn(email?:string,password?:string,mode:'signin'|'signup'='signin'){
    if(!email||!password) throw new Error('Enter your email and password.');
    const result=mode==='signup'
      ? await supabase.auth.signUp({email,password,options:{data:{display_name:email.split('@')[0]},emailRedirectTo:'https://calabar-connect-city.vercel.app/'}})
      : await supabase.auth.signInWithPassword({email,password});
    if(result.error)throw result.error;
    if(!result.data.user)throw new Error('Could not complete authentication.');
    if(mode==='signup'&&!result.data.session) return {user:{userId:result.data.user.id,email:result.data.user.email,name:profileName(result.data.user)},confirmationRequired:true};
    return {user:{userId:result.data.user.id,email:result.data.user.email,name:profileName(result.data.user)}};
  },
  async signOut(){const {error}=await supabase.auth.signOut();if(error)throw error;}
};
export const api = { get, post };
