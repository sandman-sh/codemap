import { useState } from 'react';
import { useStore } from '@/store';
import { useExplainFlow, CodeNode } from '@codemapai/api-client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Waypoints, Play } from 'lucide-react';

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

export function FlowTab() {
  const { selectedNodes, repoStructure, flowExplanations, cacheFlowExplanation } = useStore();
  const explainFlowMutation = useExplainFlow();
  const [responseFlowKey, setResponseFlowKey] = useState<string | null>(null);

  if (selectedNodes.length < 2) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground animate-in fade-in">
        <Waypoints className="w-12 h-12 mb-4 opacity-20" />
        <p className="mb-2 font-medium text-foreground">Select multiple nodes</p>
        <p className="text-sm">Hold Shift and click on at least 2 nodes to map the data flow between them.</p>
      </div>
    );
  }

  const nodes = repoStructure 
    ? selectedNodes.map(id => findNodeById(repoStructure.rootNode, id)).filter(Boolean) as CodeNode[]
    : [];

  const flowKey = selectedNodes.slice().sort().join(',');
  const cachedData = flowExplanations[flowKey];

  const handleExplain = () => {
    if (!repoStructure) return;
    explainFlowMutation.mutate({
      data: {
        nodeIds: nodes.map(n => n.id),
        nodePaths: nodes.map(n => n.path),
        repoName: repoStructure.repoName,
        nodeContents: nodes.map(n => n.content),
        sourceUrl: repoStructure.sourceUrl,
        branch: repoStructure.branch,
      }
    }, {
      onSuccess: (data) => {
        setResponseFlowKey(flowKey);
        cacheFlowExplanation(flowKey, data);
      }
    });
  };

  const isLoading = explainFlowMutation.isPending;
  const data = cachedData || (responseFlowKey === flowKey ? explainFlowMutation.data : undefined);

  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold font-mono tracking-tight">Data Flow</h2>
        <p className="text-sm text-muted-foreground">Analyzing connections between {nodes.length} points.</p>
      </div>

      <div className="flex flex-col gap-2 p-4 bg-accent/30 border border-border rounded-xl">
        {nodes.map((n, i) => (
          <div key={n.id} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-xs font-mono">
              {i + 1}
            </div>
            <span className="font-mono text-sm truncate">{n.name}</span>
            {i < nodes.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto opacity-50" />}
          </div>
        ))}
      </div>

      {!data && !isLoading && (
        <Button onClick={handleExplain} className="w-full py-6 text-base shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]">
          <Play className="w-5 h-5 mr-2 fill-current" /> Map Data Flow
        </Button>
      )}

      {isLoading && (
        <div className="space-y-4">
           {[1, 2, 3].map(i => (
             <div key={i} className="flex gap-4">
               <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
               <div className="space-y-2 flex-1">
                 <Skeleton className="h-4 w-1/3" />
                 <Skeleton className="h-12 w-full" />
               </div>
             </div>
           ))}
        </div>
      )}

      {data && (
        <div className="space-y-8 mt-8">
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary-foreground text-sm leading-relaxed">
            <span className="font-bold text-primary block mb-1">Summary</span>
            {data.summary}
          </div>

          <div className="relative space-y-6 before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {data.steps.map((step, i) => (
              <div key={i} className="relative flex items-start gap-6 group">
                <div className="w-8 h-8 rounded-full bg-card border-2 border-primary text-primary flex items-center justify-center text-sm font-bold z-10 shadow-lg shadow-background relative">
                  {step.stepNumber}
                </div>
                <div className="flex-1 pt-1 pb-4">
                   <h4 className="text-sm font-mono font-bold mb-2 text-foreground break-all">{step.nodePath || 'System'}</h4>
                   <p className="text-sm text-muted-foreground leading-relaxed bg-accent/20 p-4 rounded-xl border border-border/50">
                     {step.description}
                   </p>
                   {(step.dataIn || step.dataOut) && (
                     <div className="mt-3 grid grid-cols-2 gap-4">
                       {step.dataIn && (
                         <div className="text-xs p-2 rounded bg-background border border-border">
                           <span className="text-muted-foreground block mb-1">Input</span>
                           <code className="text-primary">{step.dataIn}</code>
                         </div>
                       )}
                       {step.dataOut && (
                         <div className="text-xs p-2 rounded bg-background border border-border">
                           <span className="text-muted-foreground block mb-1">Output</span>
                           <code className="text-primary">{step.dataOut}</code>
                         </div>
                       )}
                     </div>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
