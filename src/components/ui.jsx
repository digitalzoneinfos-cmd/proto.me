import { t } from '../lib/i18n.jsx'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Icon } from './Icons.jsx'
import { api } from '../lib/api.js'
import { isImage, monthLabel, shiftMonth, shiftDay, dmy, dayName } from '../lib/format.js'

/* ---------- Toast ---------- */
const ToastCtx = createContext(() => {})
export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null)
  const tm = useRef()
  const show = useCallback((m) => {
    setMsg(m)
    clearTimeout(tm.current)
    tm.current = setTimeout(() => setMsg(null), 2600)
  }, [])
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && <div className="toast" role="status">{msg}</div>}
    </ToastCtx.Provider>
  )
}
export const useToast = () => useContext(ToastCtx)

/* ---------- Modal ---------- */
export function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label={t('إغلاق')}><Icon name="x" /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function Confirm({ text, onYes, onClose, yes = t('حذف') }) {
  const [busy, setBusy] = useState(false)
  return (
    <Modal title={t('تأكيد')} onClose={onClose} footer={<>
      <button className="btn danger" disabled={busy} onClick={async () => { setBusy(true); try { await onYes() } finally { setBusy(false); onClose() } }}>{yes}</button>
      <button className="btn ghost" onClick={onClose}>{t('إلغاء')}</button>
    </>}>
      <p style={{ margin: 0 }}>{text}</p>
    </Modal>
  )
}

/* ---------- Signed file URL ---------- */
export function useFileUrl(path) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    let live = true
    if (path) api.fileUrl(path).then((u) => live && setUrl(u)).catch(() => {})
    return () => { live = false }
  }, [path])
  return url
}

export function Thumb({ path, onClick, onRemove, large }) {
  const url = useFileUrl(path)
  const img = isImage(path)
  return (
    <button type="button" className={`thumb ${large ? 'lg' : ''}`} onClick={onClick}
      style={img && url ? { backgroundImage: `url("${url}")` } : undefined} title={t('معاينة')}>
      {!img && <><Icon name="file" size={16} /><span style={{ position: 'absolute', bottom: 2 }}>{path.split('.').pop().toUpperCase()}</span></>}
      {onRemove && <span className="x" onClick={(e) => { e.stopPropagation(); onRemove() }} role="button" aria-label={t('إزالة')}>×</span>}
    </button>
  )
}

/* ---------- Receipt / file viewer ---------- */
const ViewerCtx = createContext(() => {})
export function ViewerProvider({ children }) {
  const [state, setState] = useState(null) // { paths, index, title }
  const open = useCallback((paths, index = 0, title = '') => setState({ paths, index, title }), [])
  return (
    <ViewerCtx.Provider value={open}>
      {children}
      {state && <Viewer {...state} setIndex={(i) => setState((s) => ({ ...s, index: i }))} onClose={() => setState(null)} />}
    </ViewerCtx.Provider>
  )
}
export const useViewer = () => useContext(ViewerCtx)

function Viewer({ paths, index, title, setIndex, onClose }) {
  const path = paths[index]
  const url = useFileUrl(path)
  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && index < paths.length - 1) setIndex(index + 1)
      if (e.key === 'ArrowRight' && index > 0) setIndex(index - 1)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [index, paths.length, onClose, setIndex])
  return (
    <div className="viewer" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="viewer-bar">
        <div><strong>{title || t('معاينة الوصل')}</strong> <span style={{ opacity: .6 }}>({index + 1}/{paths.length})</span></div>
        <div style={{ display: 'flex', gap: 8 }}>
          {url && <a className="btn sm" href={url} download target="_blank" rel="noreferrer"><Icon name="download" size={16} />{t('تحميل')}</a>}
          <button className="btn sm" onClick={onClose}><Icon name="x" size={16} />{t('إغلاق')}</button>
        </div>
      </div>
      <div className="viewer-stage" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        {!url ? <div className="spinner" /> : isImage(path) ? <img src={url} alt={t('الوصل')} /> : <iframe src={url} title={t('ملف')} />}
      </div>
      {paths.length > 1 && (
        <div className="viewer-strip">
          {paths.map((p, i) => <Thumb key={p} path={p} onClick={() => setIndex(i)} />)}
        </div>
      )}
    </div>
  )
}

