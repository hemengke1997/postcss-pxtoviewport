import postcss from 'postcss'
import { describe, expect, test } from 'vitest'
import type { Input } from 'postcss'
import pxtoviewport from '../src'
import { filterPropList } from '../src/utils/filter-prop-list'

const basicCSS = '.rule { font-size: 15px }'
const basicExpected = '.rule { font-size: 4vw }'

describe('pxtoviewport', () => {
  test('should work on the readme example', () => {
    const input = 'h1 { margin: 0 0 30px; line-height: 2; letter-spacing: 1px; }'
    const output = 'h1 { margin: 0 0 8vw; line-height: 2; letter-spacing: 1px; }'
    const processed = postcss(pxtoviewport()).process(input).css

    expect(processed).toBe(output)
  })

  test('should replace the px unit with vw', () => {
    const processed = postcss(pxtoviewport()).process(basicCSS).css
    const expected = basicExpected

    expect(processed).toBe(expected)
  })

  test('should ignore non px properties', () => {
    const expected = '.rule { font-size: 2rem }'
    const processed = postcss(pxtoviewport()).process(expected).css

    expect(processed).toBe(expected)
  })

  test('should handle < 1 values and values without a leading 0', () => {
    const rules = '.rule { margin: 0.5rem .75px -0.3px -.2em }'
    const expected = '.rule { margin: 0.5rem 0.2vw -0.08vw -.2em }'
    const options = {
      minPixelValue: 0,
    }
    const processed = postcss(pxtoviewport(options)).process(rules).css

    expect(processed).toBe(expected)
  })

  test('should remain unitless if 0', () => {
    const expected = '.rule { font-size: 0px; font-size: 0; }'
    const processed = postcss(pxtoviewport()).process(expected).css

    expect(processed).toBe(expected)
  })

  test('should not add properties that already exist', () => {
    const expected = '.rule { font-size: 15px; font-size: 4vw; }'
    const processed = postcss(pxtoviewport()).process(expected).css

    expect(processed).toBe(expected)
  })

  test('should ignore px in custom property names', () => {
    const css = ':root { --vw-15px: 15px; } .rule { font-size: var(--vw-15px); }'
    const expected = ':root { --vw-15px: 4vw; } .rule { font-size: var(--vw-15px); }'
    const options = {
      propList: ['--*', 'font-size'],
    }
    const processed = postcss(pxtoviewport(options)).process(css).css

    expect(processed).toBe(expected)
  })

  test('should support atRules', () => {
    const css =
      '@supports (top: max(375px)) { .btn { bottom: (calc(var(--safe-bottom)), calc(var(--some-var, 15px) - 15px));left: (calc(var(--safe-left)), calc(var(--some-var, 15px) - 15px));}}'

    const expected =
      '@supports (top: max(100vw)) { .btn { bottom: (calc(var(--safe-bottom)), calc(var(--some-var, 4vw) - 4vw));left: (calc(var(--safe-left)), calc(var(--some-var, 4vw) - 4vw));}}'

    const processed = postcss(pxtoviewport({ atRules: ['supports'], propList: ['*'] })).process(css).css

    expect(processed).toBe(expected)
  })

  test('should include higher priority than exclude', () => {
    const options = {
      exclude: 'node_modules',
      include: 'node_modules',
    }

    const processed = postcss(pxtoviewport(options)).process(basicCSS, {
      from: 'node_modules/path',
    }).css
    expect(processed).toBe(basicExpected)
  })
})

describe('value parsing', () => {
  test('should not replace values in double quotes or single quotes', () => {
    const options = {
      propList: ['*'],
    }
    const css = '.rule { content: \'15px\'; font-family: "15px"; font-size: 15px; }'
    const expected = '.rule { content: \'15px\'; font-family: "15px"; font-size: 4vw; }'
    const processed = postcss(pxtoviewport(options)).process(css).css

    expect(processed).toBe(expected)
  })

  test('should not replace values in `url()`', () => {
    const options = {
      propList: ['*'],
    }
    const css = '.rule { background: url(15px.jpg); font-size: 15px; }'
    const expected = '.rule { background: url(15px.jpg); font-size: 4vw; }'
    const processed = postcss(pxtoviewport(options)).process(css).css

    expect(processed).toBe(expected)
  })

  test('should not replace values with an uppercase P or X', () => {
    const options = {
      propList: ['*'],
    }
    const css =
      '.rule { margin: 15px calc(100% - 14PX); height: calc(100% - 15px); font-size: 12Px; line-height: 15px; }'
    const expected =
      '.rule { margin: 4vw calc(100% - 14PX); height: calc(100% - 4vw); font-size: 12Px; line-height: 4vw; }'
    const processed = postcss(pxtoviewport(options)).process(css).css

    expect(processed).toBe(expected)
  })

  test('should number 0 take units', () => {
    const options = {
      propList: ['*'],
    }

    const css = '.rule { font-size: 0px }'
    const expected = '.rule { font-size: 0px }'

    const processed = postcss(pxtoviewport(options)).process(css).css

    expect(processed).toBe(expected)
  })

  test('should ignore px in custom property, but handle default values', () => {
    const rules = ':root { --vw-15px: 15px; } .rule { font-size: var(--vw-15px, 15px); }'
    const expected = ':root { --vw-15px: 4vw; } .rule { font-size: var(--vw-15px, 4vw); }'
    const options = {
      propList: ['--*', 'font-size'],
    }
    const processed = postcss(pxtoviewport(options)).process(rules).css

    expect(processed).toBe(expected)
  })
})

