import { useEffect, useState } from 'react';
import { useExplainNode } from '@codemapai/api-client';
import { useStore } from '@/store';
import { CodeNode } from '@codemapai/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Sparkles, Network, ShieldCheck, Wrench, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function findNodeById(root: CodeNode, id: string): CodeNode | null {
  if (root.id === id) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
}

interface AuditResult {
  score: number;
  summary: string;
  vulnerabilities: Array<{
    severity: string;
    type: string;
    lineHint?: string;
    issue: string;
    remediation: string;
  }>;
  bestPractices: string[];
}

interface RefactorResult {
  summary: string;
  refactoredCode: string;
  keyImprovements: string[];
}

export function ExplainTab() {
  const { selectedNodes, repoStructure, explanations, cacheExplanation } = useStore();
  const { toast } = useToast();
  
  const nodeId = selectedNodes[0];
  const node = repoStructure ? findNodeById(repoStructure.rootNode, nodeId) : null;
  const cachedData = explanations[nodeId];

  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  const [refactorLoading, setRefactorLoading] = useState(false);
  const [refactorResult, setRefactorResult] = useState<RefactorResult | null>(null);

  const explainMutation = useExplainNode();

  useEffect(() => {
    setAuditResult(null);
    setRefactorResult(null);
    if (node && !cachedData && !explainMutation.isPending && repoStructure) {
      function buildRepoContext(repoStructure: any): string {
        const paths: string[] = [];
        function traverse(node: any) {
          if (node.type === 'file') paths.push(node.path);
          node.children?.forEach(traverse);
        }
        traverse(repoStructure.rootNode);
        return `Repository with ${repoStructure.fileCount} files. Languages: ${repoStructure.languages.join(', ')}. Key paths: ${paths.slice(0, 20).join(', ')}`;
      }

      explainMutation.mutate({
        data: {
          nodeId: node.id,
          nodeName: node.name,
          nodePath: node.path,
          nodeType: node.type,
          repoName: repoStructure.repoName,
          repoContext: buildRepoContext(repoStructure)
        }
      }, {
        onSuccess: (data) => {
          cacheExplanation(node.id, data);
        }
      });
    }
  }, [nodeId, node, cachedData, repoStructure]);

  if (!node) return null;

  const isLoading = explainMutation.isPending && !cachedData;
  const data = cachedData || explainMutation.data;

  const runSecurityAudit = async () => {
    setAuditLoading(true);
    try {
      const res = await fetch('/api/ai/security-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          code: `${node.name} (${node.path})`,
          filePath: node.path,
          language: node.language || 'TypeScript',
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error("Backend API is unreachable. Please ensure the backend server ('pnpm dev:api') is running on port 3001.");
      }

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Security audit failed");
      }
      setAuditResult(json);
      toast({ title: "Security Audit Complete", description: `Security score: ${json.score}/100` });
    } catch (err: any) {
      toast({ title: "Audit Failed", description: err?.message || "Could not perform security audit.", variant: "destructive" });
    } finally {
      setAuditLoading(false);
    }
  };

  const runRefactor = async () => {
    setRefactorLoading(true);
    try {
      const res = await fetch('/api/ai/refactor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          code: `${node.name} (${node.path})`,
          filePath: node.path,
          focus: "performance and modern best practices",
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error("Backend API is unreachable. Please ensure the backend server ('pnpm dev:api') is running on port 3001.");
      }

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Refactoring failed");
      }
      setRefactorResult(json);
      toast({ title: "Refactor Analysis Complete", description: "AI code optimizations generated." });
    } catch (err: any) {
      toast({ title: "Refactor Failed", description: err?.message || "Could not generate refactor suggestions.", variant: "destructive" });
    } finally {
      setRefactorLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!data) return;
    const text = `Explanation for ${node.name}:\n\nWhat it is:\n${data.what}\n\nWhy it exists:\n${data.why}\n\nConnections:\n${data.connections}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard", description: "Explanation copied successfully." });
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline" className="font-mono text-xs uppercase bg-accent/50">{node.type}</Badge>
          {data?.complexity && <Badge variant="secondary" className="text-xs capitalize">{data.complexity} Complexity</Badge>}
        </div>
        <h2 className="text-2xl font-bold font-mono tracking-tight break-all">{node.name}</h2>
        <p className="text-sm text-muted-foreground font-mono truncate">{node.path}</p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-[140px]" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-[100px]" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      ) : data ? (
        <div className="space-y-8">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> What it does
            </h3>
            <div className="p-4 rounded-xl bg-accent/30 border border-border/50 text-sm leading-relaxed text-foreground/90">
              {data.what}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
              <Network className="w-4 h-4" /> Architecture Context
            </h3>
            <div className="p-4 rounded-xl bg-accent/30 border border-border/50 text-sm leading-relaxed text-foreground/90">
              <span className="font-semibold block mb-1">Why it exists:</span>
              {data.why}
              <div className="h-px bg-border/50 my-3" />
              <span className="font-semibold block mb-1">Connections:</span>
              {data.connections}
            </div>
          </div>

          {data.tips && data.tips.length > 0 && (
            <div className="space-y-3">
               <h3 className="text-sm font-semibold text-primary uppercase tracking-widest">Key Insights</h3>
               <ul className="space-y-2">
                 {data.tips.map((tip, i) => (
                   <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                     <span className="text-primary mt-0.5">•</span> {tip}
                   </li>
                 ))}
               </ul>
            </div>
          )}

          {/* Interactive Debug & Security Tools */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Node Debug & AI Tools
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm" onClick={runSecurityAudit} disabled={auditLoading} className="w-full text-xs">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                {auditLoading ? "Auditing..." : "Security Audit"}
              </Button>
              <Button variant="outline" size="sm" onClick={runRefactor} disabled={refactorLoading} className="w-full text-xs">
                <Wrench className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                {refactorLoading ? "Refactoring..." : "AI Refactor"}
              </Button>
            </div>

            {/* Audit Results View */}
            {auditResult && (
              <div className="p-4 rounded-xl bg-accent/40 border border-border/60 space-y-3 animate-in fade-in text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-muted-foreground">Security Posture</span>
                  <Badge variant={auditResult.score >= 80 ? "default" : "destructive"}>
                    Score: {auditResult.score}/100
                  </Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed">{auditResult.summary}</p>
                {auditResult.vulnerabilities.map((v, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-destructive flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {v.type}
                      </span>
                      <Badge variant="outline" className="text-[10px] capitalize">{v.severity}</Badge>
                    </div>
                    <p className="text-foreground/90">{v.issue}</p>
                    <p className="text-muted-foreground italic">Fix: {v.remediation}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Refactor Results View */}
            {refactorResult && (
              <div className="p-4 rounded-xl bg-accent/40 border border-border/60 space-y-3 animate-in fade-in text-xs">
                <div className="flex items-center gap-1.5 font-bold text-primary">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Refactor Suggestions
                </div>
                <p className="text-muted-foreground">{refactorResult.summary}</p>
                {refactorResult.keyImprovements.map((imp, i) => (
                  <div key={i} className="text-muted-foreground flex items-start gap-1.5">
                    <span className="text-emerald-500">•</span> {imp}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button variant="outline" className="w-full mt-4" onClick={copyToClipboard}>
            <Copy className="w-4 h-4 mr-2" /> Copy Analysis
          </Button>
        </div>
      ) : explainMutation.isError ? (
        <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-xl text-destructive text-sm">
          Failed to generate explanation. Please try again.
        </div>
      ) : null}
    </div>
  );
}
