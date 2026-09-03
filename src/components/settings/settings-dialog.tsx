import type { ComponentType, ReactNode } from 'react';
import { Info } from '@phosphor-icons/react';
import { useState } from 'react';

import {
  Dialog,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { AboutTab } from './about-tab';
import { SettingsSidebarButton } from './settings-sidebar-button';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabId = 'about';

interface NavItem {
  id: TabId;
  name: string;
  icon: ComponentType<{ className?: string }>;
  content: ReactNode;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const NAV_ITEMS: NavItem[] = [
    {
      id: 'about',
      name: 'About',
      icon: Info,
      content: <AboutTab />,
    },
  ];

  const [activeId, setActiveId] = useState<TabId>('about');
  const activeItem = NAV_ITEMS.find(i => i.id === activeId)!;

  return (
    <Dialog
      isOpen={open}
      onOpenChange={onOpenChange}
      className="h-[70vh] w-200 overflow-hidden rounded-xl p-0 sm:max-w-200"
    >
      <DialogTitle className="sr-only">Settings</DialogTitle>
      <DialogDescription className="sr-only">
        Application settings
      </DialogDescription>

      {/* Flex container for sidebar + main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="
          w-48 shrink-0 overflow-y-auto border-r border-border bg-muted/30 transition-colors duration-500
        "
        >
          <nav className="space-y-0.5 p-3">
            {NAV_ITEMS.map((item, index) => (
              <SettingsSidebarButton
                key={item.id}
                id={item.id}
                icon={<item.icon className="size-4.5" />}
                label={item.name}
                isActive={activeId === item.id}
                onClick={id => setActiveId(id as TabId)}
                index={index}
              />
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex min-h-0 flex-1 flex-col self-stretch overflow-hidden bg-card">
          <div
            key={activeId}
            className="animate-slide-in-left-fast-no-opacity flex-1 overflow-y-auto p-6"
          >
            {activeItem.content}
          </div>
        </main>
      </div>
    </Dialog>
  );
}