describe('viewportWidth', () => {
  test('should replace using a root value of 10', () => {
    const expected = '.rule { font-size: 2vw }'
    const options = {
      viewportWidth: 750,
    }
    const processed = postcss(pxtoviewport(options)).process(basicCSS).css

    expect(processed).toBe(expected)
  })

  test('should replace using different root values with different files', () => {
    const css2 = '.rule { font-size: 30px }'
    const expected = '.rule { font-size: 4vw }'
    const options = {
      viewportWidth(input: Input): number {
        if (input.from.includes('basic.css')) {
          return 375
        }
        return 750
      },
    }
    const processed1 = postcss(pxtoviewport(options)).process(basicCSS, {
      from: '/tmp/basic.css',
    }).css
    const processed2 = postcss(pxtoviewport(options)).process(css2, {
      from: '/tmp/whatever.css',
    }).css

    expect(processed1).toBe(expected)
    expect(processed2).toBe(expected)
  })
})

describe('unitPrecision', () => {
  test('should replace using a decimal of 2 places', () => {
    const css = '.rule { font-size: 14px }'
    const expected = '.rule { font-size: 3.73vw }'
    const options = {
      unitPrecision: 2,
    }
    const processed = postcss(pxtoviewport(options)).process(css).css

    expect(processed).toBe(expected)
  })
})

describe('replace', () => {
  test('should leave fallback pixel unit', () => {
    const options = {
      replace: false,
    }
    const processed = postcss(pxtoviewport(options)).process(basicCSS).css
    const expected = '.rule { font-size: 15px; font-size: 4vw }'

    expect(processed).toBe(expected)
  })
})

describe('atRules', () => {
  test('should replace px in at rules', () => {
    const options = {
      atRules: true,
    }
    const processed = postcss(pxtoviewport(options)).process(
      '@media (min-width: 375px) { .rule { font-size: 15px } }',
    ).css
    const expected = '@media (min-width: 100vw) { .rule { font-size: 4vw } }'

    expect(processed).toBe(expected)
  })
})

describe('minPixelValue', () => {
  test('should not replace values below minPixelValue', () => {
    const options = {
      propList: ['*'],
      minPixelValue: 2,
    }
    const rules = '.rule { border: 1px solid #000; font-size: 15px; margin: 1px 10px; }'
    const expected = '.rule { border: 1px solid #000; font-size: 4vw; margin: 1px 2.66667vw; }'
    const processed = postcss(pxtoviewport(options)).process(rules).css

    expect(processed).toBe(expected)
  })
})

describe('filter-prop-list', () => {
  test('should find "exact" matches from propList', () => {
    const propList = ['font-size', 'margin', '!padding', '*border*', '*', '*y', '!*font*']
    const expected = 'font-size,margin'
    expect(filterPropList.exact(propList).join()).toBe(expected)
  })

  test('should find "contain" matches from propList and reduce to string', () => {
    const propList = ['font-size', '*margin*', '!padding', '*border*', '*', '*y', '!*font*']
    const expected = 'margin,border'
    expect(filterPropList.contain(propList).join()).toBe(expected)
  })

  test('should find "start" matches from propList and reduce to string', () => {
    const propList = ['font-size', '*margin*', '!padding', 'border*', '*', '*y', '!*font*']
    const expected = 'border'
    expect(filterPropList.startWith(propList).join()).toBe(expected)
  })

  test('should find "end" matches from propList and reduce to string', () => {
    const propList = ['font-size', '*margin*', '!padding', 'border*', '*', '*y', '!*font*']
    const expected = 'y'
    expect(filterPropList.endWith(propList).join()).toBe(expected)
  })

  test('should find "not" matches from propList and reduce to string', () => {
    const propList = ['font-size', '*margin*', '!padding', 'border*', '*', '*y', '!*font*']
    const expected = 'padding'
    expect(filterPropList.notExact(propList).join()).toBe(expected)
  })

  test('should find "not contain" matches from propList and reduce to string', () => {
    const propList = ['font-size', '*margin*', '!padding', '!border*', '*', '*y', '!*font*']
    const expected = 'font'
    expect(filterPropList.notContain(propList).join()).toBe(expected)
  })

  test('should find "not start" matches from propList and reduce to string', () => {
    const propList = ['font-size', '*margin*', '!padding', '!border*', '*', '*y', '!*font*']
    const expected = 'border'
    expect(filterPropList.notStartWith(propList).join()).toBe(expected)
  })

  test('should find "not end" matches from propList and reduce to string', () => {
    const propList = ['font-size', '*margin*', '!padding', '!border*', '*', '!*y', '!*font*']
    const expected = 'y'
    expect(filterPropList.notEndWith(propList).join()).toBe(expected)
  })
})

