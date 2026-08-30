import { Info } from "@phosphor-icons/react"
import { useEffect, useState } from "react"

import { getVersion } from "@tauri-apps/api/app"
import appIcon from "@/assets/icon.png"

function formatBuildDate() {
  return new Date(__BUILD_DATE__).toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <Info className="size-3" />
        {label}
      </span>
      <span className="font-mono text-xs text-muted-foreground/80">{value}</span>
    </div>
  )
}

export function AboutTab() {
  const [version, setVersion] = useState("—")

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => {})
  }, [])

  return (
    <div className="flex h-full flex-col">
      <h2 className="shrink-0 px-5 pt-5 pb-3 text-lg font-semibold text-foreground">
        About
      </h2>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-4 px-5 pb-5">
          <div className="flex flex-col items-center gap-3">
            <img
              src={appIcon}
              alt="tauri-app"
              className="size-18 rounded-[4.5px]"
              draggable={false}
            />
            <div className="text-center">
              <h3 className="text-sm font-semibold text-foreground">
                tauri-app
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                A Tauri + React desktop app template.
              </p>
            </div>
          </div>

          <div className="space-y-2 rounded-md bg-muted p-3">
            <InfoRow label="Version" value={`v${version}`} />
            <InfoRow label="Build Date" value={formatBuildDate()} />
            <InfoRow label="Git Revision" value={__GIT_REV__} />
          </div>
        </div>
      </div>
    </div>
  )
}
