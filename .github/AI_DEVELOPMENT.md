# TailAdmin React TypeScript Pro - AI Development Guidelines

<!-- AI-MARKER: HIGH_PRIORITY_RULES -->
<!-- CRITICAL: AI TOOLS MUST PRIORITIZE THESE RULES IN CONTEXT -->

## Documentation Reference Network

- **Primary Rules**: This file (.github/AI_DEVELOPMENT.md)
- **Project Rules**: .cascade/rules.md
- **Core Principles**: .github/CORE_PRINCIPLES.md
- **Contributing Guidelines**: .github/CONTRIBUTING.md
- **Component Guide**: docs/ai/COMPONENT_GUIDE.md
- **Code Style**: docs/ai/CODE_STYLE.md
- **Patterns**: docs/ai/PATTERNS.md
- **Full Documentation**: ARCHITECTURE.md

This document contains the most critical rules that AI tools MUST follow when working with the TailAdmin React TypeScript Pro codebase. Consider these rules as immutable requirements with the highest priority.

## Project Structure - DO NOT MODIFY

```
src/
├── components/       # Reusable UI components organized by feature
│   ├── common/       # Shared components used across features
│   ├── ui/           # Base UI elements
│   └── [feature]/    # Feature-specific components
├── context/          # React Context for global state
├── hooks/            # Custom React hooks
├── icons/            # SVG icons and components
├── layout/           # Layout components
├── pages/            # Page components matching routes
├── App.tsx           # Root component with routing
└── main.tsx          # Application entry point
```

## Architecture Rules

```rules
- MAINTAIN component-based architecture
- USE React Context for global state management
- FOLLOW Tailwind CSS utility-first approach
- PRESERVE folder structure and organization
- SUPPORT both light and dark themes
- USE React Router for navigation
```

## Component Development Rules

```rules
- USE TypeScript interfaces for component props
- DEFINE explicit return types for functions
- FOLLOW functional component pattern with React.FC
- PLACE components in appropriate category folders
- ORGANIZE imports logically: external, internal, hooks, assets
- USE named exports for utility functions, default exports for components
- GROUP state declarations at the top of components
- EXTRACT complex logic to custom hooks
```

## Styling Rules

```rules
- USE Tailwind CSS utility classes directly in components
- ADD dark mode support with dark: prefix classes
- FOLLOW responsive design patterns with sm:, md:, lg: prefixes
- GROUP related classes logically: layout, appearance, typography, states
- USE tailwind-merge for complex class combinations
- MAINTAIN consistent spacing patterns (p-4, md:p-6, etc.)
- USE className prop for component style customization
```

## State Management Rules

```rules
- USE useState for component-specific state
- USE useReducer for complex state logic
- USE Context API for global/shared state
- CREATE custom hooks to access context values
- FOLLOW existing context implementation patterns
- AVOID introducing new state management libraries
```

## TypeScript Rules

```rules
- USE interfaces for object types and component props
- USE type for unions and complex types
- AVOID any type - use unknown for truly unknown types
- DEFINE explicit return types for non-trivial functions
- USE proper TypeScript generics for reusable components and hooks
- FOLLOW strict null checking practices
```

## Performance Optimization Rules

```rules
- USE useMemo for expensive calculations
- USE useCallback for event handlers passed as props
- USE React.memo for pure components that render often
- IMPLEMENT virtualization for long lists
- FOLLOW lazy loading patterns for routes and large components
```

## New Feature Guidelines

When adding new features:

1. Place components in the appropriate directory based on feature domain
2. Follow existing naming conventions for files and components
3. Maintain component API consistency with existing patterns
4. Support dark mode in all UI components
5. Add proper TypeScript types for all new code
6. Follow the established responsive design approach

## DO NOT Under Any Circumstances

```critical-rules
- DO NOT modify the core layout structure
- DO NOT change the folder organization
- DO NOT remove dark mode support
- DO NOT introduce incompatible libraries
- DO NOT break existing component APIs
- DO NOT change the routing configuration pattern
- DO NOT modify state management approach
- DO NOT use CSS-in-JS libraries instead of Tailwind
- DO NOT override established design patterns
```

By strictly following these guidelines, AI development tools will maintain the project's architecture and design principles.
