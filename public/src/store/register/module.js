import * as types from './mutation-types';
import { REGISTER } from './action-types';
import { setUser, haveUser } from '../user/mutation-actions'

import { fetch } from '../helpActions'

export default {
  state: {
    email: '',
    password: '',
    firstname: '',
    lastname: '',
    role: 'student',
  },

  mutations: {
    [types.CHANGE_EMAIL_REGISTER](state, { email }) {
      state.email = email;
    },
    [types.CHANGE_PASSWORD_REGISTER](state, { password }) {
      state.password = password;
    },
    [types.CHANGE_FIRSTNAME_REGISTER](state, { firstname }) {
      state.firstname = firstname;
    },
    [types.CHANGE_LASTNAME_REGISTER](state, { lastname }) {
      state.lastname = lastname;
    },
    [types.CHANGE_ROLE_REGISTER](state, { role }) {
      state.role = role;
    },
  },

  getters: {
    registerData: state => ({
      email: state.email,
      password: state.password,
      firstname: state.firstname,
      lastname: state.lastname,
      role: state.role,
    })
  },

  actions: {
    [REGISTER]({ commit, getters }) {
      return new Promise((resolve, reject) => {
        fetch('post', '/api/v1/auth/register', getters.registerData, (err, data) => {
          let user;
          if (data) {
            commit(haveUser(user = true));
            commit(setUser(data))
          } else {
            commit(haveUser(user = false));
          }
          resolve(user);
        });
      });
    }
  }
}