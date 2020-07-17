'use strict'

const crypto = use('crypto')

const Helpers = use('Helpers')

/**
 * Gera aum string randomica
 * 
 * @param {int} length - Tamanho da string que quer gerar
 * @return {string } - String gerada no tamanho da length
 */
const str_random = async (length = 40) => {
    let string = ''
    let len = string.length

    if (len < length) {
        let size = length - len
        let bytes = await crypto.randomBytes(size) // Cria uma lista de bytes binários randomico no tamanho que foi passado
        let buffer = Buffer.from(bytes) // Converte os bytes em buffer para poder converter em string depois
        string += buffer.toString('base64').replace(/[^a-zA-Z0-9]/g, '').substr(0, size)
    }

    return string
}



/**
 * Move o arquivo para o caminho especificado, caso esse nao seja definido então será usado public/uploads
 * @param { Object<FileJar> } file // Arquivo
 * @param { string } path // Caminho para onde o arquivo será movido 
 */
const manager_single_upload = async (file, path = null) => {
    path = path ? path : Helpers.publicPath('uploads')
    const random_name = await str_random(30) // Gera um nome aleatório
    let filename = `${new Date().getTime()}-${random_name}.${file.subtype}` //Cria o nome final do arquivo
    await file.move(path, { name: filename }) // Move o arquivo para o path
    return file
}


/**
 * Move os arquivos para o caminho especificado, caso esse nao seja definido então será usado public/uploads
 * @param { Object<FileJar> } file // Arquivo
 * @param { string } path // Caminho para onde o arquivo será movido
 * @return { Object }
 */
const manager_multiple_uploads = async (file, path = null) => {
    path = path ? path : Helpers.publicPath('uploads')
    let successes = []
    let errors = []

    await Promise.all(file.files.map(async f => {
        let filename = `${new Date().getTime()}-${random_name}.${f.subtype}`
        await f.move(path, { name: filename })

        // Verifica se moveu mesmo
        if (f.moved()) {
            successes.push(f)
        } else {
            errors.push(f.errors())
        }
    }))

    return { successes, errors }
}


module.exports = { str_random, manager_single_upload, manager_multiple_uploads }