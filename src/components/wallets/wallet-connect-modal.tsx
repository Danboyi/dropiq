'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { useWalletStore } from '@/lib/store/wallet';
import { getInstalledWallets } from '@/lib/wallet-providers';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wallet, AlertCircle, Shield, CheckCircle } from 'lucide-react';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { connectWallet, user, isGuest } = useAuthStore();
  const { connect: connectWalletProvider } = useWalletStore();

  const availableWallets = getInstalledWallets();

  const handleWalletSelect = async (walletId: string) => {
    setSelectedWallet(walletId);
    setIsConnecting(true);
    setError(null);

    try {
      // First connect the wallet provider
      await connectWalletProvider(walletId);
      
      // Get the connection details
      const { connection } = useWalletStore.getState();
      
      if (!connection) {
        throw new Error('Failed to connect wallet');
      }

      // Generate nonce and message for signing
      const nonceResponse = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: connection.address }),
      });

      if (!nonceResponse.ok) {
        throw new Error('Failed to generate authentication message');
      }

      const { message } = await nonceResponse.json();

      // Sign the message
      const signature = await useWalletStore.getState().signMessage(message);

      // Authenticate with the backend
      await connectWallet({
        address: connection.address,
        signature,
        message,
        walletType: walletId,
        chainId: connection.chainId,
      });

      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
      setSelectedWallet(null);
    }
  };

  const getWalletIcon = (walletId: string) => {
    const icons: Record<string, string> = {
      metamask: '/wallets/metamask.svg',
      walletconnect: '/wallets/walletconnect.svg',
      coinbase: '/wallets/coinbase.svg',
    };
    return icons[walletId] || '/wallets/default.svg';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Your Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {user && isGuest && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                You're currently in guest mode. Connecting a wallet gives you read-only access to airdrop data.
                Create a full account to save your progress and unlock all features.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {availableWallets.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No wallet extensions detected
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Install MetaMask, WalletConnect, or another supported wallet to continue
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {availableWallets.map((wallet) => (
                <Card
                  key={wallet.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedWallet === wallet.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => !isConnecting && handleWalletSelect(wallet.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <img
                            src={getWalletIcon(wallet.id)}
                            alt={wallet.name}
                            className="h-6 w-6"
                            onError={(e) => {
                              e.currentTarget.src = '/wallets/default.svg';
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{wallet.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {wallet.id === 'metask' && 'Most popular'}
                            {wallet.id === 'walletconnect' && 'Mobile friendly'}
                            {wallet.id === 'coinbase' && 'Easy to use'}
                          </p>
                        </div>
                      </div>
                      
                      {selectedWallet === wallet.id && isConnecting ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      ) : selectedWallet === wallet.id ? (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      ) : (
                        <Badge variant="outline">Connect</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• By connecting, you agree to our Terms of Service</p>
            <p>• Your wallet will be used for identity verification only</p>
            <p>• No transactions will be executed without your permission</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}