import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFetchRepo } from '@codemapai/api-client';
import { useStore } from '@/store';
import { useToast } from '@/hooks/use-toast';
import { Github, Loader2, X, ArrowRight } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function GitHubOverlay({ open, onClose }: Props) {
  const [url, setUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { setRepoStructure } = useStore();
  const { toast } = useToast();
  const fetchMutation = useFetchRepo();

  // Focus input when overlay opens
  useEffect(() => {
    if (open) {
      setUrl('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleFetch = () => {
    if (!url.trim() || fetchMutation.isPending) return;
    fetchMutation.mutate({ data: { url: url.trim() } }, {
      onSuccess: (data) => {
        setRepoStructure(data);
        toast({ title: 'Repository loaded', description: `Parsed ${data.fileCount} files.` });
        onClose();
      },
      onError: () => {
        toast({ variant: 'destructive', title: 'Failed to load', description: 'Could not fetch repository. Make sure it is public.' });
      },
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Centered card */}
          <motion.div
            key="card"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed z-50 left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2 w-full max-w-lg px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <div className="flex items-center gap-2.5 text-foreground">
                  <Github className="w-5 h-5" />
                  <span className="font-semibold text-base">Paste a GitHub URL</span>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Input area */}
              <div className="px-6 pb-6">
                <div className="flex items-center gap-3 bg-background border border-border/60 rounded-xl px-4 py-3 focus-within:border-foreground/30 transition-colors">
                  <Github className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="https://github.com/user/repo"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                    className="flex-1 bg-transparent text-sm font-mono outline-none placeholder:text-muted-foreground/40 text-foreground"
                    disabled={fetchMutation.isPending}
                  />
                </div>

                <button
                  onClick={handleFetch}
                  disabled={!url.trim() || fetchMutation.isPending}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-foreground text-background rounded-xl py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                  {fetchMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Fetching…</>
                  ) : (
                    <>Visualize Repository <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

                <p className="mt-3 text-center text-xs text-muted-foreground/50">
                  Only public repositories are supported · Press Esc to close
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
