# ADR-0002: shadcn/ui with Radix + Tailwind for UI Components

**Status:** Accepted  
**Date:** 2026-01-22

## Context

The web app needed an accessible, themeable component library. Options included Material UI, Chakra UI, Ant Design, and shadcn/ui.

## Decision

Use **shadcn/ui** — copy-paste components built on Radix UI primitives with Tailwind CSS styling.

- Components live in `src/components/ui/` as part of the codebase, not a dependency
- Radix UI provides accessible primitives (dialogs, dropdowns, popovers, etc.)
- Tailwind CSS for styling with `class-variance-authority` for variant management
- `lucide-react` for icons
- `cn()` utility (`clsx` + `tailwind-merge`) for conditional class composition

## Consequences

**Positive:**
- Full control over component styling — no overrides needed
- Tree-shakeable — only ship components actually used
- Radix primitives ensure keyboard navigation and ARIA compliance
- Easy to customize per brand requirements
- No version lock-in — components are code, not packages

**Negative:**
- Manual updates when shadcn/ui releases new components
- Larger codebase — component code lives in the repo
- Team members need Tailwind CSS proficiency
