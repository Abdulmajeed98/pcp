// Next runs every stylesheet of the Shopper app through PostCSS, and Tailwind
// CSS is the one plugin it runs there.
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
