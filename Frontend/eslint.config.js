import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // eslint-plugin-react-hooks v7's "recommended" set bundles the
      // experimental React Compiler-readiness rules. Two of them flag
      // standard, safe patterns used throughout this codebase as errors:
      //
      // - set-state-in-effect: fires on any "fetch/poll on mount, then
      //   setState" effect — the most common data-fetching pattern in
      //   React, used deliberately in AuthContext, Dashboard, and the
      //   generation-polling hook.
      // - immutability: fires on a function referencing a sibling const
      //   declared later in the same component body (e.g. an effect
      //   calling a handler defined below it) and on a useCallback that
      //   references itself for recursive scheduling (the polling loop in
      //   useJobPolling.js) — both are safe because the reference only
      //   resolves at call time, well after the binding exists, not at
      //   declaration time.
      //
      // These rules exist to prepare code for the React Compiler, not to
      // catch bugs in hand-written hooks. Rewriting the polling/auth-check
      // logic to satisfy them would mean touching code that's already been
      // carefully verified (refresh-resume, cancellation, idempotency) for
      // a dev-tooling-readiness concern, not a runtime one. Downgraded to
      // warnings rather than disabled outright, so they're still visible.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
])
