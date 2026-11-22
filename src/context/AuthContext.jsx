import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { setLang, getLang } from '../lib/i18n.jsx'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null, membership: null })

  const refresh = useCallback(async () => {
    try {
      const user = await api.getUser()
      const membership = user ? await api.getMembership() : null
      if (membership?.org) api.setOrg(membership.org.id)
      // لغة الأدمن محفوظة في إعدادات المتجر
      if (membership?.role === 'admin' && membership.org?.language && membership.org.language !== getLang()) setLang(membership.org.language)
      setState({ loading: false, user, membership })
    } catch (e) {
      console.error(e)
      setState({ loading: false, user: null, membership: null })
    }
  }, [])

  useEffect(() => {
    refresh()
    return api.onAuthChange(() => refresh())
  }, [refresh])

  const value = {
    ...state,
    refresh,
    isAdmin: state.membership?.role === 'admin',
    org: state.membership?.org,
    setOrg: (org) => setState((s) => ({ ...s, membership: { ...s.membership, org } })),
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
