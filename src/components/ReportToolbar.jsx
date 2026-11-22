import { t } from '../lib/i18n.jsx'
import { Icon } from './Icons.jsx'

/** أدوات التقرير: تعديل، إرفاق الوصولات، طباعة / PDF، Excel */
export default function ReportToolbar({ editable, setEditable, canEdit, showReceipts, setShowReceipts, onExcel, onReset }) {
  return (
    <div className="panel no-print" style={{ display: 'flex', gap: 10, padding: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      <button className="btn primary" onClick={() => window.print()}><Icon name="print" size={16} />{t('طباعة / حفظ PDF')}</button>
      <button className="btn" onClick={onExcel}><Icon name="download" size={16} />{t('تحميل Excel')}</button>
      {canEdit && (
        <button className={`btn ${editable ? 'blue' : ''}`} onClick={() => setEditable(!editable)}>
          <Icon name={editable ? 'check' : 'edit'} size={16} />{editable ? t('إنهاء التعديل') : t('تعديل النصوص')}
        </button>
      )}
      <label className="btn ghost" style={{ cursor: 'pointer' }}>
        <input type="checkbox" checked={showReceipts} onChange={(e) => setShowReceipts(e.target.checked)} />
        {t('إرفاق صور الوصولات')}
      </label>
      <div style={{ flex: 1 }} />
      {editable && <><span className="faint" style={{ fontSize: 12 }}>{t('اضغط على أي نص محاط بإطار أزرق لتعديله — يُحفظ تلقائياً')}</span>
        <button className="btn sm ghost" onClick={onReset}><Icon name="refresh" size={14} />{t('استرجاع النص التلقائي')}</button></>}
    </div>
  )
}
