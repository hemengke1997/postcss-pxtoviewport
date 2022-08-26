import type { Input, Plugin as PostcssPlugin, Rule } from 'postcss'
import { disableNextComment } from './constant'
import { getUnitRegexp } from './pixel-unit-regex'
import {
  blacklistedSelector,
  createPropListMatcher,
  createPxReplace,
  declarationExists,
  getOptionsFromComment,
  getUnit,
  initOptions,
  isArray,
  isBoolean,
  isOptionComment,
  isRepeatRun,
  judgeIsExclude,
} from './utils'

export type PxtoviewportOptions = Partial<{
  unitToConvert: string
  viewportWidth: number | ((input: Input) => number)
  unitPrecision: number
  propList: string[]
  viewportUnit: string
  fontViewportUnit: string
  selectorBlackList: (string | RegExp)[]
  minPixelValue: number
  replace: boolean
  atRules: boolean | string[]
  include: string | RegExp | ((filePath: string) => boolean) | null
  exclude: string | RegExp | ((filePath: string) => boolean) | null
  disable: boolean
}>

export const defaultOptions: Required<PxtoviewportOptions> = {
  unitToConvert: 'px',
  viewportWidth: 375,
  unitPrecision: 5,
  viewportUnit: 'vw',
  fontViewportUnit: 'vw',
  selectorBlackList: [],
  propList: ['*'],
  minPixelValue: 1,
  replace: true,
  atRules: false,
  include: null,
  exclude: /node_modules/i,
  disable: false,
}

function pxtoviewport(options?: PxtoviewportOptions) {
  let opts = initOptions(options)
  let isExcludeFile = false

  let pxReplace: ReturnType<typeof createPxReplace>

  const plugin: PostcssPlugin = {
    postcssPlugin: 'postcss-pxtoviewport',
    Once(root, { Warning }) {
      if (opts.disable) return
      const firstNode = root.nodes[0]
      if (isOptionComment(firstNode)) {
        opts = {
          ...opts,
          ...getOptionsFromComment(firstNode, Warning),
        }
      }

      const filePath = root.source?.input.file

      const exclude = opts.exclude
      const include = opts.include

      isExcludeFile = judgeIsExclude(exclude, include, filePath)
      const viewportWidth =
        typeof opts.viewportWidth === 'function' ? opts.viewportWidth(root.source!.input) : opts.viewportWidth

      pxReplace = createPxReplace(viewportWidth, opts.unitPrecision, opts.minPixelValue)
    },
    Declaration(decl) {
      if (opts.disable) return
      if (isRepeatRun(decl)) return
      if (isExcludeFile) return

      const satisfyPropList = createPropListMatcher(opts.propList)

      if (
        !decl.value.includes('px') ||
        !satisfyPropList(decl.prop) ||
        blacklistedSelector(opts.selectorBlackList, (decl.parent as Rule).selector)
      ) {
        return
      }
      const prev = decl.prev()

      if (prev?.type === 'comment' && prev.text === disableNextComment) {
        prev.remove()
        return
      }
      const pxRegex = getUnitRegexp(opts.unitToConvert)
      const unit = getUnit(decl.prop, opts)
      const value = decl.value.replace(pxRegex, pxReplace(unit))

      if (declarationExists(decl.parent!, decl.prop, value)) return

      if (opts.replace) {
        decl.value = value
      } else {
        decl.cloneAfter({ value })
      }
    },
    AtRule(atRule) {
      if (opts.disable) return
      if (isRepeatRun(atRule)) return
      if (isExcludeFile) return

      function replacePxInRules() {
        if (!atRule.params.includes('px')) return
        const pxRegex = getUnitRegexp(opts.unitToConvert)
        atRule.params = atRule.params.replace(pxRegex, pxReplace(opts.viewportUnit))
      }

      if (isBoolean(opts.atRules) && opts.atRules) {
        replacePxInRules()
      }
      if (isArray(opts.atRules) && opts.atRules.length) {
        if (opts.atRules.includes(atRule.name)) {
          replacePxInRules()
        }
      }
    },
    OnceExit(root) {
      const firstNode = root.nodes[0]
      if (isOptionComment(firstNode) && firstNode.text.includes('pxtoviewport')) {
        firstNode.remove()
      }
      opts = initOptions(options)
      isExcludeFile = false
    },
  }

  return plugin
}

pxtoviewport.postcss = true

// eslint-disable-next-line no-restricted-syntax
export default pxtoviewport
