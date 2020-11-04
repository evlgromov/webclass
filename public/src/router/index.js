import Vue from 'vue';
import Router from 'vue-router';

import store from '../store'

import Login from '../components/Login'
import Register from '../components/Register'
import Video from '../components/Video'

Vue.use(Router);

const router = new Router({
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/register',
      name: 'Register',
      component: Register
    },
    {
      path: '/video',
      name: 'Video',
      component: Video
    },
    {
      path: '*',
      redirect: '/login'
    }
  ]
});

router.beforeEach((to, from, next) => {
  const haveUser = store.state.user.haveUser;
  if (!haveUser && ['Login', 'Register'].indexOf(to.name) === -1) return next({ name: 'Login' })
  if (haveUser && ['Login', 'Register'].indexOf(to.name) !== -1) return next({ name: 'Video' });
  next();
});

export default router;