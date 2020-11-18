<template>
  <div class="warp">
    <div class="text-center">
      <div class="form-inline mt-3">
        <div class="input-group col-md-4">
          <input v-model="email" class="form-control py-2 border-right-0 border" :placeholder="$t('auth.email')"
                 type="text">
          <span class="input-group-append">
            <button class="btn btn_search btn-outline-secondary border-left-0 border" type="button" @click="search">
              <i class="fa fa-search"></i>
            </button>
          </span>
        </div>
      </div>
    </div>
    <div class="students p-3">
      <table class="table table-hover">
        <tr>
          <td>{{ $t('students.fio') }}</td>
          <td>{{$t('auth.email')}}</td>
          <td>{{ $t('students.actions') }}</td>
        </tr>
        <tr v-for="student in students" :key="student._id">
          <td>{{ getFullname(student) }}</td>
          <td>{{ student.email }}</td>
          <td>
            <button @click="() => callStudent(student._id)">{{ $t('students.сall') }}</button>
            <button>{{ $t('students.write') }}</button>
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

    initListeners() {
      this.sockets.subscribe('invited-call-user-offline', this.onInvitedCallUserOffline)
      this.sockets.subscribe('accept-invited-call-user', this.onAcceptInvitedCallUser)
      this.sockets.subscribe('refuse-invited-call-user', this.onRefuseInvitedCallUser)
    },

    onInvitedCallUserOffline({studentId}) {
      alert(`${this.students.find(({_id}) => _id === studentId).email} offline`)
    },

    onAcceptInvitedCallUser({student, lessonId}) {
      console.log('accept-invited-call-user')
      this.$router.push(`/video/${lessonId}`)
    },

    onRefuseInvitedCallUser({student}) {
      alert(`${student.email}} отклонил ваше предложение`)
    },

    getFullname({firstname, lastname}) {
      return `${firstname} ${lastname}`;
    },

    fetchUser(query, cb) {
      let url = '/api/v1/students';
      if (query) {
        url += '?';
        for (let key in query) {
          url += `${key}=${query[key]}`;
        }
      }
      this.axios.get(url)
          .then((res) => {
            const data = res.data;
            if (data.success) {
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
    this.initListeners();
  }
}
</script>

<style lang="scss" scoped>
.btn_search{
  border-radius: 0px!important;
}
/* hide the blue outline */
.form-control:focus {
  outline: 0 !important;
  border-color: initial;
  box-shadow: none;
}


</style>