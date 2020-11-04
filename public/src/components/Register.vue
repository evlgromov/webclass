<template>
  <div class="form">
    <h1>Регистрация</h1>
    <input v-model="email" type="text" placeholder="Электронная почта">
    <input v-model="firstname" type="text" placeholder="Имя">
    <input v-model="lastname" type="text" placeholder="Фамилия">
    <input v-model="password" type="password" placeholder="Пароль">
    <button @click="register">Зарегистрироваться</button>
  </div>
</template>

<script>
import * as mutations from '../store/register/mutation-actions';
import { REGISTER } from '../store/register/action-types';

export default {
  computed: {
    email: {
      get() {
        return this.$store.state.register.email;
      },
      set(value) {
        this.$store.commit(mutations.changeEmailRegister(value));
      }
    },
    firstname: {
      get() {
        return this.$store.state.register.firstname;
      },
      set(value) {
        this.$store.commit(mutations.changeFirstnameRegister(value));
      }
    },
    lastname: {
      get() {
        return this.$store.state.register.lastname;
      },
      set(value) {
        this.$store.commit(mutations.changeLastnameRegister(value));
      }
    },
    password: {
      get() {
        return this.$store.state.register.password;
      },
      set(value) {
        this.$store.commit(mutations.changePasswordRegister(value));
      }
    }
  },
  methods: {
    register() {
      this.$store.dispatch(REGISTER).then((haveUser) => {
        if(haveUser) {
          this.$router.push({name:'Video'});
        }
      });
    }
  }
}
</script>