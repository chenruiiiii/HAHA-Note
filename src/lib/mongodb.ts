// 创建数据库连接单例

import { MongoClient, MongoClientOptions } from 'mongodb';

// Vercel MongoDB Atlas integration typically injects `MONGODB_URI`.
// The project historically also used `APP_MONGODB_MONGODB_URI`, so we accept both.
const url = process.env.MONGODB_URI || process.env.APP_MONGODB_MONGODB_URI || process.env.MONGODB_URL;
const options: MongoClientOptions = {
  appName: 'devrel.vercel.integration',
  maxIdleTimeMS: 5000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!url) {
  throw new Error('MongoDB URI is missing. Set MONGODB_URI or APP_MONGODB_MONGODB_URI.');
}

if (process.env.NODE_ENV === 'development') {
  // 开发环境下: 使用全局变量，防止热重载导致连接爆炸
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(url, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // 生产环境下: 直接创建并导出连接
  client = new MongoClient(url, options);
  clientPromise = client.connect();
}

export default clientPromise;
