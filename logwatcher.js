const fs = require('fs')
const LineReader = require('readline')
const Tail = require('tail').Tail
const EventEmitter = require('events').EventEmitter

module.exports = class LogWatcher extends EventEmitter {
  constructor(pricelog, tradelog) {
    super()
    this.pricelog = pricelog
    this.tradelog = tradelog
    this.tailPriceLog = this.tailPriceLog.bind(this)
    this.tailTradeLog = this.tailTradeLog.bind(this)
  }

  static parsePriceSample(line) {
    const date = new Date(line.slice(0, 19))
    const words = line.slice(22).split(' ')
    const currency = words[0]
    const priceCurrency = words[1]
    const price = Number(words[3])
    return { price, date, currency, priceCurrency }
  }

  static parseTradeRecord(line) {
    const type = line.includes('Bought') ? 'buy' : 'sell'
    const date = new Date(line.slice(0, 19))

    const sharesRegex = /(\d+\.*\d+)\sshares/g
    const sharesMatch = sharesRegex.exec(line)
    const shares = Number(sharesMatch[1])

    const priceRegex = /price=(\d*.\d*)/g
    const priceMatch = priceRegex.exec(line)
    const price = Number(priceMatch[1])

    const currencyRegex = /currency='(\w+)'/g
    const currencyMatch = currencyRegex.exec(line)
    const currency = currencyMatch[1]

    const priceCurrencyRegex = /price_currency='(\w+)'/g
    const priceCurrencyMatch = priceCurrencyRegex.exec(line)
    const priceCurrency = priceCurrencyMatch[1]

    return { type, shares, price, date, currency, priceCurrency }
  }

  watch() {
    console.log('Began watching')
    this.readPrices()
      .then(prices => {
        this.emit('prices', prices)
        this.tailPriceLog()
      })
      .catch(error => {
        this.emit('error', error)
      })

    this.readTrades()
      .then(trades => {
        this.emit('trades', trades)
        this.tailTradeLog()
      })
      .catch(error => {
        this.emit('error', error)
      })
  }

  unwatch() {
    this._priceTail.unwatch()
  }

  readPrices() {
    return new Promise((resolve, reject) => {
      let prices = []
      const priceReader = LineReader.createInterface({
        input: fs.createReadStream(this.pricelog)
      })

      priceReader.on('line', line => {
        const priceSample = LogWatcher.parsePriceSample(line)
        prices.splice(0, 0, priceSample)
      })

      priceReader.on('error', error => {
        reject(error)
      })

      priceReader.on('close', () => {
        resolve(prices)
      })
    })
  }

  readTrades() {
    return new Promise((resolve, reject) => {
      let trades = []
      const tradeReader = LineReader.createInterface({
        input: fs.createReadStream(this.tradelog)
      })

      tradeReader.on('line', line => {
        const trade = LogWatcher.parseTradeRecord(line)
        trades.splice(0, 0, trade)
      })

      tradeReader.on('error', error => {
        reject(error)
      })

      tradeReader.on('close', () => {
        resolve(trades)
      })
    })
  }

  tailPriceLog() {
    this._priceTail = new Tail(this.pricelog, { fromBeginning: false })
    this._priceTail.on('line', line => {
      const priceSample = LogWatcher.parsePriceSample(line)
      this.emit('prices', [priceSample])
    })
    this._priceTail.on('error', error => {
      this.emit('error', error)
    })
  }

  tailTradeLog() {
    this._tradeTail = new Tail(this.tradelog, { fromBeginning: false })
    this._tradeTail.on('line', line => {
      const trade = LogWatcher.parseTradeRecord(line)
      this.emit('trades', [trade])
    })
    this._tradeTail.on('error', error => {
      this.emit('error', error)
    })
  }
}
