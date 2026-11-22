import { useId } from 'react'

/**
 * أيقونات متدرّجة بأسلوب ProtoFlow (سماوي ← أزرق ← بنفسجي) بطابع ثلاثي الأبعاد ناعم.
 * <GIcon name="expenses" size={56} />
 */
export default function GIcon({ name, size = 56, className, style }) {
  const u = useId().replace(/:/g, '')
  const A = `url(#${u}a)` // cyan → blue
  const B = `url(#${u}b)` // blue → violet
  const C = `url(#${u}c)` // light paper
  const D = `url(#${u}d)` // teal → cyan
  const V = `url(#${u}v)` // violet
  const W = 'rgba(255,255,255,.92)'
  const S = 'rgba(255,255,255,.55)'

  const body = {
    expenses: (
      <>
        <rect x="16" y="9" width="40" height="28" rx="7" fill={C} opacity=".9" />
        <rect x="6" y="15" width="44" height="30" rx="8" fill={A} />
        <text x="17" y="36" fontSize="11" fontWeight="800" fill={W} fontFamily="Readex Pro, sans-serif">QR</text>
        <rect x="27" y="24" width="15" height="3.4" rx="1.7" fill={S} /><rect x="27" y="31" width="10" height="3.4" rx="1.7" fill={S} />
        <circle cx="47" cy="45" r="11.5" fill={B} stroke="#fff" strokeWidth="2.5" />
        <path d="M41.5 45h10m-4-4.2 4.2 4.2-4.2 4.2" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    revenue: (
      <>
        <rect x="16" y="9" width="40" height="28" rx="7" fill={C} opacity=".9" />
        <rect x="6" y="15" width="44" height="30" rx="8" fill={D} />
        <text x="17" y="36" fontSize="11" fontWeight="800" fill={W} fontFamily="Readex Pro, sans-serif">QR</text>
        <rect x="27" y="24" width="15" height="3.4" rx="1.7" fill={S} /><rect x="27" y="31" width="10" height="3.4" rx="1.7" fill={S} />
        <circle cx="47" cy="45" r="11.5" fill={A} stroke="#fff" strokeWidth="2.5" />
        <path d="M52.5 45h-10m4-4.2-4.2 4.2 4.2 4.2" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    suggestion: (
      <>
        <path d="M8 14a8 8 0 0 1 8-8h32a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8H24l-10 9v-9h0a6 6 0 0 1-6-6z" fill={B} />
        {[16, 24, 32, 40].map((x) => <path key={x} d={`M${x} 13.5l1.3 2.7 3 .4-2.2 2 .5 3-2.6-1.4-2.6 1.4.5-3-2.2-2 3-.4z`} fill={W} />)}
        <rect x="15" y="27" width="34" height="3.2" rx="1.6" fill={S} /><rect x="15" y="33" width="22" height="3.2" rx="1.6" fill={S} />
      </>
    ),
    supply: (
      <>
        <path d="M20 8l14-2 9 5v13l-14 2-9-5z" fill={A} /><path d="M29 15l14-4v13l-14 2z" fill="rgba(0,0,40,.18)" />
        <rect x="27" y="8" width="5" height="6" rx="1" fill={S} />
        <path d="M4 30l14-2 9 5v14l-14 2-9-5z" fill={V} /><path d="M13 37l14-4v14l-14 2z" fill="rgba(0,0,40,.2)" />
        <path d="M30 30l14-2 9 5v14l-14 2-9-5z" fill={B} /><path d="M39 37l14-4v14l-14 2z" fill="rgba(0,0,40,.2)" />
        <rect x="11" y="30" width="5" height="6" rx="1" fill={S} /><rect x="37" y="30" width="5" height="6" rx="1" fill={S} />
      </>
    ),
    receipt: (
      <>
        <path d="M12 6h28l12 12v34l-5-3-5 3-5-3-5 3-5-3-5 3-5-3V6z" fill={C} />
        <path d="M40 6l12 12H44a4 4 0 0 1-4-4z" fill={V} />
        <text x="17" y="26" fontSize="13" fontWeight="800" fill="#3040d8" fontFamily="Readex Pro, sans-serif">QAR</text>
        <rect x="17" y="32" width="28" height="3.2" rx="1.6" fill="#8fa2ff" /><rect x="17" y="38" width="24" height="3.2" rx="1.6" fill="#a9b7ff" /><rect x="17" y="44" width="16" height="3.2" rx="1.6" fill="#c1ccff" />
      </>
    ),
    team: (
      <>
        <circle cx="15" cy="21" r="7" fill={D} /><path d="M3 44a12 12 0 0 1 24 0v2H3z" fill={D} />
        <circle cx="49" cy="21" r="7" fill={V} opacity=".85" /><path d="M37 44a12 12 0 0 1 24 0v2H37z" fill={V} opacity=".85" />
        <circle cx="32" cy="17" r="9.5" fill={A} stroke="#fff" strokeWidth="2" />
        <path d="M16 50a16 16 0 0 1 32 0v1H16z" fill={B} stroke="#fff" strokeWidth="2" />
      </>
    ),
    stock: (
      <>
        <rect x="6" y="6" width="5" height="52" rx="2.5" fill={B} /><rect x="53" y="6" width="5" height="52" rx="2.5" fill={B} />
        <rect x="8" y="30" width="48" height="4" fill={B} /><rect x="8" y="52" width="48" height="4" fill={B} />
        <rect x="14" y="13" width="17" height="15" rx="3" fill={D} /><rect x="34" y="13" width="17" height="15" rx="3" fill={V} />
        <rect x="14" y="36" width="17" height="14" rx="3" fill={D} /><rect x="34" y="36" width="17" height="14" rx="3" fill={V} />
        {[[20, 13], [40, 13], [20, 36], [40, 36]].map(([x, y]) => <rect key={x + '' + y} x={x} y={y} width="5" height="5" rx="1" fill={S} />)}
      </>
    ),
    report: (
      <>
        <path d="M12 6h28l12 12v34a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6z" fill={C} />
        <path d="M40 6l12 12H44a4 4 0 0 1-4-4z" fill={V} />
        <rect x="18" y="34" width="7" height="9" rx="1.8" fill={D} /><rect x="28" y="28" width="7" height="15" rx="1.8" fill={A} /><rect x="38" y="22" width="7" height="21" rx="1.8" fill={V} />
        <path d="M17 27c7-1 13-5 19-12" stroke="#14b8c8" strokeWidth="2.4" fill="none" strokeLinecap="round" /><path d="M31 14l5 1-1 5" stroke="#14b8c8" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="18" y="47" width="27" height="3" rx="1.5" fill="#a9b7ff" />
      </>
    ),
    dashboard: (
      <>
        <path d="M8 44a24 24 0 0 1 48 0" stroke={`url(#${u}g)`} strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M32 44l11-13" stroke="#1b2a8f" strokeWidth="3.4" strokeLinecap="round" />
        <circle cx="32" cy="44" r="5.5" fill="#1b2a8f" /><circle cx="32" cy="44" r="2.4" fill="#5b6cff" />
      </>
    ),
    truck: (
      <>
        <rect x="4" y="14" width="34" height="26" rx="5" fill={A} />
        <path d="M38 22h10l9 9v9H38z" fill={B} /><path d="M41 25h6l5 6H41z" fill={S} />
        <rect x="9" y="20" width="16" height="3.2" rx="1.6" fill={S} />
        <circle cx="15" cy="44" r="6" fill="#1b2a8f" stroke="#fff" strokeWidth="2.4" /><circle cx="47" cy="44" r="6" fill="#1b2a8f" stroke="#fff" strokeWidth="2.4" />
      </>
    ),
    lock: (
      <>
        <path d="M32 4l22 8v15c0 14-9 25-22 31C19 52 10 41 10 27V12z" fill={B} />
        <path d="M32 4l22 8v15c0 14-9 25-22 31z" fill="rgba(0,0,40,.15)" />
        <rect x="21" y="26" width="22" height="17" rx="4" fill={W} /><path d="M25 26v-4a7 7 0 0 1 14 0v4" stroke={W} strokeWidth="3.4" fill="none" />
        <circle cx="32" cy="34" r="2.6" fill="#3d4fff" />
      </>
    ),
    phone: (
      <>
        <rect x="16" y="3" width="32" height="58" rx="8" fill={B} />
        <rect x="19.5" y="9" width="25" height="44" rx="3.5" fill={C} />
        <rect x="27" y="5.4" width="10" height="2.2" rx="1.1" fill={S} />
        <path d="M32 19v15m-6-6 6 6 6-6" stroke="#3d4fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="24" y="40" width="16" height="3.2" rx="1.6" fill="#a9b7ff" />
      </>
    ),
    calculator: (
      <>
        <rect x="11" y="4" width="42" height="56" rx="9" fill={A} />
        <rect x="17" y="10" width="30" height="13" rx="3.5" fill={C} /><text x="44" y="20.5" fontSize="8.5" fontWeight="800" textAnchor="end" fill="#3040d8" fontFamily="Readex Pro">=492</text>
        {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={r + '' + c} x={17 + c * 11} y={28 + r * 10} width="8" height="7" rx="2" fill={r === 2 && c === 2 ? '#fff' : S} />))}
      </>
    ),
  }[name]

  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id={`${u}a`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1ec8ff" /><stop offset="1" stopColor="#2f45e8" /></linearGradient>
        <linearGradient id={`${u}b`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2f6bff" /><stop offset="1" stopColor="#7a3df0" /></linearGradient>
        <linearGradient id={`${u}c`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f4f7ff" /><stop offset="1" stopColor="#c9d5ff" /></linearGradient>
        <linearGradient id={`${u}d`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#12e0d0" /><stop offset="1" stopColor="#2a7cf0" /></linearGradient>
        <linearGradient id={`${u}v`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8f7bff" /><stop offset="1" stopColor="#6a2fe0" /></linearGradient>
        <linearGradient id={`${u}g`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#12d6d0" /><stop offset=".5" stopColor="#2f6bff" /><stop offset="1" stopColor="#7a3df0" /></linearGradient>
      </defs>
      {body}
    </svg>
  )
}
