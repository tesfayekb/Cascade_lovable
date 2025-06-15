# TailAdmin React TypeScript Pro - Code Style Guide

<!-- AI-MARKER: CODE_STYLE -->
This document defines the specific code style guidelines for maintaining and extending the TailAdmin React TypeScript Pro dashboard. AI assistants and human developers should adhere to these conventions to ensure code consistency and quality.

## TypeScript Best Practices

### Type Definitions

1. **Prefer interfaces** for object types and component props:
```typescript
// Correct ✓
interface ButtonProps {
  variant: 'primary' | 'outline';
  size: 'sm' | 'md';
  children: React.ReactNode;
}

// Avoid ✗
type ButtonProps = {
  variant: 'primary' | 'outline';
  size: 'sm' | 'md';
  children: React.ReactNode;
};
```

2. **Use type for unions** and complex types:
```typescript
// Correct ✓
type ButtonVariant = 'primary' | 'outline';
type ButtonSize = 'sm' | 'md';

// Avoid using enums ✗
enum ButtonVariant {
  Primary = 'primary',
  Outline = 'outline'
}
```

3. **Avoid `any` type** whenever possible. Use `unknown` when type is truly unknown:
```typescript
// Avoid ✗
const handleData = (data: any) => {
  console.log(data.name); // Unsafe
};

// Correct ✓
const handleData = (data: unknown) => {
  if (typeof data === 'object' && data !== null && 'name' in data) {
    console.log(data.name); // Safe
  }
};
```

4. **Use function return types** for non-trivial functions:
```typescript
// Correct ✓
const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};
```

### Component Props

1. **Always define prop interfaces** explicitly:
```typescript
interface ComponentProps {
  title: string;
  isActive?: boolean; // Optional props with "?"
  onClick: () => void;
}

const Component: React.FC<ComponentProps> = ({ 
  title, 
  isActive = false, // Default for optional props
  onClick 
}) => {
  // Component implementation
};
```

2. **Use React.FC type** for function components:
```typescript
const Button: React.FC<ButtonProps> = (props) => {
  // ...
};
```

## React Component Structure

### File Organization

1. **One component per file** with matching file and component names
2. **Group imports** by type/source with a blank line between groups:
```typescript
// External dependencies
import { useState, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';

// Internal components
import Button from '../Button';

// Contexts and hooks
import { useTheme } from '../../context/ThemeContext';

// Types and utilities
import type { CardProps } from './types';
```

### Component Definition

1. **Function components** with explicit return type:
```typescript
const Card: React.FC<CardProps> = ({ title, children }) => {
  return (
    <div className="p-4 bg-white rounded-lg dark:bg-gray-800">
      {title && <h3 className="text-lg font-medium">{title}</h3>}
      {children}
    </div>
  );
};
```

2. **State and effects at the top** of the component:
```typescript
const Component: React.FC<ComponentProps> = (props) => {
  // State definitions first
  const [isOpen, setIsOpen] = useState(false);
  
  // Effects second
  useEffect(() => {
    // Effect implementation
  }, [dependency]);
  
  // Event handlers and other functions
  const handleClick = () => {
    setIsOpen(!isOpen);
  };
  
  // JSX return
  return (
    // ...
  );
};
```

3. **Extract complex logic** to helper functions or custom hooks

### Event Handling

1. **Prefix event handlers** with `handle`:
```typescript
const handleClick = () => {
  // ...
};

return <button onClick={handleClick}>Click me</button>;
```

2. **Use inline functions sparingly**:
```typescript
// Prefer this for simple cases ✓
return <button onClick={() => setCount(count + 1)}>Increment</button>;

// Prefer named functions for complex handlers ✓
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // Complex logic here
};
return <form onSubmit={handleSubmit}>...</form>;
```

## Tailwind CSS Usage

### Class Organization

1. **Group related classes** with a logical order:
```tsx
<div className="
  p-4 m-2                     /* Spacing */
  flex items-center           /* Layout */
  bg-white rounded-lg         /* Appearance */
  text-gray-900 text-sm       /* Typography */
  shadow-sm                   /* Effects */
  dark:bg-gray-800 dark:text-white  /* Dark mode */
  hover:bg-gray-50            /* States */
  sm:p-6 lg:p-8               /* Responsive */
">
```

2. **Use string concatenation or template literals** for conditional classes:
```tsx
<div className={`
  p-4 bg-white rounded-lg dark:bg-gray-800
  ${isActive ? 'border-l-4 border-brand-500' : ''}
