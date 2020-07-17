'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Category = use('App/Models/Category')
const Transformer = use('App/Transformers/Admin/CategoryTransformer')

/**
 * Resourceful controller for interacting with categories
 */
class CategoryController {
  /**
   * Show a list of all categories.
   * GET categories
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {TransformWith} ctx.transform
   * @param {object} ctx.pagination
   */
  async index({ request, response, transform, pagination }) {

    const title = request.input('title')
    const query = Category.query() //Já que vai ser preparado de toda forma a query de lista então ja atribui a uma constante(não coloca await pois não está executando, apenas instanciando)

    if (title) { // Caso passe o parametro title então executa com filtro LIKE
      query.where('title', 'LIKE', `%${title}%`) //Atribuindo um statement a query antes dela ser executada
    }

    //const page = request.input('page') // Vai ser passado ou não como parametro no front quantas paginas o usuario vai querer buscar
    //const limit = request.input('limit') // Vai ser passado ou não como parametro no front qual o limite da busca
    //const categories = await Category.query().paginate(page, limit) // Já faz a listagem
    var categories = await query.paginate(pagination.page, pagination.limit) // Já faz a listagem usando o middleware Pagination
    categories = await transform.paginate(categories, Transformer) // Usando o transformer para modificar o retorno que iria vir
    return response.send({ categories })
  }



  /**
   * Create/save a new category.
   * POST categories
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response, transform }) {
    try {
      const { title, description, image_id } = request.all() //Destruction para pegar esses valores do request.input
      var category = await Category.create({ title, description, image_id })
      category = await transform.item(category, Transformer)  // Usa item() ao inves de paginate() porque só será 1 registro e nao uma lista
      return response.status(201).send(category)
    } catch (error) {
      return response.status(400).send({ message: "Não foi possível criar a categoria" })
    }
  }

  /**
   * Display a single category.
   * GET categories/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, transform, response, view }) { //Object destruction
    var category = await Category.findOrFail(params.id) //findOrFail pois trata caso nao encontre o objeto
    category = await transform.item(category, Transformer)
    return response.send(category) //Retornando a categoria a ser exibida
  }



  /**
   * Update category details.
   * PUT or PATCH categories/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response, transform }) {
    try {
      var category = await Category.findOrFail(params.id) // Primeiro busca a categoria pelo id
      const { title, description, image_id } = request.all() //Pega os dados da request
      category.merge({ title, description, image_id }) // Faz o update
      await category.save() // Salva a modificação
      category = await transform.item(category, Transformer)
      return response.send(category)
    } catch (error) {
      return response.status(400).send({ message: 'Erro ao atualizar categoria' })
    }

  }

  /**
   * Delete a category with id.
   * DELETE categories/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
    const category = await Category.findOrFail(params.id) // Primeiro busca a categoria pelo id
    await category.delete() //Deleta a categoria
    return response.status(204).send({ message: "success" }) //Retorna apenas o status
  }
}

module.exports = CategoryController
