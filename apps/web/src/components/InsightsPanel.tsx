import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store';
import { X, Lightbulb } from 'lucide-react';

export function InsightsPanel() {
  const { insights, insightsDismissed, dismissInsights, repoStructure } = useStore();

  const visible = repoStructure && !insightsDismissed && insights.length > 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.3, delay: 0.6, ease: 'easeOut' }}
          className="absolute bottom-20 left-4 z-30 w-[260px] bg-card/90 backdrop-blur-md border border-border/60 rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
            <div className="flex items-center gap-2 text-xs font-semibold font-mono text-foreground/70 uppercase tracking-wider">
              <Lightbulb className="w-3 h-3" />
              Auto Insights
            </div>
            <button
              onClick={dismissInsights}
              className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Insight list */}
          <ul className="px-4 py-3 space-y-2">
            {insights.map((insight, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.08, duration: 0.25 }}
                className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed"
              >
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-foreground/30 flex-shrink-0" />
                {insight}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
