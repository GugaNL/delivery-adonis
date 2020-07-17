'use strict'

const BumblebeeTransformer = use('Bumblebee/Transformer')
const ImageTransformer = use('App/Transformers/Admin/ImageTransformer')

/**
 * CategoryTransformer class
 *
 * @class CategoryTransformer
 * @constructor
 */
class CategoryTransformer extends BumblebeeTransformer {

  static get defaultInclude() { // Vai pegar um outro model e incluir nesse
     return ['image']
  }

  /**
   * This method is used to transform the data.
   */
  transform (model) {
    return {
     // add your transformation object here
     id: model.id,
     title: model.title,
     description: model.description
    }
  }

  includeImage(model) {  // Carrega o transformer da image
     return this.item(model.getRelated('image'), ImageTransformer) // Pega a relação entre imagem e categoria (está em Model/Category.js)
  }

}

module.exports = CategoryTransformer
