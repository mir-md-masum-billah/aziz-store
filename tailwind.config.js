const colors = require('tailwindcss/colors');
// রঙগুলো CSS ভ্যারিয়েবল থেকে আসে — .dark ক্লাসে ভ্যারিয়েবল বদলালেই পুরো UI ডার্ক হয়ে যায়
const v = n => `rgb(var(--${n}) / <alpha-value>)`;
const scale = (base, p, shades) => ({ ...base, ...Object.fromEntries(shades.map(s => [s, v(`${p}-${s}`)])) });
const tint = [50, 100, 200, 300];

module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.js', './components/**/*.js', './lib/**/*.js'],
  theme: {
    extend: {
      colors: {
        stone: scale(colors.stone, 's', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        emerald: scale(colors.emerald, 'e', tint),
        red: scale(colors.red, 'r', tint),
        amber: scale(colors.amber, 'a', tint),
        sky: scale(colors.sky, 'k', tint),
        surface: v('surface'), accent: v('accent'), danger: v('danger'), warn: v('warn'), info: v('info'),
      },
      fontFamily: { sans: ['var(--font-bn)', 'Noto Sans Bengali', 'system-ui', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgb(28 25 23 / .04), 0 4px 16px -4px rgb(28 25 23 / .08)' },
      keyframes: {
        up: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
        pop: { from: { opacity: 0, transform: 'scale(.96)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: { up: 'up .25s ease-out', pop: 'pop .18s ease-out' },
    },
  },
  plugins: [],
};
