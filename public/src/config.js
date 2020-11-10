import Vue from 'vue';

import store from './store';
import { setSocketConnect } from './store/socket'

import auth from '@websanova/vue-auth';
import authBearer from '@websanova/vue-auth/drivers/auth/bearer.js';
import httpAxios from '@websanova/vue-auth/drivers/http/axios.1.x.js';
import routerVueRouter from '@websanova/vue-auth/drivers/router/vue-router.2.x.js';

import axios from 'axios';
import VueAxios from 'vue-axios';

import VueSocketIO from 'vue-socket.io';

Vue.use(VueAxios, axios);

Vue.prototype.$initSocket = function () {
  Vue.use(new VueSocketIO({
    debug: true,
    connection: window.location.origin,
    vuex: {
      store,
      actionPrefix: 'SOCKET_',
      mutationPrefix: 'SOCKET_'
    },
  }));

  this.$socket.on('connect', () => {
    this.$store.commit(setSocketConnect());
    this.$socket.emit('authenticate', { token: this.$auth.token() });
  })
}

Vue.use(auth, {
  auth: authBearer,
  http: httpAxios,
  router: routerVueRouter,
  tokenDefaultKey: 'jwtToken',
  rolesKey: 'role',
  stores: ['storage', 'cookie'],
  loginData: {
    url: 'api/v1/auth/login',
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
})
