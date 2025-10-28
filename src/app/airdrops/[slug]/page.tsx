"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ExternalLink, CheckCircle, Circle, Clock, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScoreBadge } from "@/components/ui/score-badge"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useAirdrop } from "@/hooks/api/use-airdrop"
import { useUpdateAirdropStatus } from "@/hooks/api/use-update-airdrop-status"

interface Requirement {
  id: string
  title: string
  description: string
  type: "social" | "transaction" | "holding" | "other"
  completed?: boolean
  link?: string
}

export default function AirdropDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [notes, setNotes] = useState("")
  const [userStatus, setUserStatus] = useState<"interested" | "in_progress" | "completed" | null>(null)

  const { data: airdrop, isLoading, error } = useAirdrop(slug)
  const updateStatus = useUpdateAirdropStatus(slug)

  // Parse requirements from JSON
  const parseRequirements = (requirementsJson: any): Requirement[] => {
    try {
      const parsed = typeof requirementsJson === 'string' 
        ? JSON.parse(requirementsJson) 
        : requirementsJson
      
      if (Array.isArray(parsed)) {
        return parsed.map((req, index) => ({
          id: req.id || `req-${index}`,
          title: req.title || `Requirement ${index + 1}`,
          description: req.description || "",
          type: req.type || "other",
          completed: req.completed || false,
          link: req.link
        }))
      }
      
      // Fallback if it's not an array
      return [{
        id: "req-1",
        title: "Complete airdrop tasks",
        description: typeof parsed === 'string' ? parsed : JSON.stringify(parsed),
        type: "other" as const,
        completed: false
      }]
    } catch {
      return [{
        id: "req-1",
        title: "Complete airdrop tasks",
        description: "Check the official website for detailed requirements",
        type: "other" as const,
        completed: false
      }]
    }
  }

  const getRequirementIcon = (type: Requirement['type']) => {
    switch (type) {
      case "social":
        return <div className="size-4 rounded-full bg-blue-500" />
      case "transaction":
        return <div className="size-4 rounded-full bg-green-500" />
      case "holding":
        return <div className="size-4 rounded-full bg-purple-500" />
      default:
        return <div className="size-4 rounded-full bg-gray-500" />
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "interested":
        return <Badge variant="secondary">Interested</Badge>
      case "in_progress":
        return <Badge variant="outline">In Progress</Badge>
      case "completed":
        return <Badge className="bg-green-500 text-white">Completed</Badge>
      default:
        return <Badge variant="outline">Not Started</Badge>
    }
  }

  const handleSaveNotes = () => {
    updateStatus.mutate({ notes })
  }

  const handleStatusChange = (newStatus: typeof userStatus) => {
    setUserStatus(newStatus)
    updateStatus.mutate({ status: newStatus || undefined })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !airdrop) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-primary mb-4">Airdrop Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The airdrop you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/home">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    )
  }

  const requirements = parseRequirements(airdrop.requirements)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="size-16">
              <AvatarImage src={airdrop.logoUrl || ""} />
              <AvatarFallback className="text-lg">
                {airdrop.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-primary">{airdrop.name}</h1>
                {getStatusBadge(airdrop.userStatus)}
              </div>
              <p className="text-muted-foreground mb-4">{airdrop.description}</p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Risk:</span>
                  <ScoreBadge score={airdrop.riskScore} type="risk" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Hype:</span>
                  <ScoreBadge score={airdrop.hypeScore} type="hype" />
                </div>
                <Badge variant="secondary">
                  {airdrop.category.charAt(0).toUpperCase() + airdrop.category.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <a
                href={airdrop.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                Go to Project
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            {airdrop.twitterUrl && (
              <Button variant="outline" asChild>
                <a href={airdrop.twitterUrl} target="_blank" rel="noopener noreferrer">
                  Twitter
                </a>
              </Button>
            )}
            {airdrop.discordUrl && (
              <Button variant="outline" asChild>
                <a href={airdrop.discordUrl} target="_blank" rel="noopener noreferrer">
                  Discord
                </a>
              </Button>
            )}
            {airdrop.telegramUrl && (
              <Button variant="outline" asChild>
                <a href={airdrop.telegramUrl} target="_blank" rel="noopener noreferrer">
                  Telegram
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Management */}
      <Card>
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
          <CardDescription>
            Track your status for this airdrop
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={userStatus === "interested" ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusChange("interested")}
            >
              <Circle className="mr-2 h-4 w-4" />
              Interested
            </Button>
            <Button
              variant={userStatus === "in_progress" ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusChange("in_progress")}
            >
              <Clock className="mr-2 h-4 w-4" />
              In Progress
            </Button>
            <Button
              variant={userStatus === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusChange("completed")}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Completed
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Requirements</CardTitle>
          <CardDescription>
            Complete these tasks to be eligible for the airdrop
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requirements.map((requirement, index) => (
              <div
                key={requirement.id}
                className="flex items-start gap-3 p-4 rounded-lg border border-border"
              >
                <div className="flex items-center gap-2 mt-0.5">
                  {getRequirementIcon(requirement.type)}
                  <span className="text-sm font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-primary mb-1">
                    {requirement.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {requirement.description}
                  </p>
                  {requirement.link && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={requirement.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        Complete Task
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
                {requirement.completed && (
                  <CheckCircle className="size-5 text-green-500 mt-0.5" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Notes</CardTitle>
          <CardDescription>
            Add your private notes for this airdrop
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Add your notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
            <Button 
              onClick={handleSaveNotes}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending ? (
                <Spinner size="sm" className="mr-2" />
              ) : null}
              Save Notes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Warning */}
      <Card className="border-orange-500/20 bg-orange-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-500">
            <AlertTriangle className="h-5 w-5" />
            Security Reminder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• Never share your private keys or seed phrases</p>
            <p>• Always verify you're on the official website</p>
            <p>• Be cautious of projects asking for excessive permissions</p>
            <p>• Use a separate wallet for airdrop hunting when possible</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}