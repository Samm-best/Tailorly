// Usage: npm run provision:super-admin -- you@example.com
// The person must already have registered (one universal account). Platform roles are a separate collection.
import mongoose from "mongoose";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: npm run provision:super-admin -- <email>");
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set.");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
const user = await mongoose.connection.collection("users").findOne({ email, status: "active" });
if (!user) {
  console.error("No active account with that email. Register first.");
  await mongoose.disconnect();
  process.exit(1);
}
await mongoose.connection.collection("platformroleassignments").updateOne(
  { userId: user._id },
  { $set: { role: "super_admin" }, $setOnInsert: { userId: user._id, createdAt: new Date() } },
  { upsert: true },
);
console.log(`super_admin role granted to ${email}`);
await mongoose.disconnect();
