import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { User } from "lucide-react";
import { UpdateNoticeModal } from "@/components/UpdateNoticeModal";
import { SubscriptionBanner } from "./SubscriptionBanner";

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
        <SubscriptionBanner />
        <header className="h-12 border-b border-border bg-card flex items-center justify-end px-2 sm:px-4 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 text-foreground min-w-0">
            <User className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-xs sm:text-base font-semibold truncate max-w-[140px] sm:max-w-none">{user?.email}</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
