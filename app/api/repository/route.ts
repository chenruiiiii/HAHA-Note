import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const getRepository = async (_id: string): Promise<any> => {
  const client = await clientPromise;
  const db = client.db('repository');
  const collection = db.collection('repository-item');

  try {
    const objectId = new ObjectId(_id);
    const data = await collection.findOne({ _id: objectId });
    return data;
  } catch (err) {
    return err;
  }
};
