const Libp2p = require('libp2p')
const WebSockets = require('libp2p-websockets')
// const TCP = require('libp2p-tcp')
const Bootstrap = require('libp2p-bootstrap')
const { NOISE } = require('libp2p-noise')
const multiaddr = require('multiaddr')
const MPLEX = require('libp2p-mplex')
const PeerId = require('peer-id')

const { PEER_A, PEER_B} = require('./const');

const bootstrapMultiaddrs = [
 `/ip4/127.0.0.1/tcp/3000/ws/p2p/${PEER_A.id}`
]

const run = async () => {
  const peerId = await PeerId.createFromJSON(PEER_B);
  const node = await Libp2p.create({
    peerId,
    modules: {
      transport: [WebSockets],
      peerDiscovery: [Bootstrap],
      connEncryption: [NOISE],
      streamMuxer: [MPLEX]
    },
    config: {
      peerDiscovery: {
        [Bootstrap.tag]: {
          enabled: true,
          list: bootstrapMultiaddrs,
        }
      }
    },
  })
  await node.start();

  const ma = multiaddr(bootstrapMultiaddrs[0]);
  console.log(`pinging remote peer at ${bootstrapMultiaddrs[0]}`)
  
  try {
    const latency = await node.ping(ma)
    console.log(`pinged ${bootstrapMultiaddrs[0]} in ${latency}ms`)
  } catch (e) {
    console.log(e);
  }


  node.on('error', (err) => {console.log('error')})
  node.on('peer:discovery', (peer) => {console.log('peer:discovery')})
  node.connectionManager.on('peer:connect', (connection) => {console.log('peer:connect')})
  node.connectionManager.on('peer:disconnect', (connection) => {console.log('peer:disconnect')})
  node.peerStore.on('peer', (peerId) => {console.log('peer')})
  node.peerStore.on('change:multiaddrs', ({ peerId, multiaddrs}) => {console.log('change:multiaddrs')})
  node.peerStore.on('change:protocols', ({ peerId, protocols}) => {console.log('change:protocols')})
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