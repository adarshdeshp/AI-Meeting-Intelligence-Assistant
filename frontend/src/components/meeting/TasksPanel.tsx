'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import type { Task } from '@/types/meeting'

interface TasksPanelProps {
  tasks?: Task[]
}

export function TasksPanel({ tasks }: TasksPanelProps) {
  const [copied, setCopied] = useState(false)

  if (!tasks || tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No tasks extracted</p>
        </CardContent>
      </Card>
    )
  }

  const handleCopyTasks = () => {
    const tasksText = tasks
      .map((task, index) => {
        const parts = []
        if (task.assignee) parts.push(`Assignee: ${task.assignee}`)
        if (task.task) parts.push(`Task: ${task.task}`)
        if (task.deadline) parts.push(`Deadline: ${task.deadline}`)
        if (task.confidence) parts.push(`Confidence: ${(task.confidence * 100).toFixed(0)}%`)
        return `${index + 1}. ${parts.join(' | ')}`
      })
      .join('\n')

    navigator.clipboard.writeText(tasksText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tasks ({tasks.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={handleCopyTasks}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy All
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <div
              key={index}
              className="rounded-lg border p-4 space-y-2"
            >
              {task.task && (
                <p className="font-medium">{task.task}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {task.assignee && (
                  <span>
                    <span className="font-medium">Assignee:</span> {task.assignee}
                  </span>
                )}
                {task.deadline && (
                  <span>
                    <span className="font-medium">Deadline:</span> {task.deadline}
                  </span>
                )}
                {task.confidence !== undefined && (
                  <span>
                    <span className="font-medium">Confidence:</span>{' '}
                    {(task.confidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
