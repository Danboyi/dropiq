'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, ArrowRight, Home } from 'lucide-react'

export default function PromoteSuccessPage() {
  const searchParams = useSearchParams()
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    setSessionId(searchParams.get('session_id'))
  }, [searchParams])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
            <CardDescription>
              Your campaign has been submitted and is now under review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-surface p-4 rounded-lg">
              <h3 className="font-semibold mb-2">What happens next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Our team will review your campaign within 24 hours</li>
                <li>• You'll receive an email once your campaign is approved</li>
                <li>• Your airdrop will appear in the featured section</li>
                <li>• Campaign analytics will be available in your dashboard</li>
              </ul>
            </div>

            {sessionId && (
              <div className="bg-surface p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Transaction Details</h3>
                <p className="text-sm text-muted-foreground">
                  Session ID: {sessionId}
                </p>
              </div>
            )}

            <div className="flex flex-col space-y-2">
              <Link href="/home">
                <Button className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <Link href="/promote">
                <Button variant="outline" className="w-full">
                  Promote Another Airdrop
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}