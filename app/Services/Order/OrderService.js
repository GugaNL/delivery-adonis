'use strict'

const Database = use('Database')

class OrderService {
    constructor(model, trx = false) {
        this.model = model
        this.trx = trx
    }



    async syncItems(items) {
        if (!Array.isArray(items)) {
            return false
        }
        await this.model.items().delete(this.trx)
        await this.model.items().createMany(items, this.trx)
    }

    async updateItems(items) {
        let currentItems = await this.model.items().whereIn('id', items.map(item => item.id)).fetch()

        //Deleta os items que o user não quer mais
        await this.model.items().whereIn('id', items.map(item => item.id)).delete(this.trx)

        //Atualiza valores e quantidades
        await Promise.all(currentItems.rows.map(async item => {
            item.fill(items.find(n => n.id === item.id))
            await item.save(this.trx)
        }))
    }


    async canApplyDiscount(coupon) {
        const now = new Date().getTime() // Para verificar a data de validade
        if(now > coupon.valid_from.getTime() || (typeof coupon.valid_until == 'object' && coupon.valid_until.getTime() < now)) {  // typeof ... 'object' é para verificar se ele nao é nulo
            return false
        }

        const couponProducts = await Database.from('coupon_products').where('coupon_id', coupon.id).pluck('product_id') // Pega os produtos associados ao cupom baseado no id
        const couponClients = await Database.from('coupon_user').where('coupon_id', coupon.id).pluck('user_id') // Pega os clientes associados ao cupom baseado no id

        //Verifica se o cupom não está associado a produtos e clientes especificos
        if (Array.isArray(couponProducts) && couponProducts.length < 1 && Array.isArray(couponClients) && couponClients.length < 1) {
            //Não está associado e é um cupom válido, nao sendo necessario validações
            return true
        }

        //Para verificar se está associado a um, a outro ou os 2
        let isAssociatedToProducts = false
        let isAssociatedToClients = false

        if (Array.isArray(couponProducts) && couponProducts.length > 0) {
            isAssociatedToProducts = true
        }

        if (Array.isArray(couponClients) && couponClients.length > 0) {
            isAssociatedToClients = true
        }


        //Verifica quais produtos que o cliente comprou que tem direito ao desconto
        const productMatch = await Database.from('order_items').where('order_id', this.model.id).whereIn('product_id', couponProducts).pluck('product_id')


        /**
         * Caso 1 - O cupom está associado a clientes e produtos
         */
        if(isAssociatedToProducts && isAssociatedToClients) {
            const clientMatch = couponClients.find(client => client === this.model.user_id) //Verificar se o cliente que está comprando está dentre os que podem

            if(clientMatch && Array.isArray(productMatch) && productMatch.length > 0) { // Verifica se o clientMatch deu certo e se o produto também. productMatch.length > 0 = pelo menos 1 produto que bate com esse pedido
                return true
            }
        }

        
        /**
         * Caso 2 - O cupom está associado apenas ao produto
         */
        if(isAssociatedToProducts && Array.isArray(productMatch) && productMatch.length > 0) { 
            return true
        }


        /**
         * Caso 3 - O cupom está associado a 1 ou mais cliente(s) mas a nenhum produto
         */
        if(isAssociatedToClients && Array.isArray(couponClients) && couponClients.length > 0) {
            
            const match = couponClients.find(client => client === this.model.user_id) // Clientes que estão na lista de ter direito ao desconto
            if(match) {
                return true
            }
        }


        /**
         * Caso nenhuma das alternativas deêm positivas então o cupom está associado a clientes ou produtos ou os 2
         * mas nenhum produto está elegível ao desconto e o cliente que fez a compra também nao poderá usar o cupom, provavelmente nao está autorizado a usar
         */
        return false
    }
}

module.exports = OrderService