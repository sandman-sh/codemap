import { useCallback, useRef, useState } from 'react';
import { Mic, MicOff, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useStore } from '@/store';
import { useSpeechToText } from '@/hooks/useVoice';
import { useAskCodebase } from '@codemapai/api-client';

type Command =
  | { type: 'search'; payload: string }
  | { type: 'ask'; payload: string }
  | { type: 'tab'; payload: 'explain' | 'flow' | 'ask' }
  | { type: 'learning-path' }
  | { type: 'dev-mode' }
  | { type: 'expand-all' }
  | { type: 'collapse-all' }
  | { type: 'unknown' };

function parseVoiceCommand(raw: string): Command {
  const t = raw.toLowerCase().trim();

  if (/^(search|find)\s+.+/.test(t))
    return { type: 'search', payload: t.replace(/^(search|find)\s+/, '') };

  if (/^ask\s+.+/.test(t))
    return { type: 'ask', payload: raw.trim().slice(4).trim() };

  if (/^(explain|open explain|show explain)$/.test(t))
    return { type: 'tab', payload: 'explain' };

  if (/^(flow|open flow|show flow|flows)$/.test(t))
    return { type: 'tab', payload: 'flow' };

  if (/^(chat|open chat|open ask|ask tab)$/.test(t))
    return { type: 'tab', payload: 'ask' };

  if (/learning path|show path|open path/.test(t))
    return { type: 'learning-path' };

  if (/start here|guide me|entry point|dev mode/.test(t))
    return { type: 'dev-mode' };

  if (/expand all/.test(t)) return { type: 'expand-all' };
  if (/collapse all/.test(t)) return { type: 'collapse-all' };

  if (t.length > 3) return { type: 'ask', payload: raw.trim() };

  return { type: 'unknown' };
}

function buildRepoContext(repoStructure: any): string {
  const paths: string[] = [];
  function traverse(node: any, depth = 0) {
    const indent = '  '.repeat(depth);
    paths.push(`${indent}${node.name}${node.type === 'folder' ? '/' : ''}`);
    if (depth < 3) node.children?.forEach((c: any) => traverse(c, depth + 1));
  }
  traverse(repoStructure.rootNode);
  return `Repository: ${repoStructure.repoName}\nLanguages: ${repoStructure.languages.join(', ')}\nFiles (${repoStructure.fileCount} total):\n${paths.slice(0, 50).join('\n')}`;
}

export function VoiceCommandFab() {
  const {
    repoStructure,
    setSearchQuery,
    setSidePanelTab,
    setSidePanelOpen,
    setLearningPathMode,
    setLearningPath,
    setDevMode,
    expandAll,
    collapseAll,
  } = useStore();

  const [status, setStatus] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const askMutation = useAskCodebase();

  const showStatus = useCallback(
    (msg: string, type: 'info' | 'success' | 'error' = 'info', duration = 3000) => {
      setStatus(msg);
      setStatusType(type);
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      if (duration > 0) {
        statusTimerRef.current = setTimeout(() => setStatus(''), duration);
      }
    },
    []
  );

  const executeCommand = useCallback(
    (cmd: Command, rawText: string) => {
      if (!repoStructure) {
        showStatus('Load a repo first', 'error');
        return;
      }

      switch (cmd.type) {
        case 'search':
          setSearchQuery(cmd.payload);
          showStatus(`Searching for "${cmd.payload}"`, 'success');
          break;

        case 'tab':
          setSidePanelTab(cmd.payload);
          setSidePanelOpen(true);
          showStatus(`Opened ${cmd.payload} panel`, 'success');
          break;

        case 'learning-path':
          setLearningPathMode(true);
          showStatus('Learning path activated', 'success');
          break;

        case 'dev-mode':
          setDevMode(true);
          showStatus('Dev mode: entry point highlighted', 'success');
          break;

        case 'expand-all':
          expandAll();
          showStatus('Expanded all nodes', 'success');
          break;

        case 'collapse-all':
          collapseAll();
          showStatus('Collapsed all nodes', 'success');
          break;

        case 'ask':
          setSidePanelTab('ask');
          setSidePanelOpen(true);
          showStatus(`Asking: "${cmd.payload.slice(0, 40)}…"`, 'info', 10000);
          askMutation.mutate(
            {
              data: {
                question: cmd.payload,
                repoName: repoStructure.repoName,
                repoContext: buildRepoContext(repoStructure),
              },
            },
            {
              onSuccess: () => showStatus('Answer ready in Ask tab', 'success'),
              onError: () => showStatus('Could not answer. Try again.', 'error'),
            }
          );
          break;

        default:
          showStatus(`Didn't understand: "${rawText.slice(0, 30)}"`, 'error');
      }
    },
    [repoStructure, setSearchQuery, setSidePanelTab, setSidePanelOpen, setLearningPathMode, setLearningPath, setDevMode, expandAll, collapseAll, askMutation, showStatus]
  );

  const { isListening, transcript, startListening, stopListening, isSupported } =
    useSpeechToText({
      onResult: (text) => {
        const cmd = parseVoiceCommand(text);
        executeCommand(cmd, text);
      },
    });

  if (!isSupported) return null;

  return (
    <div className="absolute bottom-5 right-5 z-50 flex flex-col items-end gap-2 pointer-events-none">
      {(status || (isListening && transcript)) && (
        <div
          className={clsx(
            'pointer-events-none px-3 py-2 rounded-xl text-xs font-mono shadow-lg backdrop-blur-md max-w-[220px] text-right',
            statusType === 'success' && 'bg-primary/90 text-primary-foreground',
            statusType === 'error' && 'bg-destructive/90 text-destructive-foreground',
            statusType === 'info' && 'bg-card/95 border border-border text-foreground',
            isListening && !status && 'bg-card/95 border border-border text-foreground'
          )}
        >
          {isListening && !status
            ? transcript || 'Listening…'
            : status}
        </div>
      )}

      <button
        onClick={isListening ? stopListening : startListening}
        title={isListening ? 'Stop listening' : 'Voice command'}
        className={clsx(
          'pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200',
          isListening
            ? 'bg-destructive text-destructive-foreground scale-110 ring-4 ring-destructive/30'
            : 'bg-primary text-primary-foreground hover:scale-105 hover:shadow-xl'
        )}
      >
        {isListening ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
        {isListening && (
          <span className="absolute inset-0 rounded-full animate-ping bg-destructive/40" />
        )}
      </button>
    </div>
  );
}
