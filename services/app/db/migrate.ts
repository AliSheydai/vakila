import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsDir = path.join(__dirname, 'migrations')

async function ensureMigrationsTable(client: pg.PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id            TEXT PRIMARY KEY,
      applied_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

async function getAppliedIds(client: pg.PoolClient): Promise<Set<string>> {
  const { rows } = await client.query<{ id: string }>(
    'SELECT id FROM schema_migrations'
  )
  return new Set(rows.map((row) => row.id))
}

async function run(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('DATABASE_URL is missing. Set it in the environment or .env file.')
    process.exit(1)
  }

  const pool = new pg.Pool({ connectionString: databaseUrl })
  const client = await pool.connect()

  try {
    console.log('Connecting to database…')
    await ensureMigrationsTable(client)
    console.log('schema_migrations table is ready.')

    const files = (await readdir(migrationsDir))
      .filter((name) => name.endsWith('.sql'))
      .sort()

    if (files.length === 0) {
      console.log('No migration files found. Nothing to do.')
      return
    }

    const applied = await getAppliedIds(client)
    let appliedCount = 0

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`Skip (already applied): ${file}`)
        continue
      }

      const sql = await readFile(path.join(migrationsDir, file), 'utf8')
      console.log(`Applying migration: ${file}`)

      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query(
          'INSERT INTO schema_migrations (id) VALUES ($1)',
          [file]
        )
        await client.query('COMMIT')
        appliedCount += 1
        console.log(`Applied successfully: ${file}`)
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    }

    if (appliedCount === 0) {
      console.log('Database is up to date. No new migrations.')
    } else {
      console.log(`Done. Applied ${appliedCount} migration(s).`)
    }
  } finally {
    client.release()
    await pool.end()
  }
}

run()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Migration failed: ${message}`)
    process.exit(1)
  })
