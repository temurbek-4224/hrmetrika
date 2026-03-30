import { motion } from 'framer-motion'
import { Inbox } from 'lucide-react'

export default function EmptyState({ title = 'No data', description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card-base flex flex-col items-center justify-center py-16 px-8 text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Inbox size={24} className="text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-xs text-slate-400 max-w-xs mb-4">{description}</p>}
      {action && action}
    </motion.div>
  )
}
