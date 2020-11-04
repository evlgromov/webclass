<template>
  <div class="form">
    <h1>Авторизация</h1>
    <input v-model="email" type="text" placeholder="Электронная почта">
    <input v-model="password" type="password" placeholder="Пароль">
    <button @click="auth">Войти</button>
  </div>
</template>

<script>
import { changeEmailLogin, changePasswordLogin } from '../store/login/mutation-actions';
import { LOGIN } from '../store/login/action-types';

export default {
  computed: {
    email: {
      get() {
        return this.$store.state.login.email;
      },
      set(value) {
        this.$store.commit(changeEmailLogin(value));
      }
    },
    password: {
      get() {
        return this.$store.state.login.password;
      },
      set(value) {
        this.$store.commit(changePasswordLogin(value));
      }
    }
  },
  methods: {
    auth() {
      this.$store.dispatch(LOGIN).then((haveUser) => {
        if(haveUser) {
          this.$router.push({name:'Video'});
        }
      });
    }
  }
}
</script>