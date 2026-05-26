import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './Options.vue'
// import { setupEqStoreWatcher } from './components/Eq/store'
import { setupApp } from '~/logic/common-setup'
import '../styles'
import '@cloudfly/eno-ui/styles'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// setupEqStoreWatcher()
setupApp(app)
app.mount('#app')
