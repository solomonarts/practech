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


const statuses=['technical_review','educational_review','simulation_validation','approved','published','revision_requested','rejected'];
Deno.serve(async(req)=>{const options=handleOptions(req);if(options)return options;if(req.method!=='POST')return respond({error:'Method not allowed'},405);try{const{client,user,role}=await requireUser(req);if(role!=='admin')return respond({error:'Administrator role required.'},403);const body=await req.json();if(!body.submission_id||!statuses.includes(body.decision))return respond({error:'submission_id and a valid decision are required.'},400);const{data:submission,error:readError}=await client.from('content_submissions').select('*').eq('id',body.submission_id).single();if(readError||!submission)throw readError??new Error('Submission not found');const now=new Date().toISOString();const{error:updateError}=await client.from('content_submissions').update({status:body.decision,review_note:String(body.note??''),reviewed_by:user.id,updated_at:now}).eq('id',submission.id);if(updateError)throw updateError;const{error:reviewError}=await client.from('content_reviews').insert({submission_id:submission.id,reviewer_id:user.id,decision:body.decision,note:String(body.note??'')});if(reviewError)throw reviewError;if(['published','rejected','revision_requested'].includes(body.decision)&&submission.target_id){const admin=serviceClient();const table=submission.content_type==='module'?'learning_modules':submission.content_type==='session'?'practical_sessions':'model_assets';const{error:targetError}=await admin.from(table).update({status:body.decision,updated_at:now}).eq('id',submission.target_id);if(targetError)throw targetError;}return respond({ok:true,status:body.decision});}catch(error){const message=error instanceof Error?error.message:'Request failed';return respond({error:message},message==='Unauthorized'?401:400);}});
