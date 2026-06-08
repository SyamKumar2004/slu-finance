import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize the backend Supabase admin override client directly inside the route file
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, password } = body;

    const fullPhone = `+91${phone.replace(/\D/g, '')}`;

    // Insert directly into user_profiles table schema
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .insert([
        {
          id: crypto.randomUUID(),
          full_name: name.trim(),
          email: email.trim().toLowerCase(),
          phone_number: fullPhone,
          password_hash: password,
          role: 'admin'
        }
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data?.[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// CRITICAL PRODUCTION BUILD CHECK: 
// Do NOT add or export any other custom functions (like executeQuery) below this line!