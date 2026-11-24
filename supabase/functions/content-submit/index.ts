import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
};
function respond(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});}
function handleOptions(req:Request){return req.method==='OPTIONS'?new Response('ok',{headers:corsHeaders}):null;}
function userClient(req:Request){return createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:req.headers.get('Authorization')??''}},auth:{persistSession:false}});}
async function requireUser(req:Request){const client=userClient(req);const{data:{user},error}=await client.auth.getUser();if(error||!user)throw new Error('Unauthorized');const{data:profile}=await client.from('profiles').select('role').eq('id',user.id).single();if(!profile)throw new Error('Profile not found');return{client,user,role:profile.role as 'student'|'tutor'|'admin'};}


Deno.serve(async(req)=>{const options=handleOptions(req);if(options)return options;if(req.method!=='POST')return respond({error:'Method not allowed'},405);try{const{client,user,role}=await requireUser(req);if(!['tutor','admin'].includes(role))return respond({error:'Only tutors and administrators can submit content.'},403);const body=await req.json();if(!['module','session','model'].includes(body.content_type)||!body.program_id||!body.payload||typeof body.payload!=='object')return respond({error:'content_type, program_id and payload are required.'},400);const{data,error}=await client.from('content_submissions').insert({content_type:body.content_type,program_id:body.program_id,target_id:body.target_id??null,author_id:user.id,status:'submitted',payload:body.payload}).select().single();if(error)throw error;return respond({submission:data},201);}catch(error){const message=error instanceof Error?error.message:'Request failed';return respond({error:message},message==='Unauthorized'?401:400);}});
