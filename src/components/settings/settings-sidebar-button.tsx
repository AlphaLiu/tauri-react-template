import type { CSSProperties, ReactNode } from "react"
import { useEffect, useState } from "react"

interface SettingsSidebarButtonProps {
  id: string
  icon: ReactNode
  label: string
  isActive: boolean
  onClick: (id: string) => void
  index: number
}

/**
 * Animated sidebar button for settings dialog.
 * Features:
 * - Particle explosion effect on click
 * - Bounce animation on active state
 * - Slide-in animation with staggered delay
 * - Hover scale and translate effects
 */
export function SettingsSidebarButton({
  id,
  icon,
  label,
  isActive,
  onClick,
  index,
}: SettingsSidebarButtonProps) {
  const [particles, setParticles] = useState<
    { id: number; angle: number; distance: number }[]
  >([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [bounceKey, setBounceKey] = useState(0)

  useEffect(() => {
    if (isAnimating) {
      setBounceKey((prev) => prev + 1)
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        angle: i * 45 + Math.random() * 20,
        distance: 15 + Math.random() * 10,
      }))
      setParticles(newParticles)
      const timer = setTimeout(() => {
        setParticles([])
        setIsAnimating(false)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [isAnimating])

  const handleClick = () => {
    setIsAnimating(true)
    onClick(id)
  }

  return (
    <div className="relative">
      <button
        key={`button-${bounceKey}`}
        onClick={handleClick}
        className={`group animate-slide-in-left-fast flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium focus:outline-none active:scale-[0.98] ${
          isActive
            ? "animate-button-bounce scale-[1.02] bg-primary text-primary-foreground shadow-md"
            : "text-muted-foreground hover:translate-x-0.5 hover:scale-[1.01] hover:bg-accent hover:shadow-sm"
        }`}
        style={{
          animationDelay: `${index * 25}ms`,
          animationFillMode: "backwards",
          transitionProperty: "transform, box-shadow, background-color, color",
          transitionDuration: "200ms, 200ms, 500ms, 500ms",
        }}
      >
        <span
          className={`transition-transform duration-200 ${
            isActive ? "scale-110" : "group-hover:rotate-3 group-hover:scale-110"
          }`}
        >
          {icon}
        </span>

        <span className="whitespace-nowrap transition-transform duration-200 group-hover:translate-x-0.5">
          {label}
        </span>
      </button>

      {/* Particle effects */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="bg-primary/70 pointer-events-none absolute top-1/2 left-6 size-1.5 rounded-full"
          style={
            {
              "--particle-angle": `${particle.angle}deg`,
              "--particle-distance": `${particle.distance}px`,
              animation:
                "particleExplosion 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
