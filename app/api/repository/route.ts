import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

export async function GET(request: Request): Promise<any> {
  const client = await clientPromise;
  const db = client.db('repository');
  const collection = db.collection('repo_list');

  try {
    const data = await collection.find({}).toArray();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(err);
  }
}
