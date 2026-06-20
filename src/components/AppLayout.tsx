import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

interface Props {
  children: React.ReactNode;
}

export default function AppLayout({ children }: Props) {
  return (
    <div className="flex h-screen w-full overflow-x-hidden bg-muted/30">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-24 md:pb-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}