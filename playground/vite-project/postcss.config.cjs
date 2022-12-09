module.exports = {
  plugins: {
    'postcss-nested': {},
    '@minko-fe/postcss-pxtoviewport': {
      replace: true,
      minPixelValue: 1,
      atRules: false,
      propList: ['*'],
      exclude(file) {
        return file.includes('assets/style')
      },
    },
  },
}
