'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Image = use('App/Models/Image')
const { manager_single_upload, manager_multiple_uploads } = use('App/Helpers')
const fs = use('fs')
const Transformer = use('App/Transformers/Admin/ImageTransformer')
const Helpers = use('Helpers')


/**
 * Resourceful controller for interacting with images
 */
class ImageController {
  /**
   * Show a list of all images.
   * GET images
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ request, response, pagination, transform }) {
    var images = await Image.query().orderBy('id', 'DESC').paginate(pagination.page, pagination.limit)
    images = await transform.paginate(images, Transformer) // Usando transformer para formatar campos de retorno
    return response.send(images)
  }

  /**
   * Render a form to be used for creating a new image.
   * GET images/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) { // Nao usa esse metodo pois serve para renderizar uma tela
  }

  /**
   * Create/save a new image.
   * POST images
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response, transform }) {
    try {
      //Validação do arquivo
      const fileJar = request.file('images', {
        types: ['image'],
        size: '2mb'
      })

      //Retorno pro usuário
      let images = []

      if (!fileJar.files) {
        const file = await manager_single_upload(fileJar)
        if (file.moved()) {
          const imageSaved = await Image.create({ path: file.fileName, size: file.size, original_name: file.clientName, extension: file.subtype })
          const transformImage = await transform.item(imageSaved, Transformer) // Usando transformer para formatar os campos de retorno
          images.push(transformImage)
          return response.status(201).send({ successes: images, errors: {} })
        } else {
          return response.status(400).send({ message: 'Não foi possível processar essa imagem' })
        }
      } else {
        const files = await manager_multiple_uploads(fileJar)
        await Promise.all(
          files.successes.map(async f => {
            const imageSaved = await Image.create({ path: f.fileName, size: f.size, original_name: f.clientName, extension: f.subtype })
            const transformImage = await transform.item(imageSaved, Transformer) // Usando transformer para formatar os campos de retorno
            images.push(transformImage)
          })
        )
        return response.status(201).send({ successes: images, errors: file.errors })
      }
    } catch (error) {
      return response.status(400).send({ message: 'Não foi possível processar sua solicitação' })
    }
  }

  /**
   * Display a single image.
   * GET images/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, transform }) {
    var image = await Image.findOrFail(params.id)
    image = await transform.item(image, Transformer)
    return response.send(image)
  }

  /**
   * Render a form to update an existing image.
   * GET images/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit({ params, request, response, view }) {
  }

  /**
   * Update image details.
   * PUT or PATCH images/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response, transform }) {
    var image = await Image.findOrFail(params.id)

    try {
      image.merge(request.only['original_name'])
      await image.save()
      image = await transform.item(image, Transformer)
      return response.status(200).send(image)
    } catch (error) {
      return response.status(400).send({ message: 'Não foi possível atualizar a imagem' })
    }
  }

  /**
   * Delete a image with id.
   * DELETE images/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
    const image = await Image.findOrFail(params.id)
    try {
      let filePath = Helpers.publicPath(`uploads/${image.path}`)

      await fs.unlinkSync(filePath)
      await image.delete()

      return response.status(204).send()
    } catch (error) {
      return response.status(400).send({ message: 'Não foi possível deletar a imagem' })
    }
  }
}

module.exports = ImageController
