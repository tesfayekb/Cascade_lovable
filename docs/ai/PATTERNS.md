# TailAdmin React TypeScript Pro - Development Patterns

<!-- AI-MARKER: PATTERNS -->
This document outlines the key development patterns used in the TailAdmin React TypeScript Pro dashboard project.

## State Management Patterns

### React Context Pattern

```tsx
// 1. Create context file (e.g., src/context/FeatureContext.tsx)
import { createContext, useContext, useState, ReactNode } from 'react';

// Define context type
interface FeatureContextType {
  isEnabled: boolean;
  toggleFeature: () => void;
}

// Create context
const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

// Create provider component
export const FeatureProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  
  const toggleFeature = () => {
    setIsEnabled(prev => !prev);
  };
  
  // Provide context value
  return (
    <FeatureContext.Provider value={{ isEnabled, toggleFeature }}>
      {children}
    </FeatureContext.Provider>
  );
};

// Create custom hook
export const useFeature = () => {
  const context = useContext(FeatureContext);
  if (context === undefined) {
    throw new Error('useFeature must be used within a FeatureProvider');
  }
  return context;
};

// 2. Use in component
import { useFeature } from '../context/FeatureContext';

const MyComponent = () => {
  const { isEnabled, toggleFeature } = useFeature();
  
  return (
    <button onClick={toggleFeature}>
      Feature is {isEnabled ? 'enabled' : 'disabled'}
    </button>
  );
};
```

## Component Extension Pattern

Extend existing components rather than creating new variants:

```tsx
// Original Button component
const Button: React.FC<ButtonProps> = ({ variant, size, children, ...props }) => {
  // Implementation
};

// Extended IconButton component
const IconButton: React.FC<IconButtonProps> = ({ icon, label, ...props }) => {
  return (
    <Button {...props}>
      {icon}
      <span className="sr-only">{label}</span>
    </Button>
  );
};
```

## Styling Patterns

### Tailwind CSS Organization

Group related classes in a logical order:

```tsx
<div className={twMerge(
  // Layout
  'flex flex-col items-center',
  // Spacing
  'p-4 gap-2',
  // Colors and appearance
  'bg-white rounded-lg shadow-sm',
  // Typography
  'text-gray-800 text-base',
  // Dark mode
  'dark:bg-gray-800 dark:text-gray-200',
  // Responsive
  'md:flex-row lg:p-6',
  // States
  'hover:shadow-md focus:ring-2',
  // Custom classes from props
  className
)}>
```

## Routing Pattern

```tsx
// App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import FeaturePage from './pages/FeaturePage';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Layout-wrapped routes */}
        <Route element={<AppLayout />}>
          <Route path="/feature" element={<FeaturePage />} />
        </Route>
        
        {/* Standalone routes */}
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
  );
};
```

## Error Handling Pattern

```tsx
// Component with error handling
const DataComponent: React.FC = () => {
  const [data, setData] = useState<Data[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetchDataFromAPI();
        setData(response);
        setError(null);
      } catch (err) {
        setError(err as Error);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;
  if (!data) return <EmptyState />;
  
  return <DataDisplay data={data} />;
};
```

## Performance Optimization Patterns

```tsx
// Memoization pattern
import { useMemo, useCallback } from 'react';

const MemoizedComponent: React.FC<Props> = ({ items, onSelect }) => {
  // Memoize expensive calculations
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);
  
  // Memoize event handlers
  const handleSelect = useCallback((id: string) => {
    onSelect(id);
  }, [onSelect]);
  
  return (
    <ul>
      {sortedItems.map(item => (
        <li key={item.id} onClick={() => handleSelect(item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
};
```

## Form Handling Pattern

```tsx
// Form component with validation
const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when field is edited
    setErrors(prev => ({ ...prev, [name]: '' }));
  };
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      // Submit form logic
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

Following these patterns will ensure consistency across the TailAdmin codebase and maintain the established architecture.
