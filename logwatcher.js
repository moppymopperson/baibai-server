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
    this._tail = new Tail(this.filepath, { fromBeginning: false })
    this._tail.on('line', line => {
      const priceSample = LogWatcher.parseLine(line)
      this.emit('price', priceSample)
    })
    this._tail.on('error', error => {
      this.emit('error', error)
    })
  }

  unwatch() {
    this._tail.unwatch()
  }
}
