import LogWatcher from '../LogWatcher'

const fs = require('fs')
const dummyPath = __dirname + '/dummy.log'
const dummyLine = '2017-12-13 07:25:19 : XBT USD = 16927.60000'
const dummyTrade =
  "2017-12-25 11:12:51 : Bought 25.0 shares of BTC at PriceSample(price=14000.0, date=datetime.datetime(2017, 12, 24, 11, 12, 51, 719088), currency='BTC', price_currency='USD')"

it('sets the filepath correctly', () => {
  const sut = new LogWatcher(dummyPath)
  expect(sut.filepath).toEqual(dummyPath)
})

it('parses prices properly', () => {
  const result = LogWatcher.parseLine(dummyLine)
  expect(result).toEqual({
    price: 16927.6,
    date: new Date('2017-12-13 07:25:19'),
    currency: 'XBT',
    priceCurrency: 'USD'
  })
})

it('It reads existining lines and receives new lines', done => {
  const sut = new LogWatcher(dummyPath)
  fs.writeFileSync(dummyPath, dummyLine + '\n')
  let linesRead = 0
  sut.on('price', price => {
    linesRead += 1
    if (linesRead == 3) {
      done()
    }
  })
  sut.watch()
  fs.appendFile(dummyPath, dummyLine + '\n')
  fs.appendFile(dummyPath, dummyLine + '\n')
})
