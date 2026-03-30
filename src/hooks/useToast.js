import { useState, useCallback } from 'react'

/**
 * useToast — lightweight toast state hook
 *
 * Returns:
 *   toast     null | { message: string, type: 'success' | 'error' }
 *   showToast (message: string, type?: string) => void
 *
 * Usage:
 *   const { toast, showToast } = useToast()
 *   showToast('Saved successfully')
 *   showToast('Something went wrong', 'error')
 *
 *   // In JSX render at top level of your page component:
 *   <Toast toast={toast} />
 */
export function useToast(duration = 3200) {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), duration)
  }, [duration])

  return { toast, showToast }
}
