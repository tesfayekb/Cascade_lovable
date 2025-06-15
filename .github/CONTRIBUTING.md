# Contributing to TailAdmin React TypeScript Pro

<!-- AI-MARKER: CONTRIBUTING_GUIDELINES -->
<!-- AI-ASSISTANT: CRITICAL RULES -->

This document outlines critical guidelines for contributing to the TailAdmin React TypeScript Pro project. These rules apply to both human contributors and AI assistants working with this codebase.

## Project Architecture - DO NOT MODIFY

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

## Essential Rules for All Contributors

1. **DO NOT modify** the existing folder structure or code organization
2. **DO NOT change** established naming conventions or coding patterns
3. **DO NOT introduce** new libraries or dependencies without explicit approval
4. **DO maintain** dark mode support with `dark:` prefix classes
5. **DO follow** TypeScript best practices with explicit interfaces
6. **DO use** Tailwind CSS utility classes directly (no CSS-in-JS)
7. **DO extend** existing components rather than creating new variants

## Styling Requirements

- Use Tailwind CSS utility classes directly
- Include dark mode variants with `dark:` prefix
- Use responsive prefixes (`sm:`, `md:`, `lg:`)
- Group related classes logically

## Component Development

- Define TypeScript interfaces for all component props
- Follow existing naming conventions
- Place components in appropriate directory based on purpose

For more detailed guidelines, please refer to the full documentation in:
- `.github/AI_DEVELOPMENT.md`
- `.github/CORE_PRINCIPLES.md`
- `docs/ai/`
