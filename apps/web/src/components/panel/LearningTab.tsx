import { useStore } from '@/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { BookOpen, Map, Clock, ArrowRight } from 'lucide-react';

export function LearningTab() {
  const { learningPath, setLearningPathMode } = useStore();

  if (!learningPath) return null;

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="p-6 border-b border-border bg-primary/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-mono tracking-tight flex items-center gap-2 text-primary">
            <Map className="w-5 h-5" /> Guided Path
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setLearningPathMode(false)}>Exit</Button>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed mb-4">
          {learningPath.summary}
        </p>
        {learningPath.estimatedTime && (
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Clock className="w-3.5 h-3.5" /> Estimated time: {learningPath.estimatedTime}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="relative space-y-6 before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:to-transparent">
          {learningPath.steps.map((step, i) => (
            <div key={i} className="relative flex items-start gap-6 group">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold z-10 shadow-lg shadow-primary/20 relative">
                {step.order}
              </div>
              <div className="flex-1 pt-1 pb-4">
                 <h4 className="text-sm font-mono font-bold mb-1 text-foreground break-all flex items-center gap-2">
                   {step.nodePath}
                 </h4>
                 {step.concept && (
                   <span className="inline-block text-[10px] uppercase tracking-wider font-bold text-primary mb-2 px-2 py-0.5 bg-primary/10 rounded">
                     {step.concept}
                   </span>
                 )}
                 <p className="text-sm text-muted-foreground leading-relaxed bg-accent/20 p-4 rounded-xl border border-border/50">
                   {step.reason}
                 </p>
              </div>
            </div>
          ))}
          
          <div className="relative flex items-center justify-center pt-4 z-10">
            <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground">
               <BookOpen className="w-5 h-5" />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
