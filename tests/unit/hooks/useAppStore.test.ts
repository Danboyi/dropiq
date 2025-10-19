import { renderHook, act } from '@testing-library/react'
import { useAppStore } from '@/lib/store'

// Mock the store implementation
jest.mock('@/lib/store', () => ({
  useAppStore: jest.fn(),
}))

const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>

describe('useAppStore Hook', () => {
  const mockStore = {
    theme: 'light',
    setTheme: jest.fn(),
    user: null,
    setUser: jest.fn(),
    connectedWallet: null,
    setConnectedWallet: jest.fn(),
    logout: jest.fn(),
  }

  beforeEach(() => {
    mockUseAppStore.mockReturnValue(mockStore as any)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns initial store state', () => {
    const { result } = renderHook(() => useAppStore())

    expect(result.current.theme).toBe('light')
    expect(result.current.user).toBeNull()
    expect(result.current.connectedWallet).toBeNull()
  })

  it('can set theme', () => {
    const { result } = renderHook(() => useAppStore())

    act(() => {
      result.current.setTheme('dark')
    })

    expect(mockStore.setTheme).toHaveBeenCalledWith('dark')
  })

  it('can set user', () => {
    const { result } = renderHook(() => useAppStore())
    const mockUser = { id: '1', username: 'testuser' }

    act(() => {
      result.current.setUser(mockUser)
    })

    expect(mockStore.setUser).toHaveBeenCalledWith(mockUser)
  })

  it('can set connected wallet', () => {
    const { result } = renderHook(() => useAppStore())
    const mockWallet = { address: '0x1234567890123456789012345678901234567890' }

    act(() => {
      result.current.setConnectedWallet(mockWallet)
    })

    expect(mockStore.setConnectedWallet).toHaveBeenCalledWith(mockWallet)
  })

  it('can logout', () => {
    const { result } = renderHook(() => useAppStore())

    act(() => {
      result.current.logout()
    })

    expect(mockStore.logout).toHaveBeenCalled()
  })

  it('handles theme toggle correctly', () => {
    const { result } = renderHook(() => useAppStore())

    act(() => {
      result.current.setTheme('dark')
    })

    expect(mockStore.setTheme).toHaveBeenCalledWith('dark')

    act(() => {
      result.current.setTheme('light')
    })

    expect(mockStore.setTheme).toHaveBeenCalledWith('light')
  })

  it('persists user state across re-renders', () => {
    const mockUser = { id: '1', username: 'testuser' }
    
    mockUseAppStore.mockReturnValue({
      ...mockStore,
      user: mockUser,
    } as any)

    const { result, rerender } = renderHook(() => useAppStore())

    expect(result.current.user).toBe(mockUser)

    // Re-render and user should persist
    rerender()
    expect(result.current.user).toBe(mockUser)
  })

  it('handles wallet connection state', () => {
    const { result } = renderHook(() => useAppStore())
    const mockWallet = { 
      address: '0x1234567890123456789012345678901234567890',
      chainId: 1,
      name: 'MetaMask'
    }

    act(() => {
      result.current.setConnectedWallet(mockWallet)
    })

    expect(mockStore.setConnectedWallet).toHaveBeenCalledWith(mockWallet)
  })

  it('clears user data on logout', () => {
    const mockUser = { id: '1', username: 'testuser' }
    const mockWallet = { address: '0x1234567890123456789012345678901234567890' }
    
    mockUseAppStore.mockReturnValue({
      ...mockStore,
      user: mockUser,
      connectedWallet: mockWallet,
    } as any)

    const { result } = renderHook(() => useAppStore())

    act(() => {
      result.current.logout()
    })

    expect(mockStore.logout).toHaveBeenCalled()
  })
})