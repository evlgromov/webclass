<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light border-bottom shadow-sm rounded">
    <a class="navbar-brand" href="#">8080</a>
    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarsExample09" aria-controls="navbarsExample09" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarsExample09">
      <ul class="navbar-nav mr-auto">
        <li class="nav-item active">
          <router-link class="nav-link" v-if="$auth.check(['teacher'])" to="/students">{{$t('menu.students')}}</router-link>
        </li>
        <li class="nav-item active">
          <router-link class="nav-link" v-if="$auth.check(['teacher'])" to="/canvases">{{$t('menu.canvases')}}</router-link>
        </li>
      </ul>
      <div class="form-inline my-2 my-md-0">
        <router-link class="btn btn-outline-primary mr-3" v-if="!$auth.check()" to="/login">{{$t('menu.signIn')}}</router-link>
        <router-link class="btn btn-outline-primary mr-1" v-if="!$auth.check()" to="/register">{{$t('menu.signUp')}}</router-link>
        <button class="btn btn-outline-primary"  v-if="$auth.check()" @click="() => $store.dispatch('auth/logout')">{{$t('menu.exit')}}</button>
        <div class="locale-switcher ml-3">
          <div class="locale-switcher_icon">🌐</div>
          <select class="locale-switcher_select" v-model="$i18n.locale">
            <option value="en">EN</option>
            <option value="ru">RU</option>
          </select>
        </div>
      </div>
    </div>
  </nav>

</template>

<script>
export default {

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
    padding-left: 20px;
  }
}
</style>