import {
  fileURLToPath,
  URL,
} from "node:url";

import react
  from "@vitejs/plugin-react";

import {
  defineConfig,
} from "vite";


export default defineConfig({
  plugins: [
    react(),
  ],


  /* =========================
     PATH ALIAS
  ========================= */

  resolve: {
    alias: {
      "@": fileURLToPath(
        new URL(
          "./src",
          import.meta.url
        )
      ),
    },
  },


  /* =========================
     PRODUCTION BUILD
  ========================= */

  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [

            /* =========================
               REACT / ROUTER
            ========================= */

            {
              name: "react-vendor",

              test:
                /node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,

              priority: 20,
            },


            /* =========================
               CHARTING LIBRARY
            ========================= */

            {
              name: "charts-vendor",

              test:
                /node_modules[\\/]recharts[\\/]/,

              priority: 15,
            },


            /* =========================
               OTHER VENDOR PACKAGES
            ========================= */

            {
              name: "vendor",

              test:
                /node_modules/,

              priority: 10,
            },

          ],
        },
      },
    },
  },
});