const plugin = require('tailwindcss/plugin');

const hex2rgb = require('./hex2rgb');
const rgb2hsl = require('./rgb2hsl');

const cssColors = require('./colors.json');

const rgbFnPattern = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d*)\s*(?:,\s*(\d*(?:.\d+)?\s*))?\)/

function extractColors(obj) {
  const getEntries = (o, prefix = '') => {
    return Object.entries(o).flatMap(([k, v]) =>
      Object(v) === v ? getEntries(v, `${prefix}${k}-`) : [[`${prefix}${k}`, v]]
    )
  }

  return Object.fromEntries(getEntries(obj));
}

module.exports = plugin(({ addUtilities, e, theme, variants, config }) => {
  const light = [], dark = [];

  const contrastsConfig = {
    backgroundColor: {
      selector: (name) => `.bg-${name}-contrast`,
      style: (color) => ({
        'background-color': `${color}`
      })
    },
    borderColor: {
      selector: (name) => `.border-${name}-contrast`,
      style: (color) => ({
        'border-color': `${color}`
      })
    },
    placeholderColor: {
      selector: (name) => `.placeholder-${name}-contrast::placeholder`,
      style: (color) => ({
        'color': `${color}`
      })
    },
    textColor: {
      selector: (name) => `.text-${name}-contrast`,
      style: (color) => ({
        'color': `${color}`
      })
    }
  }

  const contrasts = theme('contrasts', {
    backgroundColor: false,
    borderColor: false,
    placeholderColor: true,
    textColor: true
  })

  const colors = extractColors(theme('colors'));

  for (let [name, color] of Object.entries(colors)) {
    color = color.trim();

    let rgb = null;

    if (color in cssColors) {
      color = cssColors[color];
    }

    let match = rgbFnPattern.exec(color);
    if (match) {
      rgb = {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      }
    }

    if (!rgb) {
      rgb = hex2rgb(color);
    }

    if (rgb) {
      const hsl = rgb2hsl(rgb.r, rgb.g, rgb.b);

      if (hsl.l >= 40) {
        light.push(name);
      } else {
        dark.push(name);
      }
    }
  }

  for (const [contrast, config] of Object.entries(contrastsConfig)) {
    if (contrast in contrasts && contrasts[contrast]) {
      const lightSelector = light.map((name) => {
        return config.selector(name);
      }).join(",");

      const darkSelector = dark.map((name) => {
        return config.selector(name);
      }).join(",");

      addUtilities({
        [`${lightSelector}`]: config.style('black'),
        [`${darkSelector}`]: config.style('white')
      }, {
        variants: variants(contrast)
      });
    }
  }
})
