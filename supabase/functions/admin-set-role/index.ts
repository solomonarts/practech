import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
};
function respond(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});}
function handleOptions(req:Request){return req.method==='OPTIONS'?new Response('ok',{headers:corsHeaders}):null;}
function userClient(req:Request){return createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:req.headers.get('Authorization')??''}},auth:{persistSession:false}});}
function serviceClient(){return createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});}
async function requireUser(req:Request){const client=userClient(req);const{data:{user},error}=await client.auth.getUser();if(error||!user)throw new Error('Unauthorized');const{data:profile}=await client.from('profiles').select('role').eq('id',user.id).single();if(!profile)throw new Error('Profile not found');return{client,user,role:profile.role as 'student'|'tutor'|'admin'};}


Deno.serve(async(req)=>{
  const options=handleOptions(req);
  if(options)return options;
  if(req.method!=='POST')return respond({error:'Method not allowed'},405);
  try{
    const{user,role:callerRole}=await requireUser(req);
    if(callerRole!=='admin')return respond({error:'Administrator role required.'},403);
    const{user_id,role}=await req.json();
    if(!user_id||!['student','tutor','admin'].includes(role))return respond({error:'user_id and a valid role are required.'},400);
    const admin=serviceClient();
    const{data:previous,error:readError}=await admin.from('profiles').select('role').eq('id',user_id).single();
    if(readError)throw readError;
    const{data:profile,error}=await admin.from('profiles').update({role,updated_at:new Date().toISOString()}).eq('id',user_id).select('id,role').single();
    if(error)throw error;
    const{error:auditError}=await admin.from('platform_audit_events').insert({event_type:'profile_role_changed',actor_id:user.id,target_type:'profiles',target_id:user_id,before_data:{role:previous.role},after_data:{role}});
    if(auditError)throw auditError;
    return respond({profile});
  }catch(error){
    const message=error instanceof Error?error.message:'Request failed';
    return respond({error:message},message==='Unauthorized'?401:400);
  }
});
