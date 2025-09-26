import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import { createPinia } from 'pinia';


// create the Vue app instance
const app = createApp(App);

// add plugins
app.use(router);
app.use(createPinia());

// mount the app
app.mount('#app');
