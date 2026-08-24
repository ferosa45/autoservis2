import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { TrialBanner } from '@/components/layout/trial-banner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <TrialBanner />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
