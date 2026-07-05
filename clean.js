import { MongoClient } from 'mongodb';

async function run() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('movie-finder');
  
  const result = await db.collection('lists').deleteMany({
    title: { $in: ["luv", "luvv", "luvvvvvv", "looveeeeeeeeeeeeeeeeeeeeeeeeeec"] }
  });
  
  console.log(`Deleted ${result.deletedCount} collections.`);
  process.exit(0);
}

run();
