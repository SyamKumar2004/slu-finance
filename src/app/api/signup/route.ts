import { NextResponse } from 'next/server';
// Make sure you are IMPORTING executeQuery from your db file, NOT redefining and exporting it here!
import { executeQuery } from '@/lib/db'; 

export async function POST(request: Request) {
  try {
    const { name, email, phone, password } = await request.json();

    const queryText = `
      INSERT INTO public.user_profiles (id, full_name, email, phone_number, password_hash, role)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, 'admin')
      RETURNING *;
    `;
    
    const { data, error } = await executeQuery(queryText, [name, email, phone, password]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data?.[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// CRITICAL SAFETY FOR NEXT.JS BUILD ENGINE: 
// Ensure there are NO OTHER line statements starting with "export function..." or "export const..." here!