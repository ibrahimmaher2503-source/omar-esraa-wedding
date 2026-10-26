import React, { useEffect, useState } from 'react';
import './admin.css';

type Records = { counts: { attending: number; declined: number; wishes: number }; rows: { id: string; name: string; attending: boolean | null; message: string | null; created_at: string }[] };

export function Admin() {
  const [session, setSession] = useState<'checking' | 'login' | 'ready'>('checking');
  const [kind, setKind] = useState('rsvp'), [page, setPage] = useState(1), [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<Records | null>(null), [status, setStatus] = useState(''), [busy, setBusy] = useState(false), [loading, setLoading] = useState(false);
  useEffect(() => { document.title = 'إدارة الدعوة | Omar & Esraa'; }, []);
  useEffect(() => {
    if (session === 'login') return;
    const controller = new AbortController();
    setLoading(true); setStatus(''); setData(null);
    void fetch(`/api/admin?kind=${kind}&page=${page}`, { signal: controller.signal, cache: 'no-store' }).then(async response => {
      if (response.status === 401) { setSession('login'); return; }
      if (!response.ok) throw new Error();
      setData(await response.json()); setSession('ready');
    }).catch(() => { if (!controller.signal.aborted) setStatus('تعذّر تحميل البيانات. حاول مرة أخرى.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [session, kind, page, refresh]);
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true); setStatus('');
    try {
      const response = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'login', username: form.get('username'), password: form.get('password') }), signal: AbortSignal.timeout(30000) });
      if (!response.ok) { setStatus(response.status === 429 ? 'محاولات كثيرة. انتظر ١٥ دقيقة وحاول مجددًا.' : 'تعذّر تسجيل الدخول. راجع البيانات وحاول مجددًا.'); return; }
      setSession('ready');
    } catch { setStatus('تعذّر الاتصال. حاول مرة أخرى.'); }
    finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true); setStatus('');
    try {
      const response = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }), signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error();
      setData(null); setSession('login'); setPage(1);
    } catch { setStatus('تعذّر تسجيل الخروج. حاول مرة أخرى.'); }
    finally { setBusy(false); }
  }
  const total = data ? (kind === 'wish' ? data.counts.wishes : data.counts.attending + data.counts.declined) : 0;
  return <main className="admin-page" dir="rtl" lang="ar">
    <header><div><p className="admin-eyebrow">OMAR & ESRAA · 06.11.2026</p><h1>إدارة الدعوة</h1></div>{session === 'ready' && <button onClick={logout} disabled={busy}>تسجيل الخروج</button>}</header>
    {session === 'login' ? <section className="admin-login"><h2>تسجيل الدخول</h2><p>تأكيدات الحضور والتهاني في مكان خاص بيكم.</p><form onSubmit={login}>
      <label htmlFor="admin-username">اسم المستخدم</label><input id="admin-username" name="username" autoComplete="username" defaultValue="admin" required dir="ltr" disabled={busy}/>
      <label htmlFor="admin-password">كلمة المرور</label><input id="admin-password" name="password" type="password" autoComplete="current-password" maxLength={256} required dir="ltr" disabled={busy}/>
      <button className="admin-primary" disabled={busy}>{busy ? 'جارٍ الدخول…' : 'دخول'}</button>
    </form></section> : <>
      {data && <div className="admin-counts"><article><strong>{data.counts.attending}</strong><span>هيحضروا</span></article><article><strong>{data.counts.declined}</strong><span>اعتذروا</span></article><article><strong>{data.counts.wishes}</strong><span>تهنئة</span></article></div>}
      <nav aria-label="نوع الردود"><button aria-pressed={kind === 'rsvp'} onClick={() => { setKind('rsvp'); setPage(1); }}>تأكيدات الحضور</button><button aria-pressed={kind === 'wish'} onClick={() => { setKind('wish'); setPage(1); }}>التهاني</button><button onClick={() => setRefresh(v => v + 1)} disabled={loading}>تحديث</button></nav>
      {loading && <p role="status">جارٍ تحميل البيانات…</p>}
      {data && <section className="admin-records" aria-label={kind === 'wish' ? 'التهاني' : 'تأكيدات الحضور'}>{data.rows.length ? data.rows.map(row => <article key={row.id}><div><h2>{row.name}</h2><time dateTime={row.created_at}>{new Date(row.created_at).toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}</time></div>{kind === 'wish' ? <p>{row.message}</p> : <span className={'attendance-badge ' + (row.attending ? 'yes' : '')}>{row.attending ? 'سيحضر ✓' : 'اعتذر عن الحضور'}</span>}</article>) : <p>لا توجد ردود حتى الآن.</p>}</section>}
      {data && total > 50 && <div className="admin-pagination"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>السابق</button><span>صفحة {page} من {Math.ceil(total / 50)}</span><button disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}>التالي</button></div>}
    </>}
    <p role="status" className="admin-status">{status}</p>{status && session !== 'login' && <button onClick={() => setRefresh(v => v + 1)}>إعادة المحاولة</button>}
    <footer>البيانات خاصة بكم · التوقيت بتوقيت القاهرة · <a href="/">عرض الدعوة</a></footer>
  </main>;
}
