import fs from 'node:fs'
import postcss from 'postcss'
import nested from 'postcss-nested'
import pxtoviewport from '../src'

const css = fs.readFileSync('main.css', 'utf8')
const options = {
  replace: true,
}
const processedCss = postcss(pxtoviewport(options), nested).process(css).css

fs.writeFile('main-viewport.css', processedCss, (err) => {
  if (err) {
    throw err
  }
  console.log('viewport file written.')
})
