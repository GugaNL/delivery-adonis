'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const str_random = use('App/Helpers') // Não precisa colocar o caminho total pois está como index.js daí ele ja encontra

class PasswordReset extends Model {
    static boot() {
        super.boot()

        this.addHook('beforeCreate', async model => { //Quando o token for criado, entao tera validade de 30min a partir do momento da criação
            model.token = await str_random(25)

            const expires_at = new Date()
            expires_at.setMinutes(expires_at.getMinutes() + 30) //O token vai expirar em 30min
            model.expires_at = expires_at
        })
    }

    /**
     * Formata as datas para o padrão do mysql
     */
    static get dates() {
        return ['created_at', 'updated_at', 'expires_at']
    }
}

module.exports = PasswordReset
