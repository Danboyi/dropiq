import React from 'react'
import { render, screen } from '@testing-library/react'
import { ConditionalNavigation } from '@/components/layout/conditional-navigation'
import { Navigation } from '@/components/layout/navigation'
import { usePathname } from 'next/navigation'

// Mock the dependencies
jest.mock('@/components/layout/navigation')
jest.mock('next/navigation')

const mockNavigation = Navigation as jest.MockedFunction<typeof Navigation>
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('ConditionalNavigation Component', () => {
  beforeEach(() => {
    mockNavigation.mockReturnValue(<div data-testid="navigation">Navigation</div>)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders navigation on landing page', () => {
    mockUsePathname.mockReturnValue('/')

    render(<ConditionalNavigation />)

    expect(screen.getByTestId('navigation')).toBeInTheDocument()
    expect(mockNavigation).toHaveBeenCalledTimes(1)
  })

  it('does not render navigation on dashboard pages', () => {
    mockUsePathname.mockReturnValue('/home')

    render(<ConditionalNavigation />)

    expect(screen.queryByTestId('navigation')).not.toBeInTheDocument()
    expect(mockNavigation).not.toHaveBeenCalled()
  })

  it('does not render navigation on airdrops page', () => {
    mockUsePathname.mockReturnValue('/airdrops')

    render(<ConditionalNavigation />)

    expect(screen.queryByTestId('navigation')).not.toBeInTheDocument()
    expect(mockNavigation).not.toHaveBeenCalled()
  })

  it('does not render navigation on marketplace page', () => {
    mockUsePathname.mockReturnValue('/marketplace')

    render(<ConditionalNavigation />)

    expect(screen.queryByTestId('navigation')).not.toBeInTheDocument()
    expect(mockNavigation).not.toHaveBeenCalled()
  })

  it('does not render navigation on analytics page', () => {
    mockUsePathname.mockReturnValue('/analytics')

    render(<ConditionalNavigation />)

    expect(screen.queryByTestId('navigation')).not.toBeInTheDocument()
    expect(mockNavigation).not.toHaveBeenCalled()
  })

  it('does not render navigation on security page', () => {
    mockUsePathname.mockReturnValue('/security')

    render(<ConditionalNavigation />)

    expect(screen.queryByTestId('navigation')).not.toBeInTheDocument()
    expect(mockNavigation).not.toHaveBeenCalled()
  })

  it('renders navigation on auth page', () => {
    mockUsePathname.mockReturnValue('/auth')

    render(<ConditionalNavigation />)

    expect(screen.getByTestId('navigation')).toBeInTheDocument()
    expect(mockNavigation).toHaveBeenCalledTimes(1)
  })

  it('handles query parameters correctly', () => {
    mockUsePathname.mockReturnValue('/?ref=github')

    render(<ConditionalNavigation />)

    expect(screen.getByTestId('navigation')).toBeInTheDocument()
    expect(mockNavigation).toHaveBeenCalledTimes(1)
  })

  it('handles hash routes correctly', () => {
    mockUsePathname.mockReturnValue('/#features')

    render(<ConditionalNavigation />)

    expect(screen.getByTestId('navigation')).toBeInTheDocument()
    expect(mockNavigation).toHaveBeenCalledTimes(1)
  })
})