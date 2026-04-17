import { Pool } from "pg";

const pools = new Map<string, Pool>();

// This COULD be risky if we ever rotate
function poolKey(credentials: any) {
  return `${credentials.username}@${credentials.host}:${credentials.port}/${credentials.dbname}`;
}

export function getDbPool(credentials: any) {
  const key = poolKey(credentials);

  if (pools.has(key)) return pools.get(key)!;

  const pool = new Pool({
    host: credentials.host,
    port: credentials.port,
    database: credentials.dbname,
    user: credentials.username,
    password: credentials.password,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pools.set(key, pool);
  return pool;
}

export async function queryWithCreds(credentials: any, text: string, params?: any[]) {
  const pool = getDbPool(credentials);
  return pool.query(text, params);
}

// Use in testing or shutdowns
// export async function closeAllPools() {
//   const closes = Array.from(pools.values()).map((p) => p.end());
//   await Promise.allSettled(closes);
//   pools.clear();
// }