<template>
  <div class="home">
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
      this.sockets.subscribe('invited-call-user', this.onInvitedCallUser);
    },

    onInvitedCallUser({user}) {
      console.log(user)
    }
  },

  beforeMount() {
    this.initListeners();
  }
}
</script>