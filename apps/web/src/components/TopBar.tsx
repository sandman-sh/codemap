import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/store';
import { useUploadZip, useGetLearningPath } from '@codemapai/api-client';
import { MOCK_REPO } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Sun, Moon, Search, X, Compass, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { clsx } from 'clsx';
import { GitHubOverlay } from './GitHubOverlay';

export function TopBar() {
  const [githubOpen, setGithubOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const {
    setRepoStructure,
    repoStructure,
    learningPathMode, setLearningPathMode, setLearningPath,
    theme, toggleTheme,
    setSearchQuery,
    devMode, setDevMode,
  } = useStore();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadZip();
  const pathMutation = useGetLearningPath();

  // Debounced search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback((val: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearchQuery(val), 180);
  }, [setSearchQuery]);

  // Listen for custom events fired by the empty state
  useEffect(() => {
    const openGithub = () => setGithubOpen(true);
    const openUpload = () => fileInputRef.current?.click();
    document.addEventListener('focus-github-input', openGithub);
    document.addEventListener('trigger-zip-upload', openUpload);
    return () => {
      document.removeEventListener('focus-github-input', openGithub);
      document.removeEventListener('trigger-zip-upload', openUpload);
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate({ data: { file } }, {
      onSuccess: (data) => {
        setRepoStructure(data);
        toast({ title: 'ZIP uploaded', description: `Parsed ${data.fileCount} files.` });
      },
      onError: () => toast({ variant: 'destructive', title: 'Upload failed', description: 'Invalid ZIP file.' }),
    });
  };

  const handleLoadDemo = () => {
    setRepoStructure(MOCK_REPO);
    toast({ title: 'Demo loaded', description: 'Showing sample Todo App structure.' });
  };

  const toggleLearningPath = () => {
    if (learningPathMode) { setLearningPathMode(false); return; }
    if (!repoStructure) return;
    pathMutation.mutate({
      data: { repoName: repoStructure.repoName, rootNode: repoStructure.rootNode, languages: repoStructure.languages }
    }, {
      onSuccess: (data) => { setLearningPath(data); setLearningPathMode(true); }
    });
  };

  return (
    <>
      {/* Hidden file input for ZIP upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* GitHub URL overlay */}
      <GitHubOverlay open={githubOpen} onClose={() => setGithubOpen(false)} />

      <div className="h-14 border-b border-border bg-card/80 backdrop-blur-lg flex items-center justify-between px-5 z-40 relative">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-primary text-primary-foreground flex items-center justify-center rounded-lg shadow-md shadow-primary/20">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <circle cx="3" cy="8" r="2" fill="currentColor" opacity="0.6"/>
              <circle cx="13" cy="3" r="2" fill="currentColor" opacity="0.6"/>
              <circle cx="13" cy="13" r="2" fill="currentColor" opacity="0.6"/>
              <circle cx="8" cy="8" r="2.5" fill="currentColor"/>
              <line x1="5.2" y1="7" x2="11" y2="3.8" stroke="currentColor" strokeWidth="1.2" opacity="0.5"/>
              <line x1="5.2" y1="9" x2="11" y2="12.2" stroke="currentColor" strokeWidth="1.2" opacity="0.5"/>
            </svg>
          </div>
          <h1 className="text-base font-bold font-mono tracking-tighter select-none">
            CodeMapAI
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {repoStructure ? (
            <>
              {/* Repo label */}
              <span className="text-[11px] font-mono text-muted-foreground/60 hidden md:block mr-1">
                {repoStructure.repoName} · {repoStructure.fileCount} files
              </span>

              {/* Search */}
              <div
                className={clsx(
                  'flex items-center gap-1.5 rounded-full border transition-all duration-200 cursor-pointer',
                  localSearch
                    ? 'border-foreground/30 bg-background w-44 px-3 py-1'
                    : 'border-border/50 bg-background hover:border-border/80 w-8 h-8 justify-center',
                )}
                onClick={() => { if (!localSearch) searchRef.current?.focus(); }}
              >
                <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search files…"
                  value={localSearch}
                  onChange={(e) => {
                    setLocalSearch(e.target.value);
                    handleSearchChange(e.target.value);
                  }}
                  className={clsx(
                    'bg-transparent text-xs outline-none placeholder:text-muted-foreground/40 font-mono',
                    localSearch ? 'w-full' : 'w-0 opacity-0',
                  )}
                />
                {localSearch && (
                  <button onClick={(e) => {
                    e.stopPropagation();
                    setLocalSearch('');
                    setSearchQuery('');
                  }}>
                    <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              {/* Start Here */}
              <Button
                variant={devMode ? 'default' : 'outline'}
                size="sm"
                className={clsx(
                  'h-8 rounded-full text-xs',
                  devMode ? 'shadow-md shadow-primary/20' : 'bg-background border-border/60',
                )}
                onClick={() => setDevMode(!devMode)}
              >
                <Compass className={clsx('w-3.5 h-3.5 mr-1.5', devMode ? 'text-primary-foreground' : 'text-foreground/50')} />
                {devMode ? 'Exit Guide' : 'Start Here'}
              </Button>

              {/* Learning Path */}
              <Button
                variant={learningPathMode ? 'default' : 'outline'}
                size="sm"
                className={clsx(
                  'h-8 rounded-full text-xs',
                  learningPathMode ? 'shadow-md shadow-primary/20' : 'bg-background border-border/60',
                )}
                onClick={toggleLearningPath}
                disabled={pathMutation.isPending}
              >
                {pathMutation.isPending
                  ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  : <Sparkles className={clsx('w-3.5 h-3.5 mr-1.5', learningPathMode ? 'text-primary-foreground' : 'text-primary/70')} />
                }
                {learningPathMode ? 'Exit Path' : 'Learning Path'}
              </Button>

              {/* Load different repo */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full text-xs text-muted-foreground hover:text-foreground border border-border/40 hover:border-border/70"
                onClick={() => setGithubOpen(true)}
                title="Load a different repository"
              >
                <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                New Repo
              </Button>
            </>
          ) : (
            /* Empty state — minimal actions in bar */
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs text-muted-foreground hover:text-foreground" onClick={handleLoadDemo}>
                Try Example
              </Button>
            </div>
          )}

          {/* Theme toggle — always visible */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
    </>
  );
}
