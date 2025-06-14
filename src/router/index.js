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
import Leaderboard from '../components/Leaderboard.vue';
import TripModeSelection from '../components/TripModeSelection.vue';
import TripTracking from '../components/TripTracking.vue';
import TripSummary from '../components/TripSummary.vue';


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
  { path: '/trip-tracking', name: 'TripTracking', component: TripTracking },
  { path: '/trip-mode-selection', component: TripModeSelection },
  { path: '/trip-summary', name: 'TripSummary', component: TripSummary.vue}
];

export default createRouter({
  history: createWebHashHistory(),
  routes,
});
