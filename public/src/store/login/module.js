import { CHANGE_EMAIL_LOGIN, CHANGE_PASSWORD_LOGIN } from './mutation-types';
import { LOGIN } from './action-types';
import { setUser, haveUser } from '../user/mutation-actions'

import { fetch } from '../helpActions'

export default {
  state: {
    email: '',
    password: ''
  },

  mutations: {
    [CHANGE_EMAIL_LOGIN](state, { email }) {
      state.email = email;
    },
    [CHANGE_PASSWORD_LOGIN](state, { password }) {
      state.password = password;
    },
  },

  getters: {
    loginData: state => ({
      email: state.email,
      password: state.password
    })
  },

  actions: {
    [LOGIN]({ commit, getters }) {
      return new Promise((resolve, reject) => {
        fetch('post', '/api/v1/auth/login', getters.loginData, (err, data) => {
          let user;
          if (data) {
            commit(haveUser(user = true));
            commit(setUser(data))
          } else {
            commit(haveUser(user = false));
          }
          resolve(user)
        });
      });
    }
  }
}