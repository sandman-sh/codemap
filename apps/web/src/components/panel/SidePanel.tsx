import { useStore } from '@/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExplainTab } from './ExplainTab';
import { FlowTab } from './FlowTab';
import { AskTab } from './AskTab';
import { LearningTab } from './LearningTab';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';

export function SidePanel() {
  const { 
    isSidePanelOpen, 
    setSidePanelOpen, 
    sidePanelTab, 
    setSidePanelTab, 
    selectedNodes, 
    clearSelection,
    learningPathMode
  } = useStore();

  const handleClose = () => {
    setSidePanelOpen(false);
    clearSelection();
  };

  return (
    <AnimatePresence>
      {isSidePanelOpen && (
        <motion.div 
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute right-0 top-0 bottom-0 w-[450px] bg-card/95 backdrop-blur-xl border-l border-border/50 shadow-2xl flex flex-col z-50 overflow-hidden"
        >
          {learningPathMode ? (
            <LearningTab />
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/50">
                <Tabs value={sidePanelTab} onValueChange={(v) => setSidePanelTab(v as any)} className="w-full">
                  <TabsList className="bg-transparent space-x-2">
                    <TabsTrigger 
                      value="explain" 
                      className="data-[state=active]:bg-accent data-[state=active]:text-foreground rounded-full px-4"
                      disabled={selectedNodes.length > 1}
                    >
                      Explain
                    </TabsTrigger>
                    <TabsTrigger 
                      value="flow"
                      className="data-[state=active]:bg-accent data-[state=active]:text-foreground rounded-full px-4"
                    >
                      Flow
                    </TabsTrigger>
                    <TabsTrigger 
                      value="ask"
                      className="data-[state=active]:bg-accent data-[state=active]:text-foreground rounded-full px-4"
                    >
                      Ask
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button variant="ghost" size="icon" className="shrink-0 rounded-full h-8 w-8 ml-2 hover:bg-destructive/20 hover:text-destructive" onClick={handleClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <Tabs value={sidePanelTab} className="h-full">
                  <TabsContent value="explain" className="h-full m-0 data-[state=inactive]:hidden"><ExplainTab /></TabsContent>
                  <TabsContent value="flow" className="h-full m-0 data-[state=inactive]:hidden"><FlowTab /></TabsContent>
                  <TabsContent value="ask" className="h-full m-0 data-[state=inactive]:hidden"><AskTab /></TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
