'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Product = use('App/Models/Product')
const Transformer = use('App/Transformers/Admin/ProductTransformer')


/**
 * Resourceful controller for interacting with products
 */
class ProductController {
  /**
   * Show a list of all products.
   * GET products
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ request, response, pagination, transform }) {
    const title = request.input('title')  // o método input do request nao retorna o objeto em destruction, nao usando assim o { } na variável

    try {
      const query = Product.query()

      if (title) {
        query.where('name', 'LIKE', `${title}`)
      }

      const results = await query.paginate(pagination.page, pagination.limit)

      const products = await transform.paginate(results, Transformer)

      return response.send(products)
    } catch (error) {
      return response.send({ message: 'Não foi possível listar os produtos' })
    }


  }


  /**
   * Display a single product.
   * GET products/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, transform }) {
    try {
      const result = await Product.findOrFail(params.id)
      const product = await transform.item(result, Transformer)
      return response.send(product)
    } catch (error) {
      return response.send({ message: 'Não foi possível exibir o produto' })
    }
  }


}

module.exports = ProductController
