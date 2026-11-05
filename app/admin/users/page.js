'use client';
import { useEffect, useMemo, useState } from 'react';
import { api, up, ROLES } from '@/lib/client';
import { useMe, useUI } from '@/components/Providers';
import { Badge, Chips, Empty, I, Modal, PageHead, SearchBox, Thumb } from '@/components/ui';
import { t } from '@/lib/i18n';

const F = ({ l, children, className = '' }) => <div className={className}><label className="lbl">{l}</label>{children}</div>;
const blank = { name: '', phone: '', password: '', role: 'buyer', pageNo: '', photo: '' };
const tone = { admin: 'red', seller: 'blue', buyer: 'green' };

export default function Users() {
  const { me, ready } = useMe(); const { toast, ask } = useUI();
  const [list, setList] = useState(null), [f, setF] = useState(blank), [ed, setEd] = useState(null), [open, setOpen] = useState(false), [q, setQ] = useState(''), [role, setRole] = useState(''), [busy, setBusy] = useState(false);
  const load = () => api('/api/users').then(setList).catch(e => { toast(e.message, 'err'); setList([]); });
  useEffect(() => { if (me?.role === 'admin') load(); }, [me]);
  const s = k => e => setF({ ...f, [k]: e.target.value });
  const shown = useMemo(() => (list || []).filter(u => (!role || u.role === role) && (!q.trim() || [u.name, u.phone, u.pageNo].some(x => String(x || '').toLowerCase().includes(q.trim().toLowerCase())))), [list, q, role]);

  const add = async e => { e.preventDefault(); setBusy(true); try { await api('/api/users', 'POST', f); setF(blank); setOpen(false); toast(t("অ্যাকাউন্ট তৈরি হয়েছে")); load(); } catch (x) { toast(x.message, 'err'); } setBusy(false); };
  const save = async () => { setBusy(true); try { await api('/api/users/' + ed._id, 'PATCH', ed); setEd(null); toast(t("সেভ হয়েছে")); load(); } catch (x) { toast(x.message, 'err'); } setBusy(false); };
  const del = async u => {
    if (!(await ask(t("“{0}” কে মুছবেন?", u.name), { danger: true, yes: 'মুছুন' }))) return;
    try { await api('/api/users/' + u._id, 'DELETE'); toast(t("মুছে ফেলা হয়েছে")); load(); }
    catch (x) {
      if (x.status === 409 && (await ask(x.message, { danger: true, yes: 'হিসাবসহ মুছুন' }))) { try { await api('/api/users/' + u._id + '?force=1', 'DELETE'); toast(t("মুছে ফেলা হয়েছে")); load(); } catch (z) { toast(z.message, 'err'); } }
      else if (x.status !== 409) toast(x.message, 'err');
    }
  };
  const pickPhoto = setter => async e => { const file = e.target.files[0]; if (!file) return; try { const url = await up(file); setter(v => ({ ...v, photo: url })); } catch (x) { toast(x.message, 'err'); } };

  if (ready && me?.role !== 'admin') return <div className="card"><Empty icon="lock" title={t("অনুমতি নেই")} hint={t("এই পেজ শুধু অ্যাডমিনের জন্য")} /></div>;
  return (
    <div className="space-y-4">
      <PageHead title={t("ইউজার ম্যানেজমেন্ট")} sub={list && t("মোট {0} জন", list.length)}><button className="btn" onClick={() => setOpen(true)}><I n="plus" c="w-4 h-4" />{t("নতুন অ্যাকাউন্ট")}</button></PageHead>
      <SearchBox value={q} onChange={setQ} placeholder={t("নাম, ফোন বা পেজ নাম্বার…")} />
      <Chips value={role} onChange={setRole} options={[['', t("সবাই")], ['admin', t("অ্যাডমিন")], ['seller', t("বিক্রেতা")], ['buyer', t("ক্রেতা")]]} />
      <div className="card divide-y divide-stone-100 !p-0">
        {shown.map(u => (
          <div key={u._id} className="flex items-center gap-3 p-3.5">
            <Thumb src={u.photo} s={44} round />
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5"><span className="truncate font-semibold">{u.name}</span><Badge tone={tone[u.role]}>{ROLES[u.role]}</Badge></div><div className="muted">{u.phone}{u.pageNo && t(" • পেজ {0}", u.pageNo)}</div></div>
            <button className="btn btn-sm btn-soft" onClick={() => setEd({ ...u, password: '' })}>{t("এডিট")}</button>
            {String(u._id) !== String(me?.id) && <button className="btn btn-sm btn-danger-soft" onClick={() => del(u)} aria-label={t("মুছুন")}><I n="trash" c="w-3.5 h-3.5" /></button>}
          </div>))}
        {list === null && <div className="skel m-4 h-24" />}
        {list && !shown.length && <Empty icon="users" title={t("কেউ নেই")} />}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t("নতুন অ্যাকাউন্ট তৈরি")}>
        <form onSubmit={add} className="space-y-3">
          <F l={t("নাম *")}><input className="inp" value={f.name} onChange={s('name')} required /></F>
          <F l={t("ফোন *")}><input className="inp" inputMode="tel" placeholder="01XXXXXXXXX" value={f.phone} onChange={s('phone')} required /></F>
          <F l={t("পাসওয়ার্ড (ঠিক ৬ অক্ষর) *")}><input className="inp" maxLength={6} value={f.password} onChange={s('password')} required /></F>
          <F l={t("ধরন")}><select className="inp" value={f.role} onChange={s('role')}><option value="buyer">{t("ক্রেতা")}</option><option value="seller">{t("বিক্রেতা")}</option><option value="admin">{t("অ্যাডমিন")}</option></select></F>
          {f.role === 'buyer' && <F l={t("খাতার পেজ নাম্বার")}><input className="inp" value={f.pageNo} onChange={s('pageNo')} /></F>}
          <F l={t("ছবি")}><input type="file" accept="image/*" onChange={pickPhoto(setF)} />{f.photo && <img src={f.photo} alt="" className="mt-2 h-14 w-14 rounded-full object-cover" />}</F>
          <button className="btn w-full" disabled={busy}>{t("তৈরি করুন")}</button>
        </form>
      </Modal>

      <Modal open={!!ed} onClose={() => setEd(null)} title={t("অ্যাকাউন্ট এডিট")}>
        {ed && <div className="space-y-3">
          <F l={t("নাম")}><input className="inp" value={ed.name || ''} onChange={e => setEd({ ...ed, name: e.target.value })} /></F>
          <F l={t("ফোন")}><input className="inp" value={ed.phone || ''} onChange={e => setEd({ ...ed, phone: e.target.value })} /></F>
          <F l={t("ধরন")}><select className="inp" value={ed.role} disabled={String(ed._id) === String(me?.id)} onChange={e => setEd({ ...ed, role: e.target.value })}><option value="buyer">{t("ক্রেতা")}</option><option value="seller">{t("বিক্রেতা")}</option><option value="admin">{t("অ্যাডমিন")}</option></select></F>
          <F l={t("পেজ নাম্বার")}><input className="inp" value={ed.pageNo || ''} onChange={e => setEd({ ...ed, pageNo: e.target.value })} /></F>
          <F l={t("নতুন পাসওয়ার্ড (বদলাতে চাইলে, ৬ অক্ষর)")}><input className="inp" maxLength={6} placeholder={t("খালি রাখলে আগেরটাই থাকবে")} value={ed.password} onChange={e => setEd({ ...ed, password: e.target.value })} /></F>
          <button className="btn w-full" disabled={busy} onClick={save}>{t("সেভ করুন")}</button>
        </div>}
      </Modal>
    </div>
  );
}
