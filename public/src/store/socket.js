import Vue from 'vue';

export const SOCKET_SET_CONNECT = 'SOCKET_SET_CONNECT';

export const setSocketConnect = () => ({
  type: SOCKET_SET_CONNECT,
});

export const socket = {
  state: {
    connect: false
  },

  mutations: {
    [SOCKET_SET_CONNECT](state) {
      state.connect = true;
    }
  },
}