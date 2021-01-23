import Vue from 'vue';

export default {
  namespaced: true,

  state: {
    registerErrors: {},
    loginErrors: {}
  },

  actions: {
    fetch(data) {
      return Vue.auth.fetch(data);
    },

    login(ctx, data) {
      return new Promise((resolve, reject) => {
        Vue.auth.login({
          data: data.data,
          staySignedIn: true,
          fetchUser: false
        }).then((res) => {
          const data = res.data.data;

          Vue.auth.user(data.user);
          Vue.auth.remember(JSON.stringify(ctx.getters.user));
          Vue.auth.token('jwtToken', data.jwt_token.token, data.jwt_token.expires);
          Vue.router.push({ name: 'Home' });

          resolve(res);
        }).catch(e => {
          ctx.commit('setLoginErrors', e.response.data.error.errors)
        })
      });
    },

    register(ctx, data) {
      return new Promise((resolve, reject) => {
        Vue.auth.register({
          data: data.data,
        }).then(() => {
          ctx.dispatch('login', data)
        }).catch(e => {
          ctx.commit('setRegisterErrors', e.response.data.error.errors)
        })
      });
    },

    logout(ctx) {
      return Vue.auth.logout();
    },
  },
  mutations: {
    setLoginErrors(state, errors) {
      state.loginErrors = errors
    },
    setRegisterErrors(state, errors) {
      state.registerErrors = errors
    }
  },
  getters: {
    user() {
      return Vue.auth.user();
    },
    registerErrors(state) {
      return state.registerErrors
    },
    loginErrors(state) {
      return state.loginErrors
    }
  }
}





















// import { SET_USER, HAVE_USER, SET_JWT } from './mutation-types';
// import { GET_USER } from './action-types';
// import { setUser, haveUser, setJWT } from './mutation-actions'

// import { authFetch } from '../helpUtility'

// export default {
//   state: {
//     jwtToken: '',
//     haveUser: undefined,
//     _id: '',
//     email: '',
//     firstname: '',
//     lastname: '',
//     role: 'student',
//   },

//   mutations: {
//     [HAVE_USER](state, { have }) {
//       state.haveUser = have;
//     },

//     [SET_JWT](state, { jwtToken }) {
//       state.jwtToken = jwtToken;
//     },

//     [SET_USER](state, { user }) {
//       state._id = user._id;
//       state.email = user.email;
//       state.firstname = user.firstname;
//       state.lastname = user.lastname;
//       state.role = user.role;
//     },
//   },

//   actions: {
//     [GET_USER]({ commit }, cb) {
//       const jwtTokenExpires = Date.parse(localStorage.getItem('jwtTokenExpires'));

//       if (jwtTokenExpires > Date.now()) {
//         commit(setJWT(localStorage.getItem('jwtToken')));
//         commit(haveUser(true));
//         authFetch('get', '/api/v1/auth/me', null, (err, data) => {
//           if (err && err !== 'Unauthorized') {
//             return cb(err);
//           }

//           if (data) {
//             commit(setUser(data));
//           }

//           cb();
//         });
//       } else {
//         commit(haveUser(false));
//         cb();
//       }
//     }
//   }
// }