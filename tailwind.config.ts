import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1B1F23",
        steel: "#4A5058",
        mist: "#8C949C",
        line: "#D5D9DD",
        paper: "#F5F6F7",
        card: "#FBFBFA",
        wash: "#ECEEF0",
        ok: "#1E5A3F",
        okbg: "#D6EADF",
        bad: "#8F2D1F",
        badbg: "#F3DAD5",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
