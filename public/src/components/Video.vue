<template>
  <div class="video-container mt-3">
    <div class="card-search card ml-3 mr-3">
      <div class="card-search_container d-flex justify-content-around w-100">
        <div class="p-2 card-search_selectGroup">
          <select id="videoinput" v-model="videoinput" class="form-control" @change="changeInput">
            <option v-for="videoinput in allVideoinputs" :key="videoinput.deviceId" :value="videoinput.deviceId">
              {{ videoinput.label }}
            </option>
          </select>
        </div>
        <div class="p-2 card-search_selectGroup">
          <select id="audioinput" v-model="audioinput" class="form-control" @change="changeInput">
            <option v-for="audioinput in allAudioinputs" :key="audioinput.deviceId" :value="audioinput.deviceId">
              {{ audioinput.label }}
            </option>
          </select>
        </div>
        <div class="p-2 card-search_selectGroup">
          <select id="audiooutput" v-model="audiooutput" class="form-control" @change="changeInput">
            <option v-for="audiooutput in allAudiooutputs" :key="audiooutput.deviceId" :value="audiooutput.deviceId">
              {{ audiooutput.label }}
            </option>
          </select>
        </div>
      </div>
    </div>
    <div class="card-video d-flex">
      <div class="card-video_item card">
        <video id='localVideo' autoplay controls="false" playsinline></video>
      </div>
      <div class="card-video_item card">
        <video id='remoteVideo' autoplay controls="false" playsinline></video>
      </div>
    </div>
    <div class="chats text-center m-3">
      <button class="btn btn-outline-danger w-50" type="button">{{ $t('video.exit') }}</button>
      <button v-if="$auth.check('teacher')" @click="endVideoCall">Завершить видео урок</button>
    </div>
  </div>
</template>

<script>
const {RTCPeerConnection, RTCSessionDescription} = window;

export default {
  data: () => ({
    channelId: null,

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

      if (this.videoinput) {
        res.video = {deviceId: {exact: this.videoinput}};
      } else {
        res.video = false;
      }

      if (this.audioinput) {
        res.audio = {deviceId: {exact: this.audioinput}};
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
      this.$socket.emit("video-sing-in", this.channelId);
    },

    subscribeListeners() {
      this.sockets.subscribe("add-icecandidate", this.onAddIcecandidate);
      this.sockets.subscribe("ended-video-call", this.onEndedVideoCall);
      this.sockets.subscribe("video-remove-user", this.onVideoRemoveUser);
      this.sockets.subscribe("video-add-user", this.onVideoAddUser);
      this.sockets.subscribe("call-made", this.onCallMade);
      this.sockets.subscribe("answer-made", this.onAnswerMade);
    },

    unsubscribeListeners() {
      this.sockets.unsubscribe("add-icecandidate");
      this.sockets.unsubscribe("ended-video-call");
      this.sockets.unsubscribe("video-remove-user");
      this.sockets.unsubscribe("video-add-user");
      this.sockets.unsubscribe("call-made");
      this.sockets.unsubscribe("answer-made");
    },

    onAddIcecandidate({icecandidate}) {
      this.peerConnection.addIceCandidate(new RTCIceCandidate(icecandidate)).catch(() => {
      });
    },

    onEndedVideoCall() {
      console.log('Видео встреча завершена');
      this.$socket.emit('close-video-call');
      this.$router.push('/');
    },

    onVideoAddUser() {
      console.log('video-add-user')
      this.initPeerConnection();
      this.changeInput();
    },

    onVideoRemoveUser() {
      console.log('Пользователь вышел')
    },

    onCallMade({offer, channelId}) {
      console.log('call-made')
      this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
          .then(() => this.peerConnection.createAnswer()
              .then((answer) => this.peerConnection.setLocalDescription(new RTCSessionDescription(answer))
                  .then(() => {
                    this.$socket.emit("make-answer", {
                      answer,
                      channelId
                    });
                  })
              )
          );
    },

    onAnswerMade({answer}) {
      console.log('answer made')
      this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
    },

    callUser() {
      console.log('call')
      this.peerConnection.createOffer()
          .then((offer) =>
              this.peerConnection.setLocalDescription(new RTCSessionDescription(offer))
                  .then(() => this.$socket.emit("call-user", {
                    offer,
                    channelId: this.channelId
                  }))
          );
    },

    initPeerConnection() {
      this.peerConnection = new RTCPeerConnection({'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]});
      this.peerConnection.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
          this.$socket.emit('new-icecandidate', {
            icecandidate: event.candidate,
          });
        }
      });
      this.peerConnection.ontrack = ({streams: [stream]}) => {
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
    this.$socket.emit('video-sing-out');
    this.unsubscribeListeners();
    next();
  },

  mounted() {
    this.localVideo = document.querySelector('#localVideo');
    this.remoteVideo = document.querySelector('#remoteVideo');

    this.channelId = this.$route.params.id;

    navigator.mediaDevices.enumerateDevices().then((deviceInfos) => {
      deviceInfos.forEach((deviceInfo) => {
        if (deviceInfo.kind === 'videoinput') {
          this.allVideoinputs = [...this.allVideoinputs, deviceInfo];
        } else if (deviceInfo.kind === 'audioinput') {
          this.allAudioinputs = [...this.allAudioinputs, deviceInfo];
        } else {
          this.allAudiooutputs = [...this.allAudiooutputs, deviceInfo];
        }
      });

      this.allVideoinputs = [{deviceId: false, label: this.$t('video.videoInputs')}, ...this.allVideoinputs];
      this.allAudioinputs = [{deviceId: false, label: this.$t('video.videoInputs')}, ...this.allAudioinputs];
      this.allAudiooutputs = [{deviceId: false, label: this.$t('video.videoInputs')}, ...this.allAudiooutputs];

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
<style lang="scss" scoped>
.card-search_selectGroup {
  width: 30%;
}

.card-video {
  &_item {
    padding: 0.7em;
    margin: 1em;

    video {
      height: 450px;
      min-height: 250px;
    }
  }
}

.w-30 {
  width: 30% !important;
}

@media only screen and (max-width: 768px) {
  .card-video {
    flex-direction: column;

    &_item {
      margin: 1em 0.5em 0.5em;
    }

    video {
      height: 450px;
      min-height: 250px;
    }
  }
}

@media screen and (max-width: 430px) {
  .card-search {
    &_selectGroup {
      width: 100%;
    }

    &_container {
      flex-direction: column;
    }
  }

  .card-video {
    video {
      height: 300px;
      min-height: 250px;
    }
  }

}
</style>