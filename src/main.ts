import './assets/main.css'
import { createRouter, createWebHistory } from 'vue-router'
import { createApp } from "vue";
import App from "./App.vue";
import ui from '@nuxt/ui/vue-plugin'
import { createPinia } from 'pinia'

const pinia = createPinia()
const app = createApp(App);
const router = createRouter({
    routes: [
        { path: '/', component: () => import('./pages/index.vue') },
        {path: '/server/:ip', component: () => import('./pages/server.vue')}
    ],
    history: createWebHistory()
})
app.use(pinia)
app.use(router);
app.use(ui)


app.mount("#app");
