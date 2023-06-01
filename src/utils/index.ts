import type { AtRule, ChildNode, Comment, Container, Declaration, Rule, Warning as postcssWarning } from 'postcss'
import type { ConvertUnit, PxtoviewportOptions } from '..'
import { defaultOptions } from '..'
import { MAYBE_REGEXP } from './constant'
import { filterPropList } from './filter-prop-list'
import type { ParseOptions } from './query-parse'
import { parse } from './query-parse'

export function initOptions(options?: PxtoviewportOptions) {
  return Object.assign({}, defaultOptions, options)
}

export function isOptionComment(node: ChildNode | undefined): node is Comment {
  return node?.type === 'comment'
}

const processd = Symbol('processed')

export function isRepeatRun(r: Rule | Declaration | AtRule | undefined) {
  if (!r) return false
  if ((r as unknown as Record<symbol, boolean>)[processd]) {
    return true
  }
  ;(r as unknown as Record<symbol, boolean>)[processd] = true
  return false
}

function reRegExp() {
  return /^\/((?:\\\/|[^\/])+)\/([imgy]*)$/
}

function parseRegExp(MAYBE_REGEXPArg: unknown) {
  const RE_REGEXP = reRegExp()
  if (isString(MAYBE_REGEXPArg) && RE_REGEXP.test(MAYBE_REGEXPArg)) {
    return new RegExp(RE_REGEXP.exec(MAYBE_REGEXPArg)?.[1] || '', RE_REGEXP.exec(MAYBE_REGEXPArg)?.[2])
  }
  return MAYBE_REGEXPArg
}

export const isPxtoviewportReg = /(?<=^pxtoviewport\?).+/g

export function getOptionsFromComment(comment: Comment, Warning: typeof postcssWarning, parseOptions: ParseOptions) {
  try {
    const index = comment.text.search(isPxtoviewportReg)

    const ret: Record<string, any> = {}
    let query = comment.text.slice(index)

    if (!query || index === -1) return ret
    query = query.replaceAll(/\s+/g, '')

    const defaultKeys = Object.keys(defaultOptions)
    const parsed = parse(query, {
      parseBooleans: true,
      parseNumbers: true,
      arrayFormat: 'bracket-separator',
      arrayFormatSeparator: '|',
      ...parseOptions,
    })
    const RE_REGEXP = reRegExp()
    for (const k of Object.keys(parsed)) {
      if (defaultKeys.includes(k)) {
        let cur = parsed[k]
        if (MAYBE_REGEXP.includes(k)) {
          if (Array.isArray(cur)) {
            cur = cur.map((t) => {
              return parseRegExp(t)
            }) as any
          } else {
            if (isString(cur) && RE_REGEXP.test(cur)) {
              cur = parseRegExp(cur) as any
            }
          }
        }

        ret[k] = cur
      }
    }
    return ret as PxtoviewportOptions
  } catch {
    // eslint-disable-next-line no-new
    new Warning('Unexpected comment', { start: comment.source?.start, end: comment.source?.end })
  }
}

function isXClude(Xclude: PxtoviewportOptions['include'], filePath: string | undefined) {
  return (
    Xclude &&
    filePath &&
    ((isFunction(Xclude) && Xclude(filePath)) ||
      (isString(Xclude) && filePath.includes(Xclude)) ||
      (isRegExp(Xclude) && filePath.match(Xclude)))
  )
}

export function judgeIsExclude<T extends PxtoviewportOptions['include']>(
  exclude: T,
  include: T,
  filePath: string | undefined,
) {
  if (include) {
    if (isXClude(include, filePath)) {
      return false
    }
    return true
  }

  if (isXClude(exclude, filePath)) {
    return true
  }
  return false
}

function toFixed(number: number, precision: number) {
  const multiplier = 10 ** (precision + 1)
  const wholeNumber = Math.floor(number * multiplier)
  return (Math.round(wholeNumber / 10) * 10) / multiplier
}

