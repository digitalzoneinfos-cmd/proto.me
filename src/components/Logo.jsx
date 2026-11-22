import { useId } from 'react'

/** شعار ProtoFlow — من تصميم PROTO.ME */
export function LogoMark({ size = 32 }) {
  // معرّفات فريدة للتدرّجات حتى لا يختفي الشعار إذا كانت نسخة أخرى منه مخفية
  const id = useId().replace(/:/g, '')
  return (
    <svg width={size} height={size * 1.03} viewBox="-4 -4 208 212" aria-hidden="true" style={{ flex: 'none', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#14b8ff" />
          <stop offset="1" stopColor="#2b3dff" />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="1" x2="0.6" y2="0">
          <stop offset="0" stopColor="#8b3dff" />
          <stop offset="1" stopColor="#2b3dff" />
        </linearGradient>
      </defs>
      <path d="M58 0H142A58 58 0 0 1 142 116H96L110 82H140A24 24 0 0 0 140 34H44Z" fill={`url(#${id}t)`} />
      <path d="M82 82H126L74 198Q70 204 60 204H26Z" fill={`url(#${id}s)`} />
    </svg>
  )
}

/** "Proto" يأخذ لون النص المحيط (أبيض على الداكن، أسود على الفاتح) */
export default function Logo({ size = 30 }) {
  return (
    <span className="pf-logo" dir="ltr" style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.32 }}>
      <LogoMark size={size} />
      <span style={{ fontFamily: "'Readex Pro', sans-serif", fontWeight: 700, fontSize: size * 0.78, letterSpacing: '-0.02em', lineHeight: 1, whiteSpace: 'nowrap' }}>
        <span style={{ color: 'currentColor' }}>Proto</span>
        <span style={{ color: '#5b6cff' }}>Flow</span>
      </span>
    </span>
  )
}
