# DropIQ Component Library Documentation

## Overview

The DropIQ component library is built on top of shadcn/ui and provides a comprehensive set of reusable components specifically designed for the airdrop aggregation platform. All components follow accessibility best practices, are fully typed with TypeScript, and support responsive design.

## Design System

### Color Palette

The design system uses CSS custom properties for consistent theming:

```css
:root {
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
}
```

### Typography

```css
:root {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

### Spacing

Consistent spacing scale using Tailwind CSS:
- `1`: 0.25rem (4px)
- `2`: 0.5rem (8px)
- `3`: 0.75rem (12px)
- `4`: 1rem (16px)
- `6`: 1.5rem (24px)
- `8`: 2rem (32px)

## Base Components

### Button

Versatile button component with multiple variants and sizes.

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}
```

**Usage:**
```tsx
<Button variant="default" size="lg">
  Get Started
</Button>

<Button variant="outline" size="sm">
  Cancel
</Button>

<Button variant="ghost" size="icon">
  <Settings className="h-4 w-4" />
</Button>
```

### Card

Flexible container component for content grouping.

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  // No additional props - uses standard div props
}
```

**Usage:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
</Card>
```

### Input

Form input with various types and states.

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // No additional props - uses standard input props
}
```

**Usage:**
```tsx
<Input
  type="email"
  placeholder="Enter your email"
  disabled={false}
  required
/>
```

### Badge

Small status indicators and labels.

```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}
```

**Usage:**
```tsx
<Badge variant="default">Active</Badge>
<Badge variant="secondary">Pending</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Inactive</Badge>
```

## Custom Components

### AirdropCard

Comprehensive card component for displaying airdrop information.

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

**Usage:**
```tsx
<AirdropCard
  airdrop={airdropData}
  showActions={true}
  compact={false}
/>
```

**Compact Variant:**
```tsx
<AirdropCard
  airdrop={airdropData}
  compact={true}
/>
```

### WalletConnectModal

Multi-provider wallet connection modal.

```typescript
interface WalletConnectModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
```

**Features:**
- Support for multiple wallet providers
- QR code scanning for mobile wallets
- Manual wallet address input
- Security validation
- Connection status management

**Usage:**
```tsx
<WalletConnectModal>
  <Button>Connect Wallet</Button>
</WalletConnectModal>

// Controlled usage
<WalletConnectModal
  open={isOpen}
  onOpenChange={setIsOpen}
/>
```

### AirdropsTable

Advanced data table with sorting and filtering.

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
- Responsive design
- Pagination support

**Usage:**
```tsx
<AirdropsTable
  data={airdropsData}
  loading={isLoading}
  onViewDetails={handleViewDetails}
  onParticipate={handleParticipate}
/>
```

### AirdropChart

Flexible chart component for data visualization.

```typescript
interface AirdropChartProps {
  type: 'line' | 'area' | 'bar' | 'pie';
  data: ChartData[];
  title: string;
  description?: string;
  dataKey: string;
  xAxisKey?: string;
  color?: string;
  height?: number;
  showTrend?: boolean;
  formatValue?: (value: number) => string;
}
```

**Features:**
- Multiple chart types
- Interactive tooltips
- Responsive design
- Custom themes
- Real-time updates

**Usage:**
```tsx
<AirdropChart
  type="area"
  data={chartData}
  title="Airdrop Value Trend"
  dataKey="value"
  color="#10b981"
  height={250}
  showTrend
  formatValue={(value) => `$${(value / 1000).toFixed(0)}K`}
/>
```

### DashboardStats

Stats cards component for dashboard overview.

```typescript
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  description?: string;
  format?: 'currency' | 'percentage' | 'number';
}
```

**Usage:**
```tsx
<DashboardStats data={statsData} />

// Individual stat card
<StatsCard
  title="Total Value"
  value={2450000}
  change={12.5}
  icon={<DollarSign />}
  format="currency"
/>
```

### AuthForms

Complete authentication forms with login and registration.

```typescript
interface AuthFormsProps {
  onSuccess?: () => void;
  defaultTab?: 'login' | 'register';
}
```

**Features:**
- Login and registration forms
- Form validation
- Social login options
- Password strength indicators
- Remember me functionality

**Usage:**
```tsx
<AuthForms
  onSuccess={handleAuthSuccess}
  defaultTab="login"
/>
```

## Layout Components

### DashboardLayout

Main layout component for authenticated pages.

```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
}
```

**Features:**
- Responsive sidebar navigation
- Top navigation bar
- User menu
- Search functionality
- Theme toggle
- Notification system

**Usage:**
```tsx
<DashboardLayout>
  <div>{/* Page content */}</div>
</DashboardLayout>
```

## Form Components

### Form Validation

All form components integrate with React Hook Form and Zod for validation.

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
});
```

