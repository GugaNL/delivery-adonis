'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class Pagination {
  /**
   * @param {object} ctx // É o objeto principal, uma forma de isolar cada requisição http de cada usuario
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle(ctx, next) {
    if (ctx.request.method() === 'GET') {
      const page = ctx.request.input('page') ? parseInt(ctx.request.input('page')) : 1
      const limit = ctx.request.input('limit') ? parseInt(ctx.request.input('limit')) : 20
      const perPage = parseInt(ctx.request.input('perpage')) // Caso passe perpage ao invés de limit, depende do padrão de cada ambiente
      
      //Atribuindo os valores passados via get para a propriedade pagination do objeto ctx
      ctx.pagination = {
        page,
        limit
      }

      if (perPage) {
        ctx.pagination.limit = perPage
      }
    }

    await next() // Informa ao middleware para passar essa requisição adiante para o proximo middleware que está na fila ou proximo processo a ser executado pelo adonis
  }
}

module.exports = Pagination
