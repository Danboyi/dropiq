import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WalletConnectModal } from '@/components/wallets/wallet-connect-modal'

// Mock ethers and wallet providers
jest.mock('ethers', () => ({
  ethers: {
    BrowserProvider: jest.fn().mockImplementation(() => ({
      getSigner: jest.fn().mockResolvedValue({
        getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
        getBalance: jest.fn().mockResolvedValue('1000000000000000000'), // 1 ETH
      }),
      getNetwork: jest.fn().mockResolvedValue({
        chainId: 1,
        name: 'mainnet',
      }),
    })),
    formatEther: jest.fn().mockReturnValue('1.0'),
    parseEther: jest.fn().mockReturnValue('1000000000000000000'),
  },
}))

// Mock Web3Modal
jest.mock('@web3modal/wagmi', () => ({
  createWeb3Modal: jest.fn().mockReturnValue({
    open: jest.fn(),
    close: jest.fn(),
    subscribeEvents: jest.fn(),
  }),
}))

// Mock wagmi
jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
  useConnect: jest.fn(),
  useDisconnect: jest.fn(),
  useBalance: jest.fn(),
  useSwitchChain: jest.fn(),
  useChains: jest.fn(),
}))

// Mock the actual wallet connection logic
const mockWalletState = {
  isConnected: false,
  address: null,
  connector: null,
  chainId: null,
  balance: null,
}

jest.mock('@/hooks/use-wallet', () => ({
  useWallet: () => ({
    ...mockWalletState,
    connect: jest.fn(),
    disconnect: jest.fn(),
    switchChain: jest.fn(),
    getBalance: jest.fn(),
  }),
}))

