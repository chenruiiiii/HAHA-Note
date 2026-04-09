// 创建数据库连接单例

import { MongoClient } from 'mongodb';

const url = process.env.APP_MONGODB_MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!url) {
  throw new Error('vercel 控制台集成mongodb 失败');
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