`}>
```

3. **Use `tailwind-merge` for managing complex class combinations**:
```tsx
import { twMerge } from 'tailwind-merge';

// ...
return (
  <div className={twMerge(
    'p-4 bg-white rounded-lg', // Base classes
    isActive && 'border-l-4 border-brand-500', // Conditional classes
    className // Props-based customization
  )}>
);
```

### Component Variants

1. **Define variants in objects** for consistency:
```tsx
const variantClasses = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600',
  outline: 'bg-white ring-1 ring-gray-300 text-gray-700 hover:bg-gray-50',
};

return <button className={`px-4 py-2 rounded-md ${variantClasses[variant]}`}>Click</button>;
```

## State Management

### React Context

1. **Create a separate file** for each context:
```tsx
// ThemeContext.tsx
import { createContext, useContext, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

2. **Create custom hooks** to access context:
```tsx
// In a component
import { useTheme } from '../context/ThemeContext';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
};
```

### Local State

1. **Use appropriate state types**:
```typescript
// For primitive values
const [count, setCount] = useState<number>(0);

// For objects
const [user, setUser] = useState<User | null>(null);

// For arrays
const [items, setItems] = useState<Item[]>([]);
```

2. **Use functional updates** for state based on previous state:
```typescript
// Correct ✓
setCount(prevCount => prevCount + 1);

// Avoid ✗
setCount(count + 1);
```

## Naming Conventions

### General

1. **PascalCase** for React components and type/interface names
2. **camelCase** for variables, functions, and methods
3. **UPPER_SNAKE_CASE** for constants
4. Prefix boolean variables with `is`, `has`, `should`, etc.

### Specific Rules

| Item | Convention | Example |
|------|------------|---------|
| React Components | PascalCase | `UserProfile`, `DataTable` |
| Props | camelCase | `onClick`, `userData` |
| Custom Hooks | camelCase with `use` prefix | `useToggle`, `useFetch` |
| Context | PascalCase with `Context` suffix | `ThemeContext` |
| Context Provider | PascalCase with `Provider` suffix | `ThemeProvider` |
| Event Handlers | camelCase with `handle` prefix | `handleClick`, `handleSubmit` |
| Constants | UPPER_SNAKE_CASE | `MAX_ITEMS`, `API_URL` |
| TypeScript Interfaces | PascalCase with descriptive name | `UserData`, `TableProps` |
| TypeScript Types | PascalCase, often with descriptive suffix | `ButtonVariant`, `InputSize` |

## Comments and Documentation

1. **Use JSDoc for components** and important functions:
```typescript
/**
 * Button component with different variants and sizes
 * @param {ButtonProps} props - The component props
 * @returns {JSX.Element} The Button component
 */
const Button: React.FC<ButtonProps> = ({ variant, size, children, ...props }) => {
  // Implementation
};
```

2. **Comment complex logic** but avoid commenting obvious code:
```typescript
// Complex calculation that needs explanation
const adjustedValue = calculateComplexValue(rawValue);

// No need to comment simple code like:
const fullName = `${firstName} ${lastName}`;
```

## Performance Optimizations

1. **Memoize expensive calculations** with `useMemo`:
```typescript
const sortedItems = useMemo(() => {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}, [items]);
```

2. **Memoize callback functions** with `useCallback`:
```typescript
const handleItemClick = useCallback((id: string) => {
  // Handle click logic
  selectItem(id);
}, [selectItem]);
```

3. **Use React.memo** for components that render often but with the same props:
```typescript
const StaticComponent: React.FC<StaticProps> = React.memo(({ data }) => {
  // Render logic
});
```

## Code Formatting and Linting

1. **Follow ESLint and TypeScript configuration** in the project
2. **Use consistent indentation** (2 spaces in this project)
3. **Add trailing commas** for multi-line objects and arrays
4. **Use semicolons** at the end of statements

## AI Assistant Guidelines

1. **DO NOT change existing patterns** without explicit request
2. **Analyze existing code** to maintain consistency with surrounding code
3. **Follow folder structure** when adding new files
4. **Maintain prop interfaces** when updating components
5. **Preserve dark mode support** with `dark:` prefix classes
6. **Always define explicit types** for function parameters and returns
7. **Extend existing UI components** instead of creating new variants

By adhering to these style guidelines, AI assistants and developers will maintain code consistency and quality throughout the TailAdmin React TypeScript Pro project.
