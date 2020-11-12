const Videocall = require('../models/Videocall');
const Lesson = require('../models/Lesson');

module.exports = (client, clients, videocalls) => {
  // Только для учителя
  if (client.decoded_token.role == 'teacher') {
    /**
     * @param {string} userId - id студента, которому присылает инвайт на видео звонок учитель.
     * @description Создаётся видео звонок, инвайт на видео звонок от учителя.
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
     * @param {string} videocallId - id видео звонка
     * @description Завершение урока(видео звонок). 
     * Отсылает ученику 'ended-videocall', после этого от ученика
     * следует 'close-videocall' и он покидает room с id видео звонка
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
     * @param {string} videocallId - id видео звонка
     * @description Принимает заявку на видео звонк, видео звонк начинается (start устанавливается на Date.now())
     * Отправляет учителю 'accept-invited-videocall' с id видео звонка
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
     * @param {string} videocallId - id видео звонка
     * @description Учитель завершил видео звонок, студент выходит из room с id видео звонка.
     */
    client.on('close-videocall', (videocallId) => {
      client.leave(videocallId);
    });
  }

  // Общие

  /**
   * @param {string} videocallId - id видео звонка
   * @description Юзер зашёл на видео звонок.
   * Юзер подключается к room с id видео звонка, 
   * отсылает в комнату 'videocall-add-user'
   */
  client.on("videocall-sing-in", (videocallId) => {
    const videocall = videocalls[videocallId];
    if (videocall && videocall[client.decoded_token.role] === client.decoded_token._id) {
      client.join(videocallId);
      client.to(videocallId).emit("videocall-add-user");
    }
  });

  /**
   * @param {string} videocallId - id видео звонка
   * @description Юзер покинул видео звонок.
   * Юзер покидает room с id видео звонка, 
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
   * @param {string} data.videocallId - id видео звонка
   * @description Юзер получил IceCandidate и передаёт его
   * 2 пользователю, который находится в room с id видео звонка
   * через 'add-icecandidate' 
   */
  client.on('videocall-new-icecandidate', (data) => {
    const videocall = videocalls[data.videocallId];
    if (videocall && videocall[client.decoded_token.role] === client.decoded_token._id) {
      client.to(data.videocallId).emit("videocall-add-icecandidate", data.icecandidate);
    }
  });

  /**
   * @param {Object} data - Данные, которые поступили от юзера
   * @param {RTCIceCandidate} data.offer - Offer юзера
   * @param {string} data.videocallId - id видео звонка
   * @description Юзер налаживает RTC соединение, отправляет
   * другому юзеру offer. В room с id видео звонка посылается
   * 'videocall-call-made' с оффером 
   */
  client.on("videocall-call-user", (data) => {
    const videocall = videocalls[data.videocallId];
    if (videocall && videocall[client.decoded_token.role] === client.decoded_token._id) {
      client.to(data.videocallId).emit("videocall-call-made", data.offer);
    }
  });

  /**
  * @param {Object} data - Данные, которые поступили от юзера
  * @param {RTCIceCandidate} data.offer - Answer юзера
  * @param {string} data.videocallId - id видео звонка
  * @description Юзер налаживает RTC соединение, после получения
  * offer-а от другого юзера, он посылает ему ответ. В room с id
  * видео звонка посылается 'videocall-answer-made' с ответом 
  */
  client.on("videocall-make-answer", (data) => {
    const videocall = videocalls[data.videocallId];
    if (videocall && videocall[client.decoded_token.role] === client.decoded_token._id) {
      client.to(data.videocallId).emit("videocall-answer-made", data.answer);
    }
  });
}