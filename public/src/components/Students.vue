<template>
  <div class="warp">
    <div class="find">
      <input v-model="email" type="text" placeholder="Электронная почта">
      <button @click="search">Поиск</button>
    </div>
    <div class="students">
      <table>
        <tr>
          <td>ФИО ученика</td>
          <td>Электронная почта</td>
          <td>Действия</td>
        </tr>
        <tr v-for="student in students" :key="student._id">
          <td>{{ getFullname(student) }}</td>
          <td>{{ student.email }}</td>
          <td>
            <button @click="() => callStudent(student._id)">Позвонить</button>
            <button>Написать</button>
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  data: () => ({
    email: '',
    students: []
  }),
  methods: {
    search() {
      this.fetchUser(this.email ? {email: this.email} : null, (data) => {
        this.students = data;
      });
    },

    getFullname({firstname, lastname}) {
      return `${firstname} ${lastname}`;
    },

    fetchUser(query, cb) {
      let url = '/api/v1/students';
      if(query) {
        url += '?';
        for(let key in query) {
          url += `${key}=${query[key]}`;
        }
      }
      this.axios.get(url)
        .then((res) => {
          const data = res.data;
          if(data.success) {
            cb(data.data)
          }
        });
    },

    callStudent(studentId) {
      this.$socket.emit('invite-call-user', studentId);
    }
  },
  beforeMount() {
    this.fetchUser(null, (data) => this.students = data);
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