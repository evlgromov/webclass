<template>
  <div class="form">
    <h1>Авторизация</h1>
    <input v-model="email" type="text" placeholder="Электронная почта">
    <input v-model="password" type="password" placeholder="Пароль">
    <button @click="auth">Войти</button>
  </div>
</template>

<script>

export default {
  data: () => ({
    email: '',
    password: '',
  }),

  computed: {
    loginData() {
      return {
        email: this.email,
        password: this.password
      };
    }
  },

  methods: {
    auth() {
      this.$store
      .dispatch('auth/login', {
          data: this.loginData,
      })
      .then(null, (res) => {
        console.log(res.response)
      });
    }
  },
}
</script>