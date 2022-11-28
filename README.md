# postcss-pxtoviewport

**English** | [中文](./README-zh.md)

A plugin for [PostCSS](https://github.com/ai/postcss) that generates viewport units (vw, vh, vmin, vmax) from pixel units.

## New Features

- specify any `postcss-pxtoviewport` option in css.
- ignore line in css.

## Install

```bash
pnpm install postcss @minko-fe/postcss-pxtoviewport -D
```

## Usage

### postcss.config.js

#### example

```js
module.exports = {
  plugins: [
    require('@minko-fe/postcss-pxtoviewport')({
      viewportWidth: 375,
      selectorBlackList: ['some-class'],
      propList: ['*'],
      atRules: ['media'],
      // ...
    }),
  ],
}
```

### options

| Name              | Type                                                                | Default                                                | Description                                                                                                        |
| ----------------- | ------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| unitToConvert     | `string`                                                            | `px`                                                   | unit to convert, by default, it is px                                                                              |
| viewportWidth     | `number` \| `((input: Input) => number)`                            | 375                                                    | The width of the viewport                                                                                          |
| unitPrecision     | `number`                                                            | 5                                                      | The decimal numbers to allow the vw units to grow to                                                               |
| propList          | `string[]`                                                          | `['*']`                                                | The properties that can change from px to vw. Refer to：[propList](#propList)                                      |
| viewportUnit      | `string`                                                            | `vw`                                                   | Expected units                                                                                                     |
| fontViewportUnit  | `string`                                                            | `vw`                                                   | Expected units for font                                                                                            |
| propList          | `string[]`                                                          | ['font', 'font-size', 'line-height', 'letter-spacing'] | The properties that can change from px to viewport. Refer to: [propList](#propList)                                |
| selectorBlackList | `(string \| RegExp)[]`                                              | []                                                     | The selectors to ignore and leave as px. Refer to: [selectorBlackList](#selectorBlackList)                         |
| replace           | `boolean`                                                           | true                                                   | replaces rules containing vw instead of adding fallbacks                                                           |
| atRules           | `boolean` \| `string[]`                                             | false                                                  | Allow px to be converted in at-rules. Refer to [At-rule](https://developer.mozilla.org/en-US/docs/Web/CSS/At-rule) |
| minPixelValue     | `number`                                                            | 0                                                      | Set the minimum pixel value to replace.                                                                            |
| include           | `string` \| `RegExp` \| `((filePath: string) => boolean)` \| `null` | null                                                   | The file path to convert px to viewport. Higher priority than `exclude`. Same rules as `exclude`                   |
| exclude           | `string` \| `RegExp` \| `((filePath: string) => boolean) \| null`   | /node_modules/i                                        | The file path to ignore and leave as px. Refer to: [exclude](#exclude)                                             |
| disable           | `boolean`                                                           | false                                                  | disable plugin                                                                                                     |
| convertUnitOnEnd  | `ConvertUnit` \| `ConvertUnit[]` \| false \| null                   | null            | convert unit when plugin process end                                                                                                             |
#### propList

- Values need to be exact matches.
- Use wildcard `*` to enable all properties. Example: `['*']`
- Use `*` at the start or end of a word. (`['*position*']` will match `background-position-y`)
- Use `!` to not match a property. Example: `['*', '!letter-spacing']`
- Combine the "not" prefix with the other prefixes. Example: `['*', '!font*']`

#### selectorBlackList

- If value is string, it checks to see if selector contains the string.
  - `['body']` will match `.body-class`
- If value is regexp, it checks to see if the selector matches the regexp.
  - `[/^body$/]` will match `body` but not `.body`

#### exclude

- If value is string, it checks to see if file path contains the string.
  - `'exclude'` will match `\project\postcss-pxtoviewport\exclude\path`
- If value is regexp, it checks to see if file path matches the regexp.
  - `/exclude/i` will match `\project\postcss-pxtoviewport\exclude\path`
- If value is function, you can use exclude function to return a true and the file will be ignored.
  - the callback will pass the file path as a parameter, it should returns a Boolean result.
  - `function (file) { return file.includes('exclude') }`

## ✨ About new features

### ⚙️ Dynamically set plugin options in css

#### disable plugin

```css
/* pxtoviewport?disabled=true */
.rule {
  font-size: 15px; // 15px
}
```

If you write `15PX` (as long as it's not `px`), the plugin also ignores it, because `unitToConvert` defaults to `px`
If you want to use `PX` to ignore and want the final unit to be `px`, you can:

```js
module.exports = {
  plugins: [
    require('@minko-fe/postcss-pxtoviewport')({
      convertUnitOnEnd: {
        sourceUnit: /[p|P][x|X]$/,
        targetUnit: 'px',
      },
    }),
  ],
}
```

#### set viewportWidth

```css
/* pxtoviewport?viewportWidth=750 */
.rule {
  font-size: 30px; // 4vw
}
```

🌰 The above is just a simple example, you can set any of the options supported by `postcss-pxtoviewport` in the css file

You may have seen that the css comment is very much like the browser url?😼.
That's right. For the specification, just refer to: [query-string](https://github.com/sindresorhus/query-string)

#### example

```css
/* pxtoviewport?disable=false&viewportWidth=750&propList[]=*&replace=false&selectorBlackList[]=/some-class/i */
```

### disable the next line in css file

```css
.rule {
  /* pxtoviewport-disable-next-line */
  font-size: 15px; // 15px
}
```

## ❤️ Thanks

[postcss-px-to-viewport](https://github.com/evrone/postcss-px-to-viewport)

[@tcstory/postcss-px-to-viewport](https://github.com/tcstory/postcss-px-to-viewport)

## 👀 Related

A CSS post-processor that converts px to rem: [postcss-pxtorem](https://github.com/hemengke1997/postcss-pxtorem)

## 💕 Support

**If this has helped you, please don't hesitate to give a STAR, thanks! 😎**
