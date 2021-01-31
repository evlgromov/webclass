<template>
  <nav class="navbar navbar-light bg-light navbar-expand-lg">
    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarsExample09" aria-controls="navbarsExample09" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarsExample09">
      <ul class="navbar-nav mr-auto">
        <li class="nav-item active">
          <router-link class="nav-link" v-if="$auth.check()" to="/canvases">{{$t('menu.canvases')}}</router-link>
        </li>
      </ul>
      <div class="form-inline my-2 my-md-0">
        <div class="mr-5" v-if="isUser">{{user.email}}</div>
        <router-link class="btn btn-outline-primary mr-3" v-if="!$auth.check()" to="/login">{{$t('menu.signIn')}}</router-link>
        <router-link class="btn btn-outline-primary mr-1" v-if="!$auth.check()" to="/register">{{$t('menu.signUp')}}</router-link>
        <button class="btn btn-outline-primary"  v-if="$auth.check()" @click="() => $store.dispatch('auth/logout')">{{$t('menu.exit')}}</button>
        <div class="locale-switcher ml-3">
          <div class="locale-switcher_icon">🌐</div>
          <select class="locale-switcher_select" v-model="$i18n.locale">
            <option value="en">En</option>
            <option value="ru">Ru</option>
          </select>
        </div>
      </div>
    </div>
  </nav>

</template>

<script>
export default {
  computed: {
    user() {
      return this.$auth.user()
    },
    isUser() {
      return !!this.user;
    },
  }
}
</script>
<style lang="scss" scoped>
select:focus {outline:none;}
.locale-switcher{
  display: flex;
  &_icon{
    margin: auto;
    z-index: 1;
  }
  &_select {
    z-index: 0;
    border-radius: 20px;
    border-color: #007bff;
    height: 38px;
    margin-left: -25px;
    padding-left: 25px;
  }
}
</style>