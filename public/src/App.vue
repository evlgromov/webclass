<template>
  <div id="app">
    <!-- <menu-component></menu-component> -->
    <div id="content">
      <p>{{user}}</p>
      <router-view />
    </div>
  </div>
</template>

<script>
import { GET_USER } from './store/user/action-types'

export default {
  name: 'App',
  computed: {
    user() {
      return this.$store.state.user.firstname
    }
  },
  beforeMount() {
    // this.$store.dispatch(GET_USER);
  },
}
</script>