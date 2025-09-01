import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// For demo mode, make database optional
let pool: Pool | null = null;
let db: any = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
} else if (process.env.NODE_ENV === 'development') {
  console.warn('⚠️  No DATABASE_URL set - running in demo mode without database');
} else {
  throw new Error(
    "DATABASE_URL must be set for production. Did you forget to provision a database?",
  );
}

export { pool, db };