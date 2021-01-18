<template>
  <div class="warp">
    <div class="create">
      <input v-model="title" type="text" placeholder="Название">
      <select v-model="access">
          <option value="1">закрытая для всех</option>
          <option value="2">открытая по приглашению</option>
          <option value="3">открытая для всех</option>
      </select>
      <button @click="fetchCreateCanvas">Создать</button>
    </div>
    <div class="canvases">
      <table>
        <tr>
          <td>Название</td>
          <td>Доступ</td>
          <td>Действия</td>
        </tr>
        <tr v-for="(canvas, i) in canvases" :key="canvas._id">
          <td>
            <input v-if="canvas.updating" v-model="canvas.title" type="text" placeholder="Название">
            <p v-else>{{ canvas.title }}</p>
          </td>
          <td>
            <select v-if="canvas.updating" v-model="canvas.access">
              <option value="1">закрытая для всех</option>
              <option value="2">открытая по приглашению</option>
              <option value="3">открытая для всех</option>
            </select>
            <p v-else>{{ getAccessDescription(canvas.access) }}</p>
            <div class="accessUsers" v-if="canvas.access == 2 && users.length">
              <div class="users" v-if="canvas.updating">
                <div class="user" v-for="user of users" :key="user._id">
                  <label>
                    <input 
                      type="checkbox" 
                      :checked="canvas.accessUsers[user._id]" 
                      @change="() => onCheck(i, user._id)">{{ user.email }}
                  </label>
                  <div class="access" v-if="canvas.accessUsers[user._id]">
                    <select v-model="canvas.accessUsers[user._id].canChange">
                      <option :value="false">Не может изменять</option>
                      <option :value="true">Может изменять</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="users" v-else>
                <div class="user" v-for="user of accessUsersArray(i)" :key="user._id">
                  <p>{{ usersObject[user._id].email }}</p>
                  <p>{{ user.canChange ? 'Может изменять' : 'Не может изменять' }}</p>
                </div>
              </div>
            </div>
          </td>
          <td v-if="canvas.updating">
            <button @click="() => fetchUpdateCanvas(canvas._id, i)">Сохранить</button>
            <button @click="() => canvas.updating = false">Отменить</button>
          </td>
          <td v-else>
            <button @click="() => $router.push({name: 'Canvas', params: {id: canvas._id}})">Перейти</button>
            <button @click="() => canvas.updating = true">Редактировать</button>
            <button @click="() => fetchRemoveCanvas(canvas._id)">Удалить</button>
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  data: () => ({
    users: [],
    canvases: [],
    title: '',
    access: 1,
  }),
  computed: {
    usersObject() {
      return this.users.reduce((acc,cur) => {acc[cur._id]=cur;return acc},{});
    }
  },
  methods: {
    accessUsersArray(canvasId) {
      return Object.values(this.canvases[canvasId].accessUsers);
    },
    onCheck(i, id) {
      const canvases = [...this.canvases];
      if (!canvases[i].accessUsers[id]) {
        canvases[i].accessUsers[id] = {
          _id: id,
          canChange: false,
        };
      } else {
        delete canvases[i].accessUsers[id];
      }
      this.canvases = canvases;
    },
    getAccessDescription(access) {
        switch(parseInt(access)) {
            case 1:
                return 'закрытая для всех';
            case 2:
                return 'открытая по приглашению';
            case 3:
                return 'открытая для всех';
        }
    },
    fetchCreateCanvas() {
        const canvas = { title: this.title, access: this.access, updating: false };
        this.axios.post('/api/v1/canvases', canvas)
            .then((res) => {
                const data = res.data;
                if(data.success) {
                    this.canvases = [...this.canvases, data.canvas];
                    this.title = '';
                    this.access = 1;
                }
            });
    },
    fetchUpdateCanvas(id, i) {
        const canvas = {...this.canvases[i]};
        canvas.accessUsers = this.accessUsersArray(i);
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
    fetchCanvases() {
      this.axios.get('/api/v1/canvases')
        .then((res) => {
            const data = res.data;
            if(data.success) {
              this.canvases = data.data.map((canvas) => 
                ({...canvas, updating: false, accessUsers: canvas.accessUsers ? canvas.accessUsers.reduce((acc, cur) => 
                  {acc[cur._id] = cur; return acc}, {}) : {}}));
            }
        });
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
  },
  beforeMount() {
    this.fetchCanvases();
    this.fetchUsers();
  }
}
</script>

<style lang="scss" scoped>
table, tr, td {
  border: 1px solid black;
}

table {
  width: 100%;
  border-collapse: collapse;
  td {

  }
}
</style>