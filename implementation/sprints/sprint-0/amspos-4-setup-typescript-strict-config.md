# AMSPOS-4: Setup TypeScript Strict Config

**Sprint**: Sprint 0 — Foundation Infrastructure
**Effort**: 0.5 day
**Dependencies**: AMSPOS-3
**Phase**: Foundation

---

## Description

Configure `tsconfig.json` with strict TypeScript settings appropriate for this project. Enable all strict compiler flags to catch bugs at compile time rather than runtime. Set up absolute import path aliases.

---

## Instructions

### 1. Update `tsconfig.json`

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": false,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@screens/*": ["src/screens/*"],
      "@stores/*": ["src/stores/*"],
      "@services/*": ["src/services/*"],
      "@hooks/*": ["src/hooks/*"],
      "@constants/*": ["src/constants/*"],
      "@types/*": ["src/types/*"],
      "@utils/*": ["src/utils/*"],
      "@navigation/*": ["src/navigation/*"],
      "@models/*": ["src/models/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.d.ts", "expo-env.d.ts"]
}
```

### 2. Install babel-plugin-module-resolver for path aliases

```bash
npm install --save-dev babel-plugin-module-resolver
```

Update `babel.config.js` to add the module-resolver plugin:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      ['@babel/plugin-proposal-class-properties', { loose: true }],
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.ts', '.tsx', '.js', '.jsx'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@stores': './src/stores',
            '@services': './src/services',
            '@hooks': './src/hooks',
            '@constants': './src/constants',
            '@utils': './src/utils',
            '@navigation': './src/navigation',
            '@models': './src/models',
          },
        },
      ],
    ],
  };
};
```

### 3. Key rules enforced by this config

- `strict: true` — enables `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`
- `noUncheckedIndexedAccess: true` — array index access returns `T | undefined` (prevents runtime crashes on empty arrays)
- `exactOptionalPropertyTypes: true` — optional fields cannot be explicitly set to `undefined` unless typed as `T | undefined`
- `noImplicitReturns: true` — every code path in a function must return
- `experimentalDecorators: true` — required for WatermelonDB decorators

### 4. Verify

```bash
npx tsc --noEmit
```

All existing model and schema files should pass. Fix any type errors before proceeding.

---

## Acceptance Criteria

- [ ] `tsconfig.json` extends `expo/tsconfig.base` and adds all strict flags listed above
- [ ] Path aliases are configured in both `tsconfig.json` and `babel.config.js`
- [ ] `npx tsc --noEmit` passes with zero errors on all existing files
- [ ] `experimentalDecorators: true` is set (required for WatermelonDB)

## Definition of Done

- All acceptance criteria are met
- Existing files import correctly using both relative and aliased paths
- Code committed to `main`
