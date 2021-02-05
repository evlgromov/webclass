<template>
  <div class="container">
    <form class="create mt-3">
      <div class="create__title">
        {{$t('canvases.createWhiteboard')}}
      </div>
      <input class="create__input form-control" v-model="title" type="text" :placeholder="$t('canvases.title')">
      <button class="create__btn btn btn-primary" @click="fetchCreateCanvas">{{ $t('canvases.create') }}</button>
    </form>
    <hr>
    <h5>{{$t('canvases.yourWhiteboards')}}</h5>
    <table class="table table-bordered mt-3" v-if="canvases.length">
      <thead class="thead-light">
      <tr class="d-flex">
        <th class="col-2">{{ $t('canvases.title') }}</th>
        <th class="col-6">{{ $t('canvases.access') }}</th>
        <th class="col-4">{{ $t('canvases.actions') }}</th>
      </tr>
      </thead>
      <tbody>
      <tr class="d-flex" v-for="(canvas, i) in canvases" :key="canvas._id">
        <td class="col-2">
          <input class="form-control" v-if="canvas.updating" v-model="canvas.title" type="text" :placeholder="$t('canvases.title')">
          <p v-else>{{ canvas.title }}</p>
        </td>
        <td class="col-6">
          <div v-if="!canvas.updating">
            <div class="mt-2" >
              <div class="list list-group">
                <div class="list__item list-group-item list-group-item-action" v-for="user of canvas.accessUsers" :key="user.email">
                  <div class="list__email">{{ user.email }}</div>
                  <select
                      class="list__select custom-select"
                      v-model="user.canChange"
                      disabled
                  >
                    <option :value="false">{{ $t('canvases.canView') }}</option>
                    <option :value="true">{{ $t('canvases.canEdit') }}</option>
                  </select>
                </div>
              </div>
            </div>
            <hr v-if="Object.keys(canvas.accessUsers).length">
            <div class="for-guests">
              <div>{{ $t('canvases.accessForGuests') }}</div>
              <select class="mt-2 custom-select" v-model="canvas.access" disabled>
                <option :value="1">{{ $t('canvases.closedForGuests') }}</option>
                <option :value="2">{{ $t('canvases.guestsCanView') }}</option>
                <option :value="3">{{ $t('canvases.guestsCanEdit') }}</option>
              </select>
            </div>
          </div>
          <div v-else>
            <div class="add-email">
              <input
                  v-model="email"
                  :placeholder="$t('canvases.addEmail')"
                  v-bind:class="{'form-control':true, 'is-invalid' : !validEmail(email) && emailBlured}"
                  v-on:blur="emailBlured = true"
                  type="email"
              >
              <button
                  class="add-email__btn btn btn-secondary"
                  @click="addToAccessUsersArray(canvas, email)"
              >
                {{ $t('canvases.add') }}
              </button>
            </div>

            <div class="mt-2" >
              <div class="list list-group" v-if="canvas.updating">
                <div class="list__item list-group-item list-group-item-action" v-for="user of canvas.accessUsers" :key="user.email">
                  <div class="list__email">{{ user.email }}</div>
                  <select
                      class="list__select custom-select"
                      v-model="user.canChange"
                  >
                    <option :value="false">{{ $t('canvases.canView') }}</option>
                    <option :value="true">{{ $t('canvases.canEdit') }}</option>
                  </select>
                  <button
                      class="list__btn btn btn-secondary"
                      @click="deleteAccess(canvas, user.email)"
                  >
                    {{ $t('canvases.delete') }}
                  </button>
                </div>
              </div>
            </div>

            <small v-if="!validEmail(email) && emailBlured" class="error">Введите правильную почту</small>

            <hr>

            <div class="for-guests">
              <div>{{ $t('canvases.accessForGuests') }}</div>
              <select class="mt-2 custom-select" v-model="canvas.access">
                <option :value="1">{{ $t('canvases.closedForGuests') }}</option>
                <option :value="2">{{ $t('canvases.guestsCanView') }}</option>
                <option :value="3">{{ $t('canvases.guestsCanEdit') }}</option>
              </select>
            </div>

          </div>
        </td>
        <td class="col-4" v-if="canvas.updating">
          <button type="button" class="btn btn-outline-secondary" @click="() => fetchUpdateCanvas(canvas._id, i)">{{ $t('canvases.save') }}</button>
          <button type="button" class="btn btn-outline-secondary" @click="cancelChanges(canvas)">{{ $t('canvases.cancel') }}</button>
        </td>
        <td class="table__actions col-4" v-else>
          <button type="button" class="table__action btn btn-outline-secondary" @click="() => $router.push({name: 'Canvas', params: {id: canvas._id}})">{{ $t('canvases.open') }}</button>
          <button
              type="button"
              class="btn btn-outline-secondary table__action"
              @click="toSettings(canvas)"
          >
            {{ $t('canvases.settings') }}
          </button>
          <button
              type="button"
              class="btn btn-outline-secondary table__action"
              @click="() => fetchRemoveCanvas(canvas._id)"
          >
            {{ $t('canvases.delete') }}
          </button>
          <button
              class="icon icon_view_table table__action"
              v-clipboard="() => currentRoute + '/' + canvas._id"
              v-b-tooltip.focus.bottom="$t('canvases.copied')"
          >
            <font-awesome-icon icon="copy"></font-awesome-icon>
          </button>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script>

