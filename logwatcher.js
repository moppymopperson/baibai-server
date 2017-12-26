const fs = require('fs')
const LineReader = require('readline')
const Tail = require('tail').Tail
const EventEmitter = require('events').EventEmitter

module.exports = class LogWatcher extends EventEmitter {
  constructor(filepath) {
    super()
    this.filepath = filepath
  }

  static parseLine(line) {
    const date = new Date(line.slice(0, 19))
    const words = line.slice(22).split(' ')
    const currency = words[0]
    const priceCurrency = words[1]
    const price = Number(words[3])
    return { price, date, currency, priceCurrency }
  }

  watch() {
    console.log('Began watching')
    this.readLines((error, prices) => {
      if (error) {
        this.emit('error', error)
      } else {
        this.emit('prices', prices)
        this.tailLog()
      }
    })
  }

  unwatch() {
    this._tail.unwatch()
  }

  readLines(done) {
    let prices = []
    const reader = LineReader.createInterface({
      input: fs.createReadStream(this.filepath)
    })

    reader.on('line', line => {
      const priceSample = LogWatcher.parseLine(line)
      prices.splice(0, 0, priceSample)
    })

    reader.on('error', error => {
      done(error)
    })

    reader.on('close', () => {
      done(null, prices)
    })
  }

  tailLog() {
    this._tail = new Tail(this.filepath, { fromBeginning: false })
    this._tail.on('line', line => {
      const priceSample = LogWatcher.parseLine(line)
      this.emit('prices', [priceSample])
    })
    this._tail.on('error', error => {
      this.emit('error', error)
    })
  }
}
