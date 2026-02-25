import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#F39020",
          "orange-light": "#F5A74D",
          "orange-dark": "#D97A10",
          navy: "#1B2A3B",
          "navy-light": "#2A3F55",
          "navy-dark": "#111C28",
        },
      },
    },
  },
  plugins: [],
};
export default config;
