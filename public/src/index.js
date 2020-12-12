import Vue from 'vue';
import { sync } from 'vuex-router-sync';
import i18n from "./plugins/i18n";

import App from './App';
import router from './router';
import store from './store';

import config from './config';

sync(store, router)

new Vue({
  el: '#app',
  i18n,
  components: { App },
  router,
  store,
  template: '<App/>',
  sockets: {
    success: function() {
      console.log('connect')
    }
  }
});