const express = require('express')
const http = require('http')
const url = require('url')
const WebSocket = require('ws')
const LogWatcher = require('./logwatcher')

const app = express()

app.use(function(req, res) {
  res.send({ msg: 'hello' })
})

const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

wss.on('connection', function connection(client, req) {
  //const location = url.parse(req.url, true)
  console.log('Client connected!')
  const location = '../bit-baibai/log_files/DummyTrader_price_log.log'
  const tailer = new LogWatcher(location)

  tailer.on('price', price => {
    data = JSON.stringify(price)
    console.log('sending: ' + data)
    client.send(data)
  })
  tailer.watch()

  client.on('message', function incoming(message) {
    console.log('received: %s', message)
  })
})

wss.on('error', error => {
  console.log(error)
})

server.listen(8080, function listening() {
  console.log('Listening on %d', server.address().port)
})
