'use client'

import { useState } from 'react'
import { useAccount, useSignMessage, useDisconnect, useConnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Wallet, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'

interface ConnectWalletButtonProps {
  onClose?: () => void
}

export function ConnectWalletButton({ onClose }: ConnectWalletButtonProps = {}) {
  const { address, isConnected, connector } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { disconnect } = useDisconnect()
  const { connect, connectors, isPending } = useConnect()
  
  const { 
    connectWallet, 
    disconnectWallet, 
    isLoading, 
    error, 
    clearError,
    isConnected: isAuthConnected 
  } = useAuthStore()

  const [isSigning, setIsSigning] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleConnect = async () => {
    if (!address) return

    setIsSigning(true)
    clearError()
    setSuccessMessage(null)

    try {
      // Get nonce from server
      const nonceResponse = await api.auth.getNonce(address)
      const { nonce, message } = nonceResponse.data

      // Sign the message
      const signature = await signMessageAsync({
        message,
      })

      // Connect wallet with signature
      await connectWallet(address, signature, message)
      
      setSuccessMessage('Wallet connected successfully!')

      // Close modal if callback provided
      if (onClose) {
        setTimeout(() => onClose(), 1500)
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)

    } catch (error) {
      console.error('Wallet connection error:', error)
    } finally {
      setIsSigning(false)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    disconnectWallet()
    setSuccessMessage(null)
  }

  // Show wallet connection status
  if (isConnected && isAuthConnected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Connected</p>
              <p className="text-xs text-muted-foreground">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={isLoading}
          >
            Disconnect
          </Button>
        </div>

        {successMessage && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  // Show connect button
  return (
    <div className="space-y-4">
      <div className="text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Wallet className="h-6 w-6 text-primary" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your wallet to track airdrops and save your progress
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {!isConnected ? (
          <div className="space-y-2">
            {connectors.map((connector) => (
              <Button
                key={connector.id}
                onClick={() => connect({ connector })}
                disabled={isPending}
                className="w-full"
                variant="outline"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect {connector.name}
                  </>
                )}
              </Button>
            ))}
          </div>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={isSigning || isLoading}
            className="w-full"
          >
            {isSigning || isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Signing Message...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                Sign to Authenticate
              </>
            )}
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          By connecting, you agree to sign a message to authenticate your identity.
          This doesn't cost any gas fees.
        </p>
      </div>
    </div>
  )
}