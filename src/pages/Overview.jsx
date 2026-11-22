import { t } from '../lib/i18n.jsx'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useReport } from '../lib/hooks.js'
import { api } from '../lib/api.js'
import { money, monthKey, monthRange, monthLabel, iso, dmy, dayShort, NOTICE_KINDS, STATUS, timeAgo } from '../lib/format.js'
import { Icon } from '../components/Icons.jsx'
import { MonthStepper, Thumb, useViewer, Loading } from '../components/ui.jsx'

export function BarChart({ days, height = 170 }) {
  const vals = days.map((d) => d.net)
  const max = Math.max(10, ...vals.map(Math.abs))
  const step = Math.pow(10, Math.floor(Math.log10(max)))
  const top = Math.ceil(max / step) * step
  const ticks = [0, top / 4, top / 2, (top * 3) / 4, top]
  const best = days.reduce((b, d) => (!b || d.net > b.net ? d : b), null)
  return (
    <>
      <div className={`chart ${days.length > 12 ? 'many' : ''}`}>
        <div className="axis">{ticks.map((t) => <span key={t} className="num">{Math.round(t)}</span>)}</div>
        <div className="plot" style={{ height }}>
          {ticks.slice(1).map((t) => <span key={t} className="gl" style={{ bottom: `${(t / top) * 100}%` }} />)}
          {days.map((d, i) => (
            <div key={d.date} className={`bar ${d.net < 0 ? 'neg' : ''}`} title={`${dmy(d.date)} — ${money(d.net)}`}>
              <b className="num">{Math.round(d.net)}</b>
              <i style={{ height: `${(Math.abs(d.net) / top) * 100}%`, animationDelay: `${i * 0.04}s` }} />
            </div>
          ))}
        </div>
        <div className="labels">{days.map((d) => { const [y, m, dd] = d.date.split('-').map(Number); return <span key={d.date}>{dayShort(new Date(y, m - 1, dd).getDay())}<br /><span className="num">{dd}</span></span> })}</div>
      </div>
      {best && <p className="muted" style={{ fontSize: 12, padding: '0 22px 16px', margin: 0 }}>{t('أفضل يوم في الفترة: {d} بصافي {a} ر.ق، من أصل {n} أيام معروضة.', { d: dmy(best.date), a: money(best.net), n: days.length })}</p>}
    </>
  )
}

