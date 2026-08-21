import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

/**
 * Flat config, consumed by the ESLint CLI directly.
 *
 * Next 16 removed the `next lint` command and `@next/eslint-plugin-next` now
 * ships native flat configs, so the old `FlatCompat` bridge (and its
 * `@eslint/eslintrc` dependency) is gone — these are spread as plain arrays.
 * `next build` no longer lints either: `yarn lint` is the only lint step.
 */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'import/no-default-export': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Reports components the React Compiler would skip memoizing because a
      // library (react-hook-form's useForm, TanStack Table's useReactTable)
      // returns non-memoizable functions. We do NOT enable `reactCompiler` in
      // next.config.ts, so this is unactionable noise — the only "fix" would be
      // dropping those libraries. Turn it back on if React Compiler is adopted.
      'react-hooks/incompatible-library': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'prisma/generated/**',
      'next-env.d.ts',
    ],
  },
];

export default eslintConfig;
