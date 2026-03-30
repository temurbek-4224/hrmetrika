import { CheckCircle, XCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Toast — renders a single auto-dismissing notification banner
 *
 * Props:
 *   toast   null | { message: string, type: 'success' | 'error' }
 *
 * Usage: pair with useToast hook. Mount once at the top of each page component.
 *   const { toast, showToast } = useToast()
 *   ...
 *   <Toast toast={toast} />
 */
export default function Toast({ toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.message + toast.type}
          initial={{ opacity: 0, x: 60, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 60, scale: 0.95 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className={`fixed top-4 right-4 z-[200] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold text-white max-w-xs ${
            toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
          }`}
        >
          {toast.type === 'success'
            ? <CheckCircle size={16} className="shrink-0" />
            : <XCircle    size={16} className="shrink-0" />
          }
          <span className="leading-tight">{toast.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
