import mongoose from 'mongoose';
const { Schema, models, model } = mongoose;
const O = Schema.Types.ObjectId;

// dev সার্ভারে পুরনো স্কিমা ক্যাশ থেকে গেলে নতুন ফিল্ড সেভ হয় না — তাই dev এ প্রতিবার নতুন স্কিমা বসানো হয়
const mk = (n, sc) => { if (models[n]) { if (process.env.NODE_ENV === 'production') return models[n]; mongoose.deleteModel(n); } return model(n, sc); };
const allocs = [{ batchId: O, qty: Number }];

export const User = mk('User', new Schema({
  name: String, phone: { type: String, unique: true }, password: String,
  role: { type: String, enum: ['admin', 'seller', 'buyer'], default: 'buyer' },
  pageNo: String, photo: String, address: String, altPhone: String, shopName: String, nid: String,
  creditLimit: Number, guarantorName: String, guarantorPhone: String, note: String,
}, { timestamps: true }));

const ps = new Schema({
  company: String, group: { type: String, default: '' }, name: String,
  srName: String, srPhones: [String], dsrName: String, dsrPhones: [String],
  image: String, category: String, unit: { type: String, default: 'pcs' }, sellPrice: Number,
  minStock: { type: Number, default: 0 }, // এর নিচে নামলে "স্টক কম" সতর্কতা
  tiers: [{ qty: Number, price: Number }], sold: { type: Number, default: 0 },
  batches: [{
    cartons: Number, perCarton: Number, extra: Number, qty: Number, remaining: Number,
    sold: { type: Number, default: 0 }, withdrawn: { type: Number, default: 0 },
    purchaseDate: Date, mfgDate: Date, buyTotal: Number, buyUnit: Number, expiry: Date,
    addedAt: { type: Date, default: Date.now },
  }],
  damages: [{
    batchId: O, qty: Number, cost: Number, kind: String, recovered: Boolean, recoveredAt: Date,
    recoverKind: String, recoverAmount: Number, recoverNote: String, date: Date, reason: String,
    compensation: String, compNote: String,
  }],
  adjustments: [{ qty: Number, date: Date, note: String, createdAt: { type: Date, default: Date.now } }],
}, { timestamps: true });
ps.index({ company: 1, name: 1 });
ps.index({ sold: -1 });
export const Product = mk('Product', ps);

const ss = new Schema({
  buyer: { type: O, ref: 'User' }, seller: O,
  items: [{ product: O, name: String, image: String, qty: Number, unit: String, price: Number, cost: Number, allocs }],
  total: Number, paid: { type: Number, default: 0 }, dueDate: Date, note: String, date: { type: Date, default: Date.now },
});
ss.index({ buyer: 1, date: -1 }); ss.index({ 'items.product': 1 }); ss.index({ date: -1 });
export const Sale = mk('Sale', ss);

const pm = new Schema({ buyer: O, amount: Number, note: String, date: { type: Date, default: Date.now } });
pm.index({ buyer: 1, date: -1 });
export const Payment = mk('Payment', pm);

const wd = new Schema({
  name: String, kind: { type: String, enum: ['cash', 'product'] }, amount: Number,
  product: O, productName: String, qty: Number, unit: String, allocs, note: String, date: { type: Date, default: Date.now },
});
wd.index({ date: -1 });
export const Withdrawal = mk('Withdrawal', wd);

export const Company = mk('Company', new Schema({ name: String, logo: String }));
export const StockLog = mk('StockLog', new Schema({
  product: O, productName: String, company: String, qty: Number, unit: String, note: String,
  date: { type: Date, default: Date.now }, allocs, by: String,
}, { timestamps: true }));
