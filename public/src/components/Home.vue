<template>
  <div class="home">
    <div v-if="invite" class="invite">
      <h2>Видео урок</h2>
      <p>{{getFullname(invite)}} приглашает вас на видео урок</p>
      <div class="actions">
        <button @click="acceptInvite">Принять</button>
        <button @click="refuseInvite">Отказать</button>
      </div>
    </div>
    <div class="lesson">

    </div>
    <div class="chats">

    </div>
  </div>
</template>

<script>
export default {
  data: () => ({
    invite: false
  }),
  methods: {
    initListeners() {
      console.log('subscribe')
      this.sockets.subscribe('invited-call-user', this.onInvitedCallUser);
      this.sockets.subscribe('return-accept-invited-call-user', this.onReturnAcceptInvite);
    },

    getFullname(user) {
      return `${user.firstname} ${user.lastname}`;
    },

    onInvitedCallUser({user}) {
      this.invite = user
    },

    acceptInvite() {
      this.$socket.emit('accept-invite-call-user', this.invite.socketId);
      this.invite = false;
    },

    onReturnAcceptInvite({teacher, lessonId}) {
      console.log('return-accept-invited-call-user')
      this.$router.push(`/video/${lessonId}`)
    },

    refuseInvite() {
      this.$socket.emit('refuse-invite-call-user', this.invite.socketId);
      this.invite = false;
    },
  },

  beforeMount() {
    this.initListeners();
  }
}
</script>