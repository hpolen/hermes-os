'use client'
import { useRef, useEffect, KeyboardEvent } from 'react'
import { Pillar } from '@/lib/types'
import { getPillarColors } from './PillarBadge'

interface TaskInputProps {
  pillars: Pillar[]
  selectedPillarId: string | null
  onSelectPillar: (id: string | null) => void
  onSubmit: (text: string, pillarId: string | null) => void
  disabled?: boolean
}

export function TaskInput({
  pillars,
  selectedPillarId,
  onSelectPillar,
  onSubmit,
  disabled,
}: TaskInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus on mount
  useEffect(() => { inputRef.current?.focus() }, [])

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const val = inputRef.current?.value ?? ''

    if (e.key === 'Enter' && val.trim()) {
      onSubmit(val.trim(), selectedPillarId)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    // Pillar hotkeys — only when input is empty
    if (!val && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const key = e.key.toUpperCase()
      const match = pillars.find(p => p.shortKey.toUpperCase() === key)
      if (match) {
        e.preventDefault()
        onSelectPillar(selectedPillarId === match.id ? null : match.id)
      }
    }

    if (e.key === 'Escape') {
      onSelectPillar(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const activePillar = pillars.find(p => p.id === selectedPillarId)

  return (
    <div className="space-y-2">
      <div className={`
        flex items-center gap-2 rounded-xl border bg-card px-4 py-3
        transition-all focus-within:ring-2
        ${activePillar
          ? `border-${activePillar.color}-500/40 focus-within:ring-${activePillar.color}-500/20`
          : 'border-border focus-within:ring-ring/20'}
      `}>
        {/* Pillar indicator */}
        {activePillar ? (
          <span className="text-base leading-none">{activePillar.emoji ?? '●'}</span>
        ) : (
          <span className="text-muted-foreground text-sm">✏️</span>
        )}

        <input
          ref={inputRef}
          type="text"
          placeholder="Add a task… (press Enter)"
          disabled={disabled}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
        />

        {activePillar && (
          <button
            onClick={() => onSelectPillar(null)}
            className="text-muted-foreground hover:text-foreground text-xs transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Pillar hotkey strip */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-muted-foreground/50 mr-1">Pillar:</span>
        {pillars.map(p => {
          const c = getPillarColors(p.color)
          const isActive = selectedPillarId === p.id
          return (
            <button
              key={p.id}
              onClick={() => onSelectPillar(isActive ? null : p.id)}
              className={`
                text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all
                ${isActive
                  ? `${c.bg} ${c.text} ${c.border}`
                  : 'bg-transparent text-muted-foreground border-border/50 hover:border-border'}
              `}
            >
              <span className="opacity-60">[{p.shortKey}]</span> {p.emoji} {p.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
