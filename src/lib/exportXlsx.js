import * as XLSX from 'xlsx'
import { dmy } from './format.js'
import { t } from './i18n.jsx'

/** تصدير تقرير (يومي أو شهري) إلى ملف Excel قابل للتعديل */
export function exportReportXlsx(report, { title, period, filename }) {
  const wb = XLSX.utils.book_new()
  wb.Workbook = { Views: [{ RTL: document.documentElement.dir === 'rtl' }] }

  const daily = [
    [title], [period], [],
    ['التاريخ', 'البطاقة (ر.ق)', 'النقد (ر.ق)', 'مداخيل أخرى', 'إجمالي اليوم', 'المصاريف', 'الصافي'].map((x) => t(x)),
    ...report.days.map((d) => [dmy(d.date), d.card, d.cash, d.other, d.total, d.expenses, d.net]),
    [t('المجموع'), report.totals.card, report.totals.cash, report.totals.other, report.totals.total, report.totals.expenses, report.totals.net],
  ]
  const s1 = XLSX.utils.aoa_to_sheet(daily)
  s1['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, s1, t('المداخيل اليومية').slice(0, 31))

  const ex = [
    ['#', ...['التاريخ', 'البيان', 'الفئة', 'المبلغ (ر.ق)'].map((x) => t(x))],
    ...report.expenses.map((x, i) => [i + 1, dmy(x.expense_date), x.description, t(x.category), Number(x.amount)]),
    ['', '', t('المجموع'), '', report.totals.expenses],
  ]
  const s2 = XLSX.utils.aoa_to_sheet(ex)
  s2['!cols'] = [{ wch: 5 }, { wch: 12 }, { wch: 36 }, { wch: 20 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, s2, t('تفصيل المصاريف').slice(0, 31))

  const cat = [[t('الفئة'), t('المبلغ (ر.ق)')], ...report.categories.map((c) => [t(c.name), c.amount])]
  const s3 = XLSX.utils.aoa_to_sheet(cat)
  s3['!cols'] = [{ wch: 26 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, s3, t('حسب الفئة').slice(0, 31))

  XLSX.writeFile(wb, filename)
}
