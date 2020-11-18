import Vue from 'vue';
import Router from 'vue-router';

import Home from '../components/Home'
import Login from '../components/Login'
import Register from '../components/Register'
import Students from '../components/Students'
import Video from '../components/Video'
import Chat from '../components/Chat'

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
          name: 'Home'
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
          name: 'Home'
        }
      },
    },
    {
      path: '/video/:id',
      name: 'Video',
      component: Video,
      meta: {
        auth: true,
        redirect: {
          name: 'Login'
        }
      },
    },
    {
      path: '/chat/:id',
      name: 'Chat',
      component: Chat,
      meta: {
        auth: true,
        redirect: {
          name: 'Login'
        }
      },
    },
    {
      path: '/students',
      name: 'Students',
      component: Students,
      meta: {
        auth: {
          roles: 'teacher'
        },
        redirect: {
          name: 'Home'
        }
      },
    },
    {
      path: '/',
      component: Home,
      meta: {
        auth: true,
        redirect: {
          name: 'Login'
        }
      },
    },
    {
      path: '*',
      redirect: {
        name: 'Login'
      }
    }
  ]
});

export default Vue.router;