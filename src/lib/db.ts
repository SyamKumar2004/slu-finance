import { Pool } from 'pg';

// Initialize a master connection pool using your secure connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Ensures secure and reliable connections to Supabase servers
  }
});

export async function executeQuery(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return { data: res.rows, error: null };
  } catch (err: any) {
    console.error("Database Execution Error:", err);
    return { data: null, error: err };
  } finally {
    client.release(); // Instantly frees up the connection handle slot
  }
}