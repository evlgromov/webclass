import Vue from 'vue';
import Vuex from 'vuex'

import user from './user/module';
import login from './login/module';
import register from './register/module';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    user,
    login,
    register,
  },
  strict: true
});