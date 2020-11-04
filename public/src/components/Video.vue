<template>
  <div class="test">
    <div id="users">
      <div class="user" v-for="user in users" :key="user._id">
        <p>{{ getRole(user) }}</p>
        <h3>{{ getName(user) }}</h3>
        <p>{{ user.email }}</p>
        <button @click="() => callUser(user.socketId)">Позвонить</button>
      </div>
      </div>
    <video id='localVideo' autoplay playsinline></video>
    <video id='remoteVideo' autoplay playsinline></video>
    <button @click="init" :disabled='disabled'>Включить камеру</button>
  </div>
</template>

<script>
import { changeEmailLogin, changePasswordLogin } from '../store/login/mutation-actions';
import { LOGIN } from '../store/login/action-types';

const { RTCPeerConnection, RTCSessionDescription } = window;

export default {
  data: () => ({
    disabled: false,
    localVideo: null,
    remoteVideo: null,
    stream: null,
    socket: null,
    users: [],
    isAlreadyCalling: false,
    getCalled: false,
    existingCalls: [],
    peerConnection: false,
    constraints: {
      audio: false,
      video: true
    }
  }),

  methods: {
    getRole(user) {
      return user.role === 'student' ? 'ученик' : 'учитель';
    },

    getName(user) {
      return `${user.lastname} ${user.firstname}`;
    },

    init() {
      navigator.mediaDevices.getUserMedia(this.constraints).then((stream) => {
        this.localVideo.srcObject = stream;
        stream.getTracks().forEach(track => this.peerConnection.addTrack(track, stream));
        this.disabled = true;
      });
    },

    initListeners() {
      this.onUpdateUserList();
      this.onAddUser();
      this.onRemoveUser();
      this.onCallMade();
      this.onAnswerMade();
      this.onCallRejected();
    },

    onUpdateUserList() {
      this.socket.on("update-user-list", ({ users }) => {console.log(users)
        this.users = users;
      });
    },

    onAddUser() {
      this.socket.on("add-user", ({user}) => {console.log(user)
        this.users = [...this.users, user];
      });
    },

    onRemoveUser() {
      this.socket.on("remove-user", ({ userId }) => {
        this.users = this.users.filter((user) => user._id !== userId);
      });
    },

    onCallMade() {
      this.socket.on("call-made", (data) => {
        console.log('call-made, from:', data.user.socketId)
        if (this.getCalled) {
          const confirmed = confirm(
            `User "Socket: ${this.getName(data.user)}" wants to call you. Do accept this call?`
          );

          if (!confirmed) {
            this.socket.emit("reject-call", {
              from: data.user.socketId
            });

            return;
          }
        }
        
        this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
        .then(() => this.peerConnection.createAnswer()
          .then((answer) => this.peerConnection.setLocalDescription(new RTCSessionDescription(answer))
            .then(() => {
                console.log('make-answer, to:', data.user.socketId)
                this.socket.emit("make-answer", {
                  answer,
                  to: data.user.socketId
                });
                this.getCalled = true;
              })
          )
        );
      });
    },

    onAnswerMade() {
      this.socket.on("answer-made", (data) => {
        this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer)).then(() => {
          if (!this.isAlreadyCalling) {
            console.log('answer-made, to:', data.user.socketId)
            this.callUser(data.user.socketId);
            this.isAlreadyCalling = true;
          }
        });
      });
    },

    onCallRejected() {
      this.socket.on("call-rejected", ({user}) => {
        alert(`User: "Socket: ${this.getName(user)}" rejected your call.`);
      });
    },

    callUser(socketId) {
      console.log('call-user, to:', socketId)
      this.peerConnection.createOffer()
      .then((offer) => 
        this.peerConnection.setLocalDescription(new RTCSessionDescription(offer))
        .then(() => this.socket.emit("call-user", {
          offer,
          to: socketId
        }))
      );
    }

  },
  mounted() {
    this.localVideo = document.querySelector('#localVideo');
    this.remoteVideo = document.querySelector('#remoteVideo');

    this.peerConnection = new RTCPeerConnection();
    this.peerConnection.ontrack = ({ streams: [stream] }) => {
      this.remoteVideo.srcObject = stream;
    };

    this.socket = io.connect(window.location.origin);
    this.initListeners();
  }
}
</script>
