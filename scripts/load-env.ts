import dotenv from 'dotenv';

const nodeEnv = process.env.NODE_ENV ?? 'development';
const envFiles = [
  `.env.${nodeEnv}.local`,
  nodeEnv === 'test' ? null : '.env.local',
  `.env.${nodeEnv}`,
  '.env',
].filter((file): file is string => file !== null);

dotenv.config({ path: envFiles });
