<template>
  <div class="form">
    <div class="container-fluid mh-100 w-100 mt-4">
      <div class="card p-3">
        <h1 class="mb-3">{{$t('auth.signUnTitle')}}</h1>
        <div class="form-group mt-3 mb-4">
          <input
              v-model="email"
              :placeholder="$t('auth.email')"
              v-bind:class="{'form-control':true, 'is-invalid' : errors.email, 'mw-100':true}"
              type="text"
          >
          <small
              v-if="errors.email"
              class="invalid-feedback text-left"
          >
            {{errors.email.msg}}
          </small>
        </div>
        <div class="form-group mb-4">
          <input
              v-model="firstname"
              :placeholder="$t('auth.firstname')"
              v-bind:class="{'form-control':true, 'is-invalid' : errors.firstname, 'mw-100':true}"
              type="text"
          >
          <small
              v-if="errors.firstname"
              class="invalid-feedback text-left"
          >
            {{errors.firstname.msg}}
          </small>
        </div>
        <div class="form-group mb-4">
          <input
              v-model="lastname"
              :placeholder="$t('auth.lastname')"
              v-bind:class="{'form-control':true, 'is-invalid' : errors.lastname, 'mw-100':true}"
              type="text"
          >
          <small
              v-if="errors.lastname"
              class="invalid-feedback text-left"
          >
            {{errors.lastname.msg}}
          </small>
        </div>
        <div class="form-group mb-4">
          <input
              v-model="password"
              :placeholder="$t('auth.password')"
              v-bind:class="{'form-control':true, 'is-invalid' : errors.password, 'mw-100':true}"
              type="password"
          >
          <small
              v-if="errors.password"
              class="invalid-feedback text-left"
          >
            {{errors.password.msg}}
          </small>
        </div>
        <div class="form-group mb-4">
          <input
              v-model="confirmPassword"
              :placeholder="$t('auth.password')"
              v-bind:class="{'form-control':true, 'is-invalid' : errors.password, 'mw-100':true}"
              type="password"
          >
          <small
              v-if="checkPassword"
              class="invalid-feedback text-left"
          >
            {{invalidPassword}}
          </small>
        </div>
        <div class="form-group">
          <button class="btn btn-outline-primary mw-75 w-75 m-auto mb-0" type="button" @click="register">{{$t('auth.signUpBtn')}}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue';

export default {
  data: () => ({
    email: '',
    password: '',
    confirmPassword: '',
    firstname: '',
    lastname: '',
    invalidPassword: ''
  }),
  computed: {
    registerData() {
      return {
        email: this.email,
        password: this.password,
        firstname: this.firstname,
        lastname: this.lastname,
      }
    },
    errors() {
      return this.$store.getters['auth/getRegisterErrors']
    }
  },

  methods: {
    register() {
      const vm = this;
      if(!this.checkPassword()) return
      this.$store
        .dispatch('auth/register', {
          data: this.registerData,
        }).then((res) => {
          const token = res.data.data.jwt_token.token
          vm.$socket.close()
          vm.$socket.io.opts.query = {auth_token: token};
          vm.$socket.open()
      })
    },
    checkPassword() {
      if (this.confirmPassword === '') {
        this.invalidPassword = 'Поле не может быть пустым'
      } else if(this.password !== this.confirmPassword) {
        this.invalidPassword = 'Пароли не совпадают'
        return false
      }
      return true
    }
  }
}
</script>
<style lang="scss" scoped>
.card {
  margin: 30px auto auto;
  max-width: 400px;
  min-width: 300px;
  box-shadow:3px 3px 5px 0px rgba(50, 50, 50, 0.1);
}
@media only screen and (max-width: 768px) {
  .container-fluid{
    padding: 0!important;
  }
}
</style>