import mongoose from 'mongoose';

const c = global._m || (global._m = { conn: null, p: null });

export async function connect() {
  if (c.conn) return c.conn;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI সেট করা নেই');
  c.p = c.p || mongoose.connect(process.env.MONGODB_URI);
  try { c.conn = await c.p; } catch (e) { c.p = null; throw e; }
  return c.conn;
}