export function createPxReplace(
  viewportWidth: number,
  unitPrecision: NonNullable<PxtoviewportOptions['unitPrecision']>,
  minPixelValue: NonNullable<PxtoviewportOptions['minPixelValue']>,
) {
  return (viewportUnit: PxtoviewportOptions['viewportUnit']) => {
    return (m: string, $1: string) => {
      if (!$1) return m
      const pixels = parseFloat($1)
      if (pixels <= minPixelValue) return m
      const fixedVal = toFixed((pixels / viewportWidth) * 100, unitPrecision)
      return fixedVal === 0 ? '0' : `${fixedVal}${viewportUnit}`
    }
  }
}

export function createPropListMatcher(propList: string[]) {
  const hasWild = propList.includes('*')
  const matchAll = hasWild && propList.length === 1
  const lists = {
    exact: filterPropList.exact(propList),
    contain: filterPropList.contain(propList),
    startWith: filterPropList.startWith(propList),
    endWith: filterPropList.endWith(propList),
    notExact: filterPropList.notExact(propList),
    notContain: filterPropList.notContain(propList),
    notStartWith: filterPropList.notStartWith(propList),
    notEndWith: filterPropList.notEndWith(propList),
  }
  return function (prop: string) {
    if (matchAll) return true
    return (
      (hasWild ||
        lists.exact.includes(prop) ||
        lists.contain.some((m) => prop.includes(m)) ||
        lists.startWith.some((m) => prop.indexOf(m) === 0) ||
        lists.endWith.some((m) => prop.indexOf(m) === prop.length - m.length)) &&
      !(
        lists.notExact.includes(prop) ||
        lists.notContain.some((m) => prop.includes(m)) ||
        lists.notStartWith.some((m) => prop.indexOf(m) === 0) ||
        lists.notEndWith.some((m) => prop.indexOf(m) === prop.length - m.length)
      )
    )
  }
}

export function blacklistedSelector(
  blacklist: NonNullable<PxtoviewportOptions['selectorBlackList']>,
  selector: string,
) {
  if (typeof selector !== 'string') return
  return blacklist.some((t) => {
    if (typeof t === 'string') {
      return selector.includes(t)
    }
    return selector.match(t)
  })
}

export function getUnit(prop: string, opts: PxtoviewportOptions) {
  return !prop.includes('font') ? opts.viewportUnit : opts.fontViewportUnit
}

export function declarationExists(decls: Container<ChildNode>, prop: string, value: string) {
  return decls.some((decl) => {
    return (decl as Declaration).prop === prop && (decl as Declaration).value === value
  })
}

export function convertUnit(value: string, convert: ConvertUnit) {
  if (typeof convert.sourceUnit === 'string') {
    return value.replace(new RegExp(`${convert.sourceUnit}$`), convert.targetUnit)
  } else if (convert.sourceUnit instanceof RegExp) {
    return value.replace(new RegExp(convert.sourceUnit), convert.targetUnit)
  }
  return value
}

export function checkoutDisable(p: {
  disable: boolean
  isExcludeFile: boolean
  r?: Parameters<typeof isRepeatRun>[0]
}) {
  const { disable, isExcludeFile, r } = p
  if (disable || isExcludeFile || isRepeatRun(r)) {
    return true
  }
  return false
}

enum EnumDataType {
  number = 'Number',
  string = 'String',
  boolean = 'Boolean',
  null = 'Null',
  undefined = 'Undefined',
  object = 'Object',
  array = 'Array',
  date = 'Date',
  regexp = 'RegExp',
  function = 'Function',
}

function is(val: unknown, type: string) {
  return Object.prototype.toString.call(val) === `[object ${type}]`
}
export function isNumber(data: unknown): data is number {
  return is(data, EnumDataType.number)
}
export function isString(data: unknown): data is string {
  return is(data, EnumDataType.string)
}
export function isBoolean(data: unknown): data is boolean {
  return is(data, EnumDataType.boolean)
}
export function isNull(data: unknown): data is null {
  return is(data, EnumDataType.null)
}
export function isUndefined(data: unknown): data is undefined {
  return is(data, EnumDataType.undefined)
}
export function isObject(data: unknown): data is Object {
  return is(data, EnumDataType.object)
}
export function isArray(data: unknown): data is Array<any> {
  return is(data, EnumDataType.array)
}
export function isRegExp(data: unknown): data is RegExp {
  return is(data, EnumDataType.regexp)
}
export function isFunction(data: unknown): data is Function {
  return is(data, EnumDataType.function)
}
