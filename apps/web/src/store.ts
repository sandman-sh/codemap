import { create } from 'zustand';
import type { 
  CodeNode, 
  RepoStructure, 
  ExplainNodeResponse, 
  LearningPathResponse,
  FlowStep
} from '@codemapai/api-client';

export type SidePanelTab = 'explain' | 'flow' | 'ask';

// Derive actionable insights from a repo structure without any AI call
function generateInsights(repo: RepoStructure): string[] {
  const names: string[] = [];
  const traverse = (node: CodeNode) => {
    names.push(node.name.toLowerCase());
    node.children?.forEach(traverse);
  };
  traverse(repo.rootNode);

  const out: string[] = [];
  const has = (kw: string) => names.some(n => n.includes(kw));

  const entryFile = names.find(n =>
    ['index.js','index.ts','main.js','main.ts','app.js','app.ts','server.js','server.ts']
      .some(e => n === e)
  ) ?? names.find(n => ['index','main','app','server'].some(p => n.startsWith(p)));
  if (entryFile) out.push(`Entry point: ${entryFile}`);

  if (has('auth') || has('login') || has('session') || has('jwt') || has('passport'))
    out.push('Authentication layer detected');
  if (has('db') || has('database') || has('prisma') || has('mongo') || has('postgres') || has('model') || has('schema'))
    out.push('Database / data layer found');
  if (has('api') || has('route') || has('controller') || has('endpoint') || has('handler'))
    out.push('API / routing layer present');
  if (has('test') || has('spec') || has('.test.') || has('.spec.'))
    out.push('Test suite included');

  out.push(`${repo.fileCount} files · ${repo.languages.slice(0, 3).join(', ')}`);
  return out.slice(0, 5);
}

interface MapState {
  // Repo Data
  repoStructure: RepoStructure | null;
  setRepoStructure: (data: RepoStructure | null) => void;

  // Node Expansion
  expandedNodes: Set<string>;
  toggleExpanded: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;

  // Node Selection
  selectedNodes: string[];
  toggleSelection: (id: string, multiSelect: boolean) => void;
  clearSelection: () => void;

  // Node Highlighting (AI response refs)
  highlightedNodes: string[];
  setHighlightedNodes: (ids: string[]) => void;
  clearHighlights: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Auto-insights (derived on repo load)
  insights: string[];
  insightsDismissed: boolean;
  dismissInsights: () => void;

  // Dev mode
  devMode: boolean;
  setDevMode: (active: boolean) => void;

  // UI
  sidePanelTab: SidePanelTab;
  setSidePanelTab: (tab: SidePanelTab) => void;
  isSidePanelOpen: boolean;
  setSidePanelOpen: (isOpen: boolean) => void;

  // Learning path
  learningPathMode: boolean;
  setLearningPathMode: (active: boolean) => void;
  learningPath: LearningPathResponse | null;
  setLearningPath: (data: LearningPathResponse | null) => void;

