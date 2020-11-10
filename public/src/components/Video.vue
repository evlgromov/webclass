<template>
  <div class="test">
    <div v-if="users.length" id="users">
      <div class="user" v-for="user in users" :key="user._id" style="">
        <p>{{ user.email }}<button @click="() => callUser(user._id)">Позвонить</button></p>
      </div>
    </div>
    <div id="inputs">
      <select v-model="videoinput" id="videoinput" @change="changeInput">
        <option v-for="videoinput in allVideoinputs" :value="videoinput.deviceId" :key="videoinput.deviceId">
          {{videoinput.label}}
        </option>
      </select>
      <select v-model="audioinput" id="audioinput" @change="changeInput">
        <option v-for="audioinput in allAudioinputs" :value="audioinput.deviceId" :key="audioinput.deviceId">
          {{audioinput.label}}
        </option>
      </select>
      <select v-model="audiooutput" id="audiooutput" @change="changeInput">
        <option v-for="audiooutput in allAudiooutputs" :value="audiooutput.deviceId" :key="audiooutput.deviceId">
          {{audiooutput.label}}
        </option>
      </select>
    </div>
    <video id='localVideo' autoplay playsinline controls="false"></video>
    <div v-if="users.length" class="remoteVideos">
      <div v-for="user in users" :key="user._id">
        <video :id="user._id" autoplay playsinline controls="false"></video>
      </div>
    </div>
  </div>
</template>

<script>
const { RTCPeerConnection, RTCSessionDescription } = window;

export default {
  data: () => ({
    allVideoinputs: [],
    allAudioinputs: [],
    allAudiooutputs: [],

    videoinput: '',
    audioinput: '',
    audiooutput: '',

    localVideo: null,
    stream: null,
    users: [],
    isAlreadyCalling: false,
    getCalled: false,
    existingCalls: [],
    peerConnection: false,
  }),

  computed: {    
    constraints() {
      const res = {};

      if(this.videoinput) {
        res.video = { deviceId: { exact: this.videoinput }};
      } else {
        res.video = false;
      }

      if(this.audioinput) {
        res.audio = { deviceId: { exact: this.audioinput }};
      } else {
        res.audio = false;
      }

      return res
    }
  }, 

  methods: {
    getRole(user) {
      return user.role === 'student' ? 'ученик' : 'учитель';
    },

    getName(user) {
      return `${user.lastname} ${user.firstname}`;
    },

    changeInput() {
      navigator.mediaDevices.getUserMedia(this.constraints).then((stream) => {
        this.localVideo.srcObject = stream;
        stream.getTracks().forEach(track => this.users.forEach((user) => user.peerConnection.addTrack(track, stream)));
      });
    },

    initListeners() {
      this.$socket.emit('authenticate', { token: this.$auth.token() });
      this.onUserAlreadyExist();
      this.onAddIcecandidate();
      this.onUpdateUserList();
      this.onAddUser();
      this.onRemoveUser();
      this.onCallMade();
      this.onAnswerMade();
      this.onCallRejected();
    },

    onUserAlreadyExist() {
      this.sockets.subscribe("user-already-exist", () => {
        alert('Вы уже вошли в видеочат')
      });
    },

    onAddIcecandidate() {
      this.sockets.subscribe("add-icecandidate", (data) => {
        const user = this.users.find((user) => user._id === data.user._id);
        user.peerConnection.addIceCandidate(new RTCIceCandidate(data.icecandidate)).catch(() => {});
      });
    },

    initUser(user) {
      user.peerConnection = new RTCPeerConnection({'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]});
      user.peerConnection.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
          this.$socket.emit('new-icecandidate', {
            icecandidate: event.candidate,
            to: user._id
          });
        }
      });
      user.peerConnection.ontrack = ({ streams: [stream] }) => {
        document.getElementById(user._id).srcObject = stream;
      };
      user.peerConnection.addEventListener('connectionstatechange', event => {
        if (user.peerConnection.connectionState === 'connected') {
            console.log('Peers connected!' + ' user:' + user._id)
        }
      });
      return user;
    },

    onUpdateUserList() {
      this.sockets.subscribe('update-user-list', ({ users }) => {
        this.users = users.map(this.initUser);
      });
    },

    onAddUser() {
      this.sockets.subscribe("add-user", ({user}) => {
        this.users = [...this.users, this.initUser(user)];
      });
    },

    onRemoveUser() {
      this.sockets.subscribe("remove-user", ({ userId }) => {
        this.users = this.users.filter((user) => user._id !== userId);
      });
    },

    onCallMade() {
      this.sockets.subscribe("call-made", (data) => {
        const user = this.users.find((user) => user._id === data.user._id);

        if (this.getCalled) {
          const confirmed = confirm(
            `User "Socket: ${this.getName(user)}" wants to call you. Do accept this call?`
          );

          if (!confirmed) {
            this.$socket.emit("reject-call", {
              from: user.socketId
            });

            return;
          }
        }
        
        user.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
        .then(() => user.peerConnection.createAnswer()
          .then((answer) => user.peerConnection.setLocalDescription(new RTCSessionDescription(answer))
            .then(() => {
                this.$socket.emit("make-answer", {
                  answer,
                  to: user.socketId
                });
                this.getCalled = true;
              })
          )
        );
      });
    },

    onAnswerMade() {
      this.sockets.subscribe("answer-made", (data) => {
        const user = this.users.find((user) => user._id === data.user._id);

        user.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer)).then(() => {
          if (!this.isAlreadyCalling) {
            this.callUser(user._id);
            this.isAlreadyCalling = true;
          }
        });
      });
    },

    onCallRejected() {
      this.sockets.subscribe("call-rejected", ({user}) => {
        alert(`User: "Socket: ${this.getName(user)}" rejected your call.`);
      });
    },

    callUser(userId) {
      const user = this.users.find((user) => user._id === userId);
      user.peerConnection.createOffer()
      .then((offer) => 
        user.peerConnection.setLocalDescription(new RTCSessionDescription(offer))
        .then(() => this.$socket.emit("call-user", {
          offer,
          to: user.socketId
        }))
      );
    }

  },
  mounted() {
    this.localVideo = document.querySelector('#localVideo');
  
    navigator.mediaDevices.enumerateDevices().then((deviceInfos) => {
      deviceInfos.forEach((deviceInfo) => {
        if(deviceInfo.kind === 'videoinput') {
          this.allVideoinputs = [...this.allVideoinputs, deviceInfo];
        } else if(deviceInfo.kind === 'audioinput') {
          this.allAudioinputs = [...this.allAudioinputs, deviceInfo];
        } else {
          this.allAudiooutputs = [...this.allAudiooutputs, deviceInfo];
        }
      });

      this.allVideoinputs = [{deviceId: false, label: 'Выключить'}, ...this.allVideoinputs];
      this.allAudioinputs = [{deviceId: false, label: 'Выключить'}, ...this.allAudioinputs];
      this.allAudiooutputs = [{deviceId: false, label: 'Выключить'}, ...this.allAudiooutputs];
      
      this.videoinput = this.allVideoinputs[0].deviceId;
      this.audioinput = this.allAudioinputs[0].deviceId;
      this.audiooutput = this.allAudiooutputs[0].deviceId;

      this.initListeners();
    })
  }
}
</script>