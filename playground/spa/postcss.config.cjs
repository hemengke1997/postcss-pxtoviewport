/* eslint-disable node/no-path-concat */

module.exports = {
  plugins: {
    'tailwindcss/nesting': {},
    'tailwindcss': {
      config: `${__dirname}/tailwind.config.cjs`,
    },
    '@minko-fe/postcss-pxtoviewport': {
      viewportWidth: 375,
      replace: true,
      minPixelValue: 1,
      atRules: false,
      propList: ['*'],
      convertUnit: {
        source: /px$/i,
        target: 'px',
      },
    },
  },
}
