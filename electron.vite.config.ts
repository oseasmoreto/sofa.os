import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    // Sem isso, as URLs de asset geradas assumem raiz "/", o que funciona
    // no dev server (http) mas quebra no app empacotado, que carrega o
    // index.html via file:// — nesse esquema, um caminho começando com "/"
    // vira raiz do disco inteiro, não da pasta do app.
    base: './',
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [vue()]
  }
})
