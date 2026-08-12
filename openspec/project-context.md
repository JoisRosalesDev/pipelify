# Project Context: Pipelify

## Overview
Pipelify is a Next.js web application built with React 19, TypeScript, and Tailwind CSS v4, managed using Bun as the package manager and runtime environment.

## Technical Architecture & Stack
- **Framework**: Next.js 16.3.0 (App Router)
- **UI Library**: React 19.2.8 & React DOM 19.2.8
- **Language**: TypeScript 5.x (Strict mode enabled, `@/*` path alias mapping)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Runtime / Package Manager**: Bun 1.3.14 (`bun.lock`)
- **Linter**: ESLint 9.x with `eslint-config-next` (`core-web-vitals` & `typescript`)

## Directory Structure
- `app/`: Next.js App Router components, layouts, and global styles (`layout.tsx`, `page.tsx`, `globals.css`)
- `public/`: Static assets (`next.svg`, `vercel.svg`)
- `.agents/skills/`: Repository-level agent skills and specialized guidance
- `eslint.config.mjs`: Flat ESLint configuration
- `next.config.ts`: Next.js configuration options
- `tsconfig.json`: TypeScript compiler options and alias resolution

## Code Conventions
- Strict TypeScript typing without implicit `any`
- Utility-first Tailwind CSS styling supporting responsive & dark modes
- Next.js App Router idioms (React Server Components, async boundaries)
- Absolute path imports using `@/` alias
