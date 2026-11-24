import { createServerClient } from '@supabase/ssr';
import type { cookies } from 'next/headers';

type CookieStore=Awaited<ReturnType<typeof cookies>>;

function getSupabaseConfig(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key)throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.');
  return{url,key};
}

export function createClient(cookieStore:CookieStore){
  const{url,key}=getSupabaseConfig();
  return createServerClient(url,key,{
    cookies:{
      getAll(){return cookieStore.getAll();},
      setAll(cookiesToSet){
        try{cookiesToSet.forEach(({name,value,options})=>cookieStore.set(name,value,options));}
        catch{/* Server components cannot write cookies; middleware handles token refresh. */}
      },
    },
  });
}
