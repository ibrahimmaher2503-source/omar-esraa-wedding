import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);
const source = await readFile(new URL('../migrations/001-responses.sql', import.meta.url), 'utf8');
for (const statement of source.split(';').map(s => s.trim()).filter(Boolean)) await sql.query(statement, []);
console.log('Wedding database schema ready.');
