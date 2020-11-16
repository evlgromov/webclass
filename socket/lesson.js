const kurento = require('kurento-client');

const Videocall = require('../models/Videocall');
const Lesson = require('../models/Lesson');

const reverseRole = (role) => role === 'student' ? 'teacher' : 'student';

module.exports = (client, clients, videocalls, kurentoClient, candidatesQueue) => {
  // Только для учителя
  if (client.decoded_token.role == 'teacher') {
    /**
     * @param {string} userId - id студента, которому присылает инвайт на видеозвонок учитель.
     * @description Создаётся видеозвонок, инвайт на видеозвонок от учителя.
     * В глобальном объекте videocalls создаётся поле [videocall._id],
     * где указываются id учителя и ученика.
     * Отсылает ученику 'invited-videocall-user' с id урока
     */
    client.on('invite-videocall-user', async (userId) => {
      const student = clients[userId];

      let lesson = await Lesson.findOne({ student: userId, teacher: client.decoded_token._id }); // TODO Нужна логика создания уроков
      if (!lesson) {
        lesson = await Lesson.create({
          student: userId,
          teacher: client.decoded_token._id
        })
      }

      const videocall = await Videocall.create({ lesson: lesson._id });

      videocalls[videocall._id.toString()] = {
        student: userId,
        teacher: client.decoded_token._id
      }

      client.to(student.clientId).emit('invited-videocall-user', videocall._id);
    });

    /**
     * @param {string} videocallId - id видеозвонка
     * @description Завершение урока(видеозвонок). 
     * Отсылает ученику 'ended-videocall', после этого от ученика
     * следует 'close-videocall' и он покидает room с id видеозвонка
     */
    client.on('end-videocall', async (videocallId) => {
      const videocall = await Videocall.findById(videocallId).populate('lesson');

      if (!videocall || videocall.lesson.teacher.toString() !== client.decoded_token._id) {
        return;
      }

      videocall.end = Date.now();
      videocall.save();

      delete videocalls[lessonId];

      client.to(videocallId).emit('ended-videocall');

      client.leave(videocallId);
    });
  }
  // Только для студента
  if (client.decoded_token.role === 'student') {
    /**
     * @param {string} videocallId - id видеозвонка
     * @description Принимает заявку на видеозвонк, видеозвонк начинается (start устанавливается на Date.now())
     * Отправляет учителю 'accept-invited-videocall' с id видеозвонка
     */
    client.on('accept-invite-videocall', async (videocallId) => {
      const videocall = await Videocall.findById(videocallId).populate('lesson');

      if (!videocall || videocall.lesson.student.toString() !== client.decoded_token._id) {
        return;
      }

      videocall.start = Date.now();
      videocall.save();

      client.to(clients[videocall.lesson.teacher].clientId).emit('accept-invited-videocall', videocall._id);
      client.emit('return-accept-invited-videocall', videocall._id);
    });

    /**
     * @param {string} videocallId - id видеозвонка
     * @description Учитель завершил видеозвонок, студент выходит из room с id видеозвонка.
     */
    client.on('close-videocall', (videocallId) => {
      client.leave(videocallId);
    });
  }

  // Общие

  /**
   * @param {string} videocallId - id видеозвонка
   * @description Юзер зашёл на видеозвонок.
   * Юзер подключается к room с id видеозвонка, 
   * отсылает в комнату 'videocall-add-user'
   */
  client.on("videocall-sing-in", (videocallId) => {
    const videocall = videocalls[videocallId];
    if (videocall && videocall[client.decoded_token.role] === client.decoded_token._id) {
      client.join(videocallId);
      client.to(videocallId).emit("videocall-add-user");
      const secondUser = clients[videocall[reverseRole(client.decoded_token._id)]];
      if (secondUser && secondUser.offer) {
        client.emit('videocall-exist-user');
      }
    }
  });

  /**
   * @param {string} videocallId - id видеозвонка
   * @description Юзер покинул видеозвонок.
   * Юзер покидает room с id видеозвонка, 
   * отсылает в комнату 'videocall-remove-user'
   */
  client.on("videocall-sing-out", (videocallId) => {
    const videocall = videocalls[videocallId];
    if (videocall && videocall[client.decoded_token.role] === client.decoded_token._id) {
      client.leave(videocallId);
      client.to(videocallId).emit("videocall-remove-user");
    }
  });

  /**
   * @param {Object} data - Данные, которые поступили от юзера
   * @param {RTCIceCandidate} data.icecandidate - IceCandidate юзера
   * @param {string} data.videocallId - id видеозвонка
   * @description Юзер получил IceCandidate и передаёт его
   * 2 пользователю, который находится в room с id видеозвонка
   * через 'add-icecandidate' 
   */
  client.on('videocall-new-icecandidate', (data) => {
    const videocall = videocalls[data.videocallId];
    const id = client.decoded_token._id;
    if (videocall && videocall[client.decoded_token.role] === id) {
      const icecandidate = kurento.getComplexType('IceCandidate')(data.icecandidate);
      if (clients[id].webRtcEndpoint) {
        clients[id].webRtcEndpoint.addIceCandidate(icecandidate);
        client.to(data.videocallId).emit("videocall-add-icecandidate", data.icecandidate);
      } else {
        if (!candidatesQueue[id]) {
          candidatesQueue[id] = [];
        }
        candidatesQueue[id].push(icecandidate);
      }
    }
  });

  /**
   * @param {Object} data - Данные, которые поступили от юзера
   * @param {RTCIceCandidate} data.offer - Offer юзера
   * @param {string} data.videocallId - id видеозвонка
   * @description Юзер налаживает RTC соединение, отправляет
   * другому юзеру offer. В room с id видеозвонка посылается
   * 'videocall-call-made' с оффером 
   */
  client.on("videocall-call-user", (data) => {
    const videocall = videocalls[data.videocallId];
    if (videocall && videocall[client.decoded_token.role] === client.decoded_token._id) {
      const firstUser = clients[client.decoded_token._id];
      firstUser.offer = data.offer;
      client.to(data.videocallId).emit("videocall-called-user");
    }
  });

  /**
  * @param {Object} data - Данные, которые поступили от юзера
  * @param {RTCIceCandidate} data.offer - Answer юзера
  * @param {string} data.videocallId - id видеозвонка
  * @description Юзер налаживает RTC соединение, после получения
  * offer-а от другого юзера, он посылает ему ответ. В room с id
  * видеозвонка посылается 'videocall-answer-made' с ответом 
  */
  client.on("videocall-answer-user", async (data) => {
    const videocall = videocalls[data.videocallId];
    if (videocall && videocall[client.decoded_token.role] === client.decoded_token._id) {
      const firstUser = clients[client.decoded_token._id];
      firstUser.offer = data.offer;
      const secondUser = clients[videocall[reverseRole(firstUser.role)]];
      if (secondUser.offer) {
        console.log('create pipeline')
        const pipeline = await kurentoClient.create('MediaPipeline');

        const firstUserWebRtcEndpoint = await pipeline.create('WebRtcEndpoint');
        if (candidatesQueue[firstUser._id]) {
          while (candidatesQueue[firstUser._id].length) {
            firstUserWebRtcEndpoint.addIceCandidate(candidatesQueue[firstUser._id].shift());
          }
        }
        firstUserWebRtcEndpoint.on('OnIceCandidate', function ({ candidate }) {
          icecandidate = kurento.getComplexType('IceCandidate')(candidate);
          client.emit("videocall-add-icecandidate", icecandidate);
        });

        const secondUserWebRtcEndpoint = await pipeline.create('WebRtcEndpoint');
        if (candidatesQueue[secondUser._id]) {
          while (candidatesQueue[secondUser._id].length) {
            secondUserWebRtcEndpoint.addIceCandidate(candidatesQueue[secondUser._id].shift());
          }
        }
        secondUserWebRtcEndpoint.on('OnIceCandidate', function ({ candidate }) {
          icecandidate = kurento.getComplexType('IceCandidate')(candidate);
          client.emit("videocall-add-icecandidate", icecandidate);
        });

        await firstUserWebRtcEndpoint.connect(secondUserWebRtcEndpoint);
        await secondUserWebRtcEndpoint.connect(firstUserWebRtcEndpoint);

        const firstUserAnswer = await firstUserWebRtcEndpoint.processOffer(firstUser.offer);
        firstUserWebRtcEndpoint.gatherCandidates();
        const secondUserAnswer = await secondUserWebRtcEndpoint.processOffer(secondUser.offer);
        secondUserWebRtcEndpoint.gatherCandidates();

        firstUser.webRtcEndpoint = firstUserWebRtcEndpoint
        secondUser.webRtcEndpoint = secondUserWebRtcEndpoint

        client.emit("videocall-answer-made", firstUserAnswer);
        client.to(data.videocallId).emit("videocall-answer-made", secondUserAnswer);
      }
    } else {
      console.log('not')
    }
  });
}