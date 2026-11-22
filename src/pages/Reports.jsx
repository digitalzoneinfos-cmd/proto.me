import { t } from '../lib/i18n.jsx'
import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useReport, useReportNotes } from '../lib/hooks.js'
import { api } from '../lib/api.js'
import { exportReportXlsx } from '../lib/exportXlsx.js'
import { money, monthKey, monthRange, monthLabel, iso, dmy, dayName } from '../lib/format.js'
import { Icon } from '../components/Icons.jsx'
import { PaperFit, MonthStepper, DayStepper, Thumb, useViewer, Loading, Uploader, useLoad, useToast, Empty } from '../components/ui.jsx'
import ReportPaper from '../components/ReportPaper.jsx'
import ReportToolbar from '../components/ReportToolbar.jsx'
import { BarChart } from './Overview.jsx'

function Tabs({ tab, setTab, items }) {
  return (
    <div className="tabs no-print">
      {items.map(([k, label]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{label}</button>)}
    </div>
  )
}

function Kpis({ T }) {
  return (
    <div className="grid g-4">
      <div className="panel stat"><span className="k">{t('مداخيل البطاقة')}</span><span className="v num">{money(T.card)}<small>QAR</small></span></div>
      <div className="panel stat"><span className="k">{t('المداخيل النقدية')}</span><span className="v num">{money(T.cash + T.other)}<small>QAR</small></span></div>
      <div className="panel stat"><span className="k">{t('إجمالي المصاريف')}</span><span className="v num" style={{ color: 'var(--red)' }}>− {money(T.expenses)}<small>QAR</small></span></div>
      <div className="panel stat accent"><span className="k">{t('صافي المداخيل')}</span><span className="v num">{money(T.net)}<small>QAR</small></span></div>
    </div>
  )
}

export function ExpensesTable({ expenses, onEdit, onDelete }) {
  const view = useViewer()
  if (!expenses.length) return <Empty icon="receipt" title={t('لا توجد مصاريف')} text={t('لم تُسجّل أي مصاريف في هذه الفترة.')} />
  return (
    <div className="table-wrap">
      <table className="t">
        <thead><tr><th>#</th><th>{t('التاريخ')}</th><th>{t('البيان')}</th><th>{t('الفئة')}</th><th>{t('المبلغ (ر.ق)')}</th><th>{t('معاينة الوصل')}</th>{(onEdit || onDelete) && <th />}</tr></thead>
        <tbody>
          {expenses.map((x, i) => (
            <tr key={x.id}>
              <td className="faint">{i + 1}</td>
              <td className="num">{dmy(x.expense_date)}</td>
              <td className="wrap">{x.description}</td>
              <td><span className="tag">{t(x.category)}</span></td>
              <td className="num" style={{ fontWeight: 600 }}>{money(x.amount)}</td>
              <td>
                {x.receipt_paths?.length
                  ? <div className="thumbs">{x.receipt_paths.map((p, j) => <Thumb key={p} path={p} onClick={() => view(x.receipt_paths, j, `${x.description} — ${money(x.amount)} ${t('ر.ق')}`)} />)}</div>
                  : <span className="no-receipt">{t('بدون وصل')}</span>}
              </td>
              {(onEdit || onDelete) && (
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {onEdit && <button className="icon-btn" onClick={() => onEdit(x)} aria-label={t('تعديل')}><Icon name="edit" size={16} /></button>}
                    {onDelete && <button className="icon-btn" style={{ color: 'var(--red)' }} onClick={() => onDelete(x)} aria-label={t('حذف')}><Icon name="trash" size={16} /></button>}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ====================== التقرير الشهري ====================== */
export function MonthlyReport() {
  const { org, isAdmin, membership } = useAuth()
  const [sp, setSp] = useSearchParams()
  const month = sp.get('m') || monthKey()
  const setMonth = (m) => setSp({ m })
  const { from, to } = monthRange(month)
  const { loading, report } = useReport(from, to)
  const { notes, setNote, resetPeriod } = useReportNotes(month, membership?.fullName)
  const [tab, setTab] = useState('report')
  const [editable, setEditable] = useState(false)
  const [showReceipts, setShowReceipts] = useState(false)
  const files = useLoad(() => api.listMonthlyFiles(month), [month])
  const toast = useToast()
  const view = useViewer()

  // الفترة الفعلية = من أول يوم مسجل إلى آخر يوم مسجل
  const rec = report.days
  const pFrom = rec[0]?.date || from
  const pTo = rec[rec.length - 1]?.date || to

  return (
    <>
      <div className="page-head no-print">
        <div>
          <h1 className="page-title">{t('التقرير الشهري')}</h1>
          <div className="page-sub">{monthLabel(month)} — {t('{n} أيام مسجّلة', { n: report.recordedCount })}</div>
        </div>
        <div className="head-actions"><MonthStepper value={month} onChange={setMonth} /></div>
      </div>
      <Tabs tab={tab} setTab={setTab} items={[['report', t('التقرير (للطباعة)')], ['board', t('لوحة الشهر')], ['files', t('ملفات الشهر ({n})', { n: files.data?.length || 0 })]]} />

      {loading ? <Loading /> : tab === 'report' ? (
        <>
          <ReportToolbar editable={editable} setEditable={setEditable} canEdit={isAdmin} showReceipts={showReceipts} setShowReceipts={setShowReceipts}
            onReset={resetPeriod}
            onExcel={() => exportReportXlsx(report, { title: `${org.name} — ${t('تقرير المداخيل والمصاريف')}`, period: monthLabel(month), filename: `report-${month}.xlsx` })} />
          {report.days.length === 0
            ? <div className="panel"><Empty icon="report" title={t('لا توجد بيانات لهذا الشهر')} text={t('اختر شهراً آخر أو أدخل مداخيل اليوم.')} /></div>
            : <PaperFit><ReportPaper org={org} report={report} notes={notes} setNote={setNote} editable={editable && isAdmin} from={pFrom} to={pTo} showReceipts={showReceipts} /></PaperFit>}
        </>
      ) : tab === 'board' ? (
        <>
          <Kpis T={report.totals} />
          <div className="panel">
            <div className="panel-head"><h3>{t('صافي كل يوم')}</h3></div>
            {report.days.length ? <BarChart days={report.days} /> : <p className="muted panel-pad">{t('لا توجد بيانات.')}</p>}
          </div>
          <div className="panel">
            <div className="panel-head"><h3>{t('المداخيل اليومية')}</h3><span className="faint" style={{ fontSize: 12 }}>{t('اضغط على أي يوم لعرض تفاصيله')}</span></div>
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table className="t">
                <thead><tr><th>{t('التاريخ')}</th><th>{t('البطاقة')}</th><th>{t('النقد')}</th><th>{t('الإجمالي')}</th><th>{t('المصاريف')}</th><th>{t('الصافي')}</th><th>{t('التقرير اليومي')}</th></tr></thead>
                <tbody>
                  {report.days.map((d) => (
                    <tr key={d.date}>
                      <td><Link className="link" to={`/daily?d=${d.date}`}>{dayName(d.date)} <span className="num">{dmy(d.date)}</span></Link></td>
                      <td className="num">{money(d.card)}</td><td className="num">{money(d.cash + d.other)}</td><td className="num">{money(d.total)}</td>
                      <td className="num neg">{d.expenses ? money(d.expenses) : '—'}</td>
                      <td className={`num ${d.net < 0 ? 'neg' : ''}`} style={{ fontWeight: 700 }}>{money(d.net)}</td>
                      <td>{d.entry?.report_paths?.length ? <Thumb path={d.entry.report_paths[0]} onClick={() => view(d.entry.report_paths, 0, `${t('التقرير اليومي')} — ${dmy(d.date)}`)} /> : <span className="no-receipt">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr><td>{t('المجموع')}</td><td className="num">{money(report.totals.card)}</td><td className="num">{money(report.totals.cash + report.totals.other)}</td><td className="num">{money(report.totals.total)}</td><td className="num">{money(report.totals.expenses)}</td><td className="num">{money(report.totals.net)}</td><td /></tr></tfoot>
              </table>
            </div>
          </div>
          <div className="panel">
            <div className="panel-head"><h3>{t('تفصيل المصاريف ووصولاتها')}</h3></div>
            <div style={{ marginTop: 12 }}><ExpensesTable expenses={report.expenses} /></div>
          </div>
        </>
      ) : (
        <div className="panel panel-pad" style={{ display: 'grid', gap: 16 }}>
          <div><strong>{t('ملفات وصور التقرير الشهري')}</strong><div className="muted" style={{ fontSize: 13 }}>{t('مثل: كشف الحساب البنكي، تقرير Bizify الشهري، تحويلات «فورا»…')}</div></div>
          {files.data?.length ? (
            <div className="thumbs">
              {files.data.map((f) => (
                <div key={f.id} style={{ display: 'grid', gap: 4, justifyItems: 'center' }}>
                  <Thumb path={f.path} large onClick={() => view(files.data.map((x) => x.path), files.data.indexOf(f), f.title || t('ملف الشهر'))}
                    onRemove={isAdmin ? async () => { await api.deleteMonthlyFile(f.id); await api.removeFile(f.path); files.reload(); toast('تم حذف الملف') } : undefined} />
                </div>
              ))}
            </div>
          ) : !isAdmin && <Empty icon="file" title={t('لا توجد ملفات مرفوعة لهذا الشهر')} />}
          {isAdmin && (
            <Uploader folder={`monthly/${month}`} paths={[]} label={t('ارفع صور أو ملفات التقرير الشهري')}
              onChange={async (paths) => { for (const p of paths) await api.addMonthlyFile({ month, path: p, title: monthLabel(month) }); files.reload(); toast('تم رفع الملفات ✔') }} />
          )}
        </div>
      )}
    </>
  )
}

/* ====================== التقرير اليومي ====================== */
export function DailyReport() {
  const { org, isAdmin, membership } = useAuth()
  const [sp, setSp] = useSearchParams()
  const day = sp.get('d') || iso()
  const setDay = (d) => setSp({ d })
  const { loading, report } = useReport(day, day)
  const { notes, setNote, resetPeriod } = useReportNotes(day, membership?.fullName)
  const [tab, setTab] = useState('details')
  const [editable, setEditable] = useState(false)
  const [showReceipts, setShowReceipts] = useState(true)
  const view = useViewer()
  const d = report.days[0]
  const entry = d?.entry
  const T = report.totals

  return (
    <>
      <div className="page-head no-print">
        <div>
          <h1 className="page-title">{t('التقرير اليومي')}</h1>
          <div className="page-sub">{dayName(day)} {dmy(day)}</div>
        </div>
        <div className="head-actions">
          <DayStepper value={day} onChange={setDay} />
          {isAdmin && <Link className="btn primary" to={`/entries?d=${day}`}><Icon name={entry ? 'edit' : 'plus'} size={16} />{entry ? t('تعديل اليوم') : t('إدخال اليوم')}</Link>}
        </div>
      </div>
      <Tabs tab={tab} setTab={setTab} items={[['details', t('تفاصيل اليوم')], ['report', t('التقرير (للطباعة)')]]} />

      {loading ? <Loading /> : !d ? (
        <div className="panel"><Empty icon="calendar" title={t('لا توجد بيانات لهذا اليوم')} text={t('لم تُدخل مداخيل أو مصاريف بعد. استعمل الأسهم أو التقويم للتنقل بين الأيام.')}
          action={isAdmin && <Link className="btn primary" to={`/entries?d=${day}`}><Icon name="plus" size={16} />{t('إدخال مداخيل هذا اليوم')}</Link>} /></div>
      ) : tab === 'details' ? (
        <>
          <Kpis T={T} />
          <div className="grid g-3-2">
            <div className="panel">
              <div className="panel-head"><h3>{t('مصاريف اليوم')}</h3>{isAdmin && <Link className="link" to={`/expenses?add=${day}`}>{t('+ إضافة مصروف')}</Link>}</div>
              <div style={{ marginTop: 12 }}><ExpensesTable expenses={report.expenses} /></div>
            </div>
            <div className="panel panel-pad" style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
              <strong>{t('التقرير اليومي (Day Close)')}</strong>
              {entry?.report_paths?.length
                ? <div className="thumbs">{entry.report_paths.map((p, i) => <Thumb key={p} path={p} large onClick={() => view(entry.report_paths, i, `${t('التقرير اليومي')} — ${dmy(day)}`)} />)}</div>
                : <span className="no-receipt">{t('لم تُرفع صورة التقرير اليومي.')}</span>}
              <div style={{ display: 'grid', gap: 8, borderTop: '1px solid var(--line-soft)', paddingTop: 12, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="muted">{t('البطاقة')}</span><b className="num">{money(d.card)}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="muted">{t('النقد')}</span><b className="num">{money(d.cash)}</b></div>
                {d.other > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="muted">{t('أخرى')} {entry?.other_income_note ? `(${entry.other_income_note})` : ''}</span><b className="num">{money(d.other)}</b></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="muted">{t('المصاريف')}</span><b className="num" style={{ color: 'var(--red)' }}>− {money(d.expenses)}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--line-soft)', paddingTop: 8 }}><span>{t('الصافي')}</span><b className="num">{money(d.net)}</b></div>
              </div>
              {entry?.notes && <div style={{ fontSize: 13 }}><span className="muted">{t('ملاحظات:')} </span>{entry.notes}</div>}
            </div>
          </div>
        </>
      ) : (
        <>
          <ReportToolbar editable={editable} setEditable={setEditable} canEdit={isAdmin} showReceipts={showReceipts} setShowReceipts={setShowReceipts}
            onReset={resetPeriod}
            onExcel={() => exportReportXlsx(report, { title: `${org.name} — ${t('التقرير اليومي')}`, period: dmy(day), filename: `daily-report-${day}.xlsx` })} />
          <PaperFit><ReportPaper kind="day" org={org} report={report} notes={notes} setNote={setNote} editable={editable && isAdmin} periodLabel={`${dayName(day)} ${dmy(day)}`} showReceipts={showReceipts} /></PaperFit>
        </>
      )}
    </>
  )
}
