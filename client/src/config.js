import Vue from 'vue';

import store from './store';

import auth from '@websanova/vue-auth';
import authBearer from '@websanova/vue-auth/drivers/auth/bearer.js';
import httpAxios from '@websanova/vue-auth/drivers/http/axios.1.x.js';
import routerVueRouter from '@websanova/vue-auth/drivers/router/vue-router.2.x.js';

import axios from 'axios';
import VueAxios from 'vue-axios';

import SocketIO from 'socket.io-client';
import VueSocketIO from 'vue-socket.io';

import {BootstrapVue} from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-vue/dist/bootstrap-vue.css"

Vue.use(VueAxios, axios);
Vue.axios.defaults.baseURL = process.env.BACKEND_URL

Vue.use(BootstrapVue)

Vue.use(auth, {
  auth: authBearer,
  http: httpAxios,
  router: routerVueRouter,
  tokenDefaultKey: 'jwtToken',
  stores: ['storage', 'cookie'],
  loginData: {
    url: 'api/v1/auth/login',
    redirect: {name: 'Canvases'},
  },
  registerData: {
    url: 'api/v1/auth/register',
  },
  logoutData: {
    url: 'api/v1/auth/logout',
  },
  fetchData: {
    url: 'api/v1/auth/me',
  },
  refreshData: {
    enabled: false
  }
})

Vue.use(new VueSocketIO({
  debug: true,
  connection: SocketIO(process.env.BACKEND_URL, {query: `auth_token=${Vue.auth.token()}`}),
  vuex: {
    store,
    actionPrefix: 'SOCKET_',
    mutationPrefix: 'SOCKET_'
  },
}));