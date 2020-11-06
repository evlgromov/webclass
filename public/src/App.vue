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
export default {
  name: 'App',
  computed: {
    user() {
      return this.$auth.user()
    }
  },
}
</script>