### Custom Form Components

#### FormField
Enhanced form field with validation and error handling.

```typescript
interface FormFieldProps {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}
```

#### FormSelect
Select component with form integration.

```typescript
interface FormSelectProps {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
}
```

## Utility Components

### Loading States

#### Skeleton
Loading skeleton for content placeholders.

```tsx
<Skeleton className="h-4 w-[250px]" />
<Skeleton className="h-8 w-8 rounded-full" />
```

#### LoadingSpinner
Custom loading spinner component.

```tsx
<LoadingSpinner size="sm" />
<LoadingSpinner size="lg" />
```

### Error Handling

#### ErrorBoundary
React error boundary for graceful error handling.

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}
```

#### ErrorMessage
Consistent error message display.

```typescript
interface ErrorMessageProps {
  error: string | Error;
  variant?: 'default' | 'destructive';
}
```

## Accessibility Features

### ARIA Support

All components include proper ARIA labels and descriptions:

```tsx
<button
  aria-label="Save airdrop to favorites"
  aria-describedby="save-help"
  aria-pressed={isSaved}
>
  <StarIcon />
</button>
```

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Proper focus management
- Skip links for navigation
- Focus indicators

### Screen Reader Support

- Semantic HTML5 elements
- Live regions for dynamic content
- Proper heading hierarchy
- Descriptive alt text for images

## Responsive Design

### Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px
- **Large Desktop**: > 1280px

### Mobile-First Approach

All components are designed mobile-first:

```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* Content */}
</div>
```

### Touch-Friendly Design

- Minimum 44px touch targets
- Proper spacing between elements
- Touch-optimized gestures

## Theming

### Dark Mode Support

All components support dark/light theme switching:

```tsx
import { useTheme } from 'next-themes';

const { theme, setTheme } = useTheme();
```

### Custom Themes

Components can be customized using CSS variables:

```css
.custom-theme {
  --primary: #custom-color;
  --background: #custom-bg;
}
```

## Performance Considerations

### Code Splitting

Heavy components are code-split:

```tsx
const AirdropChart = dynamic(() => import('./AirdropChart'), {
  loading: () => <ChartSkeleton />,
});
```

### Lazy Loading

Images and components are lazy-loaded when appropriate:

```tsx
<Image
  src={imageUrl}
  alt="Description"
  loading="lazy"
/>
```

### Bundle Optimization

- Tree shaking for unused code
- Proper import/export patterns
- Minimal dependencies

## Testing

### Component Testing

Components are tested with React Testing Library:

```tsx
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
});
```

### Accessibility Testing

Components are tested for accessibility:

```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

test('button is accessible', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Best Practices

### Component Design

1. **Single Responsibility**: Each component has one clear purpose
2. **Composition**: Components are composable and reusable
3. **Props Interface**: Clear, typed props interfaces
4. **Default Props**: Sensible defaults for optional props
5. **Consistent Naming**: Clear, descriptive component names

### Code Organization

1. **Barrel Exports**: Clean import paths with index files
2. **Type Safety**: Full TypeScript coverage
3. **Documentation**: Comprehensive JSDoc comments
4. **Examples**: Usage examples in documentation

### Performance

1. **Memoization**: Use React.memo for expensive components
2. **Callbacks**: Use useCallback for event handlers
3. **State Management**: Minimize re-renders
4. **Bundle Size**: Optimize imports and dependencies

## Migration Guide

### From shadcn/ui

Custom components extend shadcn/ui components:

```tsx
import { Button as ShadcnButton } from '@/components/ui/button';

interface CustomButtonProps extends ShadcnButtonProps {
  // Additional props
}

export const CustomButton = (props: CustomButtonProps) => {
  return <ShadcnButton {...props} />;
};
```

### Version Compatibility

Components are compatible with:
- React 18+
- Next.js 13+
- TypeScript 5+
- Modern browsers (ES2020+)

## Contributing

### Component Development

1. Follow the established patterns
2. Include TypeScript types
3. Add accessibility features
4. Write tests
5. Update documentation

### Code Review Checklist

- [ ] TypeScript types are correct
- [ ] Accessibility features are implemented
- [ ] Responsive design is considered
- [ ] Tests are written
- [ ] Documentation is updated
- [ ] Performance impact is considered

## Future Enhancements

### Planned Components

- `DatePicker` - Date selection component
- `FileUpload` - File upload with progress
- `RichTextEditor` - WYSIWYG text editor
- `DataGrid` - Advanced data grid component
- `NotificationSystem` - In-app notification system

### Feature Enhancements

- Advanced theming system
- Component variants system
- Animation library integration
- Advanced form validation
- Real-time data synchronization

This component library provides a solid foundation for building consistent, accessible, and performant user interfaces for the DropIQ platform and beyond.