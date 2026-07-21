import { MindMap } from '@/components/map/MindMap';
import { SidePanel } from '@/components/panel/SidePanel';
import { TopBar } from '@/components/TopBar';
import { VoiceCommandFab } from '@/components/VoiceCommandFab';

export default function Home() {
  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden selection:bg-primary selection:text-primary-foreground">
      <TopBar />
      <div className="flex-1 relative flex">
        <div className="flex-1 relative">
          <MindMap />
          <VoiceCommandFab />
        </div>
        <SidePanel />
      </div>
    </div>
  );
}
