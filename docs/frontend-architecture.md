# DropIQ Frontend Architecture Documentation

## Overview

The DropIQ frontend is a modern, production-ready web application built with Next.js 15, TypeScript, and Tailwind CSS. It provides a seamless user experience for discovering, tracking, and participating in cryptocurrency airdrops with AI-powered insights.

## Technology Stack

### Core Framework
- **Next.js 15** with App Router for server-side rendering and optimal performance
- **TypeScript 5** for type safety and better developer experience
- **React 19** with modern hooks and concurrent features

### Styling & UI
- **Tailwind CSS 4** for utility-first styling with custom design system
- **shadcn/ui** component library for consistent, accessible UI components
- **Lucide React** for industry-standard icons
- **Framer Motion** for smooth animations and transitions

### State Management
- **Zustand** for lightweight, simple global state management
- **TanStack Query (React Query)** for server state management and caching
- **Local storage** for user preferences and persistence

### Data Visualization
- **Recharts** for interactive charts and analytics
- **Custom chart components** for airdrop-specific visualizations

### Development Tools
- **ESLint** for code quality and consistency
- **TypeScript** for static type checking
- **Next.js DevTools** for debugging and optimization

## Architecture Decisions

### 1. Component-Based Architecture

The application follows a modular component-based architecture:

```
src/
├── components/
│   ├── ui/              # shadcn/ui base components
│   ├── layout/          # Layout components (Dashboard, Navigation)
│   ├── airdrops/        # Airdrop-specific components
│   ├── wallets/         # Wallet management components
│   ├── charts/          # Analytics and visualization
│   ├── forms/           # Form components
│   ├── tables/          # Data table components
│   └── providers/       # React context providers
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and configurations
├── app/                 # Next.js App Router pages
└── types/               # TypeScript type definitions
```

**Benefits:**
- **Reusability**: Components can be easily reused across different pages
- **Maintainability**: Clear separation of concerns makes code easier to maintain
- **Testing**: Individual components can be tested in isolation
- **Performance**: Components can be code-split and loaded on demand

### 2. State Management Strategy

#### Global State (Zustand)
Used for application-wide state that needs to be shared across components:

```typescript
interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  wallets: Wallet[];
  connectedWallet: Wallet | null;
  airdrops: Airdrop[];
  savedAirdrops: string[];
  // ... other global state
}
```

**Why Zustand?**
- **Lightweight**: Minimal bundle size impact
- **Simple**: Easy to understand and use
- **TypeScript-first**: Excellent type safety
- **No providers required**: Can be used anywhere in the app

#### Server State (React Query)
Used for data fetching, caching, and synchronization:

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['airdrops', params],
  queryFn: () => apiService.getAirdrops(params),
});
```

**Why React Query?**
- **Caching**: Automatic caching and background refetching
- **Optimistic Updates**: Smooth user experience with immediate UI updates
- **Error Handling**: Built-in error handling and retry logic
- **DevTools**: Excellent debugging capabilities

### 3. Responsive Design Approach

#### Mobile-First Design
All components are designed mobile-first with progressive enhancement:

```css
/* Base styles for mobile */
.component {
  padding: 1rem;
}

/* Tablet styles */
@media (min-width: 768px) {
  .component {
    padding: 1.5rem;
  }
}

/* Desktop styles */
@media (min-width: 1024px) {
  .component {
    padding: 2rem;
  }
}
```

#### Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px
- **Large Desktop**: > 1280px

#### Touch-Friendly Interactions
- Minimum 44px touch targets for buttons and interactive elements
- Proper spacing between interactive elements
- Touch-optimized gestures and animations

### 4. Accessibility Implementation

#### Semantic HTML
```html
<main role="main" aria-label="Main content">
  <section aria-labelledby="airdrops-heading">
    <h2 id="airdrops-heading">Active Airdrops</h2>
    <!-- Content -->
  </section>