export default {
  name: 'Canvases',
  data: () => ({
    users: [],
    userExists: undefined,
    canvases: [],
    title: '',
    email: '',
    emailBlured : false,
    valid : false,
    access: 1,
    clipboardStatus: undefined
  }),
  computed: {
    currentUser() {
      return this.$auth.user()
    },
    currentRoute () {
      return window.location.href
    }
  },
  methods: {
    fetchCanvases() {
      this.axios.get('/api/v1/canvases')
        .then((res) => {
          const data = res.data;
          if(data.success) {
            this.canvases = data.data.map((canvas) =>
              ({...canvas, updating: false, accessUsers: canvas.accessUsers ? canvas.accessUsers.reduce((acc, cur) =>
                {acc[cur.email] = cur; return acc}, {}) : {}}));
          }
        });
    },
    fetchCreateCanvas() {
      const canvas = { title: this.title, access: this.access};
      this.axios.post('/api/v1/canvases', canvas)
        .then((res) => {
          const data = res.data;
          if(data.success) {
            const canvas = {...data.canvas, updating: false}
            this.canvases = [...this.canvases, canvas];
            this.title = '';
            this.access = 1;
          }
        });
    },
    fetchUpdateCanvas(id, i) {
      const canvas = {...this.canvases[i]};
      canvas.accessUsers = this.accessUsersArray(canvas);
      this.axios.put(`/api/v1/canvases/${id}`, canvas)
        .then((res) => {
          const data = res.data;
          if(data.success) {
            this.canvases = this.canvases.map((canvas) =>
              canvas._id === id ? ({...canvas, updating: false}) : canvas);
            this.$socket.emit('canvas-reload', id)
          }
        });
    },
    fetchRemoveCanvas(id) {
      this.axios.delete(`/api/v1/canvases/${id}`,)
        .then((res) => {
          const data = res.data;
          if(data.success) {
            this.canvases = this.canvases.filter((canvas) => canvas._id !== id);
            this.$socket.emit('canvas-reload', id)
          }
        });
    },
        toSettings(canvas) {
      canvas.updating = true
    },
    cancelChanges(canvas) {
      canvas.updating = false
      this.fetchCanvases()
      this.email = ''
      this.emailBlured = false
    },
    accessUsersArray(canvas) {
      return Object.values(canvas.accessUsers);
    },
    addToAccessUsersArray(canvas, email) {
      this.validate();
      if(!this.valid) return

      if (this.currentUser.email == email) {
        this.makeToast(false, 'У Вас уже есть доступ к доске')
        this.email = ''
        this.emailBlured = false
        return
      }

      this.users.forEach((user) => {
        if(Object.values(user).includes(email)) {
          this.userExists = true
        }
      })
      if (!this.userExists) this.makeToast(false, 'Пользователя нет в системе, пригласите его и он получит доступ к доске')
      this.userExists = undefined

      canvas.accessUsers[email] = {
        email,
        canChange: false
      }
      canvas.accessUsers = this.accessUsersArray(canvas)
      this.email = ''
      this.valid = false
      this.emailBlured = false
    },
    deleteAccess(canvas, email) {
      canvas.accessUsers = this.accessUsersArray(canvas).filter((i) => i.email !== email)
    },
    onReloaded(data) {
      console.log(data)
    },
    fetchUsers() {
      this.axios.get('/api/v1/users')
        .then((res) => {
          const data = res.data;
          if(data.success) {
            const me = this.$auth.user()._id;
            this.users = data.data.filter(({_id}) => me !== _id);
          }
        });
    },
    makeToast(append = false, message) {
      this.$bvToast.toast(`${message}`, {
        title: 'Уведомление',
        autoHideDelay: 5000,
        appendToast: append
      })
    },
    validEmail(email) {
      const re = /(.+)@(.+){2,}\.(.+){2,}/;
      return re.test(email.toLowerCase());
    },
    validate(){
      this.emailBlured = true;
      if(this.validEmail(this.email)){
        this.valid = true;
      }
    },
  },
  beforeMount() {
    this.fetchCanvases();
    this.fetchUsers();
  },
}
</script>

<style lang="scss" scoped>
  .create {
    display: flex;
    align-items: center;
    margin: 0 auto;
    &__title {
      margin-right: 13px;
    }
    &__input {
      max-width: 50%;
    }
    &__btn {
      margin-left: 10px;
    }
  }
  .add-email {
    display: flex;
    margin-top: 10px;
    &__btn {
      margin-left: 10px;
    }
  }
  .accessUsers {
    margin-top: 10px;
  }
  .list {
    &__item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px;
    }
    &__email {
      flex: 1 0 auto;
      padding-left: 6px;
      min-width: 35%;
    }
    &__select {
      margin: 0 12px;
    }
    &__btn {

    }
  }
  .table {
    &__actions {
      display: flex;
      align-items: center;
    }
    &__action + &__action {
      margin-left: 5px;
    }
  }
  .icon {
    border-radius: 5px;
    border: 1px solid #6c757d;
    &:hover {
      background: #6c757d;
    }
    &:active {
      background: #fff;
    }
    &_view_table {
      padding: 6px 12px;
    }
  }
  .error {
    color: #d9534f;
  }
</style>