export default function Overview() {
  const { isAdmin, membership } = useAuth()
  const [month, setMonth] = useState(monthKey())
  const { from, to } = monthRange(month)
  const { loading, report } = useReport(from, to)
  const [notices, setNotices] = useState([])
  const view = useViewer()
  const nav = useNavigate()
  const today = iso()

  useEffect(() => { api.listNotices().then(setNotices).catch(() => {}) }, [])

  const T = report.totals
  const recorded = report.days.filter((d) => d.entry)
  const last = recorded.slice(-10)
  const daysInMonth = Number(to.slice(-2))
  const todayRow = report.days.find((d) => d.date === today)
  const noReceipt = report.expenses.filter((x) => !x.receipt_paths?.length).length
  const openNotices = notices.filter((n) => n.status !== 'done')

  const checklist = useMemo(() => [
    { ok: !!todayRow?.entry, label: t('مداخيل اليوم مُدخلة') },
    { ok: !!todayRow?.entry?.report_paths?.length, label: t('صورة التقرير اليومي مرفوعة') },
    { ok: noReceipt === 0, label: noReceipt ? t('{n} مصاريف بدون وصل هذا الشهر', { n: noReceipt }) : t('كل المصاريف مرفقة بوصل') },
    { ok: openNotices.length === 0, label: openNotices.length ? t('{n} تنبيهات مفتوحة', { n: openNotices.length }) : t('لا توجد تنبيهات مفتوحة') },
  ], [todayRow, noReceipt, openNotices.length])

  const hello = new Date().getHours() < 12 ? t('صباح الخير') : t('مساء الخير')

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">{t('نظرة عامة')}</h1>
          <div className="page-sub">{hello}{t('، ')}{membership?.fullName?.split(' ')[0]} — {monthLabel(month)}</div>
        </div>
        <div className="head-actions">
          <MonthStepper value={month} onChange={setMonth} />
          {isAdmin && <button className="btn primary" onClick={() => nav('/entries')}><Icon name="plus" size={16} />{t('إدخال اليوم')}</button>}
        </div>
      </div>

      {loading ? <Loading /> : (
        <>
          <div className="grid g-3-2">
            <div className="panel hero-stat">
              <div className="panel-pad" style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}><span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--red)' }} />{t('صافي المداخيل')} <span className="faint" style={{ fontSize: 12 }}>QAR</span></div>
                <div className="big num" style={{ color: T.net < 0 ? 'var(--red)' : undefined }}>{money(T.net).split('.')[0]}<span style={{ fontSize: '0.35em', color: 'var(--muted)' }}>.{money(T.net).split('.')[1]}</span></div>
              </div>
              <div className="side">
                <div><b className="num">{money(T.card)}</b><span className="muted">{t('مداخيل البطاقة')}</span></div>
                <div><b className="num">{money(T.cash + T.other)}</b><span className="muted">{t('المداخيل النقدية')}</span></div>
              </div>
            </div>
            <div className="panel panel-pad" style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{t('مصاريف هذا الشهر')}</strong><span className="muted" style={{ fontSize: 12 }}>{t('من إجمالي المداخيل')}</span></div>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 32 }}><span className="num">{money(T.expenses)}</span> <span className="muted" style={{ fontSize: 20 }}>/ <span className="num">{money(T.total)}</span></span></div>
              <div className="progress red"><i style={{ width: `${Math.min(100, Number(report.expenseShare))}%` }} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid var(--line-soft)', paddingTop: 12 }}>
                <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 22 }}><span className="num">{report.recordedCount}</span> <span className="muted" style={{ fontSize: 16 }}>/ <span className="num">{daysInMonth}</span></span></span>
                <span className="muted" style={{ fontSize: 12 }}>{t('أيام مسجّلة')}</span>
              </div>
            </div>
          </div>

          <div className="grid g-3-2">
            <div className="panel">
              <div className="panel-head"><h3>{t('صافي الأيام الأخيرة')}</h3><Link className="link" to="/monthly">{t('عرض التقرير الشهري')}</Link></div>
              {last.length ? <BarChart days={last} /> : <p className="muted panel-pad">{t('لا توجد بيانات لهذا الشهر بعد.')}</p>}
            </div>
            <div className="panel">
              <div className="panel-head"><h3>{t('متابعة اليوم')}</h3><Link className="link" to="/daily">{t('التقرير اليومي')}</Link></div>
              <div className="list panel-pad" style={{ paddingTop: 8 }}>
                {checklist.map((c) => (
                  <div className="list-row" key={c.label} style={{ alignItems: 'center' }}>
                    <span className={`check ${c.ok ? 'on' : ''}`}>{c.ok && <Icon name="check" size={13} stroke={3} />}</span>{c.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid g-3-2">
            <div className="panel">
              <div className="panel-head"><h3>{t('آخر المصاريف')}</h3><Link className="link" to="/expenses">{t('كل المصاريف')}</Link></div>
              <div className="table-wrap" style={{ marginTop: 12 }}>
                <table className="t">
                  <thead><tr><th>{t('البيان')}</th><th>{t('التاريخ')}</th><th>{t('المبلغ')}</th><th>{t('الوصل')}</th></tr></thead>
                  <tbody>
                    {[...report.expenses].reverse().slice(0, 5).map((x) => (
                      <tr key={x.id}>
                        <td className="wrap">{x.description}</td>
                        <td className="num">{dmy(x.expense_date)}</td>
                        <td className="num">{money(x.amount)}</td>
                        <td>{x.receipt_paths?.length ? <Thumb path={x.receipt_paths[0]} onClick={() => view(x.receipt_paths, 0, x.description)} /> : <span className="no-receipt">—</span>}</td>
                      </tr>
                    ))}
                    {!report.expenses.length && <tr><td colSpan={4} className="muted">{t('لا توجد مصاريف هذا الشهر.')}</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="panel">
              <div className="panel-head"><h3>{t('آخر التنبيهات')}</h3><Link className="link" to="/notices/supply">{t('عرض الكل')}</Link></div>
              <div className="list panel-pad" style={{ paddingTop: 8 }}>
                {openNotices.slice(0, 5).map((n) => (
                  <Link to={`/notices/${n.kind}`} className="list-row" key={n.id}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS[n.status].color, marginTop: 7, flex: 'none' }} />
                    <div style={{ minWidth: 0 }}>
                      <div>{n.title} <span className="faint" style={{ fontSize: 12 }}>· {NOTICE_KINDS[n.kind].single}</span></div>
                      <div className="faint" style={{ fontSize: 12 }}>{n.author ? `${n.author} · ` : ''}{timeAgo(n.created_at)}</div>
                    </div>
                  </Link>
                ))}
                {!openNotices.length && <span className="muted">{t('لا توجد تنبيهات مفتوحة 🎉')}</span>}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
