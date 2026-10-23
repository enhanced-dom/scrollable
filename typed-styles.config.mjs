import path from 'path'
import webpack from '@enhanced-dom/webpack'

const { configs } = webpack

export default (_, argv) => {
  const willExport = argv.mode !== 'none'
  return configs.typedStylesConfigFactory({
    raw: true,
    filePaths: ['./src/scrollable.webcomponent.pcss'].concat(willExport ? [] : ['./demo/app.pcss']),
    outputPath: willExport ? path.resolve('./dist') : undefined,
  })
}