</main>
```

#### ARIA Labels and Descriptions
```typescript
<button
  aria-label="Save airdrop to favorites"
  aria-describedby="save-help"
>
  <StarIcon />
</button>
<div id="save-help" className="sr-only">
  Save this airdrop to your favorites list for quick access
</div>
```

#### Keyboard Navigation
- All interactive elements are keyboard accessible
- Proper focus management
- Skip links for navigation
- Focus indicators for better visibility

#### Screen Reader Support
- Semantic HTML5 elements
- ARIA labels and descriptions
- Live regions for dynamic content updates
- Proper heading hierarchy

### 5. Performance Optimizations

#### Code Splitting
```typescript
// Dynamic imports for heavy components
const AirdropChart = dynamic(() => import('@/components/charts/airdrop-chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});
```

#### Image Optimization
- Next.js Image component for automatic optimization
- Responsive images with proper sizing
- Lazy loading for below-the-fold images

#### Bundle Optimization
- Tree shaking for unused code
- Dynamic imports for route-based code splitting
- Optimized dependencies with proper imports

## Component Library

### Base UI Components (shadcn/ui)

All base UI components are built on shadcn/ui, providing:

- **Consistency**: Unified design language across the application
- **Accessibility**: Built with accessibility best practices
- **Customization**: Easy to customize with CSS variables
- **Type Safety**: Full TypeScript support

#### Key Components Used:
- `Button`, `Input`, `Select` for forms
- `Card`, `CardHeader`, `CardContent` for content containers
- `Table`, `TableHeader`, `TableBody` for data display
- `Dialog`, `Sheet` for modals and overlays
- `Tabs`, `TabsList`, `TabsContent` for navigation
- `Badge`, `Avatar`, `Progress` for status indicators

### Custom Components

#### AirdropCard
Comprehensive card component for displaying airdrop information:

```typescript
interface AirdropCardProps {
  airdrop: Airdrop;
  showActions?: boolean;
  compact?: boolean;
}
```

**Features:**
- Responsive layout with mobile and desktop variants
- Real-time status updates
- Interactive actions (save, participate, share)
- Risk assessment indicators
- Accessibility support

#### WalletConnectModal
Multi-provider wallet connection modal:

```typescript
interface WalletConnectModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
```

**Features:**
- Support for multiple wallet providers (MetaMask, WalletConnect, etc.)
- QR code scanning for mobile wallets
- Manual wallet address input
- Security validation and risk assessment
- Connection status management

#### AirdropsTable
Advanced data table with sorting and filtering:

```typescript
interface AirdropsTableProps {
  data: Airdrop[];
  loading?: boolean;
  onViewDetails?: (airdrop: Airdrop) => void;
  onParticipate?: (airdrop: Airdrop) => void;
}
```

**Features:**
- Multi-column sorting
- Advanced filtering (status, type, risk level)
- Search functionality
- Responsive design with mobile table view
- Pagination and virtual scrolling for large datasets

#### Chart Components
Data visualization components for analytics:

```typescript
interface AirdropChartProps {
  type: 'line' | 'area' | 'bar' | 'pie';
  data: ChartData[];
  title: string;
  // ... other props
}
```

**Features:**
- Interactive charts with tooltips
- Responsive design
- Custom themes matching the application
- Real-time data updates
- Accessibility support

## Routing and Navigation

### App Router Structure

```
app/
├── page.tsx              # Landing page
├── auth/
│   └── page.tsx          # Authentication page
├── dashboard/
│   ├── page.tsx          # Main dashboard
│   ├── airdrops/
│   │   ├── page.tsx      # Airdrops listing
│   │   └── [id]/
│   │       └── page.tsx  # Airdrop details
│   ├── wallets/
│   │   └── page.tsx      # Wallet management
│   ├── security/
│   │   └── page.tsx      # Security settings
│   └── settings/
│       └── page.tsx      # User settings
└── api/                  # API routes
```

### Protected Routes

All dashboard routes are protected using the `ProtectedRoute` component:

```typescript
<ProtectedRoute>
  <DashboardLayout>
    {/* Protected content */}
  </DashboardLayout>
</ProtectedRoute>
```

**Features:**
- Automatic redirect to login for unauthenticated users
- Loading states during authentication check
- Role-based access control (can be extended)
- Custom redirect URLs

### Navigation Components

#### DashboardLayout
Main layout component for authenticated pages:

```typescript
<DashboardLayout>
  <main>{children}</main>
</DashboardLayout>
```

**Features:**
- Responsive sidebar navigation
- Top navigation bar with user menu
- Breadcrumb navigation
- Search functionality
- Theme toggle
- Notification system

## State Management Implementation

### Zustand Store

```typescript
interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Wallet state
  wallets: Wallet[];
  connectedWallet: Wallet | null;
  
  // Airdrop state
  airdrops: Airdrop[];
  savedAirdrops: string[];
  participatedAirdrops: string[];
  
  // UI state
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  currency: 'USD' | 'EUR' | 'GBP';
  notifications: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  // ... other actions
}
```

### React Query Hooks

Custom hooks for API interactions:

```typescript
export function useAirdrops(params?: AirdropParams) {
  return useQuery({
    queryKey: ['airdrops', params],
    queryFn: () => apiService.getAirdrops(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useSaveAirdrop() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (airdropId: string) => apiService.saveAirdrop(airdropId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['airdrops'] });
      toast.success('Airdrop saved successfully');
    },
  });
}
```

## API Integration

### API Service Layer

Centralized API service with interceptors:

```typescript
class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      timeout: 10000,
    });

    // Request interceptor for auth token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token refresh
        }
        return Promise.reject(error);
      }
    );
  }
}
```

### Error Handling

Comprehensive error handling with user-friendly messages:

```typescript
export function useApiError() {
  return useCallback((error: unknown) => {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || 'An error occurred';
      toast.error(message);
    } else {
      toast.error('An unexpected error occurred');
    }
  }, []);
}
```

## Testing Strategy

### Component Testing
- Unit tests for individual components
- Integration tests for component interactions
- Accessibility testing with testing-library

### Hook Testing
- Custom hook testing with React Testing Library
- Mock API responses for consistent testing
- State management testing

### E2E Testing
- Critical user journey testing
- Cross-browser compatibility testing
- Mobile responsiveness testing

## Performance Monitoring

### Web Vitals
- Core Web Vitals monitoring
- Performance budget tracking
- Bundle size analysis

### User Experience
- Loading states and skeleton screens
- Optimistic updates for better perceived performance
- Error boundaries for graceful error handling

## Security Considerations

### Client-Side Security
- Input validation and sanitization
- XSS prevention
- Secure token storage
- CSRF protection

### API Security
- JWT token management
- Request rate limiting
- Input validation
- Error message sanitization

## Deployment and DevOps

### Build Process
- Optimized production builds
- Code splitting and tree shaking
- Asset optimization
- Environment-specific configurations

### Environment Setup
- Development, staging, and production environments
- Environment variable management
- CI/CD pipeline integration

## Future Enhancements

### Progressive Web App (PWA)
- Service worker implementation
- Offline functionality
- Push notifications
- App-like experience

### Advanced Features
- Real-time updates with WebSockets
- Advanced analytics and reporting
- Machine learning integration
- Multi-language support

### Performance Optimizations
- Server-side rendering optimization
- Edge computing integration
- Advanced caching strategies
- Bundle size optimization

## Conclusion

The DropIQ frontend architecture provides a solid foundation for a scalable, maintainable, and performant web application. The combination of modern technologies, best practices, and thoughtful design decisions ensures an excellent user experience across all devices and platforms.

The modular architecture allows for easy extension and maintenance, while the comprehensive testing strategy ensures reliability and quality. The focus on accessibility and performance makes the application inclusive and fast, providing a premium user experience for all users.