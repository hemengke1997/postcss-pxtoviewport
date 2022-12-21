module.exports = {
  plugins: {
    'tailwindcss/nesting': {},
    'tailwindcss': {},
    '@minko-fe/postcss-pxtoviewport': {
      replace: true,
      minPixelValue: 1,
      atRules: false,
      propList: ['*'],
    },
  },
}
