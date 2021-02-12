<template>
  <div id="app" v-if="appReady">
    <div id="content" class="text-center">
      <Menu v-if="!isFullscreen"/>
      <router-view />
    </div>
    <b-modal ref="modal" hide-footer title="Webclass Whiteboard">
      <div class="d-block text-center">
        <h3>Ошибка</h3>
        <p>Произошла ошибка передачи данных с сервером. Пожалуйста перезагрузите страницу.</p>
      </div>
      <b-button class="mt-3" variant="outline-danger" block @click="hideModal">Close Me</b-button>
    </b-modal>
  </div>
</template>

<script>
import Menu from './components/Menu';

export default {
  name: 'App',
  data: () => ({
    connect: false,
    isFullscreen: false,
  }),
  mounted() {
    this.$root.$on('fullscreen', this.setFullscreenFlag)
  },
  computed: {
    authReady() {
      return this.$auth.ready();
    },
    appReady() {
      return this.authReady && this.connect || this.authReady && !this.$auth.check();
    },
  },
  methods: {
    setFullscreenFlag(value) {
      this.isFullscreen = value
    },
    showModal() {
      this.$refs['modal'].show()
    },
    hideModal() {
      this.$refs['modal'].hide()
    },
  },
  sockets: {
    connect: function() {
      console.log('Connected')
      this.connect = true
    },
    disconnect: function() {
      console.log('Disconnected')
      this.showModal()
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
      margin: 0 auto;
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