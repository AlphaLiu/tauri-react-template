import { useContext, useEffect, useState, type HTMLProps } from "react"
import { Icons } from "@/tauri-controls/components/icons"
import { cn } from "@/tauri-controls/libs/utils"
import { Button } from "../components/button"
import TauriAppWindowContext from "../contexts/plugin-window"

interface MacOSProps extends HTMLProps<HTMLDivElement> {
  disableMaximize?: boolean
}

export function MacOS({
  className,
  disableMaximize = false,
  ...props
}: MacOSProps) {
  const { minimizeWindow, maximizeWindow, fullscreenWindow, closeWindow } =
    useContext(TauriAppWindowContext)

  const [isAltKeyPressed, setIsAltKeyPressed] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  const last = isAltKeyPressed ? <Icons.plusMac /> : <Icons.fullMac />
  const key = "Alt"

  const handleMouseEnter = () => {
    setIsHovering(true)
  }
  const handleMouseLeave = () => {
    setIsHovering(false)
  }

  const handleAltKeyDown = (e: KeyboardEvent) => {
    if (e.key === key) {
      setIsAltKeyPressed(true)
    }
  }
  const handleAltKeyUp = (e: KeyboardEvent) => {
    if (e.key === key) {
      setIsAltKeyPressed(false)
    }
  }
  useEffect(() => {
    // Attach event listeners when the component mounts
    window.addEventListener("keydown", handleAltKeyDown)
    window.addEventListener("keyup", handleAltKeyUp)
  }, [])

  return (
    <div
      className={cn(
        "space-x-2 px-3 text-black active:text-black dark:text-black",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <Button
        onClick={closeWindow}
        className="aspect-square h-3 w-3 cursor-default content-center items-center justify-center self-center rounded-full border border-black/[.12] bg-[#ff544d] text-center text-black/60 hover:bg-[#ff544d] active:bg-[#bf403a] active:text-black/60 dark:border-none"
      >
        {isHovering && <Icons.closeMac />}
      </Button>
      <Button
        onClick={minimizeWindow}
        className="aspect-square h-3 w-3 cursor-default content-center items-center justify-center self-center rounded-full border border-black/[.12] bg-[#ffbd2e] text-center text-black/60 hover:bg-[#ffbd2e] active:bg-[#bf9122] active:text-black/60 dark:border-none"
      >
        {isHovering && <Icons.minMac />}
      </Button>
      <Button
        onClick={
          disableMaximize
            ? undefined
            : isAltKeyPressed
              ? maximizeWindow
              : fullscreenWindow
        }
        disabled={disableMaximize}
        className={cn(
          "aspect-square h-3 w-3 cursor-default content-center items-center justify-center self-center rounded-full border text-center text-black/60 dark:border-none",
          disableMaximize
            ? "border-black/[.06] bg-[#28c93f]/40"
            : "border-black/[.12] bg-[#28c93f] hover:bg-[#28c93f] active:bg-[#1e9930] active:text-black/60"
        )}
      >
        {isHovering && !disableMaximize && last}
      </Button>
    </div>
  )
}
