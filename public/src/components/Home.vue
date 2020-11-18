<template>
  <div class="container text-center">
    <div v-if="invite" class="invite card p-3">
      <h1>{{$t('home.title')}}</h1>
      <p>{{getFullname(invite)}} {{$t('home.info')}}</p>
      <div class="actions">
        <button type="button" class="btn btn-outline-success" @click="acceptInvite">{{$t('home.acceptBtn')}}</button>
        <button type="button" class="btn btn-outline-danger" @click="refuseInvite">{{$t('home.denyBtn')}}</button>
      </div>
    </div>
    <div class="lesson">
      <div class="lesson" v-for="lesson in lessons" @click="() => returnToLesson(lesson)" :key="lesson._id" :class="{ ended: !lesson.end }">
        {{getFullname(lesson[reverseRole])}}
      </div>
    </div>
    <div class="chats">

    </div>
  </div>
</template>

<script>
export default {
  data: () => ({
    invite: false,
    lessons: []
  }),
  computed: {
    role() {
      return this.$auth.user().role;
    },
    reverseRole() {
      return this.role === 'student' ? 'teacher' : 'student';
    }
  },
  methods: {
    initListeners() {
      this.sockets.subscribe('invited-call-user', this.onInvitedCallUser);
      this.sockets.subscribe('return-accept-invited-call-user', this.onReturnAcceptInvite);
    },

    getFullname(user) {
      return `${user.firstname} ${user.lastname}`;
    },

    returnToLesson(lesson) {
      if(!lesson.end) {
        this.$router.push(`/video/${lesson._id}`)
        console.log('push')
      }
    },

    onInvitedCallUser({user}) {
      console.log('invited-call-user')
      this.invite = user
    },

    acceptInvite() {
      this.$socket.emit('accept-invite-call-user', this.invite.socketId);
      this.invite = false;
    },

    onReturnAcceptInvite({teacher, lessonId}) {
      this.$router.push(`/video/${lessonId}`)
    },

    refuseInvite() {
      this.$socket.emit('refuse-invite-call-user', this.invite.socketId);
      this.invite = false;
    },
  },

  beforeMount() {
    this.axios.get('/api/v1/lessons')
      .then((res) => {
        const data = res.data;
        if(data.success) {
          this.lessons = data.data
        }
      });
    this.initListeners();
  }
}
</script>

<style lang="scss" scoped>
.card{
  margin: auto;
  height: 100%;
}
.ended {
  border: red 1px solid;
}
</style>