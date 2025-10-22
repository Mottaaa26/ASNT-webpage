const { default: themes } = require('daisyui/theme/object');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    '../../../templates/**/*.html',
    '../../../core/templates/**/*.html',
    '../../../**/templates/**/*.html',
  ],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
}