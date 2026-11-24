import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '../../../utils/supabase/server';

export async function GET(request:NextRequest){
  const url=request.nextUrl.clone();
  const code=url.searchParams.get('code');
  const requestedNext=url.searchParams.get('next');
  const next=requestedNext?.startsWith('/')&&!requestedNext.startsWith('//')?requestedNext:'/';
  if(code){
    const cookieStore=await cookies();
    const supabase=createClient(cookieStore);
    const{error}=await supabase.auth.exchangeCodeForSession(code);
    if(!error)return NextResponse.redirect(new URL(next,request.url));
  }
  return NextResponse.redirect(new URL('/?error=Email%20confirmation%20failed.%20Request%20a%20new%20confirmation%20email.',request.url));
}
