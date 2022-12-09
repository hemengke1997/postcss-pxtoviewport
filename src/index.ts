import type { Input, Plugin as PostcssPlugin, Rule } from 'postcss'
import { disableNextComment } from './utils/constant'
import { getUnitRegexp } from './utils/pixel-unit-regex'
import {
  blacklistedSelector,
  checkoutDisable,
  convertUnit,
  createPropListMatcher,
  createPxReplace,
  declarationExists,
  getOptionsFromComment,
  getUnit,
  initOptions,
  isArray,
  isBoolean,
  isOptionComment,
  isPxtoviewportReg,
  judgeIsExclude,
} from './utils/utils'

export interface ConvertUnit {
  sourceUnit: string | RegExp
  targetUnit: string
}

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
  convertUnitOnEnd: ConvertUnit | ConvertUnit[] | false | null
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
  convertUnitOnEnd: null,
}

const postcssPlugin = 'postcss-pxtoviewport'

function pxtoviewport(options?: PxtoviewportOptions) {
  let opts = initOptions(options)
  let isExcludeFile = false

  let pxReplace: ReturnType<typeof createPxReplace>

  const plugin: PostcssPlugin = {
    postcssPlugin,
    Once(r, { Warning }) {
      if (checkoutDisable({ disable: opts.disable, isExcludeFile })) {
        return
      }

      const node = r.root()
      const firstNode = node.nodes[0]
      if (isOptionComment(firstNode)) {
        opts = {
          ...opts,
          ...getOptionsFromComment(firstNode, Warning),
        }
      }

      const filePath = node.source?.input.file

      const exclude = opts.exclude
      const include = opts.include

      isExcludeFile = judgeIsExclude(exclude, include, filePath)
      const viewportWidth =
        typeof opts.viewportWidth === 'function' ? opts.viewportWidth(node.source!.input) : opts.viewportWidth

      pxReplace = createPxReplace(viewportWidth, opts.unitPrecision, opts.minPixelValue)
    },
    Declaration(decl) {
      if (checkoutDisable({ disable: opts.disable, isExcludeFile, r: decl })) {
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
    DeclarationExit(decl) {
      const { convertUnitOnEnd } = opts
      if (convertUnitOnEnd) {
        if (Array.isArray(convertUnitOnEnd)) {
          convertUnitOnEnd.forEach((conv) => {
            decl.value = convertUnit(decl.value, conv)
          })
        } else {
          decl.value = convertUnit(decl.value, convertUnitOnEnd)
        }
      }
    },
    AtRule(atRule) {
      if (checkoutDisable({ disable: opts.disable, isExcludeFile, r: atRule })) {
        return
      }

      function replacePxInRules() {
        if (!atRule.params.includes(opts.unitToConvert)) return
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
    Comment(node, { Warning }) {
      const filePath = node.source?.input.file

      opts = {
        ...opts,
        ...getOptionsFromComment(node, Warning),
      }

      const exclude = opts.exclude
      const include = opts.include

      isExcludeFile = judgeIsExclude(exclude, include, filePath)
      const viewportWidth =
        typeof opts.viewportWidth === 'function' ? opts.viewportWidth(node.source!.input) : opts.viewportWidth

      pxReplace = createPxReplace(viewportWidth, opts.unitPrecision, opts.minPixelValue)
    },
    CommentExit(comment) {
      if (comment.text.match(isPxtoviewportReg)?.length) {
        comment.remove()
      }
    },
    OnceExit() {
      isExcludeFile = false
      opts = initOptions(options)
    },
  }

  if (options?.disable) {
    return {
      postcssPlugin,
    }
  } else {
    return plugin
  }
}

pxtoviewport.postcss = true

export default pxtoviewport

export { pxtoviewport }
