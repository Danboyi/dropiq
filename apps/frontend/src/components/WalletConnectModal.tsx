'use client'

import { useAccount, useSignMessage, useDisconnect } from 'wagmi'
import { useState } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Wallet, Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function WalletConnectModal() {
  const { address, isConnected } = useAccount()
  const { signMessage, isPending: isSigning } = useSignMessage()
  const { disconnect } = useDisconnect()
  
  const { 
    showWalletModal, 
    setShowWalletModal, 
    setWallet, 
    setUser, 
    setTokens,
    setLoading,
    isWalletConnected 
  } = useAuthStore()
  
  const [nonce, setNonce] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnectWallet = async () => {
    if (!address) return

    try {
      setIsConnecting(true)
      setError('')
      setLoading(true)

      // Get nonce from server
      const nonceResponse = await authApi.getNonce(address)
      setNonce(nonceResponse.data.nonce)
      setMessage(nonceResponse.data.message)

      // Sign message
      const signature = await new Promise<string>((resolve, reject) => {
        signMessage({
          message: nonceResponse.data.message,
          onSuccess: (result) => resolve(result),
          onError: (error) => reject(error)
        })
      })

      // Connect wallet to backend
      const authResponse = await authApi.connectWallet({
        address,
        signature,
        message: nonceResponse.data.message,
        chainId: 1 // Ethereum mainnet
      })

      // Update store
      setUser(authResponse.data.user)
      setWallet(authResponse.data.wallet || null)
      setTokens(authResponse.data.tokens.accessToken, authResponse.data.tokens.refreshToken)

      // Store tokens in cookies and localStorage
      document.cookie = `accessToken=${authResponse.data.tokens.accessToken}; path=/; max-age=604800`
      document.cookie = `refreshToken=${authResponse.data.tokens.refreshToken}; path=/; max-age=604800`
      localStorage.setItem('accessToken', authResponse.data.tokens.accessToken)
      localStorage.setItem('refreshToken', authResponse.data.tokens.refreshToken)

      setShowWalletModal(false)
      setError('')
    } catch (error: any) {
      console.error('Wallet connection error:', error)
      setError(error.response?.data?.error?.message || 'Failed to connect wallet')
    } finally {
      setIsConnecting(false)
      setLoading(false)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    setWallet(null)
    setUser(null)
    setShowWalletModal(false)
  }

  if (!showWalletModal) return null

  return (
    <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isConnected ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <Wallet className="h-4 w-4" />
                  <span className="font-medium">Wallet Connected</span>
                </div>
                <p className="text-sm text-green-700 mt-1 font-mono">
                  {address}
                </p>
              </div>
              
              {!isWalletConnected ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Click below to authenticate your wallet and access the platform.
                  </p>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button 
                    onClick={handleConnectWallet}
                    disabled={isConnecting || isSigning}
                    className="w-full"
                  >
                    {(isConnecting || isSigning) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      'Authenticate Wallet'
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-green-600">
                    Your wallet is authenticated and ready to use!
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={handleDisconnect}
                    className="w-full"
                  >
                    Disconnect Wallet
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-6">
                <Wallet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Connect Your Wallet
                </h3>
                <p className="text-sm text-gray-600">
                  Connect your Ethereum wallet to access DropIQ features.
                </p>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={() => setShowWalletModal(false)}
                  className="w-full"
                >
                  Connect Wallet
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Make sure you have a Web3 wallet installed (MetaMask, Rainbow, etc.)
                </p>
              </div>
            </div>
          )}
          
          <Separator />
          
          <div className="text-xs text-gray-500 space-y-1">
            <p>• By connecting your wallet, you agree to our Terms of Service</p>
            <p>• Your wallet will be used for authentication only</p>
            <p>• No transactions will be executed without your permission</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}