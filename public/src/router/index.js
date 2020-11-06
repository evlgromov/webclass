import Vue from 'vue';
import Router from 'vue-router';

import store from '../store'

import Login from '../components/Login'
import Register from '../components/Register'
import Video from '../components/Video'

Vue.use(Router);

Vue.router = new Router({
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: {
        auth: false,
        redirect: {
          name: 'Video'
        }
      },
    },
    {
      path: '/register',
      name: 'Register',
      component: Register,
      meta: {
        auth: false,
        redirect: {
          name: 'Video'
        }
      },
    },
    {
      path: '/video',
      name: 'Video',
      component: Video,
      meta: {
        auth: 'student'
      },
    },
    {
      path: '/404',
      component: Register,
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
});

export default Vue.router;