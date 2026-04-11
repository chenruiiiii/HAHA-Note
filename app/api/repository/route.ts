import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: Request): Promise<any> {
  const client = await clientPromise;
  const db = client.db('repository');
  const collection = db.collection('repository-item');
  const { searchParams } = new URL(request.url);
  const _id = searchParams.get('_id') as string;

  try {
    const objectId = new ObjectId(_id);
    const data = await collection.findOne({ _id: objectId });
    return data;
  } catch (err) {
    return err;
  }
}
