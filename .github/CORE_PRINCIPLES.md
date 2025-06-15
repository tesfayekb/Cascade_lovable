# TailAdmin React TypeScript Pro - Core Architecture Principles

<!-- AI-MARKER: CORE_PRINCIPLES -->
<!-- CRITICAL: HIGH PRIORITY REFERENCE FOR AI TOOLS -->

This document contains the essential architectural principles that must be maintained when working with the TailAdmin codebase. AI assistants should prioritize these rules in their context.

## Project Architecture - DO NOT CHANGE

```
TailAdmin React TypeScript Pro
│
├── components/       # Reusable UI components
│   ├── ui/           # Base UI elements (buttons, cards, forms, etc.)
│   ├── [feature]/    # Feature-specific components
│   └── common/       # Shared utility components
├── context/          # React Context for global state
├── hooks/            # Custom React hooks
├── layout/           # Layout components
└── pages/            # Page components matching routes
```

## Critical Rules

1. **Component Structure**
   - UI components in `src/components/ui/`
   - Feature components in `src/components/[feature-name]/`
   - Page components in `src/pages/[feature-name]/`

2. **State Management**
   - Use React Context for global state
   - Use custom hooks to access context
   - Follow existing context implementation patterns

3. **Styling Requirements**
   - Use Tailwind CSS utility classes directly
   - Support dark mode with `dark:` prefixed classes
   - Use responsive prefixes `sm:`, `md:`, `lg:`
   - Group related classes logically

4. **Component Development**
   - Define TypeScript interfaces for all component props
   - Follow the existing component patterns
   - Extend existing components rather than creating new variants

5. **Performance Considerations**
   - Use React.memo for pure components
   - Use useMemo/useCallback for optimizations
   - Follow established lazy loading patterns

## FORBIDDEN CHANGES

```forbidden
- DO NOT alter folder structure or organization
- DO NOT introduce new state management libraries
- DO NOT change component naming conventions
- DO NOT remove dark mode support
- DO NOT modify the layout structure
- DO NOT replace Tailwind with other styling approaches
```

## Extension Pattern

When adding new functionality:
1. Study existing similar components
2. Follow the same file structure and naming conventions
3. Maintain API compatibility with related components
4. Ensure both light and dark theme support

For detailed implementation guidelines, refer to the comprehensive documentation in `/docs/ai/`.
