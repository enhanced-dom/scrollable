import { eslintConfigFactory } from '@enhanced-dom/lint'

export default eslintConfigFactory({
  ignore: ['**/*.d.ts', '**/*.config.mjs'],
  include: ['**/*.ts', '**/*.tsx'],
})
