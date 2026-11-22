import { t } from '../lib/i18n.jsx'
import { useEffect, useRef } from 'react'
import { money, dmy, iso, isImage } from '../lib/format.js'
import { useFileUrl } from './ui.jsx'

/** نص قابل للتعديل (يحفظ عند الخروج من الحقل) */
function E({ value, onSave, editable, as: Tag = 'span', className, style }) {
  const ref = useRef()
  useEffect(() => { if (ref.current && ref.current.innerText !== value) ref.current.innerText = value || '' }, [value])
  return (
    <Tag ref={ref} className={className} style={style} contentEditable={editable} suppressContentEditableWarning
      onBlur={(e) => editable && e.currentTarget.innerText !== value && onSave(e.currentTarget.innerText)} />
  )
}

function ReceiptFig({ path, caption }) {
  const url = useFileUrl(path)
  if (!isImage(path)) return <figure><div style={{ height: 190, display: 'grid', placeItems: 'center', background: '#fafafa' }}>{t('ملف PDF')}</div><figcaption>{caption}</figcaption></figure>
  return <figure>{url ? <img src={url} alt={caption} /> : <div style={{ height: 190 }} />}<figcaption>{caption}</figcaption></figure>
}

function Header({ org }) {
  const addr = (org?.address || '').split('،')
  return (
    <>
      <div className="p-head">
        <div className="p-logo">
          <div className="lg">{(org?.name || '').split(' ').pop()}</div>
          <div><h1>{org?.name}</h1><small>ARYAM BOOKSTORE</small></div>
        </div>
        <div className="p-addr">
          {addr.map((a, i) => <div key={i}>{a.trim()}</div>)}
          {org?.phone && <div>{t('هاتف:')} <b className="num">{org.phone}</b></div>}
        </div>
      </div>
      <div className="p-rule" />
    </>
  )
}

