import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = `env.${nodeEnv}`;
config({ path: join(process.cwd(), envFile) });

const host = process.env.DB_HOST || 'localhost';
const isCloudSql = host && host.startsWith('/cloudsql/');

// Get database config with explicit fallbacks
const database = process.env.DB_DATABASE || 'dev_db';
const username = process.env.DB_USERNAME || 'dbuser';
const password = process.env.DB_PASSWORD || 'password';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: host,
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: username,
  password: password,
  database: database,
  entities: [join(__dirname, '**', '*.entity.{js,ts}')],
  synchronize: true, // Enabled for fresh database start - will be disabled when migrations are added
  logging: process.env.NODE_ENV === 'development',
  // ✅ IMPORTANT: Cloud SQL Unix socket does NOT use SSL
  // SSL is handled automatically by Cloud SQL Proxy for Unix socket connections
  ssl: false,
  extra: isCloudSql
    ? {
        socketPath: host, // Only for Cloud SQL Unix socket connections
      }
    : {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000,
        evict: 1000,
        handleDisconnects: true,
        statement_timeout: 30000,
      },
});
