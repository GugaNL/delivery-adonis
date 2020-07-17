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
    const name = request.input('name')
    const query = Product.query()

    if (name) {
      query.where('name', 'LIKE', `%${name}%`)
    }

    var products = await query.paginate(pagination.page, pagination.limit)
    products = await transform.paginate(products, Transformer)
    return response.send(products)
  }


  /**
   * Create/save a new product.
   * POST products
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response, transform }) {
    try {
      const { name, description, image_id, price } = request.all()
      var product = await Product.create({ name, description, image_id, price })
      product = await transform.item(product, Transformer)
      return response.status(201).send(product)
    } catch (error) {
      return response.status(400).send({ message: "Não foi possível criar o produto" })
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
    var product = await Product.findOrFail(params.id) // Busca o produto
    product = await transform.item(product, Transformer)
    return response.send(product)
  }


  /**
   * Update product details.
   * PUT or PATCH products/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response, transform }) {
    try {
      var product = await Product.findOrFail(params.id) // Busca o produto
      const { name, description, image_id, price } = request.all() //Pega os parametros da request pelo destruction
      product.merge({ name, description, image_id, price }) // Altera os valores
      await product.save()
      product = await transform.item(product, Transformer)
      return response.send(product)
    } catch (error) {
      return response.status(400).send({ message: 'Erro ao atualizar produto'})
    }

  }

  /**
   * Delete a product with id.
   * DELETE products/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
    try {
      const product = await Product.findOrFail(params.id) // Busca o produto
      await product.delete()
      return response.status(204).send({ message: 'success' })
    } catch (error) {
      return response.status(500).send({ message: 'Erro ao deletar produto' })
    }
  }
  
}

module.exports = ProductController
