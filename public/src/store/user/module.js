import { SET_USER, HAVE_USER } from './mutation-types';
import { GET_USER } from './action-types';
import { setUser, haveUser } from './mutation-actions'

import { fetch } from '../helpActions'

export default {
  state: {
    haveUser: undefined,
    _id: '',
    email: '',
    firstname: '',
    lastname: '',
    role: 'student',
  },

  mutations: {
    [HAVE_USER](state, { have }) {
      state.haveUser = have;
    },

    [SET_USER](state, { user }) {
      state._id = user._id;
      state.email = user.email;
      state.firstname = user.firstname;
      state.lastname = user.lastname;
      state.role = user.role;
    },
  },

  actions: {
    [GET_USER]({ commit }) {
      return new Promise((resolve, reject) => {
        fetch('get', '/api/v1/auth/me', null, (err, data) => {
          if (err) {
            return;
          }

          if (data) {
            commit(haveUser(true));
            commit(setUser(data))
          } else {
            commit(haveUser(false));
          }
          resolve(data);
        });
      });
    }
  }
}