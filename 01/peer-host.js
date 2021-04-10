const Libp2p = require('libp2p')
const { NOISE } = require('libp2p-noise')
const MPLEX = require('libp2p-mplex')
const WebSockets = require('libp2p-websockets')
const PeerId = require('peer-id')
const WStar = require('libp2p-webrtc-star');
const wrtc = require('wrtc')
const Upgrader = require('./node_modules/libp2p/src/upgrader')

const { PEER_A, PEER_B} = require('./const');



const run = async () => {
  const peerId = await PeerId.createFromJSON(PEER_A);

  const upgrader = new Upgrader({ localPeer: {id: peerId} });

  const node = await Libp2p.create({
    peerId,
    modules: {
      transport: [WebSockets, WStar],
      connEncryption: [NOISE],
      streamMuxer: [MPLEX]
    },
    addresses: {
      listen: [
        `/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star/p2p/${PEER_A.id}`
      ],
    },
    config: {
      transport: {
        [WStar.prototype[Symbol.toStringTag]]: {
          wrtc, 
          upgrader, 
        }
      }
    }
  }); 

  await node.start()

  node.multiaddrs.forEach(addr => {
    console.log(`${addr.toString()}/p2p/${node.peerId.toB58String()}`)
  })

  node.on('error', (err) => {console.log('error')})
  node.on('peer:discovery', (peer) => {
    if (peer.toB58String() === PEER_B.id) {
      console.log(`peer:discovery ${peer.toB58String()}`)
    }
  })

  node.connectionManager.on('peer:connect', (connection) => {
    if (connection.remotePeer.toB58String() === PEER_B.id) {
      console.log(`peer:connect ${connection.remotePeer.toB58String()}`);
    }
  })

  node.connectionManager.on('peer:disconnect', (connection) => {
    if (connection.remotePeer.toB58String() === PEER_B.id) {
      console.log(`peer:disconnect ${connection.remotePeer.toB58String()}`)
    }
  })
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