/* ---------- Upload dropzone ---------- */
export function Uploader({ folder, paths, onChange, label = t('اسحب صور أو ملفات الوصل هنا أو اضغط للاختيار'), accept = 'image/*,application/pdf' }) {
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)
  const input = useRef()
  const view = useViewer()
  const toast = useToast()
  const add = async (files) => {
    if (!files?.length) return
    setBusy(true)
    try {
      const added = []
      for (const f of files) {
        if (f.size > 10 * 1024 * 1024) { toast(t('الملف {f} أكبر من 10MB', { f: f.name })); continue }
        added.push(await api.uploadFile(folder, f))
      }
      onChange([...paths, ...added])
    } catch (e) { toast('تعذر رفع الملف: ' + e.message) }
    finally { setBusy(false) }
  }
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div className={`dropzone ${over ? 'over' : ''}`} onClick={() => input.current.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); add([...e.dataTransfer.files]) }}>
        {busy ? <div className="spinner" /> : <Icon name="upload" size={22} />}
        <span style={{ fontSize: 13 }}>{busy ? t('جارٍ الرفع…') : label}</span>
        <span className="faint" style={{ fontSize: 11 }}>{t('صور (JPG / PNG) أو PDF — حتى 10MB · يمكنك التصوير مباشرة من الهاتف')}</span>
        <input ref={input} type="file" multiple accept={accept} hidden onChange={(e) => { add([...e.target.files]); e.target.value = '' }} />
      </div>
      {paths.length > 0 && (
        <div className="thumbs">
          {paths.map((p, i) => <Thumb key={p} path={p} large onClick={() => view(paths, i)} onRemove={() => onChange(paths.filter((x) => x !== p))} />)}
        </div>
      )}
    </div>
  )
}

/* ---------- Month / day steppers (RTL: right = previous) ---------- */
export function MonthStepper({ value, onChange }) {
  return (
    <div className="stepper">
      <button onClick={() => onChange(shiftMonth(value, -1))} aria-label={t('الشهر السابق')}><Icon name="chevR" className="flip-ltr" /></button>
      <div className="val">{monthLabel(value)}<input type="month" value={value} onChange={(e) => e.target.value && onChange(e.target.value)} aria-label={t('اختيار الشهر')} /></div>
      <button onClick={() => onChange(shiftMonth(value, 1))} aria-label={t('الشهر التالي')}><Icon name="chevL" className="flip-ltr" /></button>
    </div>
  )
}
export function DayStepper({ value, onChange }) {
  return (
    <div className="stepper">
      <button onClick={() => onChange(shiftDay(value, -1))} aria-label={t('اليوم السابق')}><Icon name="chevR" className="flip-ltr" /></button>
      <div className="val">{dayName(value)} <span className="num" style={{ marginInlineStart: 6 }}>{dmy(value)}</span><input type="date" value={value} onChange={(e) => e.target.value && onChange(e.target.value)} aria-label={t('اختيار التاريخ')} /></div>
      <button onClick={() => onChange(shiftDay(value, 1))} aria-label={t('اليوم التالي')}><Icon name="chevL" className="flip-ltr" /></button>
    </div>
  )
}

export function Empty({ icon = 'file', title, text, action }) {
  return (
    <div className="empty">
      <div className="ico"><Icon name={icon} /></div>
      <strong style={{ color: 'var(--text)' }}>{title}</strong>
      {text && <span>{text}</span>}
      {action}
    </div>
  )
}

export function Loading() {
  return <div className="empty"><div className="spinner" /></div>
}

/** generic async loader */
export function useLoad(fn, deps) {
  const [state, setState] = useState({ loading: true, data: null, error: null })
  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }))
    try { setState({ loading: false, data: await fn(), error: null }) }
    catch (e) { setState({ loading: false, data: null, error: e }) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(() => { run() }, [run])
  return { ...state, reload: run }
}

/** يصغّر ورقة A4 لتتسع لعرض الشاشة (الهاتف) دون تمرير أفقي */
export function PaperFit({ children }) {
  const ref = useRef()
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      const p = el.querySelector('.paper')
      if (!p) return
      const z = Math.min(1, el.clientWidth / 794)
      p.style.zoom = z < 1 ? String(z) : ''
    }
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    fit()
    return () => ro.disconnect()
  }, [])
  return <div className="paper-fit" ref={ref}>{children}</div>
}
