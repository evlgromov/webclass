import Vue from 'vue';
import { sync } from 'vuex-router-sync';

import App from './App';
import router from './router';
import store from './store';

import { GET_USER } from './store/user/action-types'

sync(store, router)

store.dispatch(GET_USER).then(() => {
  new Vue({
    el: '#app',
    components: { App },
    router,
    store,
    template: '<App/>'
  });
})