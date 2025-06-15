# TailAdmin React TypeScript Pro - AI Developer Guidelines

<!-- AI-MARKER: GUIDELINES -->
This document provides specific guidelines for AI developers working with the TailAdmin React TypeScript Pro template. Follow these rules strictly to maintain the project's architecture and avoid introducing incompatible changes.

## Fundamental Rules

1. **DO NOT modify** the existing folder structure or code organization
2. **DO NOT change** established naming conventions or coding patterns
3. **DO NOT introduce** new libraries or dependencies without explicit approval
4. **DO follow** the component, styling, and state management patterns in the codebase
5. **DO extend** existing components rather than creating new variants when possible

## Component Development Examples

### Creating a New UI Component

When adding a new UI component, follow this exact pattern:

```tsx
// src/components/ui/example/ExampleComponent.tsx
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface ExampleComponentProps {
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}

const ExampleComponent: React.FC<ExampleComponentProps> = ({
  children,
  variant = "primary",
  className = "",
}) => {
  // Define variant classes using object mapping
  const variantClasses = {
    primary: "bg-brand-500 text-white",
    secondary: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  };

  return (
    <div
      className={twMerge(
        "rounded-lg p-4", // Base styles
        variantClasses[variant], // Variant styles
        className // Custom styles from props
      )}
    >
      {children}
    </div>
  );
};

export default ExampleComponent;
```

### Extending Existing Components

When extending an existing component, maintain API compatibility:

```tsx
// src/components/ui/button/IconButton.tsx
import Button from "./Button";
import type { ReactNode } from "react";

interface IconButtonProps {
  icon: ReactNode;
  variant?: "primary" | "outline";
  size?: "sm" | "md";
  onClick?: () => void;
  className?: string;
  ariaLabel: string; // Required for accessibility
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = "primary",
  size = "md",
  onClick,
  className = "",
  ariaLabel,
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className={`flex items-center justify-center p-2 ${className}`}
      aria-label={ariaLabel}
    >
      {icon}
    </Button>
  );
};

export default IconButton;
```

### Creating a New Page Component

When creating a new page component:

```tsx
// src/pages/ExampleFeature/ExamplePage.tsx
import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

// Import components as needed
import ComponentA from "../../components/exampleFeature/ComponentA";
import ComponentB from "../../components/exampleFeature/ComponentB";

const ExamplePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("tab1");
  
  const handleTabChange = (tab: string): void => {
    setActiveTab(tab);
  };

  return (
    <>
      <PageMeta
        title="Example Feature | TailAdmin - React.js Admin Dashboard Template"
        description="This is Example Feature page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Example Feature" />
      
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-8">
          <ComponentA onTabChange={handleTabChange} activeTab={activeTab} />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <ComponentB />
        </div>
      </div>
    </>
  );
};

export default ExamplePage;
```

## State Management Examples

### Local Component State

```tsx
import { useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

const UserProfile: React.FC = () => {
  // Define state with proper typing
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Handle side effects
  useEffect(() => {
    const fetchUser = async (): Promise<void> => {
      try {
        setIsLoading(true);
        // Fetch user data
        const userData = await fetchUserData();
        setUser(userData);
        setError(null);
      } catch (err) {
        setError("Failed to load user data");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Conditional rendering based on state
  if (isLoading) {
    return <div className="p-4">Loading user data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
      {user && (
        <>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white">{user.name}</h2>
          <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
        </>
      )}
    </div>
  );
};
```

### Using Context for Global State

```tsx
// In a component file
import { useTheme } from "../../context/ThemeContext";
import { useSidebar } from "../../context/SidebarContext";

const HeaderActions: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { toggleSidebar } = useSidebar();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleTheme}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Toggle theme"
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Toggle sidebar"
      >
        ☰
      </button>
    </div>
  );
};
```

## Styling Examples

### Responsive Design

```tsx
<div className="
  p-4 
  bg-white dark:bg-gray-800
  sm:p-6 
  md:p-8 
  lg:flex lg:items-center
  xl:gap-8
">
  <div className="mb-4 lg:mb-0 lg:flex-1">
    <h2 className="text-xl sm:text-2xl font-bold">Title</h2>
  </div>
  <div className="lg:flex-1">
    <p className="text-gray-600 dark:text-gray-300">Content</p>
  </div>
</div>
```

### Dark Mode Support

```tsx
<div className="
  bg-white text-gray-900
  shadow-sm border border-gray-200
  dark:bg-gray-800 dark:text-white
  dark:border-gray-700
">
  <h3 className="font-medium text-gray-800 dark:text-gray-200">Title</h3>
  <p className="text-gray-600 dark:text-gray-400">Description</p>
  <div className="bg-gray-50 dark:bg-gray-700">
    <span className="text-brand-500 dark:text-brand-400">Highlighted</span>
  </div>
</div>
```

## Adding Routes

When adding a new route:

1. Import the page component in `App.tsx`
2. Add the route to the appropriate section based on the page type

```tsx
// In App.tsx - Adding a new dashboard page
import ExamplePage from "./pages/ExampleFeature/ExamplePage";

// Inside Routes component
<Route element={<AppLayout />}>
  {/* Existing routes */}
  <Route path="/" element={<Ecommerce />} />
  
  {/* New route */}
  <Route path="/example-feature" element={<ExamplePage />} />
</Route>
```

## Common Pitfalls to Avoid

### ❌ Don't Modify Core Layout Components

The layout components (AppLayout, AppHeader, AppSidebar) define the fundamental structure of the application. Don't modify these unless explicitly asked.

### ❌ Don't Change Context API Implementation

The Context implementation pattern is standardized across the project. Don't introduce Redux, Zustand, or other state management libraries.

### ❌ Don't Break Dark Mode Support

All components must support both light and dark themes using the `dark:` variant prefix.

### ❌ Don't Create Duplicate Components

Before creating a new component, check if something similar already exists that could be extended.

### ❌ Don't Modify Existing Component APIs

Maintain backward compatibility when extending existing components.

## When Enhancing the Project

1. **Add, don't replace**: Add new features without modifying the core architecture
2. **Follow existing patterns**: Match the coding style of surrounding code
3. **Document your additions**: Add appropriate comments and JSDoc
4. **Consider responsiveness**: Ensure all UI works on all device sizes
5. **Think about accessibility**: Maintain ARIA attributes and keyboard navigation

By following these guidelines, AI developers can successfully enhance the TailAdmin React TypeScript Pro project while maintaining its integrity and design principles.
