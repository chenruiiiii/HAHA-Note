import clientPromise from '@/lib/mongodb';
import { AdminUser, AdminUserSchema } from '@/models/admin';

const DB_NAME = 'ha_admin';
const COLLECTION_NAME = 'users';

export async function seedAdmins() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<AdminUser>(COLLECTION_NAME);
  const now = new Date().toISOString();

  const admins = AdminUserSchema.array().parse([
    {
      username: 'admin',
      password: 'admin',
      role: 'admin',
      nickname: '超级管理员',
      enabled: true,
      created_at: now,
      updated_at: now,
    },
    {
      username: 'editor',
      password: 'editor123',
      role: 'editor',
      nickname: '内容编辑',
      enabled: true,
      created_at: now,
      updated_at: now,
    },
  ]);

  const ops = admins.map((admin) => ({
    updateOne: {
      filter: { username: admin.username },
      update: { $set: admin },
      upsert: true,
    },
  }));

  const result = await collection.bulkWrite(ops);
  console.log(
    `✅ ${COLLECTION_NAME} 管理员同步成功：插入 ${result.upsertedCount} 条，更新 ${result.modifiedCount} 条`
  );
}