export default function ReportPaper({ org, report, notes, setNote, editable, kind = 'month', periodLabel, from, to, showReceipts }) {
  const r = report
  const T = r.totals
  const N = (k, d) => (notes[k] !== undefined ? notes[k] : d)
  const maxCat = Math.max(1, ...r.categories.map((c) => c.amount))
  const receipts = showReceipts
    ? [
        ...r.days.flatMap((d) => (d.entry?.report_paths || []).map((p) => ({ p, c: `${t('التقرير اليومي')} — ${dmy(d.date)}` }))),
        ...r.expenses.flatMap((x) => (x.receipt_paths || []).map((p) => ({ p, c: `${x.description} — ${money(x.amount)}` }))),
      ]
    : []

  const kpis = (
    <div className="p-kpis">
      <div className="p-kpi"><span>{t('مداخيل البطاقة')}</span><b className="num">{money(T.card)} <small>QAR</small></b></div>
      <div className="p-kpi"><span>{t('المداخيل النقدية')}</span><b className="num">{money(T.cash + T.other)} <small>QAR</small></b></div>
      <div className="p-kpi"><span>{t('إجمالي المصاريف')}</span><b className="num red">− {money(T.expenses)} <small>QAR</small></b></div>
      <div className="p-kpi net"><span>{t('صافي المداخيل')}</span><b className="num">{money(T.net)} <small>QAR</small></b></div>
    </div>
  )

  const titleBlock = (
    <div className="p-title">
      <div>
        <E as="h2" editable={editable} value={N('title', t('تقرير المداخيل والمصاريف'))} onSave={(v) => setNote('title', v)} />
        <E as="div" className="per" editable={editable}
          value={N('period', kind === 'day' ? `${t('التقرير اليومي')} — ${periodLabel}` : t('الفترة من {a} إلى {b} — {n} أيام مسجّلة (تقرير تراكمي يُحدَّث يوميًا)', { a: dmy(from), b: dmy(to), n: r.recordedCount }))}
          onSave={(v) => setNote('period', v)} />
      </div>
      <div className="meta">
        <div>{t('تاريخ الإصدار:')} <b className="num">{dmy(iso())}</b></div>
        <div>{t('موجّه إلى:')} <E as="b" editable={editable} value={N('addressee', t('إدارة المكتبة'))} onSave={(v) => setNote('addressee', v)} /></div>
      </div>
    </div>
  )

  const expensesTable = (
    <table className="pt">
      <thead><tr><th>#</th><th>{t('التاريخ')}</th><th>{t('البيان')}</th><th>{t('المبلغ (ر.ق)')}</th></tr></thead>
      <tbody>
        {r.expenses.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>{t('لا توجد مصاريف')}</td></tr>}
        {r.expenses.map((x, i) => (
          <tr key={x.id}><td>{i + 1}</td><td className="num">{dmy(x.expense_date)}</td><td>{x.description}</td><td className="num">{money(x.amount)}</td></tr>
        ))}
      </tbody>
      <tfoot><tr><td colSpan={3}>{t('المجموع')}</td><td className="num">{money(T.expenses)}</td></tr></tfoot>
    </table>
  )

  const sideBoxes = (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="p-box">
        <h4>{t('المصاريف حسب الفئة (ر.ق)')}</h4>
        {r.categories.map((c) => (
          <div className="p-cat" key={c.name}>
            <div className="r"><span>{t(c.name)}</span><b className="num">{money(c.amount)}</b></div>
            <div className="bar"><i style={{ width: `${(c.amount / maxCat) * 100}%` }} /></div>
          </div>
        ))}
        <div style={{ fontSize: 10.5, color: '#6b7280' }}>{t('تمثّل المصاريف {p}% من إجمالي المداخيل.', { p: r.expenseShare })}</div>
      </div>
      <div className="p-note">
        <E as="h4" editable={editable} value={N('noteTitle', t('ملاحظة هامة — التحقق من صحة الأرقام'))} onSave={(v) => setNote('noteTitle', v)} />
        <E as="div" editable={editable} value={N('note', '')} onSave={(v) => setNote('note', v)} />
      </div>
    </div>
  )

  const summary = (
    <>
      <div className="p-sec">{t('الخلاصة')}</div>
      <E as="div" className="p-sum" editable={editable} value={N('summary', r.autoSummary)} onSave={(v) => setNote('summary', v)} />
      <div className="p-sign">
        <span>{t('من إعداد')}</span>
        <E as="b" editable={editable} value={N('preparer', '')} onSave={(v) => setNote('preparer', v)} />
        <E as="div" editable={editable} value={N('preparerTitle', '')} onSave={(v) => setNote('preparerTitle', v)} />
        <div className="line" />
        <span>{t('التوقيع')}</span>
      </div>
    </>
  )

  if (kind === 'day') {
    const d = r.days[0]
    return (
      <div className={`paper ${editable ? 'editing' : ''}`}>
        <section className="sheet">
          <Header org={org} />
          {titleBlock}
          {kpis}
          <div className="p-sec">{t('مداخيل اليوم')}</div>
          <table className="pt">
            <thead><tr><th>{t('البطاقة (ر.ق)')}</th><th>{t('النقد (ر.ق)')}</th><th>{t('مداخيل أخرى')}</th><th>{t('إجمالي اليوم')}</th><th>{t('المصاريف')}</th><th>{t('الصافي')}</th></tr></thead>
            <tbody><tr>
              <td className="num">{money(d?.card)}</td><td className="num">{money(d?.cash)}</td><td className="num">{money(d?.other)}</td>
              <td className="num">{money(d?.total)}</td><td className="num red">{d?.expenses ? money(d.expenses) : '—'}</td><td className="num"><b>{money(d?.net)}</b></td>
            </tr></tbody>
          </table>
          {d?.entry?.other_income_note && <div style={{ fontSize: 11.5, color: '#6b7280' }}>{t('مداخيل أخرى:')} {d.entry.other_income_note}</div>}
          {d?.entry?.notes && <div style={{ fontSize: 11.5 }}><b>{t('ملاحظات:')}</b> {d.entry.notes}</div>}
          <div className="p-sec">{t('تفصيل المصاريف')}</div>
          <div className="p-two">{expensesTable}{sideBoxes}</div>
          {summary}
          <div className="pno"><span className="num">{receipts.length ? '1 / 2' : '1 / 1'}</span></div>
        </section>
        {receipts.length > 0 && (
          <section className="sheet">
            <div className="p-sec">{t('مرفقات اليوم — الوصولات والتقرير اليومي')}</div>
            <div className="p-receipts">{receipts.map((x) => <ReceiptFig key={x.p} path={x.p} caption={x.c} />)}</div>
            <div className="pno"><span className="num">2 / 2</span></div>
          </section>
        )}
      </div>
    )
  }

  const pages = 2 + (receipts.length ? 1 : 0)
  return (
    <div className={`paper ${editable ? 'editing' : ''}`}>
      <section className="sheet">
        <Header org={org} />
        {titleBlock}
        {kpis}
        <div className="p-sec">{t('المداخيل اليومية')}</div>
        <table className="pt">
          <thead><tr><th>{t('التاريخ')}</th><th>{t('البطاقة (ر.ق)')}</th><th>{t('النقد (ر.ق)')}</th>{T.other > 0 && <th>{t('أخرى')}</th>}<th>{t('إجمالي اليوم')}</th><th>{t('المصاريف')}</th><th>{t('الصافي')}</th></tr></thead>
          <tbody>
            {r.days.map((d) => (
              <tr key={d.date}>
                <td className="num">{dmy(d.date)}</td><td className="num">{money(d.card)}</td><td className="num">{money(d.cash)}</td>
                {T.other > 0 && <td className="num">{money(d.other)}</td>}
                <td className="num">{money(d.total)}</td>
                <td className="num red">{d.expenses ? money(d.expenses) : '—'}</td>
                <td><span className="netbar"><span className="num" style={{ color: d.net < 0 ? '#c62828' : undefined }}>{money(d.net)}</span><i style={{ width: Math.max(2, (Math.max(0, d.net) / r.maxNet) * 70) }} /></span></td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr>
            <td>{t('المجموع')}</td><td className="num">{money(T.card)}</td><td className="num">{money(T.cash)}</td>
            {T.other > 0 && <td className="num">{money(T.other)}</td>}
            <td className="num">{money(T.total)}</td><td className="num">{money(T.expenses)}</td><td className="num">{money(T.net)}</td>
          </tr></tfoot>
        </table>
        <div className="pno"><span className="num">1 / {pages}</span></div>
      </section>
      <section className="sheet">
        <div className="p-sec">{t('تفصيل المصاريف')}</div>
        <div className="p-two">{expensesTable}{sideBoxes}</div>
        {summary}
        <div className="pno"><span className="num">2 / {pages}</span></div>
      </section>
      {receipts.length > 0 && (
        <section className="sheet">
          <div className="p-sec">{t('ملحق — صور الوصولات')}</div>
          <div className="p-receipts">{receipts.map((x) => <ReceiptFig key={x.p} path={x.p} caption={x.c} />)}</div>
          <div className="pno"><span className="num">3 / {pages}</span></div>
        </section>
      )}
    </div>
  )
}
