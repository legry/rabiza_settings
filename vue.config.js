const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  pwa: {
    name: "Настройки рабица",
    manifestOptions: {
      display: "minimal-ui"
    }
  }
})