describe('exclude', () => {
  test('should ignore file path with exclude RegEx', () => {
    const options = {
      exclude: /exclude/i,
    }
    const processed = postcss(pxtoviewport(options)).process(basicCSS, {
      from: 'exclude/path',
    }).css
    expect(processed).toBe(basicCSS)
  })

  test('should not ignore file path with exclude String', () => {
    const options = {
      exclude: 'exclude',
    }
    const processed = postcss(pxtoviewport(options)).process(basicCSS, {
      from: 'exclude/path',
    }).css
    expect(processed).toBe(basicCSS)
  })

  test('should not ignore file path with exclude function', () => {
    const options = {
      exclude(file: string) {
        return file.includes('exclude')
      },
    }
    const processed = postcss(pxtoviewport(options)).process(basicCSS, {
      from: 'exclude/path',
    }).css
    expect(processed).toBe(basicCSS)
  })
})

describe('include', () => {
  test('should convert file path with include RegEx', () => {
    const options = {
      include: /node_modules/i,
    }
    const processed = postcss(pxtoviewport(options)).process(basicCSS, {
      from: 'node_modules/path',
    }).css
    expect(processed).toBe(basicExpected)
  })

  test('should convert file path with include string', () => {
    const options = {
      include: 'node_modules',
    }

    const processed = postcss(pxtoviewport(options)).process(basicCSS, {
      from: 'node_modules/path',
    }).css
    expect(processed).toBe(basicExpected)
  })

  test('should convert file path with include function', () => {
    const options = {
      include: (file: string) => {
        return file.includes('node_modules')
      },
    }
    const processed = postcss(pxtoviewport(options)).process(basicCSS, {
      from: 'node_modules/path',
    }).css
    expect(processed).toBe(basicExpected)
  })

  test('should convert specified file path', () => {
    const options = {
      include: 'node_modules/pathA',
    }
    const processed = postcss(pxtoviewport(options)).process(basicCSS, {
      from: 'node_modules/path',
    }).css
    expect(processed).toBe(basicCSS)
  })
})

