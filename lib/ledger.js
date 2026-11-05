// বাকির হিসাব: মোট বিক্রি − নগদ − পরবর্তী পরিশোধ
export const dueOf = (sales, payments) => sales.reduce((s, x) => s + x.total - x.paid, 0) - payments.reduce((s, x) => s + x.amount, 0);

// পরিশোধ পুরনো বাকি থেকে আগে কাটা হয় (FIFO) — এরপরও যে বিক্রির প্রতিশ্রুত তারিখ পেরিয়ে গেছে তার বাকি = মেয়াদোত্তীর্ণ
export function overdue(sales, payments, now = Date.now()) {
  let credit = payments.reduce((s, x) => s + x.amount, 0), amount = 0, since = null;
  for (const s of [...sales].sort((a, b) => new Date(a.date) - new Date(b.date))) {
    let r = s.total - s.paid; if (r <= 0) continue;
    const use = Math.min(r, credit); credit -= use; r -= use;
    if (r > 0 && s.dueDate && new Date(s.dueDate).getTime() + 864e5 <= now) {
      amount += r; if (!since || new Date(s.dueDate) < since) since = new Date(s.dueDate);
    }
  }
  return { amount, since };
}
