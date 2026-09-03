import { SettingsIcon } from 'lucide-react';
import { useState } from 'react';
import { SettingsDialog } from '@/components/settings/settings-dialog';
import { Button } from '@/components/ui/button';

export function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => {
          setIsOpen(true);
        }}
        title="Settings"
        aria-label="Settings"
        className="
          max-h-8 w-11.5 cursor-default rounded-none bg-transparent text-black/90
          hover:bg-black/5
          active:bg-black/3
          dark:text-white
          dark:hover:bg-white/6
          dark:active:bg-white/4
        "
      >
        <SettingsIcon className="size-4" />
      </Button>

      {/* The dialog itself portals to document.body, so rendering it inside
          the titlebar header is safe. */}
      <SettingsDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
