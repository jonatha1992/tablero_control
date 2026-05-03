'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProtectedRoute } from '@/hooks/protected-route';
import { useAuth } from '@/hooks/auth-context';
import { Plus, MessageSquare, ClipboardList } from 'lucide-react';
import { useKanbanUIStore } from '@/stores/kanban-ui.store';
import { CreateTaskModal } from '@/components/tareas/create-task-modal';
import { DictateTasksModal } from '@/components/tareas/dictate-tasks-modal';

function FabOption({ label, icon: Icon, onClick }: { label: string; icon: React.ElementType; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 group"
    >
      <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs font-medium px-2 py-1 rounded-md shadow-md whitespace-nowrap">
        {label}
      </span>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border shadow-md hover:bg-accent transition-colors">
        <Icon className="h-4 w-4" />
      </div>
    </button>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  const {
    isCreateModalOpen, closeCreateModal, openCreateModal,
    isDictateModalOpen, closeDictateModal, openDictateModal,
  } = useKanbanUIStore();

  return (
    <ProtectedRoute>
      <div className="flex flex-1 h-full min-h-0 w-full flex-col">
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
            <main className="flex-1 overflow-auto p-4 flex flex-col relative min-h-0 min-w-0">
              {children}
            </main>
            <Footer />
          </div>
        </div>

        {/* FAB speed-dial */}
        <div className="fixed bottom-10 right-10 flex flex-col items-end gap-2 z-40">
          {fabOpen && (
            <>
              <FabOption
                label="Crear con IA"
                icon={MessageSquare}
                onClick={() => { openDictateModal(); setFabOpen(false); }}
              />
              <FabOption
                label="Formulario"
                icon={ClipboardList}
                onClick={() => { openCreateModal(); setFabOpen(false); }}
              />
            </>
          )}
          <button
            onClick={() => setFabOpen((v) => !v)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            title="Crear tarea"
          >
            <Plus className={cn('h-6 w-6 transition-transform duration-200', fabOpen && 'rotate-45')} />
          </button>
        </div>

        <CreateTaskModal
          open={isCreateModalOpen}
          onOpenChange={(open) => { if (!open) closeCreateModal(); }}
        />

        <DictateTasksModal
          open={isDictateModalOpen}
          onOpenChange={(open) => { if (!open) closeDictateModal(); }}
        />
      </div>
    </ProtectedRoute>
  );
}
