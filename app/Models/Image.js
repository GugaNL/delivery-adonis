'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

const Env = use('Env') //Mock

class Image extends Model {

    static get computed() { //Informa ao Lucit que deve executar a computed property ao instanciar o model abaixo
        return ['url']
    }

    getUrl({ path }) {
        return `${Env.get('APP_URL')}/uploads/${path}`
    }
}

module.exports = Image
