/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'xxs': '0.625rem', // Smaller than xs
        'tiny': '0.5rem',  // Super tiny text size
        'super-tiny': '0.2rem',  // Super tiny text size
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

