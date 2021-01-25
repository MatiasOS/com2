const Libp2p = require('libp2p')
const WebSockets = require('libp2p-websockets')
const { NOISE } = require('libp2p-noise')
const MPLEX = require('libp2p-mplex')
const PeerId = require('peer-id')

const { PEER_A } = require('./const');

const run = async () => {
  const peerId = await PeerId.createFromJSON(PEER_A);
  const node = await Libp2p.create({
    peerId,
    modules: {
      transport: [WebSockets],
      connEncryption: [NOISE],
      streamMuxer: [MPLEX]
    },
    addresses: {
      listen: [
        '/ip4/127.0.0.1/tcp/3000/ws',
      ]
    },
  }); 

  await node.start()

  node.multiaddrs.forEach(addr => {
    console.log(`${addr.toString()}/p2p/${node.peerId.toB58String()}`)
  })

  node.on('error', (err) => {console.log('error')})
  node.on('peer:discovery', (peer) => {console.log('peer:discovery')})
  node.connectionManager.on('peer:connect', (connection) => {
    console.log(`peer:connect ${connection.remotePeer.toB58String()}`)
  })
  node.connectionManager.on('peer:disconnect', (connection) => {console.log('peer:disconnect')})
  node.peerStore.on('peer', (peerId) => {console.log('peer')})
  node.peerStore.on('change:multiaddrs', ({ peerId, multiaddrs}) => {console.log('change:multiaddrs')})
  node.peerStore.on('change:protocols', ({ peerId, protocols}) => {console.log(`change:protocols ${peerId.toB58String()} ${protocols}`)})
  return node;
}

const node = run();

const stop = async (n) => {
  // stop libp2p
  await n.stop()
  console.log('libp2p has stopped')
  process.exit(0)
}


process.on('SIGTERM', async () => stop(await node))
process.on('SIGINT', async () => stop(await node))

