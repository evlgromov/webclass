<template>
  <div class="home">
    <div v-if="invite" class="invite">
      <h2>Видео урок</h2>
      <p>Вас приглашают на видео урок</p>
      <div class="actions">
        <button @click="acceptInvite">Перейти</button>
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
      this.sockets.subscribe('invited-videocall-user', this.onInvitedVideocallUser);
      this.sockets.subscribe('return-accept-invited-videocall', this.onReturnAcceptInvitedVideocall);
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

    onInvitedVideocallUser(videocallId) {
      this.invite = videocallId;
    },

    acceptInvite() {
      this.$socket.emit('accept-invite-videocall', this.invite);
      this.invite = false;
    },

    onReturnAcceptInvitedVideocall(videocallId) {
      this.$router.push(`/video/${videocallId}`)
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
.ended {
  border: red 1px solid;
}
</style>