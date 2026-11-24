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


Deno.serve(async(req)=>{const options=handleOptions(req);if(options)return options;if(req.method!=='POST')return respond({error:'Method not allowed'},405);try{const{client,user,role}=await requireUser(req);if(role!=='student')return respond({error:'Only student accounts can enroll.'},403);const{program_id}=await req.json();if(!program_id)return respond({error:'program_id is required.'},400);const{data,error}=await client.from('program_enrollments').insert({student_id:user.id,program_id,status:'active'}).select().single();if(error)throw error;return respond({enrollment:data},201);}catch(error){const message=error instanceof Error?error.message:'Request failed';return respond({error:message},message==='Unauthorized'?401:400);}});
