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
  },
  {
    files: ['api/**/*.js', 'scripts/**/*.js', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: [
      'src/planner/controls/planning/components/SmartNumberInput.jsx',
      'src/scenes/SceneThree/SceneThree.jsx',
      'src/scenes/SceneFour/SceneFour.jsx',
      'src/scenes/SceneFive/SceneFive.jsx',
    ],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
