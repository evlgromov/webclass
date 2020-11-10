<template>
  <nav>
    <ul>
      <router-link v-if="$auth.check()" to="/">Главная</router-link>
      <router-link v-if="!$auth.check()" to="/login">Вход</router-link>
      <router-link v-if="!$auth.check()" to="/register">Регистрация</router-link>
      <router-link v-if="$auth.check(['teacher'])" to="/students">Ученики</router-link>
      <a href="#" v-if="$auth.check()" @click="() => $store.dispatch('auth/logout')">Выйти</a>
    </ul>
  </nav>
</template>

<script>
export default {
  
}
</script>