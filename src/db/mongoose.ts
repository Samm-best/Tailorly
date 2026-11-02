import mongoose from "mongoose";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const g = globalThis as unknown as { __tailorlyMongoose?: Cache };
const cache: Cache = (g.__tailorlyMongoose ??= { conn: null, promise: null });

/** Reusable connection (survives Next.js hot reloads and warm serverless invocations). */
export async function connectDb(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    const env = getEnv();
    cache.promise = mongoose
      .connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        // In production create indexes deliberately (migration step), not on every boot.
        autoIndex: env.NODE_ENV !== "production",
      })
      .then((m) => {
        logger.info("mongodb connected");
        return m;
      })
      .catch((err) => {
        cache.promise = null; // allow retry on next request
        throw err;
      });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}

export async function pingDb(): Promise<boolean> {
  try {
    const m = await connectDb();
    await m.connection.db?.admin().ping();
    return true;
  } catch {
    return false;
  }
}
