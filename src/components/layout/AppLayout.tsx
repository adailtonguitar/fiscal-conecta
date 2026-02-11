import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { User } from "lucide-react";
import { UpdateNoticeModal } from "@/components/UpdateNoticeModal";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden">
      <UpdateNoticeModal />
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 border-b border-border bg-card flex items-center justify-end px-4 shrink-0">
          <div className="flex items-center gap-2 text-foreground">
            <User className="w-5 h-5" />
            <span className="text-base font-semibold">{user?.email}</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
