<template>
  <div class="form">
    <h1>Регистрация</h1>
    <div id="role">
      <input id="student" type="radio" value="student" v-model="role">
      <label for="student">Ученик</label>
      <input id="teacher" type="radio" value="teacher" v-model="role">
      <label for="teacher">Учитель</label>
    </div>
    <input v-model="email" type="text" placeholder="Электронная почта">
    <input v-model="firstname" type="text" placeholder="Имя">
    <input v-model="lastname" type="text" placeholder="Фамилия">
    <input v-model="password" type="password" placeholder="Пароль">
    <button @click="register">Зарегистрироваться</button>
  </div>
</template>

<script>
export default {
  data: () => ({
    email: '',
    password: '',
    firstname: '',
    lastname: '',
    role: 'student',
  }),

  computed: {
    registerData() {
      return {
        email: this.email,
        password: this.password,
        firstname: this.firstname,
        lastname: this.lastname,
        role: this.role,
      }
    }
  },

  methods: {
    register() {
      this.$store
      .dispatch('auth/register', {
          data: this.registerData,
      }).then((res) => {
        this.$initSocket();
        this.$router.push('/');
      });
    }
  }
}
</script>