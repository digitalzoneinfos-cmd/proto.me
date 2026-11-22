import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from './api.js'
import { computeReport, autoSummary, defaultNote } from './calc.js'

export function useReport(from, to) {
  const [state, setState] = useState({ loading: true, entries: [], expenses: [] })
  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }))
    try {
      const [entries, expenses] = await Promise.all([api.listEntries(from, to), api.listExpenses(from, to)])
      setState({ loading: false, entries, expenses })
    } catch (e) {
      console.error(e)
      setState({ loading: false, entries: [], expenses: [], error: e })
    }
  }, [from, to])
  useEffect(() => { load() }, [load])
  const report = useMemo(() => {
    const r = computeReport(state.entries, state.expenses)
    return { ...r, autoSummary: autoSummary(r) }
  }, [state.entries, state.expenses])
  return { ...state, report, reload: load }
}

const DEFAULT_KEYS = ['addressee', 'preparer', 'preparerTitle', 'note', 'noteTitle']

/** ملاحظات التقرير القابلة للتعديل: افتراضيات المتجر + تعديلات الفترة */
export function useReportNotes(period, fallbackPreparer) {
  const [notes, setNotes] = useState({})
  useEffect(() => {
    let live = true
    Promise.all([api.getReportNotes('_defaults'), api.getReportNotes(period)]).then(([d, p]) => {
      if (!live) return
      setNotes({ note: defaultNote(), preparer: fallbackPreparer || '', ...d, ...p })
    }).catch(() => setNotes({ note: defaultNote(), preparer: fallbackPreparer || '' }))
    return () => { live = false }
  }, [period, fallbackPreparer])

  const setNote = useCallback(async (key, value) => {
    setNotes((n) => ({ ...n, [key]: value }))
    const p = await api.getReportNotes(period).catch(() => ({}))
    await api.saveReportNotes(period, { ...p, [key]: value })
    if (DEFAULT_KEYS.includes(key)) {
      const d = await api.getReportNotes('_defaults').catch(() => ({}))
      await api.saveReportNotes('_defaults', { ...d, [key]: value })
    }
  }, [period])

  const resetPeriod = useCallback(async () => {
    await api.saveReportNotes(period, {})
    const d = await api.getReportNotes('_defaults').catch(() => ({}))
    setNotes({ note: defaultNote(), preparer: fallbackPreparer || '', ...d })
  }, [period, fallbackPreparer])

  return { notes, setNote, resetPeriod }
}
