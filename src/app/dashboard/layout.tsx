'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProtectedRoute } from '@/hooks/protected-route';
import { useAuth } from '@/hooks/auth-context';
import { Sparkles } from 'lucide-react';
import { useKanbanUIStore } from '@/stores/kanban-ui.store';
import { AiAssistantPanel } from '@/components/layout/ai-assistant-panel';
import { OnboardingTour } from '@/components/layout/onboarding-tour';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { isAiPanelOpen, openAiPanel, closeAiPanel } = useKanbanUIStore();

  return (
    <ProtectedRoute>
      <div className="h-screen overflow-hidden w-full flex flex-col">
        <div className="flex flex-1 min-h-0 min-w-0">
          <Sidebar
            collapsed={sidebarCollapsed}
            onCollapse={setSidebarCollapsed}
            mobileOpen={mobileSidebarOpen}
            onMobileOpenChange={setMobileSidebarOpen}
          />
          <div className={cn(
            "flex flex-1 flex-col transition-all duration-300 ease-in-out min-h-0 min-w-0",
            sidebarCollapsed ? "lg:pl-16" : "lg:pl-56"
          )}>
            <Header
              userName={user?.name}
              onMobileMenuOpen={() => setMobileSidebarOpen(true)}
            />
            <main className="flex-1 overflow-hidden p-4 flex flex-col relative min-h-0 min-w-0">
              {children}
            </main>
            <Footer />
          </div>
        </div>

        {/* FAB — Asistente IA */}
        <div className="fixed bottom-10 right-10 flex flex-col items-end gap-2 z-40">
          <button
            id="tour-fab"
            onClick={() => openAiPanel()}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            title="Asistente IA"
          >
            <Sparkles className="h-6 w-6" />
          </button>
        </div>

        <AiAssistantPanel
          open={isAiPanelOpen}
          onOpenChange={(open) => { if (!open) closeAiPanel(); }}
        />

        <OnboardingTour />
      </div>
    </ProtectedRoute>
  );
}
