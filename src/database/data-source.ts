import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = `env.${nodeEnv}`;
config({ path: join(process.cwd(), envFile) });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'dbuser',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'ai_photo_studio_db',
  entities: [join(__dirname, '**', '*.entity.{js,ts}')],
  synchronize: true, // Enabled for fresh database start - will be disabled when migrations are added
  logging: process.env.NODE_ENV === 'development',
  // ✅ IMPORTANT: Cloud SQL Unix socket does NOT use SSL
  // SSL is handled automatically by Cloud SQL Proxy for Unix socket connections
  ssl: false,
  extra: {
    socketPath: process.env.DB_HOST, // 👈 THIS IS THE FIX
  },
});
