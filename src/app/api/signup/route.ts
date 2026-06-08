import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Setup the database connection configuration objects locally inside the context stream
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, password } = body;

    const fullPhone = `+91${phone.replace(/\D/g, '')}`;

    // Direct insert to database bypassing client row level security blocks
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