import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss({
      theme: {
        extend: {
          fontFamily: {
            nunito: ["Nunito", "sans-serif"],
          },
        },
        theme: {
          extend: {
            keyframes: {
              "slide-down": {
                "0%": { transform: "translateY(-16px)", opacity: "0" },
                "100%": { transform: "translateY(0)", opacity: "1" },
              },
            },
            animation: {
              "slide-down": "slide-down 0.2s ease-out",
            },
          },
        },
      },
    }
    ),
  ],
  base: "/"

})

