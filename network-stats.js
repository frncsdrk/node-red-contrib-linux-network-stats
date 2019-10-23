module.exports = function (RED) {
  const si = require('systeminformation')

  function NetworkStatsNode(conf) {
    RED.nodes.createNode(this, conf)

    this.name = conf.name

    const node = this

    node.on('input', (msg) => {
      si.networkInterfaceDefault()
        .then(iface => {
          si.networkStats(iface)
            .then(data => {
              for (let i = 0; i < data.length; i++) {
                const ifaceData = data[i]
                if (ifaceData.iface === iface) {
                  let payloadArr = []
                  payloadArr.push({
                    payload: ifaceData.rx_sec,
                    topic: 'received_bytes_sec'
                  })
                  payloadArr.push({
                    payload: ifaceData.tx_sec,
                    topic: 'transfered_bytes_sec'
                  })
                  node.send([ payloadArr ])

                  break
                }
              }
            })
            .catch(err => {
              node.error('SI networkStats Error', err)
            })
        })
        .catch(err => {
          node.error('SI networkInterfaceDefault Error', err)
        })
    })
  }

  RED.nodes.registerType('network_stats', NetworkStatsNode)
}
