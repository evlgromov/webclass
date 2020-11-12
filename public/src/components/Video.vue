<template>
  <div class="test">
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
    <div class="videos">
      <video id='localVideo' autoplay playsinline controls="false"></video>
      <video id='remoteVideo' autoplay playsinline controls="false"></video>
    </div>
    <div class="chats">
      <button v-if="$auth.check('teacher')" @click="endVideoCall">Завершить видео урок</button>
    </div>
  </div>
</template>

<script>
const { RTCPeerConnection, RTCSessionDescription } = window;

export default {
  data: () => ({
    videocallId: null,

    allVideoinputs: [],
    allAudioinputs: [],
    allAudiooutputs: [],

    videoinput: '',
    audioinput: '',
    audiooutput: '',

    localVideo: null,
    remoteVideo: null,

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

    changeInput() {
      navigator.mediaDevices.getUserMedia(this.constraints).then((stream) => {
        this.localVideo.srcObject = stream;
        stream.getTracks().forEach(track => this.peerConnection.addTrack(track, stream));
        this.callUser();
      });
    },

    endVideoCall() {
      this.$socket.emit("end-video-call");
      this.$router.push('/');
    },

    initEmit() {
      this.$socket.emit("videocall-sing-in", this.videocallId);
    },

    subscribeListeners() {
      this.sockets.subscribe("videocall-add-icecandidate", this.onVideocallAddIcecandidate);
      this.sockets.subscribe("ended-videocall", this.onEndedVideocall);
      this.sockets.subscribe("videocall-remove-user", this.onVideocallRemoveUser);
      this.sockets.subscribe("videocall-add-user", this.onVideocallAddUser);
      this.sockets.subscribe("videocall-call-made", this.onVideocallMade);
      this.sockets.subscribe("videocall-answer-made", this.onVideocallAnswerMade);
    },

    unsubscribeListeners() {
      this.sockets.unsubscribe("videocall-add-icecandidate");
      this.sockets.unsubscribe("ended-videocall");
      this.sockets.unsubscribe("video-remove-user");
      this.sockets.unsubscribe("videocall-add-user");
      this.sockets.unsubscribe("call-made");
      this.sockets.unsubscribe("videocall-answer-made");
    },

    onVideocallAddIcecandidate(icecandidate) {
      this.peerConnection.addIceCandidate(new RTCIceCandidate(icecandidate)).catch(() => {});
    },

    onEndedVideocall() {
      console.log('Видео встреча завершена');
      this.$socket.emit('close-videocall');
      this.$router.push('/');
    },

    onVideocallAddUser() {
      console.log('video-add-user')
      this.initPeerConnection();
      this.changeInput();
    },

    onVideocallRemoveUser() {
      console.log('Пользователь вышел')
    },

    onVideocallMade(offer) {
      console.log('call-made')
      this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
      .then(() => this.peerConnection.createAnswer()
        .then((answer) => this.peerConnection.setLocalDescription(new RTCSessionDescription(answer))
          .then(() => {
            this.$socket.emit("videocall-make-answer", {
              answer,
              videocallId: this.videocallId
            });
          })  
        )
      );
    },

    onVideocallAnswerMade(answer) {
      console.log('answer made')
      this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
    },

    callUser() {
      console.log('call')
      this.peerConnection.createOffer()
      .then((offer) => 
        this.peerConnection.setLocalDescription(new RTCSessionDescription(offer))
        .then(() => this.$socket.emit("videocall-call-user", {
          offer,
          videocallId: this.videocallId
        }))
      );
    },

    initPeerConnection() {
      this.peerConnection = new RTCPeerConnection({'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]});
      this.peerConnection.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
          this.$socket.emit('videocall-new-icecandidate', {
            icecandidate: event.candidate,
            videocallId: this.videocallId
          });
        }
      });
      this.peerConnection.ontrack = ({ streams: [stream] }) => {
        this.remoteVideo.srcObject = stream;
      };
      this.peerConnection.addEventListener('connectionstatechange', event => {
        if (this.peerConnection.connectionState === 'connected') {
          console.log('Peers connected!')
        }
      });
    }

  },

  beforeRouteLeave(to, from, next) {
    this.$socket.emit('videocall-sing-out');
    this.unsubscribeListeners();
    next();
  },

  mounted() {
    this.localVideo = document.querySelector('#localVideo');
    this.remoteVideo = document.querySelector('#remoteVideo');

    this.videocallId = this.$route.params.id;
  
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


      this.initPeerConnection();
      this.subscribeListeners();

      this.initEmit();
    })
  }
}
</script>