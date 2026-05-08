import mongoose from 'mongoose';

// On Vercel, env vars are injected by the platform – no .env file exists.
// Locally, vite.config.ts loads .env into process.env for us.
// We do NOT import 'dotenv/config' here because it crashes on Vercel
// when the .env file is absent.

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cached;

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not defined. ' +
      'On Vercel: add it in Project Settings → Environment Variables. ' +
      'Locally: add it to your .env file.'
    );
  }

  if (!cached.promise) {
    console.log('[db] Connecting to MongoDB…');
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log('[db] Connected to MongoDB successfully');
    return cached.conn;
  } catch (err) {
    // Reset the promise so next invocation retries
    cached.promise = null;
    console.error('[db] MongoDB connection failed:', err);
    throw err;
  }
}

export default dbConnect;
