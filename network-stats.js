module.exports = function (RED) {
  const si = require('systeminformation')

  function aggregatePayloads (possiblePayloads, payloadArr) {
    for (let i = 0; i < possiblePayloads.length; i++) {
      const possiblePayloadsItem = possiblePayloads[i]
      if (possiblePayloadsItem.condition) {
        payloadArr.push(possiblePayloadsItem.result)
      }
    }

    return payloadArr
  }

  function NetworkStatsNode(conf) {
    RED.nodes.createNode(this, conf)

    this.name = conf.name

    const node = this

    this.receivedBytesSec = (typeof conf.receivedBytesSec === 'undefined') ? true : conf.receivedBytesSec
    this.transmittedBytesSec = (typeof conf.transmittedBytesSec  === 'undefined') ? true : conf.transmittedBytesSec

    node.on('input', (msg, send, done) => {
      send = send || function() { node.send.apply(node, arguments) }
      si.networkInterfaceDefault()
        .then(iface => {
          si.networkStats(iface)
            .then(data => {
              for (let i = 0; i < data.length; i++) {
                const ifaceData = data[i]
                if (ifaceData.iface === iface) {
                  let payloadArr = []
                  payloadArr = this.calculatePayloads(ifaceData, payloadArr)
                  send([ payloadArr ])

                  break
                }
              }
            })
            .catch(err => {
              if (done) {
                done(err)
              } else {
                node.error('SI networkStats Error', err)
              }
            })
        })
        .catch(err => {
          if (done) {
            done(err)
          } else {
            node.error('SI networkInterfaceDefault Error', err)
          }
        })
    })
  }

  NetworkStatsNode.prototype.calculatePayloads = function (data, payloadArr) {
    const possiblePayloads = [
      {
        condition: this.receivedBytesSec,
        result: {
          payload: data.rx_sec,
          topic: 'received_bytes_sec'
        }
      },
      {
        condition: this.transmittedBytesSec,
        result: {
          payload: data.tx_sec,
          topic: 'transmitted_bytes_sec'
        }
      }
    ]

    return aggregatePayloads(possiblePayloads, payloadArr)
  }

  RED.nodes.registerType('network_stats', NetworkStatsNode)
}
