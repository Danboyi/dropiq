'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle, Save, RotateCcw } from 'lucide-react'
import { useAuth } from '@/stores/authStore'
import { toast } from 'sonner'

interface Requirement {
  id: string
  type: string
  description: string
  completed?: boolean
  details?: string
  contractAddress?: string
  link?: string
}

interface ChecklistProps {
  airdropId: string
  requirements: Requirement[]
  initialProgress?: Record<string, boolean>
  notes?: string
  onProgressUpdate?: (completedCount: number, totalCount: number) => void
}

export function Checklist({ 
  airdropId, 
  requirements, 
  initialProgress = {}, 
  notes: initialNotes = '',
  onProgressUpdate 
}: ChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(initialProgress)
  const [notes, setNotes] = useState(initialNotes)
  const [isSaving, setIsSaving] = useState(false)
  
  const { isAuthenticated, getAuthToken } = useAuth()
  const queryClient = useQueryClient()

  // Calculate progress
  const completedCount = Object.values(checkedItems).filter(Boolean).length
  const totalCount = requirements.length
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  // Update parent component with progress
  if (onProgressUpdate) {
    onProgressUpdate(completedCount, totalCount)
  }

  const saveProgressMutation = useMutation({
    mutationFn: async ({ progress, notes }: { progress: Record<string, boolean>, notes: string }) => {
      if (!isAuthenticated) {
        throw new Error('User not authenticated')
      }

      const token = getAuthToken()
      if (!token) {
        throw new Error('No authentication token')
      }

      const response = await fetch(`/api/airdrops/${airdropId}/status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progress,
          notes,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to save progress: ${response.statusText}`)
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Progress saved', {
        description: 'Your checklist progress has been updated.',
        duration: 3000,
      })
      
      // Invalidate user progress query
      queryClient.invalidateQueries({ queryKey: ['user-progress'] })
    },
    onError: (error) => {
      toast.error('Failed to save progress', {
        description: error.message,
        duration: 5000,
      })
    },
  })

  const handleCheckChange = (requirementId: string, checked: boolean) => {
    const newCheckedItems = {
      ...checkedItems,
      [requirementId]: checked,
    }
    setCheckedItems(newCheckedItems)
  }

  const handleSaveProgress = async () => {
    setIsSaving(true)
    try {
      await saveProgressMutation.mutateAsync({ 
        progress: checkedItems, 
        notes 
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetProgress = () => {
    setCheckedItems({})
    setNotes('')
    toast.info('Progress reset', {
      description: 'Your checklist has been reset. Don\'t forget to save!',
      duration: 3000,
    })
  }

  const getRequirementIcon = (requirement: Requirement) => {
    const isChecked = checkedItems[requirement.id]
    return isChecked ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : (
      <Circle className="h-5 w-5 text-muted-foreground" />
    )
  }

  const getRequirementBadge = (requirement: Requirement) => {
    const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'contract_interaction': { label: 'Contract', variant: 'default' as const },
      'social_task': { label: 'Social', variant: 'secondary' as const },
      'transaction': { label: 'Transaction', variant: 'outline' as const },
      'holding': { label: 'Holding', variant: 'destructive' as const },
    }

    const badge = badges[requirement.type] || { label: 'Task', variant: 'secondary' as const }
    return <Badge variant={badge.variant}>{badge.label}</Badge>
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Progress Checklist
            </CardTitle>
            <CardDescription>
              Track your progress for this airdrop
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{completedCount}/{totalCount}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Requirements List */}
        <div className="space-y-3">
          {requirements.map((requirement, index) => (
            <div key={requirement.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card/50">
              <Checkbox
                id={`requirement-${requirement.id}`}
                checked={checkedItems[requirement.id] || false}
                onCheckedChange={(checked) => handleCheckChange(requirement.id, checked as boolean)}
                className="mt-0.5"
              />
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  {getRequirementIcon(requirement)}
                  <label 
                    htmlFor={`requirement-${requirement.id}`}
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    {requirement.description}
                  </label>
                  {getRequirementBadge(requirement)}
                </div>
                
                {requirement.details && (
                  <p className="text-xs text-muted-foreground ml-7">
                    {requirement.details}
                  </p>
                )}
                
                {requirement.contractAddress && (
                  <p className="text-xs text-muted-foreground ml-7 font-mono">
                    Contract: {requirement.contractAddress}
                  </p>
                )}
                
                {requirement.link && (
                  <a 
                    href={requirement.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline ml-7"
                  >
                    → Open link
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Notes Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Notes</label>
          <Textarea
            placeholder="Add any notes about your progress..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={handleSaveProgress}
            disabled={isSaving || saveProgressMutation.isPending}
            className="flex-1"
          >
            {isSaving || saveProgressMutation.isPending ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Progress
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleResetProgress}
            disabled={isSaving || saveProgressMutation.isPending}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}