<template>
  <div class="form">
    <div class="container-fluid text-center mh-100 w-100 mt-4">
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
        <div class="form-group mt-3">
          <input v-model="email" class="form-control mw-100 mb-3" :placeholder="$t('auth.email')" type="text">
        </div>
        <div class="form-group">
          <input v-model="firstname" class="form-control mw-100 mb-3" :placeholder="$t('auth.firstname')" type="text">
        </div>
        <div class="form-group">
          <input v-model="lastname" class="form-control mw-100 mb-3" :placeholder="$t('auth.lastname')" type="text">
        </div>
        <div class="form-group">
          <input v-model="password" class="form-control mw-100 mb-3" :placeholder="$t('auth.password')" type="password">
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
    firstname: '',
    lastname: '',
    role: 'student',
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
    }
  },

  methods: {
    register() {
      this.$store
          .dispatch('auth/register', {
            data: this.registerData,
          }).then((res) => {
        location.href=location.href;
      });
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