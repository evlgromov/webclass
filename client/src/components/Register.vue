<template>
  <div class="form">
    <div class="container-fluid mh-100 w-100 mt-4">
      <div class="card p-3">
        <h1 class="mb-3">{{$t('auth.signUnTitle')}}</h1>
        <div class="d-flex justify-content-center">
          <div class="p-2">
            <div class="form-check-inline">
              <label class="form-check-label">
                <input type="radio" class="form-check-input" value="student" v-model="role" name="optradio">{{$t('auth.student')}}
              </label>
            </div>
          </div>
          <div class="p-2">
            <div class="form-check-inline">
              <label class="form-check-label">
                <input type="radio" class="form-check-input" value="teacher" v-model="role" name="optradio">{{$t('auth.teacher')}}
              </label>
            </div>
          </div>
        </div>
        <div class="form-group mt-3 mb-4">
          <input v-model="email" class="form-control mw-100" :placeholder="$t('auth.email')" type="text">
          <small
              v-if="errors.email"
              class="error"
          >
            {{errors.email.msg}}
          </small>
        </div>
        <div class="form-group mb-4">
          <input v-model="firstname" class="form-control mw-100" :placeholder="$t('auth.firstname')" type="text">
          <small
              v-if="errors.firstname"
              class="error"
          >
            {{errors.firstname.msg}}
          </small>
        </div>
        <div class="form-group mb-4">
          <input v-model="lastname" class="form-control mw-100" :placeholder="$t('auth.lastname')" type="text">
          <small
              v-if="errors.lastname"
              class="error"
          >
            {{errors.lastname.msg}}
          </small>
        </div>
        <div class="form-group mb-4">
          <input v-model="password" class="form-control mw-100" :placeholder="$t('auth.password')" type="password">
          <small
              v-if="errors.password"
              class="error"
          >
            {{errors.password.msg}}
          </small>
        </div>
        <div class="form-group mb-4">
          <input v-model="confirmPassword" class="form-control mw-100" :placeholder="$t('auth.confirmPassword')" type="password">
          <small
              v-if="checkPassword"
              class="error"
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
export default {
  data: () => ({
    email: '',
    password: '',
    confirmPassword: '',
    firstname: '',
    lastname: '',
    role: 'student',
    invalidPassword: ''
  }),
  mounted() {

  },
  computed: {
    registerData() {
      return {
        email: this.email,
        password: this.password,
        firstname: this.firstname,
        lastname: this.lastname,
        role: this.role,
      }
    },
    errors() {
      return this.$store.getters['auth/getErrors']
    }
  },

  methods: {
    register() {
      if(!this.checkPassword()) return
      this.$store
        .dispatch('auth/register', {
          data: this.registerData,
        })
    },
    checkPassword() {
      if(this.password !== this.confirmPassword) {
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
.error {
  float: left;
  color: darkred;
}
@media only screen and (max-width: 768px) {
  .container-fluid{
    padding: 0!important;
  }
}
</style>