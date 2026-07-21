import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/store';
import { useAskCodebase } from '@codemapai/api-client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, Sparkles, Mic, MicOff, Volume2, Square } from 'lucide-react';
import { clsx } from 'clsx';
import { useSpeechToText, useTextToSpeech } from '@/hooks/useVoice';

type Message = { role: 'user' | 'assistant', content: string, refs?: string[] };

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

function matchRefPathsToNodeIds(refs: string[], repoStructure: any): string[] {
  const ids: string[] = [];
  const refNames = refs.map(r => r.split('/').pop()?.toLowerCase() ?? r.toLowerCase());
  function traverse(node: any) {
    const nodeName = node.name.toLowerCase();
    if (refNames.some(r => nodeName === r || nodeName.startsWith(r.replace(/\.[^.]+$/, '')))) {
      ids.push(node.id);
    }
    node.children?.forEach(traverse);
  }
  traverse(repoStructure.rootNode);
  return ids;
}

function getApiErrorMessage(error: unknown): string {
  const data = error && typeof error === "object" && "data" in error
    ? (error as { data?: unknown }).data
    : undefined;

  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }

  if (error instanceof Error && error.message.trim()) return error.message;

  return "AI request failed. Check the API server logs for details.";
}

export function AskTab() {
  const { repoStructure, setHighlightedNodes, clearHighlights } = useStore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const askMutation = useAskCodebase();
  const bottomRef = useRef<HTMLDivElement>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { speak, isSpeaking, stop: stopSpeaking } = useTextToSpeech();

  const { isListening, transcript, startListening, stopListening, isSupported } =
    useSpeechToText({
      onResult: (text) => {
        setInput(text);
        textareaRef.current?.focus();
      },
      onInterim: (text) => setInput(text),
    });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, askMutation.isPending]);

  const handleHighlightRefs = (refs: string[]) => {
    if (!repoStructure || !refs.length) return;
    const ids = matchRefPathsToNodeIds(refs, repoStructure);
    if (!ids.length) return;
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    setHighlightedNodes(ids);
    highlightTimerRef.current = setTimeout(() => clearHighlights(), 6000);
  };

  useEffect(() => {
    return () => { stopSpeaking(); };
  }, [stopSpeaking]);

  const handleSend = useCallback(() => {
    if (!input.trim() || !repoStructure) return;
    stopSpeaking();
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    askMutation.mutate(
      {
        data: {
          question: userMsg,
          repoName: repoStructure.repoName,
          repoContext: buildRepoContext(repoStructure),
        },
      },
      {
        onSuccess: (data) => {
          const refs = data.referencedPaths ?? [];
          const answer = data.answer;
          setMessages(prev => [...prev, { role: 'assistant', content: answer, refs }]);
          handleHighlightRefs(refs);
          speak(answer);
        },
        onError: (error) => {
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: getApiErrorMessage(error),
              refs: [],
            },
          ]);
        },
      }
    );
  }, [input, repoStructure, askMutation, speak, stopSpeaking]);

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="p-6 pb-2 border-b border-border">
        <h2 className="text-2xl font-bold font-mono tracking-tight flex items-center gap-2">
          <MessageSquare className="w-5 h-5" /> Ask AI
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Chat with your codebase — or use the mic to speak.
        </p>
      </div>

      <ScrollArea className="flex-1 p-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground pt-12">
            <Sparkles className="w-12 h-12 mb-4 opacity-20" />
            <p className="mb-2">Ask anything about the code</p>
            {isSupported && (
              <p className="text-xs opacity-50 mb-4">Or tap the mic to speak your question</p>
            )}
            <div className="flex flex-wrap justify-center gap-2 mt-2 max-w-[300px]">
              <BadgeSuggestion text="Where is auth handled?" onClick={setInput} />
              <BadgeSuggestion text="How is data saved?" onClick={setInput} />
              <BadgeSuggestion text="Find database connections" onClick={setInput} />
            </div>
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={clsx(
                  'flex flex-col max-w-[90%]',
                  msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                )}
              >
                <div
                  className={clsx(
                    'p-4 rounded-2xl text-sm leading-relaxed shadow-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-accent/50 border border-border/50 text-foreground rounded-bl-sm'
                  )}
                >
                  {msg.content}
                </div>

                {msg.role === 'assistant' && (
                  <button
                    onClick={() => isSpeaking ? stopSpeaking() : speak(msg.content)}
                    title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                    className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  >
                    {isSpeaking ? (
                      <><Square className="w-3 h-3" /> Stop</>
                    ) : (
                      <><Volume2 className="w-3 h-3" /> Read aloud</>
                    )}
                  </button>
                )}

                {msg.refs && msg.refs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.refs.map((ref, j) => (
                      <button
                        key={j}
                        onClick={() => handleHighlightRefs([ref])}
                        className="text-[10px] font-mono bg-background border border-border px-2 py-1 rounded-lg hover:border-foreground/40 hover:bg-accent transition-all duration-150 text-muted-foreground hover:text-foreground"
                        title="Click to highlight in map"
                      >
                        {ref.split('/').pop() ?? ref}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {askMutation.isPending && (
              <div className="mr-auto items-start flex max-w-[90%]">
                <div className="p-4 rounded-2xl bg-accent/50 border border-border/50 rounded-bl-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t border-border bg-card">
        <div className="relative group">
          <Textarea
            ref={textareaRef}
            placeholder={isListening ? 'Listening…' : 'Type or speak a question…'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className={clsx(
              'min-h-[80px] resize-none pr-20 bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary rounded-xl',
              isListening && 'border-primary/40 ring-1 ring-primary/30'
            )}
          />

          <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
            {isSupported && (
              <Button
                size="icon"
                variant={isListening ? 'default' : 'outline'}
                className={clsx(
                  'rounded-lg w-8 h-8 transition-all',
                  isListening && 'bg-destructive hover:bg-destructive text-destructive-foreground border-0 ring-2 ring-destructive/30'
                )}
                onClick={isListening ? stopListening : startListening}
                title={isListening ? 'Stop listening' : 'Speak your question'}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </Button>
            )}

            <Button
              size="icon"
              className="rounded-lg w-8 h-8 transition-transform group-focus-within:scale-105"
              onClick={handleSend}
              disabled={!input.trim() || askMutation.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isListening && transcript && (
          <p className="text-xs text-muted-foreground mt-2 font-mono truncate opacity-60">
            {transcript}
          </p>
        )}
      </div>
    </div>
  );
}

function BadgeSuggestion({ text, onClick }: { text: string; onClick: (t: string) => void }) {
  return (
    <button
      onClick={() => onClick(text)}
      className="text-xs px-3 py-1.5 rounded-full border border-border bg-accent/20 hover:bg-accent hover:border-border/80 transition-colors text-muted-foreground hover:text-foreground"
    >
      {text}
    </button>
  );
}
