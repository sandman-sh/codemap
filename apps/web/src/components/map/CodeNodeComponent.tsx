import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Folder,
  FileCode2,
  FunctionSquare,
  ChevronRight,
  ChevronDown,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { CodeNode } from '@codemapai/api-client';

export type CodeNodeData = {
  node: CodeNode;
  isExpanded: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  learningStep?: number;
  onToggleExpand: (id: string) => void;
};

function NodeIcon({ type }: { type: string }) {
  switch (type) {
    case 'root':
    case 'folder':
      return <Folder className="w-4 h-4 text-muted-foreground" />;
    case 'file':
      return <FileCode2 className="w-4 h-4 text-primary/70" />;
    case 'function':
    case 'class':
    case 'export':
      return <FunctionSquare className="w-3.5 h-3.5 text-accent-foreground/50" />;
    default:
      return <FileCode2 className="w-4 h-4 text-muted-foreground" />;
  }
}

export const CodeNodeComponent = memo(function CodeNodeComponent({
  data,
}: {
  data: CodeNodeData;
}) {
  const { node, isExpanded, isSelected, isHighlighted, isDimmed, learningStep, onToggleExpand } = data;
  const hasChildren = !!(node.children && node.children.length > 0);

  return (
    <div
      className={clsx(
        'relative group flex items-center w-[260px] p-3 rounded-xl border',
        'transition-[border-color,box-shadow,transform,opacity] duration-200',
        'cursor-grab active:cursor-grabbing',
        // Highlighted (AI refs)
        isHighlighted && !isSelected &&
          'border-foreground/50 shadow-[0_0_0_2px_rgba(255,255,255,0.12),0_0_20px_rgba(255,255,255,0.06)] bg-card scale-[1.03] z-20',
        // Selected
        isSelected &&
          'border-primary ring-1 ring-primary/20 shadow-lg bg-card scale-[1.02] z-10',
        // Normal
        !isSelected && !isHighlighted &&
          'border-border hover:border-border/80 bg-card hover:shadow-md',
        // Dimmed (search active, no match)
        isDimmed && 'opacity-20 pointer-events-none',
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-4 !rounded-sm !bg-border !border-none !opacity-0 group-hover:!opacity-40 !transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-4 !rounded-sm !bg-border !border-none !opacity-0 group-hover:!opacity-40 !transition-opacity"
      />

      {/* AI highlight pulse ring */}
      {isHighlighted && (
        <span className="absolute inset-0 rounded-xl border border-foreground/20 animate-pulse pointer-events-none" />
      )}

      {/* Learning step badge */}
      {learningStep !== undefined && (
        <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-md z-20 pointer-events-none">
          {learningStep}
        </div>
      )}

      {/* Expand/collapse — .nodrag prevents drag on button */}
      <div
        className={clsx(
          'nodrag flex items-center justify-center w-6 h-6 rounded-md mr-2 flex-shrink-0 transition-colors',
          hasChildren ? 'hover:bg-accent cursor-pointer' : 'opacity-0 pointer-events-none',
        )}
        onClick={(e) => { e.stopPropagation(); if (hasChildren) onToggleExpand(node.id); }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {hasChildren && (
          isExpanded
            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="flex items-center flex-1 min-w-0 gap-2">
        <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-accent/40 border border-border/70">
          <NodeIcon type={node.type} />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-semibold truncate text-foreground font-mono tracking-tight leading-tight">
            {node.name}
          </span>
          {node.type !== 'folder' && node.type !== 'root' && (
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider leading-tight mt-0.5">
              {node.type}
            </span>
          )}
        </div>
      </div>

      {/* Complexity dot */}
      {node.complexity && node.complexity !== 'low' && (
        <div className="flex-shrink-0 ml-2 pointer-events-none">
          <div
            className={clsx(
              'w-2 h-2 rounded-full',
              node.complexity === 'high'
                ? 'bg-destructive shadow-[0_0_6px_rgba(239,68,68,0.6)]'
                : 'bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.4)]',
            )}
            title={`Complexity: ${node.complexity}`}
          />
        </div>
      )}

      {/* Entry point */}
      {node.isEntryPoint && (
        <div className="flex-shrink-0 ml-1 text-primary pointer-events-none" title="Entry Point">
          <Zap className="w-3.5 h-3.5 fill-primary" />
        </div>
      )}

      {/* Selection ring */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-primary rounded-xl pointer-events-none" />
      )}
    </div>
  );
});
