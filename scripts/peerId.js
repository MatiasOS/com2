const PeerId = require('peer-id')

const run = async () => {
  const id = await PeerId.create({ bits: 1024, keyType: 'rsa' })
  console.log(JSON.stringify(id.toJSON(), null, 2))
}

run()