import { getFontsize, getRoot, page, viteTestUrl } from '~utils'
import { beforeAll, beforeEach, describe, expect, test } from 'vitest'

declare module 'vitest' {
  export interface TestContext {
    vw: string
  }
}

describe('pxtoviewport - width 375', () => {
  beforeAll(async () => {
    await page.setViewportSize({
      width: 375,
      height: 1000,
    })
    await page.goto(viteTestUrl)
  })

  beforeEach(async (ctx) => {
    ctx.vw = await getRoot()
  })

  test('should 1vw to be 16px', ({ vw }) => {
    expect(vw).toBe('16px')
  })

  test('should a_1 fontsize be rootVw', async ({ vw }) => {
    const fontSize = await getFontsize('#a_1')
    expect(fontSize).toBe(vw)
  })

  test('should a_2 fontsize be 16px', async () => {
    const fontSize = await getFontsize('#a_2')
    expect(fontSize).toBe('16px')
  })

  test('should b_1 fontsize be rootVw', async ({ vw }) => {
    const fontSize = await getFontsize('#b_1')
    expect(fontSize).toBe(vw)
  })

  test('should b_2 fontsize be 16px', async () => {
    const fontSize = await getFontsize('#b_2')
    expect(fontSize).toBe('16px')
  })

  test('should c_1 fontsize be half vw', async ({ vw }) => {
    const fontSize = await getFontsize('#c_1')
    expect(fontSize.replace('px', '')).toBeCloseTo(Number.parseFloat(vw) / 2)
  })
})

describe('pxtoviewport - width 750', () => {
  beforeAll(async () => {
    await page.setViewportSize({
      width: 1120,
      height: 1120,
    })
    await page.goto(viteTestUrl)
  })

  beforeEach(async (ctx) => {
    ctx.vw = await getRoot()
  })

  test('should 1vw to be 47.7867px', ({ vw }) => {
    expect(vw).toBe('47.7867px')
  })

  test('should a_1 fontsize be 1vw', async ({ vw }) => {
    const fontSize = await getFontsize('#a_1')
    expect(fontSize).toBe(vw)
  })

  test('should a_2 fontsize be 16px', async () => {
    const fontSize = await getFontsize('#a_2')
    expect(fontSize).toBe('16px')
  })

  test('should b_1 fontsize be 1vw', async ({ vw }) => {
    const fontSize = await getFontsize('#b_1')
    expect(fontSize).toBe(vw)
  })

  test('should b_2 fontsize be 16px', async () => {
    const fontSize = await getFontsize('#b_2')
    expect(fontSize).toBe('16px')
  })

  test('should c_1 fontsize be half vw', async ({ vw }) => {
    const fontSize = await getFontsize('#c_1')
    expect(fontSize.replace('px', '')).toBeCloseTo(Number.parseFloat(vw) / 2)
  })
})

describe('pxtoviewport - width 1960', () => {
  beforeAll(async () => {
    await page.setViewportSize({
      width: 1960,
      height: 1960,
    })
    await page.goto(viteTestUrl)
  })

  beforeEach(async (ctx) => {
    ctx.vw = await getRoot()
  })

  test('should 1vw to be 83.6267px', ({ vw }) => {
    expect(vw).toBe('83.6267px')
  })

  test('should a_1 fontsize be 1vw', async ({ vw }) => {
    const fontSize = await getFontsize('#a_1')
    expect(fontSize).toBe(vw)
  })

  test('should a_2 fontsize be 16px', async () => {
    const fontSize = await getFontsize('#a_2')
    expect(fontSize).toBe('16px')
  })

  test('should b_1 fontsize be 1vw', async ({ vw }) => {
    const fontSize = await getFontsize('#b_1')
    expect(fontSize).toBe(vw)
  })

  test('should b_2 fontsize be 16px', async () => {
    const fontSize = await getFontsize('#b_2')
    expect(fontSize).toBe('16px')
  })

  test('should c_1 fontsize be half vw', async ({ vw }) => {
    const fontSize = await getFontsize('#c_1')
    expect(fontSize.replace('px', '')).toBeCloseTo(Number.parseFloat(vw) / 2)
  })
})
