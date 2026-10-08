import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Missing MONGODB_URI in .env");

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const clientPromise: Promise<MongoClient> =
  globalThis._mongoClientPromise ??
  (globalThis._mongoClientPromise = new MongoClient(uri).connect());

export default clientPromise;

let indexes: Promise<unknown> | undefined;

/** Creates the indexes the auth flow relies on (once per process). */
export function ensureIndexes() {
  indexes ??= clientPromise
    .then((client) => {
      const db = client.db();
      return Promise.all([
        db.collection("users").createIndex(
          { email: 1 },
          { unique: true, partialFilterExpression: { email: { $type: "string" } } },
        ),
        db
          .collection("email_verifications")
          .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      ]);
    })
    .catch((err) => {
      console.error("[auth] failed to create indexes", err);
    });
  return indexes;
}