describe('top comment', () => {
  test('regexp', () => {
    const css = '/* postcss-pxtoviewport?disable=false */\n.rule { font-size: 15px }'
    const expected = '.rule { font-size: 4vw }'
    const processed = postcss(pxtoviewport()).process(css).css

    expect(processed).toBe(expected)
  })

  test('empty', () => {
    const css = ''
    const expected = ''
    const processed = postcss(pxtoviewport()).process(css).css
    expect(processed).toBe(expected)
  })

  test('disable', () => {
    const css = '/* pxtoviewport?disable=true */\n.rule { font-size: 15px }'

    const expected = '.rule { font-size: 15px }'

    const processed = postcss(pxtoviewport({ propList: ['*'] })).process(css).css

    expect(processed).toBe(expected)
  })

  test('viewportWidth', () => {
    const css = '/* pxtoviewport?viewportWidth=750 */\n.rule { font-size: 30px }'

    const expected = '.rule { font-size: 4vw }'
    const processed = postcss(pxtoviewport({ propList: ['*'] })).process(css).css

    expect(processed).toBe(expected)
  })

  test('propList - string', () => {
    const css = '/* pxtoviewport?propList[]=font-size */\n.rule { font-size: 15px; margin-right: 15px }'

    const expected = '.rule { font-size: 4vw; margin-right: 15px }'

    const processed = postcss(pxtoviewport({ propList: ['*'] })).process(css).css

    expect(processed).toBe(expected)
  })

  test('propList - !', () => {
    const css = '/* pxtoviewport?propList[]=!font-size */\n.rule { font-size: 15px; margin-right: 15px }'

    const expected = '.rule { font-size: 15px; margin-right: 15px }'

    const processed = postcss(pxtoviewport({ propList: ['*'] })).process(css).css

    expect(processed).toBe(expected)
  })

  test('propList - ! & *', () => {
    const css = '/* pxtoviewport?propList[]=!margin*|font* */\n.rule { font-size: 15px; margin-right: 15px }'

    const expected = '.rule { font-size: 4vw; margin-right: 15px }'

    const processed = postcss(pxtoviewport({ propList: ['*'] })).process(css).css

    expect(processed).toBe(expected)
  })

  test('unitPrecision', () => {
    const css = '/* pxtoviewport?unitPrecision=3 */\n.rule { font-size: 16px; }'

    const expected = '.rule { font-size: 4.267vw; }'
    const processed = postcss(pxtoviewport()).process(css).css

    expect(processed).toBe(expected)
  })

  test('selectorBlackList - string', () => {
    const css = '/* pxtoviewport?selectorBlackList[]=rule */\n.rule { font-size: 15px; }'

    const expected = '.rule { font-size: 15px; }'

    const processed = postcss(pxtoviewport()).process(css).css

    expect(processed).toBe(expected)
  })

  test('selectorBlackList - RegExp', () => {
    const css = '/* pxtoviewport?selectorBlackList[]=/rule/ */\n.rule { font-size: 15px; }'
    const expected = '.rule { font-size: 15px; }'

    const processed = postcss(pxtoviewport()).process(css).css

    expect(processed).toBe(expected)
  })

  test('selectorBlackList', () => {
    const css =
      '/* pxtoviewport?selectorBlackList[]=/rule/|other */\n.rule { font-size: 15px; } .other { font-size: 15px; }'

    const expected = '.rule { font-size: 15px; } .other { font-size: 15px; }'

    const processed = postcss(pxtoviewport()).process(css).css

    expect(processed).toBe(expected)
  })

  test('replace', () => {
    const css = '/* pxtoviewport?replace=false */\n.rule { font-size: 15px; }'
    const expected = '.rule { font-size: 15px; font-size: 4vw; }'
    const processed = postcss(pxtoviewport()).process(css).css

    expect(processed).toBe(expected)
  })

  test('atRules', () => {
    const css = '/* pxtoviewport?atRules=true */\n@media (min-width: 375px) { .rule { font-size: 15px } }'
    const processed = postcss(pxtoviewport()).process(css).css
    const expected = '@media (min-width: 100vw) { .rule { font-size: 4vw } }'

    expect(processed).toBe(expected)
  })

  test('minPixelValue', () => {
    const css =
      '/* pxtoviewport?minPixelValue=2 */\n.rule { border: 1px solid #000; font-size: 15px; margin: 1px 10px; }'

    const processed = postcss(pxtoviewport({ propList: ['*'] })).process(css).css

    const expected = '.rule { border: 1px solid #000; font-size: 4vw; margin: 1px 2.66667vw; }'
    expect(processed).toBe(expected)
  })
})

describe('inline comment', () => {
  test('should disable next line', () => {
    const css =
      '.rule { font-size: 15px; /* simple comment */ width: 15px; /* pxtoviewport-disable-next-line */ height: 15px; }'
    const expected = '.rule { font-size: 4vw; /* simple comment */ width: 4vw; height: 15px; }'

    const processed = postcss(pxtoviewport({ propList: ['*'] })).process(css).css

    expect(processed).toBe(expected)
  })

  test('should disable next line in mutiline css', () => {
    const css =
      '.rule {\nfont-size: 15px;\n/* pxtoviewport-disable-next-line */\nwidth: 100px;\n/* pxtoviewport-disable-next-line */\nheight: 50px;\n}'

    const expected = '.rule {\nfont-size: 4vw;\nwidth: 100px;\nheight: 50px;\n}'

    const processed = postcss(pxtoviewport({ propList: ['*'] })).process(css).css

    expect(processed).toBe(expected)
  })
})

describe('unitToConvert', () => {
  test('should ignore non px values by default', () => {
    const expected = '.rule { font-size: 2em }'
    const processed = postcss(pxtoviewport()).process(expected).css

    expect(processed).toBe(expected)
  })

  test('should convert only values described in options', () => {
    const rules = '.rule { font-size: 30em; line-height: 2px }'
    const expected = '.rule { font-size: 8vw; line-height: 2px }'
    const options = {
      unitToConvert: 'em',
    }
    const processed = postcss(pxtoviewport(options)).process(rules).css

    expect(processed).toBe(expected)
  })
})
