import { connect } from '@/lib/db';
import { Payment, User } from '@/models';
import { getUser, staff, isAdmin, isId, J, E, H, body } from '@/lib/auth';

export const POST = H(async req => {
  const u = await getUser(); if (!staff(u)) return E('অনুমতি নেই', 403); await connect();
  const b = await body(req);
  if (!(+b.amount > 0)) return E('টাকার পরিমাণ দিন');
  if (!isId(b.buyerId) || !(await User.exists({ _id: b.buyerId, role: 'buyer' }))) return E('ক্রেতা পাওয়া যায়নি');
  await Payment.create({ buyer: b.buyerId, amount: +b.amount, note: String(b.note || '').trim() });
  return J({ ok: 1 });
});

// ভুল পরিশোধ মুছতে (শুধু অ্যাডমিন)
export const DELETE = H(async req => {
  const u = await getUser(); if (!isAdmin(u)) return E('শুধু অ্যাডমিন মুছতে পারবে', 403); await connect();
  const id = new URL(req.url).searchParams.get('id'); if (!isId(id)) return E('পাওয়া যায়নি', 404);
  await Payment.findByIdAndDelete(id); return J({ ok: 1 });
});
