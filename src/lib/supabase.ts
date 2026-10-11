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
const profileName = (u: any) => u?.user_metadata?.display_name || u?.user_metadata?.full_name || 'Calabar Member';
const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'local-business';
const normalizeWhatsApp = (input: string): string => {
  const raw=String(input||'').trim(); if(!raw) return '';
  let digits='';
  if(/^https?:\/\//i.test(raw)||/^(wa\.me\/|api\.whatsapp\.com\/)/i.test(raw)) {
    try {
      const u=new URL(/^https?:\/\//i.test(raw)?raw:'https://'+raw);
      const fromPath=u.pathname.replace(/\D/g,'');
      const fromQuery=(u.searchParams.get('phone')||'').replace(/\D/g,'');
      digits=fromQuery||fromPath;
      if(!['wa.me','www.wa.me','api.whatsapp.com','www.api.whatsapp.com'].includes(u.hostname.toLowerCase())) return '';
    } catch { return ''; }
  } else if(/^\+?[0-9\s().-]+$/.test(raw)) digits=raw.replace(/\D/g,'');
  else return '';
  if(digits.length===11&&digits.startsWith('0')) digits='234'+digits.slice(1);
  else if(digits.length===10) digits='234'+digits;
  if(digits.length<10||digits.length>15) return '';
  return 'https://wa.me/'+digits;
};
const asItem = (x: any) => ({...x, id:x.id, vendor_id:x.vendor_id, vendor_owner_id:x.vendor?.owner_id, title:x.title, category:x.category, price: x.price_ngn ? '₦'+Number(x.price_ngn).toLocaleString('en-NG') : 'Ask for price', location:x.vendor?.address || x.vendor?.area || 'Calabar, Cross River', description:x.description || '', images:Array.isArray(x.image_urls)?x.image_urls:[], image:x.image_urls?.[0] || '', vendor:x.owner_profile?.display_name || x.owner_profile?.username || x.vendor?.business_name || 'Calabar vendor', is_verified:!!x.owner_profile?.is_verified && (!x.owner_profile?.verified_until || new Date(x.owner_profile.verified_until).getTime()>Date.now()), rating_average:Number(x.owner_profile?.rating_average||0), rating_count:Number(x.owner_profile?.rating_count||0), order_count:Number(x.order_count||0), available_until:x.available_until||null, availability_note:x.availability_note||'', kind:x.category || 'Product'});
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
    const {data,error}=await supabase.from('listings').select('*, vendor:vendors(id,owner_id,business_name,address,area,cover_image_url)').eq('is_available',true).or('available_until.is.null,available_until.gt.'+new Date().toISOString()).order('created_at',{ascending:false}).limit(100);
    const rows=ensure(data,error); const ownerIds=[...new Set(rows.map((x:any)=>x.vendor?.owner_id).filter(Boolean))];
    const {data:owners,error:ownerError}=ownerIds.length?await supabase.from('profiles').select('id,username,display_name,is_verified,verified_until').in('id',ownerIds):{data:[],error:null}; if(ownerError)fail(ownerError.message);
    const ownerMap=new Map((owners||[]).map((p:any)=>[p.id,p]));
    const {data:ratings,error:ratingsError}=ownerIds.length?await supabase.from('profile_ratings').select('profile_id,rating').in('profile_id',ownerIds):{data:[],error:null};
    if(ratingsError) fail(ratingsError.message);
    const ratingMap=new Map<string,{sum:number,count:number}>();
    for(const rating of (ratings||[]) as any[]){const entry=ratingMap.get(rating.profile_id)||{sum:0,count:0};entry.sum+=Number(rating.rating);entry.count++;ratingMap.set(rating.profile_id,entry);}
    return {data:{items:rows.map((x:any)=>{const ownerId=x.vendor?.owner_id;const owner=ownerMap.get(ownerId)||{};const rating=ratingMap.get(ownerId)||{sum:0,count:0};return asItem({...x,owner_profile:{...owner,rating_average:rating.count?rating.sum/rating.count:0,rating_count:rating.count}});})}};
  }
  const contactMatch = path.match(/^\/api\/listings\/([^/]+)\/contact$/);
  if (contactMatch) {
    const customer=await currentUser();
    const {data:listing,error:listingError}=await supabase.from('listings').select('id,title,price_ngn,vendor_id,vendor:vendors(owner_id,whatsapp_url)').eq('id',contactMatch[1]).single();
    if(listingError) fail(listingError.message);
    const ownerId=(listing as any).vendor?.owner_id;
    const {data:profile,error:profileError}=ownerId?await supabase.from('profiles').select('whatsapp_url,display_name,username').eq('id',ownerId).maybeSingle():{data:null,error:null};
    if(profileError) fail(profileError.message);
    const raw=String(profile?.whatsapp_url||(listing as any).vendor?.whatsapp_url||'').trim();
    const url=normalizeWhatsApp(raw);
    if(!url) fail('This seller has not added a valid WhatsApp contact yet. Ask them to add it under Edit profile.');
    if(ownerId!==customer.id) {
      const price=(listing as any).price_ngn?('₦'+Number((listing as any).price_ngn).toLocaleString('en-NG')):'the listed price';
      const message='Hi '+(profile?.display_name||profile?.username||'seller')+', I found your listing "'+(listing as any).title+'" on Calabar Connect City ('+price+'). I am interested. Is it available? Please share the next steps. Thank you.';
      const {error:orderError}=await supabase.from('vendor_enquiries').insert({vendor_id:(listing as any).vendor_id,customer_id:customer.id,listing_id:(listing as any).id,message,status:'new'});
      if(orderError) fail(orderError.message);
      return {data:{url:url+'?text='+encodeURIComponent(message)}};
    }
    return {data:{url}};
  }
  const groupDetailMatch=path.match(/^\/api\/groups\/(?!mine$)([^/]+)$/);
  if(groupDetailMatch){
    const groupId=groupDetailMatch[1];
    const {data:group,error:groupError}=await supabase.from('community_groups').select('*').eq('id',groupId).single();
    if(groupError) fail(groupError.message);
    const {data:posts,error:postsError}=await supabase.from('community_group_posts').select('*').eq('group_id',groupId).order('created_at',{ascending:false}).limit(100);
    if(postsError) fail(postsError.message);
    const {data:memberRows,error:membersError}=await supabase.from('group_members').select('user_id,role,status,joined_at').eq('group_id',groupId).eq('status','active');
    if(membersError) fail(membersError.message);
    const ids=[...new Set([...(posts||[]).map((p:any)=>p.author_id),...(memberRows||[]).map((m:any)=>m.user_id)])];
    const {data:profiles,error:profilesError}=ids.length?await supabase.from('profiles').select('id,username,display_name,avatar_url,is_verified,verified_until').in('id',ids):{data:[],error:null};
    if(profilesError) fail(profilesError.message);
    const {data:{user:viewer}}=await supabase.auth.getUser();
    const postIds=(posts||[]).map((p:any)=>p.id);
    const {data:groupLikes,error:likesError}=postIds.length?await supabase.from('community_group_post_reactions').select('post_id,user_id').in('post_id',postIds):{data:[],error:null};
    if(likesError) fail(likesError.message);
    const isMember=!!viewer&&(memberRows||[]).some((m:any)=>m.user_id===viewer.id);
    const profileMap=new Map((profiles||[]).map((p:any)=>[p.id,p]));
    return {data:{item:{...group,members:(memberRows||[]).length,is_member:isMember,is_owner:!!viewer&&group.owner_id===viewer.id,posts:(posts||[]).map((p:any)=>{const a:any=profileMap.get(p.author_id)||{};const likes=(groupLikes||[]).filter((x:any)=>x.post_id===p.id);return {...p,author:a.display_name||a.username||'Calabar member',avatar_url:a.avatar_url||null,is_verified:!!a.is_verified&&(!a.verified_until||new Date(a.verified_until).getTime()>Date.now()),like_count:likes.length,liked_by_me:!!viewer&&likes.some((x:any)=>x.user_id===viewer.id)};}),member_list:(memberRows||[]).map((m:any)=>({...m,profile:profileMap.get(m.user_id)||{}}))}}};
  }
  if (path === '/api/groups') {
    const {data,error}=await supabase.from('community_groups').select('*').eq('visibility','public').order('created_at',{ascending:false});
    const rows=ensure(data,error);
    const {data:memberRows}=await supabase.from('group_members').select('group_id').eq('status','active');
    const items=rows.map((g:any)=>({id:g.id,name:g.name,avatar_url:g.avatar_url||null,owner_id:g.owner_id,category:g.name.toLowerCase().includes('food')?'Food':g.name.toLowerCase().includes('fashion')?'Fashion':g.name.toLowerCase().includes('job')?'Jobs':'Community',description:g.description||'',members:(memberRows||[]).filter((m:any)=>m.group_id===g.id).length}));
    return {data:{items}};
  }
  if (path.startsWith('/api/people')) {
    const q = new URLSearchParams(path.split('?')[1] || '').get('q') || '';
    const term=q.replace(/[%,_]/g,'').trim();
    let builder=supabase.from('profiles').select('id,username,display_name,full_name,avatar_url,bio,city,is_verified,verified_until').order('display_name').limit(100);
    if(term) builder=builder.or('username.ilike.%'+term+'%,display_name.ilike.%'+term+'%,full_name.ilike.%'+term+'%');
    const {data,error}=await builder;
    return {data:{items:ensure(data,error).map((p:any)=>({...p,is_verified:!!p.is_verified&&(!p.verified_until||new Date(p.verified_until).getTime()>Date.now()),verified_until:undefined}))}};
  }
  const publicProfileMatch = path.match(/^\/api\/profile\/([^/]+)$/);
  if (publicProfileMatch) {
    const user=await currentUser();
    const targetId=publicProfileMatch[1];
    const {data,error}=await supabase.from('profiles').select('id,username,display_name,full_name,avatar_url,bio,city,is_verified,verified_until,verified_days,created_at').eq('id',targetId).single();
    if(error) fail(error.message);
    const {data:posts,error:postError}=await supabase.from('community_posts').select('id,text,image_url,created_at,author_id,category').eq('author_id',targetId).order('created_at',{ascending:false}).limit(50);
    if(postError) fail(postError.message);
    const postIds=(posts||[]).map((p:any)=>p.id);
    const [{data:postLikes},{data:postShares}]=await Promise.all([postIds.length?supabase.from('community_post_reactions').select('post_id,user_id').in('post_id',postIds):Promise.resolve({data:[]}),postIds.length?supabase.from('community_post_shares').select('post_id,user_id').in('post_id',postIds):Promise.resolve({data:[]})]);
    const {data:follow,error:followError}=await supabase.from('community_follows').select('follower_id').eq('follower_id',user.id).eq('followed_id',targetId).maybeSingle();
    if(followError) fail(followError.message);
    const [{count:followers},{count:following}]=await Promise.all([supabase.from('community_follows').select('*',{count:'exact',head:true}).eq('followed_id',targetId),supabase.from('community_follows').select('*',{count:'exact',head:true}).eq('follower_id',targetId)]);
    const {data:ratings,error:ratingError}=await supabase.from('profile_ratings').select('rating,rater_id').eq('profile_id',targetId); if(ratingError)fail(ratingError.message); const ratingRows=ratings||[]; const ratingAverage=ratingRows.length?ratingRows.reduce((sum:number,r:any)=>sum+Number(r.rating),0)/ratingRows.length:0; const {data:targetVendor}=await supabase.from('vendors').select('id').eq('owner_id',targetId).maybeSingle(); const targetListingsResult:any=targetVendor?await supabase.from('listings').select('order_count').eq('vendor_id',targetVendor.id):{data:[],error:null}; if(targetListingsResult.error)fail(targetListingsResult.error.message); const targetListings=targetListingsResult.data; const orders=(targetListings||[]).reduce((sum:number,l:any)=>sum+Number(l.order_count||0),0);
    return {data:{item:{...data,verified_until:undefined,verified_days:undefined,is_verified:!!data.is_verified&&(!data.verified_until||new Date(data.verified_until).getTime()>Date.now()),rating_average:ratingAverage,rating_count:ratingRows.length,my_rating:ratingRows.find((r:any)=>r.rater_id===user.id)?.rating||0,order_count:orders||0,followers_count:followers||0,following_count:following||0,posts:(posts||[]).map((p:any)=>({...p,like_count:(postLikes||[]).filter((x:any)=>x.post_id===p.id).length,liked_by_me:(postLikes||[]).some((x:any)=>x.post_id===p.id&&x.user_id===user.id),share_count:(postShares||[]).filter((x:any)=>x.post_id===p.id).length,shared_by_me:(postShares||[]).some((x:any)=>x.post_id===p.id&&x.user_id===user.id)}))},is_following:!!follow}};
  }
  if (path === '/api/profile') {
    const user=await currentUser();
    const {data,error}=await supabase.from('profiles').select('*').eq('id',user.id).maybeSingle();
    if(error) fail(error.message);
    const [{count:followers},{count:following}]=await Promise.all([supabase.from('community_follows').select('*',{count:'exact',head:true}).eq('followed_id',user.id),supabase.from('community_follows').select('*',{count:'exact',head:true}).eq('follower_id',user.id)]);
    return {data:{item:{...(data || {id:user.id,username:user.email?.split('@')[0] || '',display_name:profileName(user),avatar_url:'',bio:''}),followers_count:followers||0,following_count:following||0}}};
  }
  if (path.startsWith('/api/comments/')) {
    const postId=path.split('/')[3];
    const {data,error}=await supabase.from('community_comments').select('*, author_profile:profiles!community_comments_author_id_fkey(username,display_name,avatar_url,is_verified)').eq('post_id',postId).order('created_at',{ascending:true});
    return {data:{items:ensure(data,error)}};
  }
  if (path === '/api/posts') {
    const {data,error}=await supabase.from('community_posts').select('*').order('created_at',{ascending:false}).limit(80);
    const rows=ensure(data,error);const ids=rows.map((p:any)=>p.author_id);const postIds=rows.map((p:any)=>p.id);
    const [{data:profiles,error:pe},{data:likes,error:le},{data:shares,error:se},{data:comments,error:ce},{data:{user:viewer}}]=await Promise.all([
      ids.length?supabase.from('profiles').select('id,display_name,username,avatar_url,is_verified,verified_until').in('id',[...new Set(ids)]):Promise.resolve({data:[],error:null}),
      postIds.length?supabase.from('community_post_reactions').select('post_id,user_id').in('post_id',postIds):Promise.resolve({data:[],error:null}),
      postIds.length?supabase.from('community_post_shares').select('post_id,user_id').in('post_id',postIds):Promise.resolve({data:[],error:null}),
      postIds.length?supabase.from('community_comments').select('post_id').in('post_id',postIds):Promise.resolve({data:[],error:null}),
      supabase.auth.getUser()
    ]);if(pe)fail(pe.message);if(le)fail(le.message);if(se)fail(se.message);if(ce)fail(ce.message);
    const pm=new Map((profiles||[]).map((p:any)=>[p.id,p]));
    return {data:{items:rows.map((p:any)=>{const a:any=pm.get(p.author_id)||{};return {id:p.id,text:p.text,image_url:p.image_url||null,author:a.display_name||a.username||'Calabar Member',author_id:p.author_id,is_verified:!!a.is_verified&&(!a.verified_until||new Date(a.verified_until).getTime()>Date.now()),avatar_url:a.avatar_url||null,category:p.category,created_at:p.created_at,like_count:(likes||[]).filter((x:any)=>x.post_id===p.id).length,liked_by_me:!!viewer&&(likes||[]).some((x:any)=>x.post_id===p.id&&x.user_id===viewer.id),share_count:(shares||[]).filter((x:any)=>x.post_id===p.id).length,shared_by_me:!!viewer&&(shares||[]).some((x:any)=>x.post_id===p.id&&x.user_id===viewer.id),comment_count:(comments||[]).filter((x:any)=>x.post_id===p.id).length}})}};
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
    const {data,error}=await supabase.from('profiles').select('id,username,display_name,avatar_url,is_verified,verified_until,verified_days').order('created_at',{ascending:false}).limit(500);
    return {data:{items:ensure(data,error).map((p:any)=>({...p,is_verified:!!p.is_verified&&(!p.verified_until||new Date(p.verified_until).getTime()>Date.now())}))}};
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
    const {data,error}=await supabase.from('group_members').select('group_id,role,status,group:community_groups(id,name,description,avatar_url,owner_id)').eq('user_id',user.id).eq('status','active');
    return {data:{items:ensure(data,error).map((m:any)=>({...m.group,role:m.role,status:m.status}))}};
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
    const {data,error}=await supabase.from('listings').insert({vendor_id:vendor.id,title:body.title,description:body.description,price_ngn:numeric,image_urls:Array.isArray(body.image_urls)?body.image_urls:(body.image?[body.image]:[]),category:body.category||'Product',available_until:body.available_until||null,availability_note:String(body.availability_note||'').trim()||null}).select('*, vendor:vendors(*)').single();
    const created=ensure(data,error); const {data:ownerProfile}=await supabase.from('profiles').select('id,username,display_name,is_verified,verified_until').eq('id',user.id).maybeSingle();
    return {data:{item:asItem({...created,owner_profile:ownerProfile})}};
  }
  const reportResolveMatch=path.match(/^\/api\/admin\/reports\/([^/]+)\/resolve$/);
  if(reportResolveMatch){
    if((user.email||'').toLowerCase()!=='princewillobongha@gmail.com') fail('Admin access required.');
    const {data,error}=await supabase.from('moderation_reports').update({status:'reviewed',reviewed_at:new Date().toISOString()}).eq('id',reportResolveMatch[1]).select('*').single();
    return {data:{item:ensure(data,error)}};
  }
  const ratingMatch=path.match(/^\/api\/profile\/([^/]+)\/rating$/);
  if(ratingMatch){ const targetId=ratingMatch[1]; const rating=Number(body.rating); if(!Number.isInteger(rating)||rating<1||rating>5)fail('Choose a rating from 1 to 5 stars.'); if(targetId===user.id)fail('You cannot rate your own profile.'); const {data,error}=await supabase.from('profile_ratings').upsert({profile_id:targetId,rater_id:user.id,rating,updated_at:new Date().toISOString()},{onConflict:'profile_id,rater_id'}).select('*').single(); return {data:{item:ensure(data,error)}}; }
  if(path==='/api/admin/verify'){
    if ((user.email||'').toLowerCase() !== 'princewillobongha@gmail.com') fail('Admin access required.');
    const days=Math.max(1,Math.min(3650,Number(body.days)||30)); const verified=!!body.verified; const {data,error}=await supabase.from('profiles').update({is_verified:verified,verified_days:verified?days:null,verified_until:verified?new Date(Date.now()+days*86400000).toISOString():null,updated_at:new Date().toISOString()}).eq('id',body.user_id).select('id,is_verified,verified_days,verified_until').single();
    return {data:{item:ensure(data,error)}};
  }
  if(path==='/api/profile'){
    const username=String(body.username||'').trim().toLowerCase().replace(/^@/,'');
    if(!/^[a-z0-9_.]{3,24}$/.test(username)) fail('Username must be 3–24 characters using letters, numbers, dots or underscores.');
    const rawWhatsapp=String(body.whatsapp_url||'').trim();
    const whatsapp=normalizeWhatsApp(rawWhatsapp);
    if(rawWhatsapp&&!whatsapp) fail('Enter a valid WhatsApp number (local Nigerian numbers such as 08012345678 work) or a wa.me link.');
    const {data,error}=await supabase.from('profiles').upsert({id:user.id,username,display_name:String(body.display_name||'').trim()||username,full_name:String(body.full_name||'').trim()||null,bio:String(body.bio||'').trim(),avatar_url:body.avatar_url||null,city:String(body.city||body.location||'Calabar').trim()||'Calabar',whatsapp_url:whatsapp||null,updated_at:new Date().toISOString()},{onConflict:'id'}).select('*').single();
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
    const {data,error}=await supabase.from('community_groups').insert({owner_id:user.id,name,slug,description:String(body.description||'').trim(),avatar_url:body.avatar_url||null,visibility:body.visibility==='private'?'private':'public'}).select('*').single();
    const group=ensure(data,error);
    const {error:memberError}=await supabase.from('group_members').insert({group_id:group.id,user_id:user.id,role:'owner',status:'active'});
    if(memberError) fail('Group was created but membership could not be added: '+memberError.message);
    return {data:{item:{id:group.id,name:group.name,description:group.description||'',avatar_url:group.avatar_url||null,owner_id:group.owner_id,members:1,category:'Community'}}};
  }
  const groupPostLikeMatch=path.match(/^\/api\/groups\/([^/]+)\/posts\/([^/]+)\/like$/);
  if(groupPostLikeMatch){
    const groupId=groupPostLikeMatch[1],postId=groupPostLikeMatch[2];
    const {data:existing,error:lookupError}=await supabase.from('community_group_post_reactions').select('post_id').eq('post_id',postId).eq('user_id',user.id).maybeSingle();
    if(lookupError) fail(lookupError.message);
    if(existing){const {error}=await supabase.from('community_group_post_reactions').delete().eq('post_id',postId).eq('user_id',user.id);if(error)fail(error.message);return {data:{liked:false}};}
    const {error}=await supabase.from('community_group_post_reactions').insert({post_id:postId,user_id:user.id});
    if(error)fail(error.message);return {data:{liked:true}};
  }
  const groupPostMatch=path.match(/^\/api\/groups\/([^/]+)\/posts$/);
  if(groupPostMatch){
    const text=String(body.text||'').trim();if(!text)fail('Write something before posting in the group.');
    const {data,error}=await supabase.from('community_group_posts').insert({group_id:groupPostMatch[1],author_id:user.id,text,image_url:body.image_url||null}).select('*').single();
    const p=ensure(data,error);
    const {data:author,error:authorError}=await supabase.from('profiles').select('id,username,display_name,avatar_url,is_verified,verified_until').eq('id',user.id).maybeSingle();
    if(authorError) fail(authorError.message);
    return {data:{item:{...p,author:author?.display_name||author?.username||'Calabar member',avatar_url:author?.avatar_url||null,is_verified:!!author?.is_verified&&(!author?.verified_until||new Date(author.verified_until).getTime()>Date.now()),like_count:0,liked_by_me:false}}};
  }
  const groupUpdateMatch=path.match(/^\/api\/groups\/([^/]+)\/update$/);
  if(groupUpdateMatch){
    const {data,error}=await supabase.from('community_groups').update({avatar_url:body.avatar_url||null,description:String(body.description||'').trim()}).eq('id',groupUpdateMatch[1]).eq('owner_id',user.id).select('*').single();
    return {data:{item:ensure(data,error)}};
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
    const {data:repost,error:re}=await supabase.from('community_posts').insert({author_id:user.id,text:original.text,image_url:original.image_url,category:'Repost'}).select('id').single();
    if(re) fail(re.message);
    const {error}=await supabase.from('community_post_shares').insert({post_id:postId,user_id:user.id,repost_id:repost.id});
    if(error){await supabase.from('community_posts').delete().eq('id',repost.id).eq('author_id',user.id);fail(error.message);}
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
    const emailPrefix=String(data.user.email||'').split('@')[0].toLowerCase(); const displayName=profile?.display_name&&profile.display_name.toLowerCase()!==emailPrefix?profile.display_name:(profile?.username||'Calabar Member'); return {userId:data.user.id,email:data.user.email,name:displayName,username:profile?.username||'',avatar_url:profile?.avatar_url||'',bio:profile?.bio||'',is_verified:!!profile?.is_verified,...data.user};
  },
  async signIn(email?:string,password?:string,mode:'signin'|'signup'='signin'){
    if(!email||!password) throw new Error('Enter your email and password.');
    const result=mode==='signup'
      ? await supabase.auth.signUp({email,password,options:{data:{display_name:'Calabar Member'},emailRedirectTo:'https://calabar-connect-city-omega.vercel.app/'}})
      : await supabase.auth.signInWithPassword({email,password});
    if(result.error)throw result.error;
    if(!result.data.user)throw new Error('Could not complete authentication.');
    if(mode==='signup'&&!result.data.session) return {user:{userId:result.data.user.id,email:result.data.user.email,name:profileName(result.data.user)},confirmationRequired:true};
    return {user:{userId:result.data.user.id,email:result.data.user.email,name:profileName(result.data.user)}};
  },
  async resendConfirmation(email:string){const {error}=await supabase.auth.resend({type:'signup',email,options:{emailRedirectTo:'https://calabar-connect-city-omega.vercel.app/'}});if(error)throw error;},
  async signOut(){const {error}=await supabase.auth.signOut();if(error)throw error;}
};
async function del(path:string){
  const user=await currentUser();
  const listingDelete=path.match(/^\/api\/listings\/([^/]+)$/);
  if(listingDelete){const {data:listing,error:lookupError}=await supabase.from('listings').select('id,vendor_id,vendor:vendors(owner_id)').eq('id',listingDelete[1]).single();if(lookupError)fail(lookupError.message);if((listing as any).vendor?.owner_id!==user.id)fail('You can only delete your own listing.');const {error}=await supabase.from('listings').delete().eq('id',listingDelete[1]);if(error)fail(error.message);return {data:{ok:true}};}
  const groupPostDelete=path.match(/^\/api\/groups\/([^/]+)\/posts\/([^/]+)$/);
  if(groupPostDelete){const {error}=await supabase.from('community_group_posts').delete().eq('id',groupPostDelete[2]).eq('group_id',groupPostDelete[1]);if(error)fail(error.message);return {data:{ok:true}};}
  const groupMemberDelete=path.match(/^\/api\/groups\/([^/]+)\/members\/([^/]+)$/);
  if(groupMemberDelete){const {error}=await supabase.from('group_members').delete().eq('group_id',groupMemberDelete[1]).eq('user_id',groupMemberDelete[2]);if(error)fail(error.message);return {data:{ok:true}};}
  const postDelete=path.match(/^\/api\/posts\/([^/]+)$/);
  if(postDelete){const {error}=await supabase.from('community_posts').delete().eq('id',postDelete[1]).eq('author_id',user.id);if(error)fail(error.message);return {data:{ok:true}};}
  const unshare=path.match(/^\/api\/posts\/([^/]+)\/share$/);
  if(unshare){const postId=unshare[1];const {data:share,error:se}=await supabase.from('community_post_shares').select('repost_id').eq('post_id',postId).eq('user_id',user.id).maybeSingle();if(se)fail(se.message);if(!share)return {data:{ok:true,shared:false}};if(share.repost_id){const {error}=await supabase.from('community_posts').delete().eq('id',share.repost_id).eq('author_id',user.id);if(error)fail(error.message);}const {error}=await supabase.from('community_post_shares').delete().eq('post_id',postId).eq('user_id',user.id);if(error)fail(error.message);return {data:{ok:true,shared:false}};}
  fail('Unsupported DELETE route: '+path);
}
export const api = { get, post, delete: del };
