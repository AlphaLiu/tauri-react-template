import antfu, { GLOB_SRC } from '@antfu/eslint-config';
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';

export default antfu({
  formatters: true,
  stylistic: {
    semi: true, // 这个选项可能会影响 @antfu 的分号设置
  },
  ignores: [
    '**/*.json',
    '**/*.d.ts',
    '**/assets/**',
    '**/*.{md,mdx}',
    'index.html',
    'vite.config.ts',
    'src/components/ui/**',
    'src/tauri-controls/**',
    'src-tauri/**',
    'src/bindings.ts',
  ],
}, {
  files: [`src/${GLOB_SRC}`],
  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
  settings: {
    'better-tailwindcss': {
      entryPoint: 'src/index.css',
    },
  },
  plugins: {
    'better-tailwindcss': eslintPluginBetterTailwindcss,
  },
  rules: {
    ...eslintPluginBetterTailwindcss.configs['recommended-error'].rules,
    'better-tailwindcss/enforce-consistent-line-wrapping': ['warn', { group: 'newLine', preferSingleLine: true, printWidth: 120 }],
    'better-tailwindcss/no-unregistered-classes': 'off',
  },
});