describe('Wallet Integration Tests', () => {
  beforeEach(() => {
    // Reset mock state
    mockWalletState.isConnected = false
    mockWalletState.address = null
    mockWalletState.connector = null
    mockWalletState.chainId = null
    mockWalletState.balance = null

    // Mock window.ethereum
    Object.defineProperty(window, 'ethereum', {
      value: {
        request: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
        on: jest.fn(),
        removeListener: jest.fn(),
        isConnected: jest.fn(() => true),
        isMetaMask: true,
      },
      writable: true,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Wallet Connection Modal', () => {
    it('should render wallet connect button when not connected', () => {
      render(
        <WalletConnectModal>
          <button>Connect Wallet</button>
        </WalletConnectModal>
      )

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
    })

    it('should open wallet selection modal when clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <WalletConnectModal>
          <button>Connect Wallet</button>
        </WalletConnectModal>
      )

      const connectButton = screen.getByText('Connect Wallet')
      await user.click(connectButton)

      await waitFor(() => {
        expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
        expect(screen.getByText('MetaMask')).toBeInTheDocument()
        expect(screen.getByText('WalletConnect')).toBeInTheDocument()
        expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument()
      })
    })

    it('should display wallet address when connected', async () => {
      // Mock connected state
      mockWalletState.isConnected = true
      mockWalletState.address = '0x1234567890123456789012345678901234567890'
      mockWalletState.balance = '1.5'

      render(
        <WalletConnectModal>
          <button>Connected Wallet</button>
        </WalletConnectModal>
      )

      await waitFor(() => {
        expect(screen.getByText('0x1234...7890')).toBeInTheDocument()
        expect(screen.getByText('1.5 ETH')).toBeInTheDocument()
      })
    })

    it('should handle wallet connection errors gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock connection error
      Object.defineProperty(window, 'ethereum', {
        value: {
          request: jest.fn().mockRejectedValue(new Error('User rejected connection')),
          on: jest.fn(),
          removeListener: jest.fn(),
          isConnected: jest.fn(() => false),
          isMetaMask: true,
        },
        writable: true,
      })

      render(
        <WalletConnectModal>
          <button>Connect Wallet</button>
        </WalletConnectModal>
      )

      const connectButton = screen.getByText('Connect Wallet')
      await user.click(connectButton)

      // Try to connect with MetaMask
      const metaMaskButton = await screen.findByText('MetaMask')
      await user.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText(/Connection failed/)).toBeInTheDocument()
        expect(screen.getByText('User rejected connection')).toBeInTheDocument()
      })
    })

    it('should handle wallet disconnection', async () => {
      const user = userEvent.setup()
      
      // Mock connected state
      mockWalletState.isConnected = true
      mockWalletState.address = '0x1234567890123456789012345678901234567890'

      render(
        <WalletConnectModal>
          <button>Connected Wallet</button>
        </WalletConnectModal>
      )

      await waitFor(() => {
        expect(screen.getByText('0x1234...7890')).toBeInTheDocument()
      })

      // Find and click disconnect button
      const disconnectButton = screen.getByText('Disconnect')
      await user.click(disconnectButton)

      await waitFor(() => {
        expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
      })
    })

    it('should display network information', async () => {
      // Mock connected state with network
      mockWalletState.isConnected = true
      mockWalletState.address = '0x1234567890123456789012345678901234567890'
      mockWalletState.chainId = 1

      render(
        <WalletConnectModal>
          <button>Connected Wallet</button>
        </WalletConnectModal>
      )

      await waitFor(() => {
        expect(screen.getByText('Ethereum Mainnet')).toBeInTheDocument()
      })
    })

    it('should handle network switching', async () => {
      const user = userEvent.setup()
      
      // Mock connected state
      mockWalletState.isConnected = true
      mockWalletState.address = '0x1234567890123456789012345678901234567890'
      mockWalletState.chainId = 1

      render(
        <WalletConnectModal>
          <button>Connected Wallet</button>
        </WalletConnectModal>
      )

      await waitFor(() => {
        expect(screen.getByText('Ethereum Mainnet')).toBeInTheDocument()
      })

      // Find and click network switch button
      const networkButton = screen.getByText('Switch Network')
      await user.click(networkButton)

      await waitFor(() => {
        expect(screen.getByText('Polygon')).toBeInTheDocument()
        expect(screen.getByText('BSC')).toBeInTheDocument()
        expect(screen.getByText('Arbitrum')).toBeInTheDocument()
      })

      // Switch to Polygon
      const polygonButton = screen.getByText('Polygon')
      await user.click(polygonButton)

      await waitFor(() => {
        expect(screen.getByText('Polygon')).toBeInTheDocument()
      })
    })
  })

  describe('Multi-Wallet Support', () => {
    it('should support multiple wallet providers', async () => {
      const user = userEvent.setup()
      
      render(
        <WalletConnectModal>
          <button>Connect Wallet</button>
        </WalletConnectModal>
      )

      const connectButton = screen.getByText('Connect Wallet')
      await user.click(connectButton)

      await waitFor(() => {
        // Check for multiple wallet options
        expect(screen.getByText('MetaMask')).toBeInTheDocument()
        expect(screen.getByText('WalletConnect')).toBeInTheDocument()
        expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument()
        expect(screen.getByText('Phantom')).toBeInTheDocument()
      })
    })

    it('should handle WalletConnect connection', async () => {
      const user = userEvent.setup()
      
      render(
        <WalletConnectModal>
          <button>Connect Wallet</button>
        </WalletConnectModal>
      )

      const connectButton = screen.getByText('Connect Wallet')
      await user.click(connectButton)

      await waitFor(() => {
        expect(screen.getByText('WalletConnect')).toBeInTheDocument()
      })

      const walletConnectButton = screen.getByText('WalletConnect')
      await user.click(walletConnectButton)

      await waitFor(() => {
        expect(screen.getByText('Scan QR code with your wallet')).toBeInTheDocument()
      })
    })

    it('should handle Coinbase Wallet connection', async () => {
      const user = userEvent.setup()
      
      render(
        <WalletConnectModal>
          <button>Connect Wallet</button>
        </WalletConnectModal>
      )

      const connectButton = screen.getByText('Connect Wallet')
      await user.click(connectButton)

      await waitFor(() => {
        expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument()
      })

      const coinbaseButton = screen.getByText('Coinbase Wallet')
      await user.click(coinbaseButton)

      await waitFor(() => {
        expect(screen.getByText('Opening Coinbase Wallet...')).toBeInTheDocument()
      })
    })
  })

  describe('Wallet Error Handling', () => {
    it('should handle no wallet installed', async () => {
      const user = userEvent.setup()
      
      // Mock no wallet installed
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true,
      })

      render(
        <WalletConnectModal>
          <button>Connect Wallet</button>
        </WalletConnectModal>
      )

      const connectButton = screen.getByText('Connect Wallet')
      await user.click(connectButton)

      await waitFor(() => {
        expect(screen.getByText('No wallet found')).toBeInTheDocument()
        expect(screen.getByText('Install MetaMask')).toBeInTheDocument()
      })
    })

    it('should handle wrong network', async () => {
      const user = userEvent.setup()
      
      // Mock wallet on wrong network
      mockWalletState.isConnected = true
      mockWalletState.address = '0x1234567890123456789012345678901234567890'
      mockWalletState.chainId = 1337 // Localhost network

      render(
        <WalletConnectModal>
          <button>Connected Wallet</button>
        </WalletConnectModal>
      )

      await waitFor(() => {
        expect(screen.getByText('Wrong Network')).toBeInTheDocument()
        expect(screen.getByText('Switch to Mainnet')).toBeInTheDocument()
      })
    })

    it('should handle insufficient balance', async () => {
      const user = userEvent.setup()
      
      // Mock wallet with low balance
      mockWalletState.isConnected = true
      mockWalletState.address = '0x1234567890123456789012345678901234567890'
      mockWalletState.balance = '0.001' // Very low balance

      render(
        <WalletConnectModal>
          <button>Connected Wallet</button>
        </WalletConnectModal>
      )

      await waitFor(() => {
        expect(screen.getByText('Low Balance')).toBeInTheDocument()
        expect(screen.getByText('0.001 ETH')).toBeInTheDocument()
      })
    })

    it('should handle wallet disconnection mid-transaction', async () => {
      const user = userEvent.setup()
      
      // Mock wallet disconnection
      mockWalletState.isConnected = true
      mockWalletState.address = '0x1234567890123456789012345678901234567890'

      render(
        <WalletConnectModal>
          <button>Connected Wallet</button>
        </WalletConnectModal>
      )

      await waitFor(() => {
        expect(screen.getByText('0x1234...7890')).toBeInTheDocument()
      })

      // Simulate wallet disconnection
      mockWalletState.isConnected = false
      mockWalletState.address = null

      await waitFor(() => {
        expect(screen.getByText('Wallet Disconnected')).toBeInTheDocument()
        expect(screen.getByText('Reconnect Wallet')).toBeInTheDocument()
      })
    })
  })

  describe('Wallet Security', () => {
    it('should validate wallet address format', async () => {
      const user = userEvent.setup()
      
      // Mock invalid address
      Object.defineProperty(window, 'ethereum', {
        value: {
          request: jest.fn().mockResolvedValue('invalid-address'),
          on: jest.fn(),
          removeListener: jest.fn(),
          isConnected: jest.fn(() => true),
          isMetaMask: true,
        },
        writable: true,
      })

      render(
        <WalletConnectModal>
          <button>Connect Wallet</button>
        </WalletConnectModal>
      )

      const connectButton = screen.getByText('Connect Wallet')
      await user.click(connectButton)

      const metaMaskButton = await screen.findByText('MetaMask')
      await user.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid wallet address')).toBeInTheDocument()
      })
    })

    it('should handle signature requests', async () => {
      const user = userEvent.setup()
      
      // Mock signature request
      Object.defineProperty(window, 'ethereum', {
        value: {
          request: jest.fn()
            .mockResolvedValueOnce('0x1234567890123456789012345678901234567890')
            .mockResolvedValueOnce('0xsignature123'),
          on: jest.fn(),
          removeListener: jest.fn(),
          isConnected: jest.fn(() => true),
          isMetaMask: true,
        },
        writable: true,
      })

      render(
        <WalletConnectModal>
          <button>Connect Wallet</button>
        </WalletConnectModal>
      )

      const connectButton = screen.getByText('Connect Wallet')
      await user.click(connectButton)

      const metaMaskButton = await screen.findByText('MetaMask')
      await user.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText('Sign Message')).toBeInTheDocument()
        expect(screen.getByText('Please sign to verify your identity')).toBeInTheDocument()
      })
    })

    it('should reject malicious signature requests', async () => {
      const user = userEvent.setup()
      
      // Mock malicious signature request
      Object.defineProperty(window, 'ethereum', {
        value: {
          request: jest.fn()
            .mockResolvedValueOnce('0x1234567890123456789012345678901234567890')
            .mockRejectedValueOnce(new Error('Malicious request detected')),
          on: jest.fn(),
          removeListener: jest.fn(),
          isConnected: jest.fn(() => true),
          isMetaMask: true,
        },
        writable: true,
      })

      render(
        <WalletConnectModal>
          <button>Connect Wallet</button>
        </WalletConnectModal>
      )

      const connectButton = screen.getByText('Connect Wallet')
      await user.click(connectButton)

      const metaMaskButton = await screen.findByText('MetaMask')
      await user.click(metaMaskButton)

      await waitFor(() => {
        expect(screen.getByText('Security Alert')).toBeInTheDocument()
        expect(screen.getByText('Malicious request detected')).toBeInTheDocument()
      })
    })
  })
})