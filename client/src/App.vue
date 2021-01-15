<template>
  <div id="app" v-if="appReady">
    <!-- <menu-component></menu-component> -->
    <div id="content" class="m-0 w-100 h-100 text-center">
      <Menu/>
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

export default {
  name: 'App',
  data: () => ({
    connect: false
  }),
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
    appReady() {
      return this.authReady && this.connect || this.authReady && !this.$auth.check();
    }
  },
  components: {
    Menu
  },
  sockets: {
    connect: function () {
      this.connect = true;
    },
  },
}
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
}

#app {
  .btn{
    border-radius: 20px;
  }
  #content {
    width: 100vw;
    height: 100vh;
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
  }
}
</style>