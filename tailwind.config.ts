import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        marca: {
          DEFAULT: '#115740',
          oscuro: '#0b3d2c',
          claro: '#e8f0ea',
          oro: '#c99b3d',
        },
      },
    },
  },
  plugins: [],
};

export default config;
