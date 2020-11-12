<template>
  <div class="chat">
    <div class="opponent">
      
    </div>
    <div class="warp">
      <div v-if="secondUser" class="user">
        {{secondUser.email}}
        {{secondUser.status ? 'online' : 'offline'}}
      </div>
      <div class="messages">
        <div class="loaded" v-if="isMessagesLoaded">
          <p v-if="!messages.length" class="empty">
            Тут пусто
          </p>
          <div
            v-for="message in messages"
            :key="message._id"
            class="message"
            :class="{ 
              my: message.owner === $auth.user()._id,
              notRead: message.notRead
            }">
            <p>{{ message.text }}</p>
          </div>
        </div>
      </div>
      <div class="send">
        <input v-model="message" type="text">
        <button @click="sendMessage">Отправить</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data: () => ({
    chatId: null,
    secondUser: null,

    message: '',
    messages: [],
    isMessagesLoaded: false,
  }),
  methods: {
    sendMessage() {
      this.messages = [...this.messages, {
        text: this.message,
        owner: this.$auth.user()._id
      }];
      this.$socket.emit('chat-send-message', this.message)
      this.message = '';
    },

    subscribeListeners() {
      this.sockets.subscribe('chat-sended-message', this.onChatSendedMessage);
    },

    unsubscribeListeners() {
      this.sockets.unsubscribe('chat-sended-message');
    },

    initEmit() {
      // console.log('emit')
      // console.log(this.chatId)
      // this.$socket.emit('chat-sing-in', this.chatId);
    },

    onChatSendedMessage(data) {
      this.messages = [...this.messages, { text: data }];
    },
  },

  beforeRouteLeave(to, from, next) {
    // this.$socket.emit('chat-sing-out');
    this.unsubscribeListeners();
    next();
  },

  mounted() {
    this.chatId = this.$route.params.id;

    this.axios.get(`/api/v1/chats/${this.chatId}/messages`)
      .then((res) => {
        const data = res.data;
        if(data.success) {
          this.messages = data.data;
          this.isMessagesLoaded = true;
          this.subscribeListeners();
          this.initEmit();
        }
      });
  }
}
</script>