import * as React from "react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ScoreBadgeProps {
  score: number
  maxScore?: number
  type: "risk" | "hype"
  showValue?: boolean
  className?: string
}

function ScoreBadge({ 
  score, 
  maxScore = 100, 
  type, 
  showValue = true,
  className 
}: ScoreBadgeProps) {
  const percentage = (score / maxScore) * 100
  
  const getRiskColor = (score: number) => {
    if (score <= 30) return "bg-green-500"
    if (score <= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getHypeColor = (score: number) => {
    if (score <= 30) return "bg-red-500"
    if (score <= 60) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getProgressColor = () => {
    return type === "risk" ? getRiskColor(score) : getHypeColor(score)
  }

  const getBadgeVariant = () => {
    if (type === "risk") {
      if (score <= 30) return "secondary"
      if (score <= 60) return "outline"
      return "destructive"
    } else {
      if (score <= 30) return "destructive"
      if (score <= 60) return "outline"
      return "secondary"
    }
  }

  return (
    <div className={cn("flex items-center gap-2 min-w-20", className)}>
      <Progress 
        value={percentage} 
        className="w-12 h-2"
      />
      <div 
        className="h-2 w-2 rounded-full" 
        style={{ backgroundColor: getProgressColor().replace('bg-', '#').replace('500', '500') }}
      />
      {showValue && (
        <Badge variant={getBadgeVariant()} className="text-xs">
          {score}
        </Badge>
      )}
    </div>
  )
}

export { ScoreBadge }