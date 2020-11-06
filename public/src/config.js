import Vue from 'vue';
import auth from '@websanova/vue-auth';
import authBearer from '@websanova/vue-auth/drivers/auth/bearer.js';
import httpAxios from '@websanova/vue-auth/drivers/http/axios.1.x.js';
import routerVueRouter from '@websanova/vue-auth/drivers/router/vue-router.2.x.js';

import axios from 'axios';
import VueAxios from 'vue-axios';

Vue.use(VueAxios, axios);

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
