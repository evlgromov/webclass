<template>
  <div class="test">
    <div id="inputs">
      <select v-model="videoinput" id="videoinput" @change="onVideocallCallUser">
        <option v-for="videoinput in allVideoinputs" :value="videoinput.deviceId" :key="videoinput.deviceId">
          {{videoinput.label}}
        </option>
      </select>
      <select v-model="audioinput" id="audioinput" @change="onVideocallCallUser">
        <option v-for="audioinput in allAudioinputs" :value="audioinput.deviceId" :key="audioinput.deviceId">
          {{audioinput.label}}
        </option>
      </select>
      <select v-model="audiooutput" id="audiooutput" @change="onVideocallCallUser">
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
import kurentoUtils from 'kurento-utils';

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

    webRtcPeer: false,
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
      this.sockets.subscribe("videocall-exist-user", this.onVideocallExistUser);
      this.sockets.subscribe("videocall-called-user", this.onVideocallCalledUser);
      this.sockets.subscribe("videocall-answer-made", this.onVideocallAnswerMade);
    },

    unsubscribeListeners() {
      this.sockets.unsubscribe("videocall-add-icecandidate");
      this.sockets.unsubscribe("ended-videocall");
      this.sockets.unsubscribe("video-remove-user");
      this.sockets.unsubscribe("videocall-add-user");
      this.sockets.unsubscribe("videocall-exist-user");
      this.sockets.unsubscribe("videocall-called-user");
    },

    onVideocallAddIcecandidate(icecandidate) {
      this.webRtcPeer.addIceCandidate(icecandidate);
    },

    onEndedVideocall() {
      console.log('Видео встреча завершена');
      this.$socket.emit('close-videocall');
      this.$router.push('/');
    },

    onVideocallAddUser() {
      console.log('video-add-user')
      // this.initWebRtcPeer();
    },

    onVideocallExistUser() {
      this.onVideocallCallUser();
    },

    onVideocallCallUser() {
      this.initWebRtcPeer("videocall-call-user");
    },

    onVideocallCalledUser() {
      console.log('videocall-answer-user')
      this.initWebRtcPeer("videocall-answer-user");
    },

    onVideocallRemoveUser() {
      console.log('Пользователь вышел')
    },

    onVideocallAnswerMade(answer) {
      console.log('videocall-answer-made')
      this.webRtcPeer.processAnswer(answer);
    },

    initWebRtcPeer(emitName) {
      console.log('initWebRtcPeer')
      const options = {
        localVideo: this.localVideo,
        remoteVideo: this.remoteVideo,
        onicecandidate: (candidate) => {
          this.$socket.emit('videocall-new-icecandidate', {
            icecandidate: event.candidate,
            videocallId: this.videocallId
          });
        },
        mediaConstraints: this.constraints,
        configuration: { 
        iceServers: [
		      { url: 'stun:l.google.com:19302' },
		      {
            url: 'turn:numb.viagenie.ca',
            credential: 'muazkh',
            username: 'webrtc@live.com'
          },
          {
            url: 'turn:192.158.29.39:3478?transport=udp',
            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            username: '28224511:1379330808'
          },
          {
            url: 'turn:192.158.29.39:3478?transport=tcp',
            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            username: '28224511:1379330808'
          },
          {
            url: 'turn:turn.bistri.com:80',
            credential: 'homeo',
            username: 'homeo'
          },
          {
            url: 'turn:turn.anyfirewall.com:443?transport=tcp',
            credential: 'webrtc',
            username: 'webrtc'
          }
		    ]}
      }

      // stun.l.google.com:19302
      // stun1.l.google.com:19302
      // stun2.l.google.com:19302
      // stun3.l.google.com:19302
      // stun4.l.google.com:19302

      const videocallId = this.videocallId;
      const socket = this.$socket;
      this.webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function(error) {
        this.generateOffer(function(error, offer) {
          if (error) {
            console.error(error);
          }
          socket.emit(emitName, {
            offer,
            videocallId
          })
        });
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
      
      this.videoinput = this.allVideoinputs[1].deviceId;
      this.audioinput = this.allAudioinputs[0].deviceId;
      this.audiooutput = this.allAudiooutputs[0].deviceId;

      this.subscribeListeners();

      this.initEmit();
      if(this.$auth.user().role === 'teacher') {
        this.onVideocallCallUser();
      }
    })
  }
}
</script>