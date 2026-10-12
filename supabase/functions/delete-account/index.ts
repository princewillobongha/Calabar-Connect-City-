import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return new Response(JSON.stringify({error:"POST required"}),{status:405,headers:{...cors,"Content-Type":"application/json"}});
 const url=Deno.env.get("SUPABASE_URL")!,serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),anonKey=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
 if(!serviceKey||!anonKey)return new Response(JSON.stringify({error:"Account deletion is not configured."}),{status:500,headers:{...cors,"Content-Type":"application/json"}});
 const authHeader=req.headers.get("Authorization");if(!authHeader?.startsWith("Bearer "))return new Response(JSON.stringify({error:"Please sign in again."}),{status:401,headers:{...cors,"Content-Type":"application/json"}});
 const userClient=createClient(url,anonKey,{global:{headers:{Authorization:authHeader}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:userError}=await userClient.auth.getUser();if(userError||!user)return new Response(JSON.stringify({error:"Your session expired. Sign in and try again."}),{status:401,headers:{...cors,"Content-Type":"application/json"}});
 const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}}),uid=user.id;
 const cleanup=async(table:string,column:string,value:string)=>{const {error}=await admin.from(table).delete().eq(column,value);if(error&&!/does not exist|schema cache/i.test(error.message))throw error;};
 try{
  await cleanup("community_follows","follower_id",uid);await cleanup("community_follows","followed_id",uid);
  await cleanup("community_post_reactions","user_id",uid);await cleanup("community_post_shares","user_id",uid);await cleanup("community_group_post_reactions","user_id",uid);
  await cleanup("community_comments","author_id",uid);await cleanup("community_posts","author_id",uid);await cleanup("community_group_posts","author_id",uid);
  await cleanup("group_members","user_id",uid);await cleanup("vendor_enquiries","customer_id",uid);
  await cleanup("profile_ratings","rater_id",uid);await cleanup("profile_ratings","profile_id",uid);
  await cleanup("notifications","user_id",uid);await cleanup("notifications","actor_id",uid);await cleanup("report_messages","sender_id",uid);await cleanup("moderation_reports","reporter_id",uid);
  const {data:vendors,error:ve}=await admin.from("vendors").select("id").eq("owner_id",uid);if(ve)throw ve;
  for(const v of vendors||[]){await cleanup("vendor_enquiries","vendor_id",v.id);await cleanup("listings","vendor_id",v.id);}
  await cleanup("vendors","owner_id",uid);
  const {data:groups,error:ge}=await admin.from("community_groups").select("id").eq("owner_id",uid);if(ge)throw ge;
  for(const g of groups||[]){await cleanup("community_group_posts","group_id",g.id);await cleanup("group_members","group_id",g.id);await cleanup("community_groups","id",g.id);}
  const {error}=await admin.auth.admin.deleteUser(uid);if(error)throw error;
  return new Response(JSON.stringify({ok:true}),{status:200,headers:{...cors,"Content-Type":"application/json"}});
 }catch(e){console.error("Account deletion failed",e);return new Response(JSON.stringify({error:"Account deletion did not complete. Please contact support before retrying."}),{status:500,headers:{...cors,"Content-Type":"application/json"}});}
});