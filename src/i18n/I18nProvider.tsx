import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { I18nContext } from './context'
import { detectLang, messages, STORAGE_KEY } from './messages'
import type { Lang } from './messages'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang)

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // 保存できなくても表示は切り替わるので、次回起動時に検出へ戻るだけ
    }
  }, [])

  // 支援技術やブラウザの翻訳機能に、いま表示している言語を伝える
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo(() => ({ lang, setLang, t: messages[lang] }), [lang, setLang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
