import { cloneDeep, isArray, isBoolean } from '@minko-fe/lodash-pro'
import { type Input, type Plugin as PostcssPlugin, type Rule } from 'postcss'
import {
  blacklistedSelector,
  checkIfDisable,
  convertUnitFn,
  createPropListMatcher,
  currentOptions,
  declarationExists,
  getUnit,
  initOptions,
  isPxtoviewportReg,
  setupCurrentOptions,
} from './utils'
import { DISABLE_NEXT_COMMENT } from './utils/constant'
import { getUnitRegexp } from './utils/pixel-unit-regex'
import { type ParseOptions } from './utils/query-parse'

export interface ConvertUnit {
  source: string | RegExp
  target: string
}

export type PxtoviewportOptions = Partial<{
  unitToConvert: string
  viewportWidth: number | ((input: Input | undefined) => number)
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
  convertUnit: ConvertUnit | ConvertUnit[] | false | null
  parseOptions: ParseOptions
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
  convertUnit: null,
  parseOptions: {},
}

const postcssPlugin = 'postcss-pxtoviewport'

function pxtoviewport(options?: PxtoviewportOptions) {
  const RAW_OPTIONS = initOptions(options)

  const plugin: PostcssPlugin = {
    postcssPlugin,
    Once(r, h) {
      const node = r.root()
      const firstNode = node.nodes[0]

      h[currentOptions] = {
        isExcludeFile: false,
        pxReplace: undefined,
        originOpts: cloneDeep(RAW_OPTIONS), // avoid reference pollution
      }

      setupCurrentOptions(h as any, { node, comment: firstNode })
    },
    Comment(node, h) {
      setupCurrentOptions(h as any, { node, comment: node })
    },
    CommentExit(comment) {
      if (comment.text.match(isPxtoviewportReg)?.length) {
        comment.remove()
      }
    },
    Declaration(decl, h) {
      const opts = h[currentOptions].originOpts

      if (checkIfDisable({ disable: opts.disable, isExcludeFile: h[currentOptions].isExcludeFile, r: decl })) {
        return
      }

      const satisfyPropList = createPropListMatcher(opts.propList)

      if (
        !satisfyPropList(decl.prop) ||
        blacklistedSelector(opts.selectorBlackList, (decl.parent as Rule).selector) ||
        !decl.value.includes(opts.unitToConvert)
      ) {
        return
      }

      const prev = decl.prev()

      if (prev?.type === 'comment' && prev.text === DISABLE_NEXT_COMMENT) {
        prev.remove()
        return
      }
      const pxRegex = getUnitRegexp(opts.unitToConvert)
      const unit = getUnit(decl.prop, opts)
      const value = decl.value.replace(pxRegex, h[currentOptions].pxReplace(unit))

      if (declarationExists(decl.parent!, decl.prop, value)) return

      if (opts.replace) {
        decl.value = value
      } else {
        decl.cloneAfter({ value })
      }
    },
    DeclarationExit(decl, h) {
      const opts = h[currentOptions].originOpts
      const { convertUnit } = opts
      if (convertUnit) {
        if (Array.isArray(convertUnit)) {
          convertUnit.forEach((conv) => {
            decl.value = convertUnitFn(decl.value, conv)
          })
        } else {
          decl.value = convertUnitFn(decl.value, convertUnit)
        }
      }
    },
    AtRule(atRule, h) {
      const opts = h[currentOptions].originOpts

      if (checkIfDisable({ disable: opts.disable, isExcludeFile: h[currentOptions].isExcludeFile, r: atRule })) {
        return
      }

      function replacePxInRules() {
        if (!atRule.params.includes(opts.unitToConvert)) return
        const pxRegex = getUnitRegexp(opts.unitToConvert)
        atRule.params = h[currentOptions].pxReplace
          ? atRule.params.replace(pxRegex, h[currentOptions].pxReplace(opts.viewportUnit))
          : atRule.params
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
  }

  if (options?.disable) {
    return {
      postcssPlugin,
    }
  }
  return plugin
}

pxtoviewport.postcss = true

export default pxtoviewport

export { pxtoviewport }
