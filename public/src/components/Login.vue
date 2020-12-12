<template>
  <div class="container-fluid text-center mh-100 w-100 mt-4">
    <div class="card w-50  p-3">
      <h1 class="mb-3">{{ $t('auth.signInTitle') }}</h1>
      <div class="form-group mt-3">
        <input v-model="email" :placeholder="$t('auth.email')" class="form-control mw-100 mb-3" type="text">
      </div>
      <div class="form-group">
        <input v-model="password" :placeholder="$t('auth.password')" class="form-control mw-100 mb-3" type="password">
      </div>
      <div class="form-group">
        <button class="btn btn-outline-primary mw-75 w-75 m-auto" type="button" @click="auth">
          {{ $t('auth.signInBtn') }}
        </button>
      </div>
    </div>
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
          }).then((res) => {
        this.$router.push('/');
      });
    }
  },
}
</script>
<style scoped>
.card {
  margin: 100px auto auto;
  max-width: 400px;
  min-width: 350px;
  box-shadow: 3px 3px 5px 0px rgba(50, 50, 50, 0.1);
}
</style>