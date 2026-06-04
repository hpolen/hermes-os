'use client'
import { useState } from 'react'
import { Project } from '@/lib/types'
import { updateProject } from '@/lib/firebase/projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Plus } from 'lucide-react'

interface Props {
  project: Project
  onUpdate: (p: Project) => void
}

type ListField = 'goals' | 'risks' | 'dependencies' | 'assignedAgents'

export function OverviewTab({ project, onUpdate }: Props) {
  const [editingMission, setEditingMission] = useState(false)
  const [missionValue, setMissionValue] = useState(project.mission ?? '')
  const [addValues, setAddValues] = useState<Record<ListField, string>>({
    goals: '',
    risks: '',
    dependencies: '',
    assignedAgents: '',
  })

  const saveMission = async () => {
    const updated = { ...project, mission: missionValue }
    await updateProject(project.id, { mission: missionValue })
    onUpdate(updated)
    setEditingMission(false)
  }

  const handleMissionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveMission()
    if (e.key === 'Escape') { setMissionValue(project.mission ?? ''); setEditingMission(false) }
  }

  const addItem = async (field: ListField) => {
    const val = addValues[field].trim()
    if (!val) return
    const current = (project[field] ?? []) as string[]
    const newList = [...current, val]
    const updated = { ...project, [field]: newList }
    await updateProject(project.id, { [field]: newList })
    onUpdate(updated)
    setAddValues(prev => ({ ...prev, [field]: '' }))
  }

  const removeItem = async (field: ListField, index: number) => {
    const current = (project[field] ?? []) as string[]
    const newList = current.filter((_, i) => i !== index)
    const updated = { ...project, [field]: newList }
    await updateProject(project.id, { [field]: newList })
    onUpdate(updated)
  }

  const handleAddKeyDown = (e: React.KeyboardEvent, field: ListField) => {
    if (e.key === 'Enter') addItem(field)
  }

  const ListSection = ({ field, label }: { field: ListField; label: string }) => {
    const items = (project[field] ?? []) as string[]
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{label}</h3>
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-2 group">
              <span className="flex-1 text-sm">{item}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={() => removeItem(field, i)}
              >
                <X className="w-3 h-3" />
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Input
            placeholder={`Add ${label.toLowerCase()}...`}
            value={addValues[field]}
            onChange={e => setAddValues(prev => ({ ...prev, [field]: e.target.value }))}
            onKeyDown={e => handleAddKeyDown(e, field)}
            className="h-8 text-sm"
          />
          <Button size="sm" variant="outline" className="h-8" onClick={() => addItem(field)}>
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Mission */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Mission</h3>
        {editingMission ? (
          <Input
            autoFocus
            value={missionValue}
            onChange={e => setMissionValue(e.target.value)}
            onBlur={saveMission}
            onKeyDown={handleMissionKeyDown}
            className="text-sm"
          />
        ) : (
          <p
            className="text-sm cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 min-h-[2rem] flex items-center"
            onClick={() => { setMissionValue(project.mission ?? ''); setEditingMission(true) }}
          >
            {project.mission || <span className="text-muted-foreground italic">Click to add mission...</span>}
          </p>
        )}
      </div>

      <ListSection field="goals" label="Goals" />
      <ListSection field="risks" label="Risks" />
      <ListSection field="dependencies" label="Dependencies" />
      <ListSection field="assignedAgents" label="Assigned Agents" />
    </div>
  )
}
