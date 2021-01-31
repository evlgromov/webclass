<template>
  <div class="home">
<!--    <div v-if="invite" class="invite">-->
<!--      <h2>Видео урок</h2>-->
<!--      <p>{{getFullname(invite)}} приглашает вас на видео урок</p>-->
<!--      <div class="actions">-->
<!--        <button @click="acceptInvite">Принять</button>-->
<!--        <button @click="refuseInvite">Отказать</button>-->
<!--      </div>-->
<!--    </div>-->
    <div class="lesson">
      <div class="lesson" v-for="lesson in lessons" @click="() => returnToLesson(lesson)" :key="lesson._id" :class="{ ended: !lesson.end }">
        {{getFullname(this.$auth.user())}}
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
  }
}
</script>

<style lang="scss" scoped>
.ended {
  border: red 1px solid;
}
</style>