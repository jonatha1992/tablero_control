import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'src/app/**/*.{ts,tsx}',
    'src/components/**/*.{ts,tsx}',
    'src/hooks/**/*.{ts,tsx}',
    'src/lib/api/*.ts',
    'src/services/*.ts',
    'tests/**/*.ts',
    'scripts/*.ts',
  ],
  project: ['src/**/*.{ts,tsx}', 'tests/**/*.ts', 'scripts/**/*.ts'],
  ignore: [
    // Artifacts
    'playwright-report/**',
    'test-results/**',
    '.next/**',
    // Playwright auth state
    'tests/.auth/**',
    // shadcn/ui subcomponents (exported for compound component pattern)
    'src/components/ui/badge.tsx',
    'src/components/ui/dialog.tsx',
    'src/components/ui/dropdown-menu.tsx',
    'src/components/ui/input.tsx',
    // Domain types (declared for future use / public API)
    'src/types/domain/*.ts',
    'src/types/ui/*.ts',
    'src/types/dto/*.ts',
    'src/types/api/*.ts',
    // Test helpers
    'tests/helpers/*.ts',
    // Email templates (dual export pattern for React Email)
    'src/lib/mail/templates/*.tsx',
  ],
  ignoreDependencies: [
    // Prisma peer dependencies
    'pg',
    '@types/pg',
    // Playwright (used via npx, not direct imports in source)
    'playwright',
    // PostCSS / Tailwind are used by Next.js build pipeline
    'postcss',
    'tailwindcss',
    // dotenv is used via import 'dotenv/config'
    'dotenv',
  ],
  ignoreExportsUsedInFile: true,
};

export default config;
