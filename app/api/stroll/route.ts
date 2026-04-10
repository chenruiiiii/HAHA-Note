import clientPromise from '@/lib/mongodb';

export const getStrollRecommend = async (page: number, limit: number): Promise<any> => {
  const client = await clientPromise;
  const db = client.db('stroll-recommend'); // 逛逛数据库
  const collection = db.collection('recommend-details'); // 集合
  try {
    const data = collection
      .find({})
      .skip((page - 1) * limit)
      .limit(limit);
    return data;
  } catch (error) {
    return error;
  }
};
