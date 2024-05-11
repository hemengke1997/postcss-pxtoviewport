/* eslint-disable node/no-path-concat */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [`${__dirname}/src/**/*.{js,ts,jsx,tsx}`],
  corePlugins: {
    preflight: true,
  },
  plugins: [],
}
