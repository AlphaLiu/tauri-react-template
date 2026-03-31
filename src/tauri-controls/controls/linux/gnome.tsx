import { useContext, type HTMLProps } from "react"
import { Button } from "@/tauri-controls/components/button"
import { Icons } from "@/tauri-controls/components/icons"
import TauriAppWindowContext from "@/tauri-controls/contexts/plugin-window"
import { cn } from "@/tauri-controls/libs/utils"

interface GnomeProps extends HTMLProps<HTMLDivElement> {
  disableMaximize?: boolean
}

export function Gnome({
  className,
  disableMaximize = false,
  ...props
}: GnomeProps) {
  const { isWindowMaximized, minimizeWindow, maximizeWindow, closeWindow } =
    useContext(TauriAppWindowContext)

  return (
    <div
      className={cn("mr-[10px] h-auto items-center space-x-[13px]", className)}
      {...props}
    >
      <Button
        onClick={minimizeWindow}
        className="m-0 aspect-square h-6 w-6 cursor-default rounded-full bg-[#dadada] p-0 text-[#3d3d3d] hover:bg-[#d1d1d1] active:bg-[#bfbfbf] dark:bg-[#373737] dark:text-white dark:hover:bg-[#424242] dark:active:bg-[#565656]"
      >
        <Icons.minimizeWin className="h-[9px] w-[9px]" />
      </Button>
      <Button
        onClick={disableMaximize ? undefined : maximizeWindow}
        disabled={disableMaximize}
        className={cn(
          "m-0 aspect-square h-6 w-6 cursor-default rounded-full p-0",
          disableMaximize
            ? "bg-[#dadada]/40 text-[#3d3d3d]/40 dark:bg-[#373737]/40 dark:text-white/40"
            : "bg-[#dadada] text-[#3d3d3d] hover:bg-[#d1d1d1] active:bg-[#bfbfbf] dark:bg-[#373737] dark:text-white dark:hover:bg-[#424242] dark:active:bg-[#565656]"
        )}
      >
        {!isWindowMaximized ? (
          <Icons.maximizeWin className="h-2 w-2" />
        ) : (
          <Icons.maximizeRestoreWin className="h-[9px] w-[9px]" />
        )}
      </Button>
      <Button
        onClick={closeWindow}
        className="m-0 aspect-square h-6 w-6 cursor-default rounded-full bg-[#dadada] p-0 text-[#3d3d3d] hover:bg-[#d1d1d1] active:bg-[#bfbfbf] dark:bg-[#373737] dark:text-white dark:hover:bg-[#424242] dark:active:bg-[#565656]"
      >
        <Icons.closeWin className="h-2 w-2" />
      </Button>
    </div>
  )
}
