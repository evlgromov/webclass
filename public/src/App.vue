<template>
  <div id="app" v-if="appReady">
    <!-- <menu-component></menu-component> -->
    <div id="content">
      <Menu />
      <p v-if="isUser">{{user.email}}</p>
      <router-view />
    </div>
  </div>
</template>

<script>
import Vue from 'vue';
import VueSocketIO from 'vue-socket.io';

import store from './store';

import Menu from './components/Menu'

import { initSocket } from './store/socket';

export default {
  name: 'App',
  computed: {
    user() {
      return this.$auth.user()
    },
    isUser() {
      return !!this.user;
    },
    authReady() {
      return this.$auth.ready();
    },
    socketReady() {
      return this.$store.state.socket.connect;
    },
    appReady() {
      return this.authReady && this.socketReady || this.authReady && !this.$auth.check();
    }
  },
  components: {
    Menu
  },
  beforeMount() {
    this.$auth
      .load()
      .then(() => {
        if (this.$auth.check()) {
          this.$initSocket();
        }
      });
  }
}
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
}

#app {
  #content {
    max-width: 1024px;
    margin: 20px auto;
    .form {
      display: flex;
      flex-direction: column;
      input, button {
        max-width: 200px;
      }
      h1 {
        margin-bottom: 20px;
      }
    }
    .test {
      .localVideo {
        width: 200px;
      }
      .remoteVideos {
        display: flex;
        div {
          video {
            width: 200px;
          }
        }
      }
    }
  }
}
</style>