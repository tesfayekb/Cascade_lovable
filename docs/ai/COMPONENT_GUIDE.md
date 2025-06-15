# TailAdmin React TypeScript Pro - Component Development Guide

<!-- AI-MARKER: COMPONENT_GUIDE -->
This document provides guidelines for developing components in the TailAdmin React TypeScript Pro dashboard project.

## Component Architecture Overview

Components in TailAdmin follow a hierarchical structure:

1. **Base UI Components** (`src/components/ui/`)
   - Foundational elements like buttons, cards, forms
   - Highly reusable across the application

2. **Feature Components** (`src/components/[feature]/`)
   - Components specific to a feature area
   - May compose multiple UI components

3. **Page Components** (`src/pages/`)
   - Full page implementations
   - Compose feature components

## Component Structure Best Practices

### File Organization

```
src/components/
├── ui/                 # Base UI components
│   ├── button/         # Group related components
│   │   ├── Button.tsx  # Main component
│   │   └── index.ts    # Re-export for clean imports
│   ├── card/
│   └── form/
├── tables/             # Feature-specific components
├── charts/
└── common/             # Shared utility components
```

### Component File Template

```tsx
// Import statements
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import type { ReactNode } from 'react';

// Props interface
interface ComponentProps {
  // Props definitions
}

// Component implementation
const Component: React.FC<ComponentProps> = ({ 
  // Destructured props
}) => {
  // State declarations
  
  // Helper functions
  
  // Return JSX
  return (
    // JSX structure
  );
};

export default Component;
```

## Best Practices for Component Development

1. **Single Responsibility**: Each component should do one thing well
2. **Composability**: Create small, reusable components that can be combined
3. **Consistent Prop API**: Follow established patterns for prop naming and types
4. **Dark Mode Support**: Always include dark variants for styling
5. **Responsive Design**: Ensure components work across all device sizes

For more detailed examples and patterns, see the PATTERNS.md document.
