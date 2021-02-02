<template>
  <div id="app" v-if="appReady">
    <!-- <menu-component></menu-component> -->
    <div id="content" class="text-center">
      <Menu/>
      <router-view />
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import Menu from './components/Menu';

export default {
  name: 'App',
  data: () => ({
    connect: false
  }),
  computed: {
    authReady() {
      return this.$auth.ready();
    },
    appReady() {
      return this.authReady && this.connect || this.authReady && !this.$auth.check();
    },
  },
  sockets: {
    connect: function() {
      console.log('Connected')
      this.connect = true
    },
    disconnect: function() {
      console.log('Disconnected')
    }
  },
  components: {
    Menu
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
      width: 100vw;
      height: 100vh;
      margin: 0 auto 50px;
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