  // Caching
  explanations: Record<string, ExplainNodeResponse>;
  cacheExplanation: (id: string, data: ExplainNodeResponse) => void;
  flowExplanations: Record<string, { steps: FlowStep[], summary: string }>;
  cacheFlowExplanation: (key: string, data: { steps: FlowStep[], summary: string }) => void;

  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const useStore = create<MapState>((set, get) => ({
  // --- Repo ---
  repoStructure: null,
  setRepoStructure: (data) => set({
    repoStructure: data,
    expandedNodes: data ? new Set([data.rootNode.id]) : new Set(),
    selectedNodes: [],
    highlightedNodes: [],
    searchQuery: '',
    learningPathMode: false,
    learningPath: null,
    isSidePanelOpen: false,
    devMode: false,
    insights: data ? generateInsights(data) : [],
    insightsDismissed: false,
  }),

  // --- Expansion ---
  expandedNodes: new Set(),
  toggleExpanded: (id) => set((state) => {
    const next = new Set(state.expandedNodes);
    next.has(id) ? next.delete(id) : next.add(id);
    return { expandedNodes: next };
  }),
  expandAll: () => set((state) => {
    if (!state.repoStructure) return state;
    const allIds = new Set<string>();
    const traverse = (node: CodeNode) => {
      allIds.add(node.id);
      node.children?.forEach(traverse);
    };
    traverse(state.repoStructure.rootNode);
    return { expandedNodes: allIds };
  }),
  collapseAll: () => set((state) => ({
    expandedNodes: state.repoStructure ? new Set([state.repoStructure.rootNode.id]) : new Set()
  })),

  // --- Selection ---
  selectedNodes: [],
  toggleSelection: (id, multiSelect) => set((state) => {
    let next: string[];
    if (multiSelect) {
      next = state.selectedNodes.includes(id)
        ? state.selectedNodes.filter(n => n !== id)
        : [...state.selectedNodes, id];
    } else {
      next = state.selectedNodes.includes(id) && state.selectedNodes.length === 1 ? [] : [id];
    }
    let tab = state.sidePanelTab;
    if (next.length === 1 && tab === 'flow') tab = 'explain';
    if (next.length > 1) tab = 'flow';
    return { selectedNodes: next, isSidePanelOpen: next.length > 0 || state.isSidePanelOpen, sidePanelTab: tab };
  }),
  clearSelection: () => set({ selectedNodes: [] }),

  // --- Highlights ---
  highlightedNodes: [],
  setHighlightedNodes: (ids) => set({ highlightedNodes: ids }),
  clearHighlights: () => set({ highlightedNodes: [] }),

  // --- Search ---
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  // --- Insights ---
  insights: [],
  insightsDismissed: false,
  dismissInsights: () => set({ insightsDismissed: true }),

  // --- Dev mode ---
  devMode: false,
  setDevMode: (active) => {
    const { repoStructure } = get();
    if (!active || !repoStructure) { set({ devMode: false }); return; }

    // Find entry-point node
    let entryId: string | null = null;
    const ENTRY_NAMES = ['index.js','index.ts','main.js','main.ts','app.js','app.ts','server.js','server.ts'];
    const traverse = (node: CodeNode): boolean => {
      if (ENTRY_NAMES.includes(node.name.toLowerCase())) { entryId = node.id; return true; }
      return (node.children ?? []).some(c => traverse(c));
    };
    traverse(repoStructure.rootNode);
    if (!entryId) entryId = repoStructure.rootNode.id;

    set({
      devMode: true,
      highlightedNodes: [entryId],
      selectedNodes: [entryId],
      isSidePanelOpen: true,
      sidePanelTab: 'explain',
    });
  },

  // --- UI ---
  sidePanelTab: 'explain',
  setSidePanelTab: (tab) => set({ sidePanelTab: tab, isSidePanelOpen: true }),
  isSidePanelOpen: false,
  setSidePanelOpen: (isOpen) => set({ isSidePanelOpen: isOpen }),

  // --- Learning path ---
  learningPathMode: false,
  setLearningPathMode: (active) => set((state) => ({
    learningPathMode: active,
    isSidePanelOpen: active ? true : state.isSidePanelOpen,
    selectedNodes: active ? [] : state.selectedNodes,
  })),
  learningPath: null,
  setLearningPath: (data) => set({ learningPath: data }),

  // --- Cache ---
  explanations: {},
  cacheExplanation: (id, data) => set((state) => ({
    explanations: { ...state.explanations, [id]: data }
  })),
  flowExplanations: {},
  cacheFlowExplanation: (key, data) => set((state) => ({
    flowExplanations: { ...state.flowExplanations, [key]: data }
  })),

  // --- Theme ---
  theme: (localStorage.getItem('codemap-theme') as 'dark' | 'light') || 'dark',
  toggleTheme: () => set((state) => {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('codemap-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    return { theme: next };
  }),
}));
