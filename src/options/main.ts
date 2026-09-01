import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '~/features/shell/App.vue'
import '../styles'
import '@cloudfly/eno-ui/styles'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
