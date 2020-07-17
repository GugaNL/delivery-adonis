'use strict'

class NotificationController {
  constructor ({ socket, request }) {
    this.socket = socket
    this.request = request
  }


  /**
   * Emite uma mensagem de broadcast pra todos exceto eu
   */
  onMessage(message) {
    this.socket.broadcast('message', message)
  }

  /**
   * Desconectar
   */
  onClose() {
    this.socket.broadcastToAll('drop:connection')
  }

}

module.exports = NotificationController
