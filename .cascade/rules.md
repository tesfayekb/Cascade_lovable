# TailAdmin React TypeScript Pro - Project Rules

<!-- AI-MARKER: PROJECT_RULES -->
<!-- CRITICAL: AUTOMATICALLY LOADED PROJECT RULES -->

These are specific rules for the TailAdmin React TypeScript Pro dashboard template that all AI assistants must follow when working with this codebase.

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

## Architectural Rules - CRITICAL

1. **Component Organization**
   - UI components in `src/components/ui/`
   - Feature components in `src/components/[feature]/`
   - Page components in `src/pages/[section]/`
   - NEVER create components outside their appropriate directories

2. **State Management**
   - Use React Context for global state
   - Create contexts in `src/context/` directory
   - Follow existing patterns in `ThemeContext.tsx` and `SidebarContext.tsx`
   - NEVER introduce Redux or other state management libraries

3. **Styling Requirements**
   - Use Tailwind CSS utility classes directly in components
   - Always include dark mode support with `dark:` prefix classes
   - Use responsive design with `sm:`, `md:`, `lg:` prefixes
   - NEVER use CSS-in-JS libraries or separate CSS files

4. **Component Development**
   - Define TypeScript interfaces for all props
   - Use React.FC type for function components
   - Extend existing components rather than creating new variants
   - Follow established naming conventions (PascalCase for components)

5. **Routing Configuration**
   - Define routes in `App.tsx`
   - Use layout-wrapped routes for dashboard pages
   - Use standalone routes for auth pages
   - NEVER modify the routing structure or approach

## FORBIDDEN CHANGES

The following changes are strictly forbidden:
- Altering folder structure or organization
- Modifying the layout components or structure
- Changing the state management approach
- Removing dark mode support
- Breaking component APIs
- Introducing new styling approaches

When extending the project, always analyze existing patterns and follow them precisely.
