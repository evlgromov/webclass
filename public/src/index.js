import Vue from 'vue';
import { sync } from 'vuex-router-sync';

import App from './App';
import router from './router';
import store from './store';

import config from './config';

sync(store, router)

new Vue({
  el: '#app',
  components: { App },
  router,
  store,
  template: '<App/>'
});