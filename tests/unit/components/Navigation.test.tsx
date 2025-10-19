import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Navigation } from '@/components/layout/navigation'
import { useAppStore } from '@/lib/store'
import { useLogout } from '@/hooks/use-api'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'

// Mock the hooks
jest.mock('@/lib/store')
jest.mock('@/hooks/use-api')
jest.mock('next-themes')
jest.mock('next/navigation')
jest.mock('@/components/wallets/wallet-connect-modal', () => ({
  WalletConnectModal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>
const mockUseLogout = useLogout as jest.MockedFunction<typeof useLogout>
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('Navigation Component', () => {
  const mockLogoutMutation = {
    mutate: jest.fn(),
  }

  beforeEach(() => {
    mockUseAppStore.mockReturnValue({
      theme: 'light',
      setTheme: jest.fn(),
      user: null,
      connectedWallet: null,
    } as any)

    mockUseLogout.mockReturnValue(mockLogoutMutation as any)

    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: jest.fn(),
    } as any)

    mockUsePathname.mockReturnValue('/')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('When user is not logged in', () => {
    it('renders navigation with sign in and get started buttons', () => {
      render(<Navigation />)

      expect(screen.getByText('DropIQ')).toBeInTheDocument()
      expect(screen.getByText('Features')).toBeInTheDocument()
      expect(screen.getByText('How It Works')).toBeInTheDocument()
      expect(screen.getByText('Pricing')).toBeInTheDocument()
      expect(screen.getByText('About')).toBeInTheDocument()
      expect(screen.getByText('Contact')).toBeInTheDocument()
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByText('Get Started')).toBeInTheDocument()
    })

    it('does not render user-specific elements', () => {
      render(<Navigation />)

      expect(screen.queryByTestId('user-avatar')).not.toBeInTheDocument()
      expect(screen.queryByTestId('notifications')).not.toBeInTheDocument()
    })

    it('renders connect wallet button', () => {
      render(<Navigation />)

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
    })
  })

  describe('When user is logged in', () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      avatar: 'https://example.com/avatar.jpg',
    }

    beforeEach(() => {
      mockUseAppStore.mockReturnValue({
        theme: 'light',
        setTheme: jest.fn(),
        user: mockUser,
        connectedWallet: null,
      } as any)
    })

    it('renders user avatar and notifications', () => {
      render(<Navigation />)

      expect(screen.getByTestId('user-avatar')).toBeInTheDocument()
      expect(screen.getByTestId('notifications')).toBeInTheDocument()
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
      expect(screen.queryByText('Get Started')).not.toBeInTheDocument()
    })

    it('opens user dropdown when avatar is clicked', async () => {
      render(<Navigation />)

      const avatar = screen.getByTestId('user-avatar')
      fireEvent.click(avatar)

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Browse Airdrops')).toBeInTheDocument()
        expect(screen.getByText('Marketplace')).toBeInTheDocument()
        expect(screen.getByText('Wallets')).toBeInTheDocument()
        expect(screen.getByText('Analytics')).toBeInTheDocument()
        expect(screen.getByText('Settings')).toBeInTheDocument()
        expect(screen.getByText('Log out')).toBeInTheDocument()
      })
    })

    it('calls logout when log out is clicked', async () => {
      render(<Navigation />)

      const avatar = screen.getByTestId('user-avatar')
      fireEvent.click(avatar)

      await waitFor(() => {
        const logoutButton = screen.getByText('Log out')
        fireEvent.click(logoutButton)
      })

      expect(mockLogoutMutation.mutate).toHaveBeenCalled()
    })
  })

  describe('Theme toggle', () => {
    it('toggles theme when theme button is clicked', () => {
      const mockSetTheme = jest.fn()
      mockUseAppStore.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        user: null,
        connectedWallet: null,
      } as any)

      render(<Navigation />)

      const themeButton = screen.getByRole('button', { name: /theme/i })
      fireEvent.click(themeButton)

      expect(mockSetTheme).toHaveBeenCalledWith('dark')
    })

    it('shows sun icon in dark mode', () => {
      mockUseAppStore.mockReturnValue({
        theme: 'dark',
        setTheme: jest.fn(),
        user: null,
        connectedWallet: null,
      } as any)

      render(<Navigation />)

      // Check for sun icon (should be visible in dark mode)
      const sunIcon = document.querySelector('[data-testid="sun-icon"]')
      expect(sunIcon).toBeInTheDocument()
    })
  })

  describe('Navigation links', () => {
    it('renders correct navigation items', () => {
      render(<Navigation />)

      expect(screen.getByText('Features')).toBeInTheDocument()
      expect(screen.getByText('How It Works')).toBeInTheDocument()
      expect(screen.getByText('Pricing')).toBeInTheDocument()
      expect(screen.getByText('About')).toBeInTheDocument()
      expect(screen.getByText('Contact')).toBeInTheDocument()
    })

    it('highlights active navigation item', () => {
      mockUsePathname.mockReturnValue('/#features')
      render(<Navigation />)

      const featuresLink = screen.getByText('Features')
      expect(featuresLink).toHaveClass('text-foreground')
    })
  })

  describe('Mobile responsiveness', () => {
    it('renders mobile menu button on small screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<Navigation />)

      const mobileMenuButton = screen.getByRole('button', { name: /menu/i })
      expect(mobileMenuButton).toBeInTheDocument()
    })

    it('opens mobile menu when hamburger is clicked', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<Navigation />)

      const mobileMenuButton = screen.getByRole('button', { name: /menu/i })
      fireEvent.click(mobileMenuButton)

      await waitFor(() => {
        expect(screen.getByText('Features')).toBeInTheDocument()
        expect(screen.getByText('How It Works')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<Navigation />)

      const navigation = screen.getByRole('navigation')
      expect(navigation).toBeInTheDocument()
      expect(navigation).toHaveAttribute('aria-label', 'Main navigation')
    })

    it('supports keyboard navigation', () => {
      render(<Navigation />)

      const firstNavItem = screen.getByText('Features')
      firstNavItem.focus()
      expect(firstNavItem).toHaveFocus()

      // Test tab navigation
      fireEvent.keyDown(firstNavItem, { key: 'Tab' })
      const nextNavItem = screen.getByText('How It Works')
      expect(nextNavItem).toHaveFocus()
    })

    it('announces notifications to screen readers', () => {
      mockUseAppStore.mockReturnValue({
        theme: 'light',
        setTheme: jest.fn(),
        user: { id: '1', username: 'testuser' },
        connectedWallet: null,
      } as any)

      render(<Navigation />)

      const notificationButton = screen.getByTestId('notifications')
      expect(notificationButton).toHaveAttribute('aria-label', 'Notifications, 2 unread')
    })
  })
})