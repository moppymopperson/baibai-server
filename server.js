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
  const pricelog = '../bit-baibai/log_files/ErikPracticeTrader_price_log.log'
  const tradelog =
    '../bit-baibai/log_files/ErikPracticeTrader_trade_records.log'
  const tailer = new LogWatcher(pricelog, tradelog)

  tailer.on('prices', prices => {
    data = JSON.stringify({ prices })
    client.send(data, error => {
      if (error) {
        console.log('Error sending prices: ' + error)
      }
    })
  })

  tailer.on('trades', trades => {
    data = JSON.stringify({ trades })
    client.send(data, error => {
      if (error) {
        console.log('Error sending trades ' + error)
      }
    })
  })

  tailer.on('error', error => {
    console.log('Trailer Error: ' + error)
  })

  tailer.watch()

  client.on('message', function incoming(message) {
    console.log('received: %s', message)
  })

  client.on('error', error => {
    console.log(error)
  })
})

wss.on('error', error => {
  console.log(error)
})

server.listen(8080, function listening() {
  console.log('Listening on %d', server.address().port)
})
