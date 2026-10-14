import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
// Always send confirmation links back to the stable production domain, not a temporary preview URL.
const authRedirectUrl = 'https://calabar-connect-city-omega.vercel.app/';
export const supabase = createClient(
  supabaseUrl || 'https://moejannssmjupdvkcofw.supabase.co',
  supabaseKey || 'sb_publishable_60YiAMNciYl-5UjEj0jYFA_LajRkki3',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

const fail = (message: string): never => { throw new Error(message); };
const ensure = <T,>(data: T | null, error: any): T => { if (error) fail(error.message || 'Supabase request failed'); return data as T; };
const withTimeout = <T,>(operation: PromiseLike<T>, ms = 25000): Promise<T> => new Promise((resolve, reject) => {
  const timer = window.setTimeout(() => reject(new Error('This request is taking longer than expected. Check your connection. If you were creating an account, wait a moment before trying again, or request a fresh confirmation email.')), ms);
  Promise.resolve(operation).then(value => { window.clearTimeout(timer); resolve(value); }, error => { window.clearTimeout(timer); reject(error); });
});
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
const asItem = (x: any) => ({...x, id:x.id, vendor_id:x.vendor_id, vendor_owner_id:x.vendor?.owner_id, title:x.title, category:x.category, price: x.price_ngn ? '₦'+Number(x.price_ngn).toLocaleString('en-NG') : 'Ask for price', location:x.vendor?.address || x.vendor?.area || 'Calabar, Cross River', description:x.description || '', images:Array.isArray(x.image_urls)?x.image_urls:[], image:x.image_urls?.[0] || '', vendor:x.owner_profile?.display_name || x.owner_profile?.username || x.vendor?.business_name || 'Calabar vendor', is_verified:!!x.owner_profile?.is_verified && (!x.owner_profile?.verified_until || new Date(x.owner_profile.verified_until).getTime()>Date.now()), rating_average:Number(x.owner_profile?.rating_average||0), rating_count:Number(x.owner_profile?.rating_count||0), order_count:Number(x.order_count||0), view_count:Number(x.view_count||0), available_until:x.available_until||null, availability_note:x.availability_note||'', sale_status:x.sale_status||'available', kind:x.category || 'Product'});
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
  if (path === '/api/discover/businesses') {
    const {data:vendors,error}=await supabase.from('vendors').select('id,owner_id,business_name,category,description,address,area,cover_image_url,is_open,availability_note,created_at').eq('is_open',true).order('created_at',{ascending:false}).limit(100);
    const rows=ensure(vendors,error);
    const ownerIds=[...new Set(rows.map((v:any)=>v.owner_id).filter(Boolean))];
    const vendorIds=rows.map((v:any)=>v.id);
    const [{data:profiles,error:profileError},{data:listings,error:listingError}]=await Promise.all([
      ownerIds.length?supabase.from('profiles').select('id,username,display_name,avatar_url,is_verified,verified_until').in('id',ownerIds):Promise.resolve({data:[],error:null}),
      vendorIds.length?supabase.from('listings').select('id,vendor_id,title,image_urls,category,sale_status,available_until').in('vendor_id',vendorIds).eq('is_available',true).order('created_at',{ascending:false}):Promise.resolve({data:[],error:null})
    ]);
    if(profileError)fail(profileError.message);if(listingError)fail(listingError.message);
    const profileMap=new Map((profiles||[]).map((p:any)=>[p.id,p]));
    const listingRows=listings||[];
    return {data:{items:rows.map((v:any)=>{const owner:any=profileMap.get(v.owner_id)||{};const products=listingRows.filter((l:any)=>l.vendor_id===v.id);return {...v,owner_name:owner.display_name||owner.username||v.business_name||'Local business',owner_avatar:owner.avatar_url||null,is_verified:!!owner.is_verified&&(!owner.verified_until||new Date(owner.verified_until).getTime()>Date.now()),listing_count:products.length,latest_listing_image:products.find((l:any)=>Array.isArray(l.image_urls)&&l.image_urls.length)?.image_urls?.[0]||null};})}};
  }
  if (path === '/api/listings') {
    const {data,error}=await supabase.from('listings').select('*, vendor:vendors(id,owner_id,business_name,address,area,cover_image_url)').eq('is_available',true).order('created_at',{ascending:false}).limit(100);
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
    const {data:listing,error:listingError}=await supabase.from('listings').select('id,title,price_ngn,sale_status,vendor_id,vendor:vendors(owner_id,whatsapp_url)').eq('id',contactMatch[1]).single();
    if(listingError) fail(listingError.message);
    if((listing as any).sale_status==='sold') fail('This item has been marked SOLD by the seller.');
    const ownerId=(listing as any).vendor?.owner_id;
    const {data:profile,error:profileError}=ownerId?await supabase.from('profiles').select('whatsapp_url,display_name,username,is_verified,verified_until').eq('id',ownerId).maybeSingle():{data:null,error:null};
    if(profileError) fail(profileError.message);
    const sellerVerified=!!profile?.is_verified&&(!profile?.verified_until||new Date(profile.verified_until).getTime()>Date.now());
    if(!sellerVerified) fail('You cannot contact this seller yet because this seller is not verified. Please choose a verified seller.');
    const raw=String(profile?.whatsapp_url||(listing as any).vendor?.whatsapp_url||'').trim();
    const url=normalizeWhatsApp(raw);
    if(!url) fail('This seller has not added a valid WhatsApp contact yet. Ask them to add it under Edit profile.');
    if(ownerId!==customer.id) {
      const price=(listing as any).price_ngn?('₦'+Number((listing as any).price_ngn).toLocaleString('en-NG')):'the listed price';
      const message='Hi '+(profile?.display_name||profile?.username||'seller')+', I found your listing "'+(listing as any).title+'" on Calabar Connect City ('+price+'). I am interested. Is it available? Please share the next steps. Thank you.';
      const {error:orderError}=await supabase.from('vendor_enquiries').insert({vendor_id:(listing as any).vendor_id,customer_id:customer.id,listing_id:(listing as any).id,message,status:'new'});
      if(orderError) fail(orderError.message);
      // The database trigger creates the seller's tappable listing-enquiry notification.
      return {data:{url:url+'?text='+encodeURIComponent(message)}};
    }
    return {data:{url}};
  }
  const groupDetailMatch=path.match(/^\/api\/groups\/(?!mine$)([^/]+)$/);
  if(groupDetailMatch){
    const groupId=groupDetailMatch[1];
    const {data:group,error:groupError}=await supabase.from('community_groups').select('*').eq('id',groupId).single();
    if(groupError) fail(groupError.message);
    const {data:posts,error:postsError}=await supabase.from('community_group_posts').select('*').eq('group_id',groupId).order('pinned_at',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false}).limit(100);
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
    const profiles=ensure(data,error);
    const {data:{user:viewer}}=await supabase.auth.getUser();
    let followRows:any[]=[]; let friendRows:any[]=[];
    if(viewer){
      const [followResult,friendResult]=await Promise.all([
        supabase.from('community_follows').select('followed_id').eq('follower_id',viewer.id),
        supabase.from('friend_requests').select('id,sender_id,receiver_id,status').or('sender_id.eq.'+viewer.id+',receiver_id.eq.'+viewer.id)
      ]);
      if(followResult.error)fail(followResult.error.message); if(friendResult.error)fail(friendResult.error.message);
      followRows=followResult.data||[]; friendRows=friendResult.data||[];
    }
    return {data:{items:profiles.map((p:any)=>{
      const request=viewer?friendRows.find((f:any)=>(f.sender_id===viewer.id&&f.receiver_id===p.id)||(f.sender_id===p.id&&f.receiver_id===viewer.id)):null;
      return {...p,is_verified:!!p.is_verified&&(!p.verified_until||new Date(p.verified_until).getTime()>Date.now()),verified_until:undefined,is_following:!!viewer&&followRows.some((f:any)=>f.followed_id===p.id),friend_status:request?.status||null,friend_request_id:request?.id||null,friend_request_direction:request?(request.sender_id===viewer?.id?'sent':'received'):null};
    })}};
  }
  const publicProfileMatch = path.match(/^\/api\/profile\/([^/]+)$/);
  if (publicProfileMatch) {
    const user=await currentUser();
    const targetId=publicProfileMatch[1];
    const {data,error}=await supabase.from('profiles').select('id,username,display_name,full_name,avatar_url,bio,city,is_verified,verified_until,verified_days,created_at').eq('id',targetId).single();
    if(error) fail(error.message);
    let profileData:any=data;
    if(!profileData.avatar_url){
      try{
        const {data:storedImages}=await supabase.storage.from('community-media').list(targetId,{limit:50});
        const images=(storedImages||[]).filter((file:any)=>file.name&&/\\.(jpe?g|png|webp|gif|avif)$/i.test(file.name));
        if(images.length===1){
          profileData={...profileData,avatar_url:supabase.storage.from('community-media').getPublicUrl(targetId+'/'+images[0].name).data.publicUrl};
        }
      }catch{}
    }
    const {data:posts,error:postError}=await supabase.from('community_posts').select('id,text,image_url,created_at,author_id,category').eq('author_id',targetId).order('created_at',{ascending:false}).limit(50);
    if(postError) fail(postError.message);
    const postIds=(posts||[]).map((p:any)=>p.id);
    const [{data:postLikes},{data:postShares}]=await Promise.all([postIds.length?supabase.from('community_post_reactions').select('post_id,user_id').in('post_id',postIds):Promise.resolve({data:[]}),postIds.length?supabase.from('community_post_shares').select('post_id,user_id').in('post_id',postIds):Promise.resolve({data:[]})]);
    const {data:follow,error:followError}=await supabase.from('community_follows').select('follower_id').eq('follower_id',user.id).eq('followed_id',targetId).maybeSingle();
    if(followError) fail(followError.message);
    const [{count:followers},{count:following}]=await Promise.all([supabase.from('community_follows').select('*',{count:'exact',head:true}).eq('followed_id',targetId),supabase.from('community_follows').select('*',{count:'exact',head:true}).eq('follower_id',targetId)]);
    const {data:ratings,error:ratingError}=await supabase.from('profile_ratings').select('rating,rater_id').eq('profile_id',targetId); if(ratingError)fail(ratingError.message); const ratingRows=ratings||[]; const ratingAverage=ratingRows.length?ratingRows.reduce((sum:number,r:any)=>sum+Number(r.rating),0)/ratingRows.length:0; const {data:targetVendor}=await supabase.from('vendors').select('id').eq('owner_id',targetId).maybeSingle(); const targetListingsResult:any=targetVendor?await supabase.from('listings').select('id,title,description,price_ngn,category,area,image_urls,created_at,order_count').eq('vendor_id',targetVendor.id).eq('is_available',true).order('created_at',{ascending:false}).limit(50):{data:[],error:null}; if(targetListingsResult.error)fail(targetListingsResult.error.message); const targetListings=targetListingsResult.data; const orders=(targetListings||[]).reduce((sum:number,l:any)=>sum+Number(l.order_count||0),0);
    return {data:{item:{...profileData,verified_until:undefined,verified_days:undefined,is_verified:!!profileData.is_verified&&(!profileData.verified_until||new Date(profileData.verified_until).getTime()>Date.now()),rating_average:ratingAverage,rating_count:ratingRows.length,my_rating:ratingRows.find((r:any)=>r.rater_id===user.id)?.rating||0,order_count:orders||0,followers_count:followers||0,following_count:following||0,listings:(targetListings||[]).map((l:any)=>({id:l.id,title:l.title,description:l.description,price:l.price_ngn?String(l.price_ngn):'Ask for price',category:l.category,location:l.area||'Calabar, Cross River',image:Array.isArray(l.image_urls)?l.image_urls[0]||'':l.image_urls||''})),posts:(posts||[]).map((p:any)=>({...p,like_count:(postLikes||[]).filter((x:any)=>x.post_id===p.id).length,liked_by_me:(postLikes||[]).some((x:any)=>x.post_id===p.id&&x.user_id===user.id),share_count:(postShares||[]).filter((x:any)=>x.post_id===p.id).length,shared_by_me:(postShares||[]).some((x:any)=>x.post_id===p.id&&x.user_id===user.id)}))},is_following:!!follow}};
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
    const {data,error}=await supabase.from('community_posts').select('*').order('pinned_at',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false}).limit(80);
    const rows=ensure(data,error);const ids=rows.map((p:any)=>p.author_id);const postIds=rows.map((p:any)=>p.id);
    const [{data:profiles,error:pe},{data:likes,error:le},{data:shares,error:se},{data:comments,error:ce},{data:{user:viewer}}]=await Promise.all([
      ids.length?supabase.from('profiles').select('id,display_name,username,avatar_url,is_verified,verified_until').in('id',[...new Set(ids)]):Promise.resolve({data:[],error:null}),
      postIds.length?supabase.from('community_post_reactions').select('post_id,user_id').in('post_id',postIds):Promise.resolve({data:[],error:null}),
      postIds.length?supabase.from('community_post_shares').select('post_id,user_id').in('post_id',postIds):Promise.resolve({data:[],error:null}),
      postIds.length?supabase.from('community_comments').select('post_id').in('post_id',postIds):Promise.resolve({data:[],error:null}),
      supabase.auth.getUser()
    ]);if(pe)fail(pe.message);if(le)fail(le.message);if(se)fail(se.message);if(ce)fail(ce.message);
    const pm=new Map((profiles||[]).map((p:any)=>[p.id,p]));
    return {data:{items:rows.map((p:any)=>{const a:any=pm.get(p.author_id)||{};return {id:p.id,text:p.text,image_url:p.image_url||null,author:a.display_name||a.username||'Calabar Member',author_id:p.author_id,is_verified:!!a.is_verified&&(!a.verified_until||new Date(a.verified_until).getTime()>Date.now()),avatar_url:a.avatar_url||null,category:p.category,created_at:p.created_at,like_count:(likes||[]).filter((x:any)=>x.post_id===p.id).length,liked_by_me:!!viewer&&(likes||[]).some((x:any)=>x.post_id===p.id&&x.user_id===viewer.id),share_count:(shares||[]).filter((x:any)=>x.post_id===p.id).length,shared_by_me:!!viewer&&(shares||[]).some((x:any)=>x.post_id===p.id&&x.user_id===viewer.id),comment_count:0,view_count:Number(p.view_count||0),pinned_at:p.pinned_at||null}})}};
  }
  const user=await currentUser();
  if (path === '/api/admin/support-threads') {
    if ((user.email||'').toLowerCase() !== 'princewillobongha@gmail.com') fail('Admin access required.');
    const {data,error}=await supabase.from('admin_support_messages').select('id,user_id,sender_id,sender_role,message,created_at').order('created_at',{ascending:false}).limit(1000);
    const rows=ensure(data,error);
    const latestByUser=new Map<string,any>();
    for(const row of rows){if(!latestByUser.has(row.user_id))latestByUser.set(row.user_id,row);}
    const ids=[...latestByUser.keys()];
    const {data:profiles,error:profileError}=ids.length?await supabase.from('profiles').select('id,username,display_name,avatar_url').in('id',ids):{data:[],error:null};
    if(profileError)fail(profileError.message);
    const pm=new Map((profiles||[]).map((p:any)=>[p.id,p]));
    return {data:{items:[...latestByUser.entries()].map(([userId,last]:any)=>({user_id:userId,last_message:last,profile:pm.get(userId)||{},waiting_for_admin:last.sender_role==='member'})).sort((a:any,b:any)=>Date.parse(b.last_message.created_at)-Date.parse(a.last_message.created_at))}};
  }
  if (path === '/api/admin/support-messages/' || path.startsWith('/api/admin/support-messages/')) {
    if ((user.email||'').toLowerCase() !== 'princewillobongha@gmail.com') fail('Admin access required.');
    const targetId=path.slice('/api/admin/support-messages/'.length).split('?')[0];
    if(!targetId)fail('Choose a member conversation.');
    const {data,error}=await supabase.from('admin_support_messages').select('*').eq('user_id',targetId).order('created_at',{ascending:true}).limit(300);
    return {data:{items:ensure(data,error)}};
  }
  if (path === '/api/support/messages') {
    const {data,error}=await supabase.from('admin_support_messages').select('*').eq('user_id',user.id).order('created_at',{ascending:true}).limit(300);
    const items=ensure(data,error);
    return {data:{items,can_reply:items.length>0&&items[items.length-1].sender_role==='admin'}};
  }
  if (path === '/api/friends') {
    const {data,error}=await supabase.from('friend_requests').select('*, sender:profiles!friend_requests_sender_id_fkey(display_name,username), receiver:profiles!friend_requests_receiver_id_fkey(display_name,username)').or('sender_id.eq.'+user.id+',receiver_id.eq.'+user.id).order('created_at',{ascending:false});
    return {data:{items:ensure(data,error).map((x:any)=>({id:x.id,from_id:x.sender_id,to_id:x.receiver_id,from_name:x.sender?.display_name||x.sender?.username||'Member',to_name:x.receiver?.display_name||x.receiver?.username||'Member',status:x.status,created_at:x.created_at}))}};
  }
  if (path === '/api/notifications') {
    const {data,error}=await supabase.from('notifications').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(150);
    const rows=ensure(data,error);
    const actorIds=[...new Set(rows.filter((n:any)=>n.actor_id).map((n:any)=>n.actor_id))];
    const {data:actors,error:actorError}=actorIds.length?await supabase.from('profiles').select('id,display_name,username').in('id',actorIds):{data:[],error:null};
    if(actorError) fail(actorError.message);
    const actorMap=new Map((actors||[]).map((p:any)=>[p.id,p]));
    const normalized=rows.map((n:any)=>{
      const isFollow=['follow','new_follower'].includes(String(n.kind||'')) || /follower/i.test(String(n.title||''));
      if(!isFollow) return {...n,read:!!n.read_at};
      const actor:any=actorMap.get(n.actor_id);
      const name=actor?.display_name||actor?.username||'A member';
      return {...n,kind:'new_follower',title:'You have a new follower',body:name+' started following you.',target_url:n.actor_id?'profile://'+n.actor_id:n.target_url,read:!!n.read_at};
    });
    const deduped:any[]=[];
    for(const n of normalized){
      if(n.kind==='new_follower'){
        const time=Date.parse(n.created_at||'');
        const duplicate=deduped.some((x:any)=>x.kind==='new_follower'&&x.actor_id===n.actor_id&&Math.abs(time-Date.parse(x.created_at||''))<=30000);
        if(duplicate) continue;
      }
      deduped.push(n);
    }
    return {data:{items:deduped.slice(0,100)}};
  }
  if (path === '/api/admin/profiles') {
    if ((user.email||'').toLowerCase() !== 'princewillobongha@gmail.com') fail('Admin access required.');
    const {data,error}=await supabase.from('profiles').select('id,username,display_name,avatar_url,is_verified,verified_until,verified_days').order('created_at',{ascending:false}).limit(500);
    return {data:{items:ensure(data,error).map((p:any)=>({...p,is_verified:!!p.is_verified&&(!p.verified_until||new Date(p.verified_until).getTime()>Date.now())}))}};
  }
  if (path === '/api/restrictions/mine') {
    const {data,error}=await supabase.from('member_restrictions').select('id,restriction_type,reason,expires_at,created_at').eq('user_id',user.id).is('deleted_at',null);
    const rows=ensure(data,error);
    return {data:{items:rows.filter((r:any)=>!r.expires_at||new Date(r.expires_at).getTime()>Date.now())}};
  }
  if (path.startsWith('/api/admin/restrictions')) {
    if ((user.email||'').toLowerCase() !== 'princewillobongha@gmail.com') fail('Admin access required.');
    const userId = new URLSearchParams(path.split('?')[1] || '').get('user_id');
    let query = supabase.from('member_restrictions').select('*').is('deleted_at', null).order('created_at', {ascending:false});
    if (userId) query = query.eq('user_id', userId);
    const {data,error}=await query.limit(300);
    const rows=ensure(data,error);
    return {data:{items:rows.filter((r:any)=>!r.expires_at||new Date(r.expires_at).getTime()>Date.now())}};
  }
  if (path === '/api/admin/reports') {
    if ((user.email||'').toLowerCase() !== 'princewillobongha@gmail.com') fail('Admin access required.');
    const {data,error}=await supabase.from('moderation_reports').select('*').is('deleted_at',null).order('created_at',{ascending:false}).limit(300);
    const rows=ensure(data,error);
    const reporterIds=[...new Set(rows.map((x:any)=>x.reporter_id).filter(Boolean))];
    const profileTargetIds=rows.filter((x:any)=>x.target_type==='profile').map((x:any)=>x.target_id).filter(Boolean);
    const communityIds=rows.filter((x:any)=>x.target_type==='community_post').map((x:any)=>x.target_id).filter(Boolean);
    const groupIds=rows.filter((x:any)=>x.target_type==='group_post').map((x:any)=>x.target_id).filter(Boolean);
    const listingIds=rows.filter((x:any)=>x.target_type==='marketplace_listing').map((x:any)=>x.target_id).filter(Boolean);
    const [reporters,profileTargets,communityTargets,groupTargets,listingTargets]=await Promise.all([
      reporterIds.length?supabase.from('profiles').select('id,username,display_name,avatar_url').in('id',reporterIds):Promise.resolve({data:[],error:null}),
      profileTargetIds.length?supabase.from('profiles').select('id,username,display_name,avatar_url').in('id',profileTargetIds):Promise.resolve({data:[],error:null}),
      communityIds.length?supabase.from('community_posts').select('id,author_id,text').in('id',communityIds):Promise.resolve({data:[],error:null}),
      groupIds.length?supabase.from('community_group_posts').select('id,author_id,text,group_id,group:community_groups(name)').in('id',groupIds):Promise.resolve({data:[],error:null}),
      listingIds.length?supabase.from('listings').select('id,title,description,vendor:vendors(owner_id,business_name)').in('id',listingIds):Promise.resolve({data:[],error:null})
    ]);
    for(const q of [reporters,profileTargets,communityTargets,groupTargets,listingTargets]) if(q.error) fail(q.error.message);
    const contentRows=[...(communityTargets.data||[]),...(groupTargets.data||[])];
    const listingRows=listingTargets.data||[];
    const targetProfileIds=[...new Set([...contentRows.map((x:any)=>x.author_id),...listingRows.map((x:any)=>x.vendor?.owner_id)].filter(Boolean))];
    const {data:targetProfiles,error:targetProfileError}=targetProfileIds.length?await supabase.from('profiles').select('id,username,display_name,avatar_url').in('id',targetProfileIds):{data:[],error:null};
    if(targetProfileError)fail(targetProfileError.message);
    const pm=new Map((reporters.data||[]).map((p:any)=>[p.id,p]));
    const tpm=new Map([...(profileTargets.data||[]),...(targetProfiles||[])].map((p:any)=>[p.id,p]));
    const cm=new Map((communityTargets.data||[]).map((p:any)=>[p.id,p]));
    const gm=new Map((groupTargets.data||[]).map((p:any)=>[p.id,p]));
    const lm=new Map(listingRows.map((p:any)=>[p.id,p]));
    return {data:{items:rows.map((x:any)=>{
      let target:any=null, reportedUserId:string|null=null, targetTitle='';
      if(x.target_type==='profile'){reportedUserId=x.target_id;target=tpm.get(x.target_id)||null;targetTitle='Member profile';}
      else if(x.target_type==='community_post'){target=cm.get(x.target_id)||null;reportedUserId=target?.author_id||null;targetTitle='Community post';}
      else if(x.target_type==='group_post'){target=gm.get(x.target_id)||null;reportedUserId=target?.author_id||null;targetTitle='Group post'+(target?.group?.name?' · '+target.group.name:'');}
      else if(x.target_type==='marketplace_listing'){target=lm.get(x.target_id)||null;reportedUserId=target?.vendor?.owner_id||null;targetTitle=target?.title||'Marketplace listing';}
      const reportedUser=reportedUserId?tpm.get(reportedUserId)||null:null;
      return {...x,reporter:pm.get(x.reporter_id)||null,reporter_name:(pm.get(x.reporter_id) as any)?.display_name||(pm.get(x.reporter_id) as any)?.username||'Unknown member',reported_user_id:reportedUserId,reported_user:reportedUser,reported_user_name:reportedUser?.display_name||reportedUser?.username||target?.vendor?.business_name||'Unknown member',target_title:targetTitle,target_content:target?.text||target?.description||''};
    })}};
  }
  const reportMessages=path.match(/^\/api\/reports\/([^/]+)\/messages$/);
  if(reportMessages){const rid=reportMessages[1];const {data:rep,error:re}=await supabase.from('moderation_reports').select('id,reporter_id').eq('id',rid).single();if(re)fail(re.message);if(rep.reporter_id!==user.id&&(user.email||'').toLowerCase()!=='princewillobongha@gmail.com')fail('You cannot access this report conversation.');const {data,error}=await supabase.from('report_messages').select('*').eq('report_id',rid).order('created_at',{ascending:true});return {data:{items:ensure(data,error)}};}
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
  const adminEmail=(user.email||'').toLowerCase()==='princewillobongha@gmail.com';
  const adminSupportMatch=path.match(/^\/api\/admin\/support-messages\/([^/]+)$/);
  if(adminSupportMatch){
    if(!adminEmail)fail('Admin access required.');
    const targetId=adminSupportMatch[1];
    const message=String(body.message||'').trim();
    if(!message)fail('Write a message before sending.');
    if(message.length>4000)fail('Messages must be 4,000 characters or fewer.');
    const {data,error}=await supabase.from('admin_support_messages').insert({user_id:targetId,sender_id:user.id,sender_role:'admin',message}).select('*').single();
    const item=ensure(data,error);
    // The database trigger creates the member notification in the same transaction.
    return {data:{item,notificationSent:true}};
  }
  if(path==='/api/support/messages'){
    if(adminEmail)fail('Use the admin dashboard to reply to members.');
    const message=String(body.message||'').trim();
    if(!message)fail('Write a message before sending.');
    if(message.length>4000)fail('Messages must be 4,000 characters or fewer.');
    const {data,error}=await supabase.from('admin_support_messages').insert({user_id:user.id,sender_id:user.id,sender_role:'member',message}).select('*').single();
    const item=ensure(data,error);
    return {data:{item,confirmation:'Your message has been sent. A Calabar Connect City admin will be with you shortly.'}};
  }
  // Permanently delete a moderation report. This route is admin-only and
  // deliberately uses DELETE rather than a soft-delete/restore workflow.
  const reportDelete=path.match(/^\/api\/admin\/reports\/([^/]+)\/delete$/);
  if(reportDelete){
    if(!adminEmail) fail('Admin access required.');
    const {data,error}=await supabase.from('moderation_reports').delete().eq('id',reportDelete[1]).select('id').maybeSingle();
    if(error) fail(error.message);
    if(!data) fail('This report was not found or has already been permanently deleted.');
    return {data:{ok:true,permanentlyDeleted:true}};
  }
  const activeRestriction=async (restrictionType:string) => {
    if(adminEmail) return null;
    const {data,error}=await supabase.from('member_restrictions').select('restriction_type,reason,expires_at').eq('user_id',user.id).is('deleted_at',null);
    if(error) fail(error.message);
    const match=(data||[]).find((r:any)=>(!r.expires_at||new Date(r.expires_at).getTime()>Date.now())&&(r.restriction_type==='all'||r.restriction_type===restrictionType));
    if(!match)return null;
    const expiry=match.expires_at?' Access returns on '+new Date(match.expires_at).toLocaleString()+'.':' This restriction has no expiry date.';
    fail('Posting restricted: '+match.reason+'.'+expiry+' If you think this is a mistake, contact the Calabar Connect City admin.');
  };
  if(path.startsWith('/api/admin/restrictions/')&&path.endsWith('/remove')){
    if(!adminEmail)fail('Admin access required.');
    const id=path.split('/')[4];
    const {error}=await supabase.from('member_restrictions').update({deleted_at:new Date().toISOString(),deleted_by:user.id}).eq('id',id).is('deleted_at',null);
    if(error)fail(error.message);
    return {data:{ok:true}};
  }
  if(path==='/api/admin/restrictions'){
    if(!adminEmail)fail('Admin access required.');
    const restrictionType=String(body.restriction_type||'');
    const targetUser=String(body.user_id||'');
    const reason=String(body.reason||'').trim().slice(0,1000);
    if(!targetUser||!['community','groups','marketplace','all'].includes(restrictionType))fail('Choose a member and a valid restriction.');
    if(!reason)fail('Add a reason so the member understands the restriction.');
    const {data:existing,error:existingError}=await supabase.from('member_restrictions').select('id,expires_at').eq('user_id',targetUser).eq('restriction_type',restrictionType).is('deleted_at',null);
    if(existingError)fail(existingError.message);
    if((existing||[]).some((r:any)=>!r.expires_at||new Date(r.expires_at).getTime()>Date.now()))fail('This restriction is already active for this member.');
    const rawDays=body.days===null||body.permanent===true?null:Number(body.days);
    if(rawDays!==null&&(!Number.isInteger(rawDays)||rawDays<1||rawDays>3650))fail('Choose a duration between 1 and 3650 days, or permanent.');
    const expiresAt=rawDays===null?null:new Date(Date.now()+rawDays*86400000).toISOString();
    const {data,error}=await supabase.from('member_restrictions').insert({user_id:targetUser,restriction_type:restrictionType,reason,expires_at:expiresAt,created_by:user.id}).select('*').single();
    const restriction=ensure(data,error);
    const expiryText=expiresAt?' until '+new Date(expiresAt).toLocaleString():' permanently';
    const kindLabel=({community:'community posting',groups:'group posting',marketplace:'marketplace listings',all:'all posting'} as Record<string,string>)[restrictionType];
    const {error:noticeError}=await supabase.from('notifications').insert({user_id:targetUser,actor_id:user.id,kind:'account_restriction',title:'Posting restriction applied',body:'Your '+kindLabel+' has been restricted'+expiryText+'. Reason: '+reason,target_url:'profile://'+targetUser});
    if(noticeError) fail('Restriction was saved, but the member notification could not be sent: '+noticeError.message);
    return {data:{item:restriction}};
  }
  if(path.startsWith('/api/comments/')) fail('Comments are disabled on Calabar Connect City.');
  if(/^\/api\/posts\/[^/]+\/share$/.test(path)) fail('Resharing is disabled on Calabar Connect City.');
  if(path==='/api/listings'){
    await activeRestriction('marketplace');
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
    const {data,error}=await supabase.from('listings').insert({vendor_id:vendor.id,title:body.title,description:body.description,price_ngn:numeric,image_urls:Array.isArray(body.image_urls)?body.image_urls:(body.image?[body.image]:[]),category:body.category||'Product',available_until:null,availability_note:null}).select('*, vendor:vendors(*)').single();
    const created=ensure(data,error); const {data:ownerProfile}=await supabase.from('profiles').select('id,username,display_name,is_verified,verified_until').eq('id',user.id).maybeSingle();
    return {data:{item:asItem({...created,owner_profile:ownerProfile})}};
  }
  const listingStatusMatch=path.match(/^\/api\/listings\/([^/]+)\/status$/);
  if(listingStatusMatch){
    const status=body.sale_status==='sold'?'sold':'available';
    const {data:listing,error:lookupError}=await supabase.from('listings').select('id,vendor_id,vendor:vendors(owner_id)').eq('id',listingStatusMatch[1]).single();
    if(lookupError)fail(lookupError.message);
    if((listing as any).vendor?.owner_id!==user.id)fail('You can only change the status of your own listing.');
    const {data,error}=await supabase.from('listings').update({sale_status:status,updated_at:new Date().toISOString()}).eq('id',listingStatusMatch[1]).select('id,sale_status').single();
    return {data:{item:ensure(data,error)}};
  }
  const removeReportedContent=path.match(/^\/api\/admin\/reports\/([^/]+)\/remove-content$/);
  if(removeReportedContent){
    if((user.email||'').toLowerCase()!=='princewillobongha@gmail.com')fail('Admin access required.');
    const {data:report,error:reportError}=await supabase.from('moderation_reports').select('id,target_type,target_id').eq('id',removeReportedContent[1]).single();
    if(reportError)fail(reportError.message);
    if(!report.target_id)fail('This report has no linked content to remove.');
    let removeError:any=null;
    let removed:any[]|null=null;
    if(report.target_type==='community_post'){const r=await supabase.from('community_posts').delete().eq('id',report.target_id).select('id');removeError=r.error;removed=r.data;}
    else if(report.target_type==='group_post'){const r=await supabase.from('community_group_posts').delete().eq('id',report.target_id).select('id');removeError=r.error;removed=r.data;}
    else if(report.target_type==='marketplace_listing'){const r=await supabase.from('listings').delete().eq('id',report.target_id).select('id');removeError=r.error;removed=r.data;}
    else fail('This report type cannot be removed automatically. Review the profile report manually.');
    if(removeError)fail(removeError.message);
    if(!removed?.length)fail('No reported content was removed. It may already be deleted or access was blocked.');
    const {error:deleteReportError}=await supabase.from('moderation_reports').delete().eq('id',report.id);
    if(deleteReportError)fail('Content was removed, but the report could not be permanently deleted: '+deleteReportError.message);
    return {data:{ok:true,reportDeleted:true}};
  }
  const reportDeleteMatch=path.match(/^\/api\/admin\/reports\/([^/]+)\/delete$/);
  if(reportDeleteMatch){
    if((user.email||'').toLowerCase()!=='princewillobongha@gmail.com')fail('Admin access required.');
    const {data,error}=await supabase.from('moderation_reports').delete().eq('id',reportDeleteMatch[1]).select('id').maybeSingle();
    if(error)fail(error.message);
    if(!data)fail('Report not found or already permanently deleted.');
    return {data:{ok:true}};
  }
  const reportResolveMatch=path.match(/^\/api\/admin\/reports\/([^/]+)\/resolve$/);
  if(reportResolveMatch){
    if((user.email||'').toLowerCase()!=='princewillobongha@gmail.com') fail('Admin access required.');
    const {data,error}=await supabase.from('moderation_reports').update({status:'resolved',reviewed_at:new Date().toISOString()}).eq('id',reportResolveMatch[1]).select('*').single();
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
    await activeRestriction('groups');
    const text=String(body.text||'').trim();if(!text)fail('Write something before posting in the group.');
    const names=[...String(text).matchAll(/@([a-zA-Z0-9_.-]+)/g)].map((m:any)=>m[1].toLowerCase());let mentioned_user_ids:string[]=[];if(names.length){const {data:tagged,error:te}=await supabase.from('profiles').select('id,username').in('username',names);if(te)fail(te.message);mentioned_user_ids=(tagged||[]).filter((p:any)=>p.id!==user.id).map((p:any)=>p.id);}
    const {data,error}=await supabase.from('community_group_posts').insert({group_id:groupPostMatch[1],author_id:user.id,text,image_url:body.image_url||null,mentioned_user_ids}).select('*').single();
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
  const pinPost=path.match(/^\/api\/posts\/([^/]+)\/pin$/);
  if(pinPost){if((user.email||'').toLowerCase()!=='princewillobongha@gmail.com')fail('Admin access required.');const {data:p,error:pe}=await supabase.from('community_posts').select('id,pinned_at').eq('id',pinPost[1]).single();if(pe)fail(pe.message);const pinned_at=p.pinned_at?null:new Date().toISOString();const {error}=await supabase.from('community_posts').update({pinned_at}).eq('id',p.id);if(error)fail(error.message);return {data:{pinned:!!pinned_at}};}
  const pinGroup=path.match(/^\/api\/groups\/([^/]+)\/posts\/([^/]+)\/pin$/);
  if(pinGroup){if((user.email||'').toLowerCase()!=='princewillobongha@gmail.com')fail('Admin access required.');const {data:p,error:pe}=await supabase.from('community_group_posts').select('id,pinned_at').eq('id',pinGroup[2]).eq('group_id',pinGroup[1]).single();if(pe)fail(pe.message);const pinned_at=p.pinned_at?null:new Date().toISOString();const {error}=await supabase.from('community_group_posts').update({pinned_at}).eq('id',p.id);if(error)fail(error.message);return {data:{pinned:!!pinned_at}};}
  if(path.startsWith('/api/comments/')){
    const postId=path.split('/')[3];
    const {data:post,error:postError}=await supabase.from('community_posts').select('author_id').eq('id',postId).maybeSingle();
    if(postError) fail(postError.message);
    const {data,error}=await supabase.from('community_comments').insert({post_id:postId,author_id:user.id,text:String(body.text||'').trim(),image_url:body.image_url||null}).select('*, author_profile:profiles!community_comments_author_id_fkey(username,display_name,avatar_url,is_verified)').single();
    const comment=ensure(data,error);
    if(post?.author_id && post.author_id!==user.id){
      await supabase.from('notifications').insert({user_id:post.author_id,actor_id:user.id,kind:'post_comment',title:'New comment on your post',body:profileName(user)+' commented on your community post.',target_url:'post://'+postId});
    }
    return {data:{item:comment}};
  }
  const reactionMatch=path.match(/^\/api\/posts\/([^/]+)\/like$/);
  if(reactionMatch){
    const postId=reactionMatch[1];
    const {data:existing,error:ee}=await supabase.from('community_post_reactions').select('*').eq('post_id',postId).eq('user_id',user.id).maybeSingle();
    if(ee) fail(ee.message);
    if(existing){const {error}=await supabase.from('community_post_reactions').delete().eq('post_id',postId).eq('user_id',user.id);if(error)fail(error.message);return {data:{liked:false}};}
    const {error}=await supabase.from('community_post_reactions').insert({post_id:postId,user_id:user.id});if(error)fail(error.message);
    const {data:post}=await supabase.from('community_posts').select('author_id').eq('id',postId).maybeSingle();
    if(post?.author_id && post.author_id!==user.id){
      const {data:actor}=await supabase.from('profiles').select('display_name,username').eq('id',user.id).maybeSingle();
      const actorName=actor?.display_name||actor?.username||profileName(user);
      await supabase.from('notifications').insert({user_id:post.author_id,actor_id:user.id,kind:'post_like',title:'New like on your post',body:actorName+' liked your community post.',target_url:'post://'+postId});
    }
    return {data:{liked:true}};
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
    await activeRestriction('community');
    const textValue=String(body.text||''),names=[...textValue.matchAll(/@([a-zA-Z0-9_.-]+)/g)].map((m:any)=>m[1].toLowerCase());let mentioned_user_ids:string[]=[];if(names.length){const {data:tagged,error:te}=await supabase.from('profiles').select('id,username').in('username',names);if(te)fail(te.message);mentioned_user_ids=(tagged||[]).filter((p:any)=>p.id!==user.id).map((p:any)=>p.id);}
    const {data,error}=await supabase.from('community_posts').insert({author_id:user.id,text:textValue,image_url:body.image_url||null,category:body.category||'Community',mentioned_user_ids}).select('*, author_profile:profiles!community_posts_author_id_fkey(display_name,username,avatar_url,is_verified)').single();
    const p=ensure(data,error);return {data:{item:{id:p.id,text:p.text,image_url:p.image_url||null,author:p.author_profile?.display_name||profileName(user),author_id:p.author_id,avatar_url:p.author_profile?.avatar_url||null,is_verified:!!p.author_profile?.is_verified,category:p.category,created_at:p.created_at}}};
  }
  if(path.startsWith('/api/groups/')&&path.endsWith('/join')){
    const id=path.split('/')[3];
    const {data:existing,error:lookupError}=await supabase.from('group_members').select('group_id,status').eq('group_id',id).eq('user_id',user.id).maybeSingle();
    if(lookupError) fail(lookupError.message);
    if(existing?.status==='active') return {data:{ok:true,alreadyJoined:true}};
    if(existing){const {error}=await supabase.from('group_members').update({status:'active',role:'member'}).eq('group_id',id).eq('user_id',user.id);if(error)fail(error.message);return {data:{ok:true,reactivated:true}};}
    const {error}=await supabase.from('group_members').insert({group_id:id,user_id:user.id,role:'member',status:'active'});
    if(error) fail(error.message);return {data:{ok:true}};
  }
  if(path==='/api/friends/request'){
    const to=String(body.to_id||'').trim(); if(!to||to===user.id) fail('Choose another member.');
    const {data:existing,error:ee}=await supabase.from('friend_requests').select('*').or('and(sender_id.eq.'+user.id+',receiver_id.eq.'+to+'),and(sender_id.eq.'+to+',receiver_id.eq.'+user.id+')').maybeSingle();
    if(ee) fail(ee.message);
    if(existing&&existing.status==='declined'){
      const {data,error}=await supabase.from('friend_requests').update({sender_id:user.id,receiver_id:to,status:'pending',updated_at:new Date().toISOString()}).eq('id',existing.id).select('*').single();
      const req=ensure(data,error);
      await supabase.from('notifications').insert({user_id:to,actor_id:user.id,kind:'friend_request',title:'Connection request',body:'Someone wants to connect with you.'});
      return {data:{item:{id:req.id,from_id:req.sender_id,to_id:req.receiver_id,status:req.status,created_at:req.created_at}}};
    }
    if(existing)return {data:{item:existing}};
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
  const reportResolve=path.match(/^\/api\/admin\/reports\/([^/]+)\/resolve$/);
  if(reportResolve){
    if((user.email||'').toLowerCase()!=='princewillobongha@gmail.com') fail('Admin access required.');
    const {data,error}=await supabase.from('moderation_reports').update({status:'resolved',reviewed_at:new Date().toISOString()}).eq('id',reportResolve[1]).select('*').single();
    return {data:{item:ensure(data,error)}};
  }
  const notification=path.match(/^\/api\/notifications\/([^/]+)\/read$/);
  if(notification){
    const {error}=await supabase.from('notifications').update({read_at:new Date().toISOString()}).eq('id',notification[1]).eq('user_id',user.id);
    if(error) fail(error.message);return {data:{ok:true}};
  }
  const reportReply=path.match(/^\/api\/reports\/([^/]+)\/messages$/);
  if(reportReply){const rid=reportReply[1],admin=(user.email||'').toLowerCase()==='princewillobongha@gmail.com';const {data:rep,error:re}=await supabase.from('moderation_reports').select('id,reporter_id').eq('id',rid).single();if(re)fail(re.message);if(rep.reporter_id!==user.id&&!admin)fail('You cannot reply to this report.');const message=String(body.message||'').trim();if(!message)fail('Write a message first.');const {data,error}=await supabase.from('report_messages').insert({report_id:rid,sender_id:user.id,message}).select('*').single();const item=ensure(data,error);if(admin)await supabase.from('notifications').insert({user_id:rep.reporter_id,actor_id:user.id,kind:'report_reply',title:'The admin replied to your report',body:profileName(user)+' replied to your report.',target_url:'report://'+rid});return {data:{item}};}
  if(path==='/api/reports'){
    const reason=String(body.reason||'').trim();if(!reason)fail('Write a report message first.');
    const {data,error}=await supabase.from('moderation_reports').insert({reporter_id:user.id,target_type:body.target_type||'community_content',target_id:body.target_id||null,reason,details:body.details||'',status:'open'}).select('*').single();
    const report=ensure(data,error);const {error:me}=await supabase.from('report_messages').insert({report_id:report.id,sender_id:user.id,message:reason});if(me)fail(me.message);return {data:{item:report}};
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
    const normalizedEmail=email.trim().toLowerCase();
    let result=await withTimeout(mode==='signup'
      ? supabase.auth.signUp({email:normalizedEmail,password,options:{data:{display_name:'Calabar Member'},emailRedirectTo:authRedirectUrl}})
      : supabase.auth.signInWithPassword({email:normalizedEmail,password}),25000);
    if(result.error) {
      // If signup hit the outbound-email limit, try a password login once. This
      // never bypasses email verification; it only helps an already-active account.
      const rateLimited=mode==='signup'&&/rate limit|too many requests|email rate/i.test(result.error.message||'');
      if(rateLimited) {
        const fallback=await withTimeout(supabase.auth.signInWithPassword({email:normalizedEmail,password}),25000);
        if(!fallback.error&&fallback.data.user&&fallback.data.session) {
          return {user:{userId:fallback.data.user.id,email:fallback.data.user.email,name:profileName(fallback.data.user)},existingAccountSignedIn:true};
        }
      }
      throw result.error;
    }
    if(!result.data.user)throw new Error('Could not complete authentication.');
    if(mode==='signup'&&!result.data.session) return {user:{userId:result.data.user.id,email:result.data.user.email,name:profileName(result.data.user)},confirmationRequired:true};
    return {user:{userId:result.data.user.id,email:result.data.user.email,name:profileName(result.data.user)}};
  },
  async resendConfirmation(email:string){const {error}=await withTimeout(supabase.auth.resend({type:'signup',email:email.trim().toLowerCase(),options:{emailRedirectTo:authRedirectUrl}}),25000);if(error)throw error;},
  async signOut(){const {error}=await supabase.auth.signOut();if(error)throw error;}
};
async function del(path:string){
  const user=await currentUser();
  if(path==='/api/notifications/clear-all'){
    const {data,error}=await supabase.from('notifications').delete().eq('user_id',user.id).select('id');
    if(error) fail(error.message);
    return {data:{ok:true,deleted:data?.length||0}};
  }
  const notificationDelete=path.match(/^\/api\/notifications\/([^/]+)$/);
  if(notificationDelete){
    const {data,error}=await supabase.from('notifications').delete().eq('id',notificationDelete[1]).eq('user_id',user.id).select('id').maybeSingle();
    if(error) fail(error.message);
    if(!data) fail('This notification was not found or has already been deleted.');
    return {data:{ok:true}};
  }
  if(/^\/api\/posts\/[^/]+\/share$/.test(path)) fail('Resharing is disabled on Calabar Connect City.');
  const listingDelete=path.match(/^\/api\/listings\/([^/]+)$/);
  if(listingDelete){const {data:listing,error:lookupError}=await supabase.from('listings').select('id,vendor_id,vendor:vendors(owner_id)').eq('id',listingDelete[1]).single();if(lookupError)fail(lookupError.message);if((user.email||'').toLowerCase()!=='princewillobongha@gmail.com'&&(listing as any).vendor?.owner_id!==user.id)fail('You can only delete your own listing.');const {error}=await supabase.from('listings').delete().eq('id',listingDelete[1]);if(error)fail(error.message);return {data:{ok:true}};}
  const groupDelete=path.match(/^\/api\/groups\/([^/]+)$/);
  if(groupDelete){
    const groupId=groupDelete[1];
    const {data:group,error:groupError}=await supabase.from('community_groups').select('id,owner_id').eq('id',groupId).single();
    if(groupError)fail(groupError.message);
    if(group.owner_id!==user.id)fail('Only the group owner can delete this group.');
    const {data:groupPosts,error:postsError}=await supabase.from('community_group_posts').select('id').eq('group_id',groupId);
    if(postsError)fail(postsError.message);
    // Group-post reactions are removed by the database's ON DELETE CASCADE
    // when the owner deletes the group's posts; do not bypass each user's own-like RLS.
    const {error:deletePostsError}=await supabase.from('community_group_posts').delete().eq('group_id',groupId);
    if(deletePostsError)fail(deletePostsError.message);
    const {error:deleteMembersError}=await supabase.from('group_members').delete().eq('group_id',groupId);
    if(deleteMembersError)fail(deleteMembersError.message);
    const {error:deleteGroupError}=await supabase.from('community_groups').delete().eq('id',groupId).eq('owner_id',user.id);
    if(deleteGroupError)fail(deleteGroupError.message);
    return {data:{ok:true}};
  }
  const groupPostDelete=path.match(/^\/api\/groups\/([^/]+)\/posts\/([^/]+)$/);
  if(groupPostDelete){const admin=(user.email||'').toLowerCase()==='princewillobongha@gmail.com';let q=supabase.from('community_group_posts').delete().eq('id',groupPostDelete[2]).eq('group_id',groupPostDelete[1]);if(!admin)q=q.eq('author_id',user.id);const {error}=await q;if(error)fail(error.message);return {data:{ok:true}};}
  const groupMemberDelete=path.match(/^\/api\/groups\/([^/]+)\/members\/([^/]+)$/);
  if(groupMemberDelete){const {error}=await supabase.from('group_members').delete().eq('group_id',groupMemberDelete[1]).eq('user_id',groupMemberDelete[2]);if(error)fail(error.message);return {data:{ok:true}};}
  const postDelete=path.match(/^\/api\/posts\/([^/]+)$/);
  if(postDelete){const admin=(user.email||'').toLowerCase()==='princewillobongha@gmail.com';let q=supabase.from('community_posts').delete().eq('id',postDelete[1]);if(!admin)q=q.eq('author_id',user.id);const {error}=await q;if(error)fail(error.message);return {data:{ok:true}};}
  const unshare=path.match(/^\/api\/posts\/([^/]+)\/share$/);
  if(unshare){const postId=unshare[1];const {data:share,error:se}=await supabase.from('community_post_shares').select('repost_id').eq('post_id',postId).eq('user_id',user.id).maybeSingle();if(se)fail(se.message);if(!share)return {data:{ok:true,shared:false}};if(share.repost_id){const {error}=await supabase.from('community_posts').delete().eq('id',share.repost_id).eq('author_id',user.id);if(error)fail(error.message);}const {error}=await supabase.from('community_post_shares').delete().eq('post_id',postId).eq('user_id',user.id);if(error)fail(error.message);return {data:{ok:true,shared:false}};}
  fail('Unsupported DELETE route: '+path);
}
export const api = { get, post, delete: del };
