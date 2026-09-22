import { readFile } from "node:fs/promises";
import { Pool } from "pg";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl)
    throw new Error("DATABASE_URL is required");
const pool = new Pool({ connectionString: databaseUrl });
try {
    const migration = await readFile(new URL("../../../src/database/migrations/001-inbox.sql", import.meta.url), "utf8");
    await pool.query(migration);
    console.log("Database migration applied");
}
finally {
    await pool.end();
}
//# sourceMappingURL=migrate.js.map