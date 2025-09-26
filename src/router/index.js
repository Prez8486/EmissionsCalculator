import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '../components/Home.vue';
import FormCar from '../components/FormCar.vue';
import FormBus from '../components/FormBus.vue';
import FormTram from '../components/FormTram.vue';
import FormMetro from '../components/FormMetro.vue';
import FormFlight from '../components/FormFlight.vue';
import Login from '../components/Login.vue';
import Register from '../components/Register.vue';
import History from '../components/History.vue';
import Leaderboard from '../components/UserLeaderboard.vue';
import ChangePassword from '../components/ChangePassword.vue';
import BaseTransportForm from '@/components/BaseTransportForm.vue';
import SelectMode from '../components/SelectMode.vue';

const routes = [
  { path: '/', component: Login },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/home', component: Home },
  { path: '/form/car', component: FormCar },
  { path: '/form/bus', component: FormBus },
  { path: '/form/tram', component: FormTram },
  { path: '/form/metro', component: FormMetro },
  { path: '/form/flight', component: FormFlight },
  { path: '/leaderboard', component: Leaderboard },
  { path: '/history', component: History },
  { path: '/select-mode', component: SelectMode },
  {
    path: '/base-form',
    component: BaseTransportForm,
    props: route => ({ transportMode: route.query.mode || '' })
  },

  { path: '/comparison', component: Comparison },

  { path: '/changepassword', component: ChangePassword },

];

export default createRouter({
  history: createWebHashHistory(),
  routes,
});
