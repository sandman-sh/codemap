import { useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type NodeMouseHandler,
  BackgroundVariant,
  PanOnScrollMode,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '@/store';
import { CodeNodeComponent } from './CodeNodeComponent';
import { getLayoutedElements } from '@/lib/layout';
import type { CodeNode } from '@codemapai/api-client';
import { motion } from 'framer-motion';
import { Github, Upload, Play, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { MOCK_REPO } from '@/lib/mock-data';
import { InsightsPanel } from '@/components/InsightsPanel';

const nodeTypes = { codeNode: CodeNodeComponent };

/** Collect all node IDs in a flat set */
function collectAllIds(node: CodeNode, out: Set<string> = new Set()): Set<string> {
  out.add(node.id);
  node.children?.forEach(c => collectAllIds(c, out));
  return out;
}

/**
 * Inner component — must be a child of <ReactFlow> to call useReactFlow().
 * Watches highlighted nodes + search matches and moves the viewport.
 */
function MapController({
  highlightedNodes,
  searchMatchedIds,
}: {
  highlightedNodes: string[];
  searchMatchedIds: Set<string> | null;
}) {
  const { fitView } = useReactFlow();
  const prevHighlighted = useRef<string[]>([]);

  useEffect(() => {
    const changed =
      highlightedNodes.length !== prevHighlighted.current.length ||
      highlightedNodes.some((id, i) => id !== prevHighlighted.current[i]);
    if (!changed || highlightedNodes.length === 0) return;
    prevHighlighted.current = highlightedNodes;

    setTimeout(() => {
      fitView({
        nodes: highlightedNodes.map(id => ({ id })),
        duration: 500,
        padding: 0.35,
        maxZoom: 1.4,
      });
    }, 60);
  }, [highlightedNodes, fitView]);

  useEffect(() => {
    if (!searchMatchedIds || searchMatchedIds.size === 0) return;
    setTimeout(() => {
      fitView({
        nodes: [...searchMatchedIds].map(id => ({ id })),
        duration: 450,
        padding: 0.3,
        maxZoom: 1.6,
      });
    }, 60);
  }, [searchMatchedIds, fitView]);

  return null;
}


export function MindMap() {
  const {
    repoStructure,
    expandedNodes,
    toggleExpanded,
    selectedNodes,
    toggleSelection,
    learningPathMode,
    learningPath,
    setRepoStructure,
    highlightedNodes,
    searchQuery,
    devMode,
  } = useStore();

  const handleLoadDemo = useCallback(() => setRepoStructure(MOCK_REPO), [setRepoStructure]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // --- Search matching ---
  const searchMatchedIds = useMemo<Set<string> | null>(() => {
    if (!searchQuery.trim() || !repoStructure) return null;
    const q = searchQuery.toLowerCase();
    const matched = new Set<string>();
    const traverse = (node: CodeNode) => {
      if (node.name.toLowerCase().includes(q)) matched.add(node.id);
      node.children?.forEach(traverse);
    };
    traverse(repoStructure.rootNode);
    return matched;
  }, [searchQuery, repoStructure]);

  // --- Layout computation ---
  const { layoutedNodes, layoutedEdges } = useMemo(() => {
    if (!repoStructure) return { layoutedNodes: [], layoutedEdges: [] };

    const flatNodes: CodeNode[] = [];
    const rawEdges: Edge[] = [];

    const learningStepsMap = new Map<string, number>();
    if (learningPathMode && learningPath) {
      learningPath.steps.forEach(step => {
        if (step.nodeId) learningStepsMap.set(step.nodeId, step.order);
      });
    }

    const traverse = (node: CodeNode, parentId: string | null) => {
      flatNodes.push(node);
      if (parentId) {
        const isSelected = selectedNodes.includes(node.id);
        rawEdges.push({
          id: `${parentId}->${node.id}`,
          source: parentId,
          target: node.id,
          type: 'smoothstep',
          animated: learningStepsMap.has(node.id) || isSelected,
          style: {
            stroke: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))',
            strokeWidth: isSelected ? 2 : 1,
          },
        });
      }
      if (expandedNodes.has(node.id) && node.children) {
        node.children.forEach(child => traverse(child, node.id));
      }
    };

    traverse(repoStructure.rootNode, null);

    const rfNodes: Node[] = flatNodes.map(n => ({
      id: n.id,
      type: 'codeNode',
      position: { x: 0, y: 0 },
      data: {
        node: n,
        isExpanded: expandedNodes.has(n.id),
        isSelected: selectedNodes.includes(n.id),
        isHighlighted: highlightedNodes.includes(n.id),
        isDimmed: searchMatchedIds !== null && !searchMatchedIds.has(n.id),
        learningStep: learningStepsMap.get(n.id),
        onToggleExpand: toggleExpanded,
      },
    }));

    const { nodes: ln, edges: le } = getLayoutedElements(rfNodes, rawEdges, 'LR');
    return { layoutedNodes: ln, layoutedEdges: le };
  }, [
    repoStructure,
    expandedNodes,
    selectedNodes,
    toggleExpanded,
    learningPathMode,
    learningPath,
    highlightedNodes,
    searchMatchedIds,
  ]);

  // Sync layout → React Flow internal state (preserving user-dragged positions)
  useEffect(() => {
    setNodes(prev => {
      const prevMap = new Map(prev.map(n => [n.id, n]));
      return layoutedNodes.map(ln => {
        const existing = prevMap.get(ln.id);
        return existing
          ? { ...ln, position: existing.position, data: ln.data }
          : ln;
      });
    });
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (event, node) => toggleSelection(node.id, event.shiftKey || event.metaKey),
    [toggleSelection],
  );

  // --- Empty state ---
  if (!repoStructure) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background relative overflow-hidden">
        {/* Subtle radial glow behind the card */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full bg-foreground/[0.02] blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="relative text-center w-full max-w-sm px-6"
        >
          {/* Logo mark */}
          <div className="mx-auto mb-7 w-16 h-16 rounded-2xl border border-border/40 bg-card shadow-xl flex items-center justify-center">
            <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
              <circle cx="8" cy="20" r="4" stroke="currentColor" strokeWidth="1.5" className="text-foreground/50"/>
              <circle cx="32" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" className="text-foreground/50"/>
              <circle cx="32" cy="32" r="4" stroke="currentColor" strokeWidth="1.5" className="text-foreground/50"/>
              <circle cx="20" cy="20" r="5" fill="currentColor" className="text-foreground/25"/>
              <line x1="13" y1="18" x2="27" y2="10" stroke="currentColor" strokeWidth="1.5" className="text-border"/>
              <line x1="13" y1="22" x2="27" y2="30" stroke="currentColor" strokeWidth="1.5" className="text-border"/>
            </svg>
          </div>

          <h2 className="text-2xl font-bold font-mono tracking-tight text-foreground mb-2">
            Visualize Your Codebase
          </h2>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Turn any GitHub repository or ZIP file into an interactive mindmap with AI-powered insights.
          </p>

          {/* Primary action — GitHub URL */}
          <button
            onClick={() => document.dispatchEvent(new CustomEvent('focus-github-input'))}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-foreground text-background hover:opacity-90 transition-opacity mb-3 font-semibold text-sm shadow-lg"
          >
            <Github className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 text-left">Paste a GitHub URL</span>
            <ArrowRight className="w-4 h-4 opacity-60" />
          </button>

          {/* Secondary actions */}
          <div className="flex gap-3">
            <button
              onClick={() => document.dispatchEvent(new CustomEvent('trigger-zip-upload'))}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border/60 bg-card hover:bg-accent hover:border-border text-sm font-medium text-foreground/80 hover:text-foreground transition-all duration-200"
            >
              <Upload className="w-4 h-4" />
              Upload ZIP
            </button>
            <button
              onClick={handleLoadDemo}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border/40 hover:border-border/70 text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              <Play className="w-4 h-4" />
              Try Example
            </button>
          </div>

          <p className="mt-6 text-[11px] text-muted-foreground/40">
            Public GitHub repos only · No account needed
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.25, maxZoom: 1.2 }}
        minZoom={0.05}
        maxZoom={3}
        className="touch-none"
        style={{ userSelect: 'none' }}
        proOptions={{ hideAttribution: true }}
        panOnDrag={true}
        panOnScroll={true}
        panOnScrollMode={PanOnScrollMode.Free}
        panOnScrollSpeed={0.6}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={true}
        zoomActivationKeyCode={null}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        selectionOnDrag={false}
        connectOnClick={false}
        autoPanOnNodeDrag={true}
        preventScrolling={true}
      >
        {/* Subtle 1px line grid */}
        <Background
          variant={BackgroundVariant.Lines}
          gap={22}
          lineWidth={1}
          color="rgba(255,255,255,0.05)"
        />
        <Controls
          className="bg-card border border-border shadow-lg rounded-xl overflow-hidden"
          showInteractive={false}
          position="bottom-left"
        />
        <MiniMap
          nodeColor={n =>
            n.data?.isHighlighted
              ? 'hsl(var(--foreground))'
              : n.data?.isSelected
                ? 'hsl(var(--primary))'
                : 'hsl(var(--muted-foreground))'
          }
          maskColor="hsl(var(--background) / 0.7)"
          className="bg-card border border-border shadow-lg rounded-xl"
          position="bottom-right"
        />

        {/* Viewport controller — must live inside ReactFlow */}
        <MapController
          highlightedNodes={highlightedNodes}
          searchMatchedIds={searchMatchedIds}
        />
      </ReactFlow>

      {/* Auto-insights panel (bottom-left, above controls) */}
      <InsightsPanel />

      {/* Dev-mode banner */}
      {devMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="bg-card/90 backdrop-blur-sm border border-border/60 rounded-full px-4 py-1.5 text-xs font-mono text-foreground/60 shadow-md">
            Guided Mode · Entry point highlighted · Click it to explore
          </div>
        </div>
      )}
    </div>
  );
}
