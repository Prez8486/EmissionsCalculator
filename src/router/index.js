import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '../components/Home.vue';
import SelectMode from '../components/SelectMode.vue';
import FormCar from '../components/FormCar.vue';
import FormBus from '../components/FormBus.vue';
import FormTram from '../components/FormTram.vue';
import FormMetro from '../components/FormMetro.vue';
import FormFlight from '../components/FormFlight.vue';
import Login from '../components/Login.vue';
import Register from '../components/Register.vue';
import History from '../components/History.vue';
import Leaderboard from '../components/Leaderboard.vue';
import CarTrip from '../components/CarTrip.vue';
import Comparison from '@/components/Comparison.vue';
const routes = [
  { path: '/', component: Login },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/home', component: Home },
  { path: '/select-mode', component: SelectMode },
  { path: '/form/car', component: FormCar },
  { path: '/form/bus', component: FormBus },
  { path: '/form/tram', component: FormTram },
  { path: '/form/metro', component: FormMetro },
  { path: '/form/flight', component: FormFlight },
  { path: '/leaderboard', component: Leaderboard },
  { path: '/history', component: History },
  { path: '/cartrip', component: CarTrip },
  { path: '/comparison', component: Comparison },
];

export default createRouter({
  history: createWebHashHistory(),
  routes,
});
