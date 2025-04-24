import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '../components/Home.vue';
import SelectMode from '../components/SelectMode.vue';
import FormCar from '../components/FormCar.vue';
import FormBus from '../components/FormBus.vue';
import FormTram from '../components/FormTram.vue';
import FormMetro from '../components/FormMetro.vue';
import FormFlight from '../components/FormFlight.vue';
import History from '../components/History.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/select-mode', component: SelectMode },
  { path: '/form/car', component: FormCar },
  { path: '/form/bus', component: FormBus },
  { path: '/form/tram', component: FormTram },
  { path: '/form/metro', component: FormMetro },
  { path: '/form/flight', component: FormFlight },
  { path: '/history', component: History },
];

export default createRouter({
  history: createWebHashHistory(),
  routes,
});
