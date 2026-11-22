// يضع اسم العمود على كل خلية حتى تظهر الجداول كبطاقات على الهاتف
export function startTableLabels() {
  const label = () => {
    document.querySelectorAll('table.t').forEach((tb) => {
      const head = tb.tHead?.rows[0]
      if (!head) return
      const names = [...head.cells].flatMap((c) => Array(c.colSpan || 1).fill(c.textContent.trim()))
      ;[...tb.tBodies].concat(tb.tFoot ? [tb.tFoot] : []).forEach((sec) => {
        ;[...sec.rows].forEach((r) => {
          let i = 0
          ;[...r.cells].forEach((c) => {
            const n = c.colSpan > 1 ? '' : names[i] || ''
            if (c.dataset.l !== n) c.dataset.l = n
            i += c.colSpan || 1
          })
        })
      })
    })
  }
  let raf = 0
  const mo = new MutationObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(label) })
  mo.observe(document.body, { childList: true, subtree: true, characterData: true })
  label()
}
