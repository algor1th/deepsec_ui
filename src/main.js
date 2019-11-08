import Vue from 'vue'
import App from './App.vue'
import router from './router'
import 'element-ui/lib/theme-chalk/index.css'
import Element from 'element-ui' // TODO import only used components
import notification from './util/notification'

const { remote } = require('electron')

Vue.config.productionTip = false

Vue.use(Element)

// Setup prototype for global use
Vue.prototype.$notification = notification
Vue.prototype.$openExternalLink = function(e) { remote.shell.openExternal(e.target.href) }
// TODO prototype for settings and user settings

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
