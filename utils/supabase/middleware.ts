import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request:NextRequest){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Middleware should never take public workspace routes down when auth config
  // is missing in a deployment. Configure these values to enable session refresh.
  let response=NextResponse.next({request});
  if(!url||!key)return response;

  const supabase=createServerClient(url,key,{
    cookies:{
      getAll(){return request.cookies.getAll();},
      setAll(cookiesToSet){
        cookiesToSet.forEach(({name,value})=>request.cookies.set(name,value));
        response=NextResponse.next({request});
        cookiesToSet.forEach(({name,value,options})=>response.cookies.set(name,value,options));
      },
    },
  });

  try{
    await supabase.auth.getUser();
  }catch{
    // Workspace routes are intentionally open. A failed auth refresh should not
    // become a middleware 500; callers can still use public/demo routes.
  }
  return response;
}
