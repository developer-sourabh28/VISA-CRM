import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

let nativeDb = null;

export const getNativeDb = async () => {
  if (nativeDb) return nativeDb;
  const client = await MongoClient.connect(process.env.MONGO_URI, { useUnifiedTopology: true });
  nativeDb = client.db(); // Use the default db from the URI
  return nativeDb;
}; 