import { useContext, type HTMLProps } from "react"
import { Icons } from "@/tauri-controls/components/icons"
import TauriAppWindowContext from "@/tauri-controls/contexts/plugin-window"
import { cn } from "@/tauri-controls/libs/utils"
import { Button } from "../components/button"

interface WindowsProps extends HTMLProps<HTMLDivElement> {
  disableMaximize?: boolean
}

export function Windows({
  className,
  disableMaximize = false,
  ...props
}: WindowsProps) {
  const { isWindowMaximized, minimizeWindow, maximizeWindow, closeWindow } =
    useContext(TauriAppWindowContext)

  return (
    <div className={cn("h-8", className)} {...props}>
      <Button
        onClick={minimizeWindow}
        className="max-h-8 w-[46px] cursor-default rounded-none bg-transparent text-black/90 hover:bg-black/[.05] active:bg-black/[.03] dark:text-white dark:hover:bg-white/[.06] dark:active:bg-white/[.04]"
      >
        <Icons.minimizeWin />
      </Button>
      <Button
        onClick={disableMaximize ? undefined : maximizeWindow}
        disabled={disableMaximize}
        className={cn(
          "max-h-8 w-[46px] cursor-default rounded-none bg-transparent",
          disableMaximize
            ? "text-black/30 dark:text-white/30"
            : "text-black/90 hover:bg-black/[.05] active:bg-black/[.03] dark:text-white dark:hover:bg-white/[.06] dark:active:bg-white/[.04]"
        )}
      >
        {!isWindowMaximized ? (
          <Icons.maximizeWin />
        ) : (
          <Icons.maximizeRestoreWin />
        )}
      </Button>
      <Button
        onClick={closeWindow}
        className="max-h-8 w-[46px] cursor-default rounded-none bg-transparent text-black/90 hover:bg-[#c42b1c] hover:text-white active:bg-[#c42b1c]/90 dark:text-white"
      >
        <Icons.closeWin />
      </Button>
    </div>
  )
}
