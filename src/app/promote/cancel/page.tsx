'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Home } from 'lucide-react'

export default function PromoteCancelPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <ArrowLeft className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl text-yellow-600">Payment Cancelled</CardTitle>
            <CardDescription>
              Your payment was cancelled. No charges were made.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-surface p-4 rounded-lg">
              <h3 className="font-semibold mb-2">No worries!</h3>
              <p className="text-sm text-muted-foreground">
                You can try again anytime. Your airdrop selection has been saved and you can 
                resume the promotion process whenever you're ready.
              </p>
            </div>

            <div className="flex flex-col space-y-2">
              <Link href="/promote">
                <Button className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </Link>
              <Link href="/home">
                <Button variant="outline" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}