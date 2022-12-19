const assert = require("node:assert")
const { describe, test } = require('node:test');
const EventEmitter = require("node:events")
const { LoggerChannel } = require(`../lib/channel.js`)
const { DebugLevel, CriticalLevel } = require(`../lib/levels.js`)
const { LoggerMessage } = require(`../lib/message.js`)
const { LoggerFormatter } = require(`../lib/utils/util.formatter.js`)
const { LoggerValidator } = require("../lib/utils/util.validator.js")
const { LoggerProcessor } = require("../lib/utils/util.processor.js")

// Enviroment

const TEST_ERROR = new Error(`some error`)
const TEST_CONTEXT = { procid: process.pid, version: 1, facility: 1, }
const TEST_TEXT_MESSAGE = `text message`

class ChannelInstanceError extends Error {
    constructor() { 
        super("ChannnelLevelError: The levels argument should includes only LoggerLevels") 
    }
}

class ChannelReadTest extends LoggerChannel {
    constructor(options) { super(options) }   
    add(chunk) { this.push(chunk) }
    _read() {}
}

class TransportMock extends EventEmitter {
    constructor() {super()}    
}

class WriteChannelTest extends LoggerChannel {
    output = []
    drainMode = false

    constructor(options) {
        super(options)
    }

    _write(chunk, encoding, callback) {
        this.output.push({chunk, encoding, callback})
        if(this.drainMode) {
            process.nextTick(callback)
            return false
        }
        callback()
        return true
    }

}

class ErrorChannelTest extends LoggerChannel {
    error
    output = []
    drainMode = false

    constructor(options) {
        super(options)
        this.output.removeListener = () => {}
    }

    _write(chunk, encoding, callback) {
        this.output.push({chunk, encoding, callback})
        if(this.drainMode) {
            if(this.error) process.nextTick(() => callback(this.error))
            else process.nextTick(callback)
            return false
        }
        if(this.error) return callback(this.error)
        callback()
        return true
    }

}

// Tests
    
test(`constructor: process context`, function() {
    const theChannel = new LoggerChannel({context: TEST_CONTEXT})
    assert.deepEqual(theChannel.context, TEST_CONTEXT, `channel context property should be equal to ${TEST_CONTEXT}`)
})

test(`constructor: process single level`, function() {
    const theChannel = new LoggerChannel({levels: CriticalLevel})
    assert.deepEqual(theChannel.levels, [CriticalLevel], `channel levels property should be equal to value`)
})

test(`constructor: process levels array`, function() {
    const theChannel = new LoggerChannel({levels: [CriticalLevel]})
    assert.deepEqual(theChannel.levels, [CriticalLevel], `channel levels property should be equal to value`)
})

test(`constructor: process invalid levels`, function() {
    assert.throws(() => new LoggerChannel({levels: `asdasdasd`}), new ChannelInstanceError(),`channel should throw an error with invalid level instance`)
})

test(`constructor: process formatter`, function() {
    const theFormatter = new LoggerFormatter()
    const theChannel = new LoggerChannel({formatter: theFormatter})
    assert.deepEqual(theChannel.formatter, theFormatter, `channel formatter property should be equal to provided in constructor formatter instance`)
})

test(`constructor: process validator`, function() {
    const theValidator = new LoggerValidator()
    const theChannel = new LoggerChannel({validator: theValidator})
    assert.deepEqual(theChannel.validator, theValidator, `channel validator property should be equal to provided in constructor validator instance`)
})

test(`constructor: process processor`, function() {
    const theProcessor = new LoggerProcessor()
    const theChannel = new LoggerChannel({processor: theProcessor})
    assert.deepEqual(theChannel.processor, theProcessor, `channel formatter property should be equal to provided in constructor formatter instance`)
})

test(`setLevels method: process single instance of LoggerLevels`, function() {
    const level = DebugLevel
    const theChannel = new LoggerChannel({levels: level})
    assert.deepStrictEqual(theChannel.levels, [level], `channel levels property should contain passed variable instance of LoggerLevel`)
})

test(`setLevels method: process array of LoggerLevels instances`, function() {
    const levels = [DebugLevel, CriticalLevel]
    const theChannel = new LoggerChannel({levels})
    assert.deepStrictEqual(theChannel.levels, levels, `channel levels property should contain passed array of instances of LoggerLevel`)
})

test(`setLevels method: process invalid instances of LoggerLevels`, function() {
    const levels = [DebugLevel, `asdasdsad`]
    assert.throws(() => new LoggerChannel({levels}), new ChannelInstanceError(), `channel should throw an error with invalid level instances`)
})

test(`setTransport method: process transport`, function() {
    const theChannel = new LoggerChannel()
    const theTransport = new TransportMock()

    theChannel.setTransport(theTransport)
    assert.deepEqual(theChannel.transport, theTransport, `channel transport property should be equal provided tranport instance`)
    assert.equal(theTransport.listenerCount("error"), 1, `channel should add error listener to the provided transport instance`)
})

test(`setTransport method: process multiple transport`, function() {
    const theChannel = new LoggerChannel()
    const theFirstTransport = new TransportMock()
    const theSecondTransport = new TransportMock()

    theChannel.setTransport(theFirstTransport)
    theChannel.setTransport(theSecondTransport)
    assert.deepEqual(theChannel.transport, theSecondTransport, `channel transport property should be equal provided tranport instance`)
    assert.equal(theFirstTransport.listenerCount("error"), 0, `channel should remove error listener from preview transport instance`)
    assert.equal(theSecondTransport.listenerCount("error"), 1, `channel should add error listener to the provided transport instance`)
})

test(`read method: process payload`, function(t, done) {
    const theChannel = new ChannelReadTest()

    const callback = (message) => {
        assert.ok(message instanceof LoggerMessage, `channel message should be instance of LoggerMessage`)
        assert.equal(message.get(`msg`), TEST_TEXT_MESSAGE, `channel message should contain msg property equal to ${TEST_TEXT_MESSAGE}`)
        done()
    }

    theChannel.on(`data`, callback)
    theChannel.add(TEST_TEXT_MESSAGE)
})

test(`write method: process payload`, function() {
    const theChannel = new WriteChannelTest()

    theChannel.write(TEST_TEXT_MESSAGE)

    const pri = 1 * 8 + DebugLevel.code
    const message = theChannel.output[0].chunk

    assert.ok(theChannel.output.length, `channel output should be equal to 1`)
    assert.ok(message instanceof LoggerMessage, `channel message should contain instance of LoggerMessage`)
    assert.equal(message.get("pri"), pri, `channel message pri property should be equal to ${pri}`)
    assert.equal(message.get(`msg`), TEST_TEXT_MESSAGE, `channel message msg property equal to ${TEST_TEXT_MESSAGE}`)
})

test(`write method: process payload with invalid level`, function(t, done) {
    const theCriticalChannel = new WriteChannelTest({levels: CriticalLevel})

    const callback = () => {
        const pri = 1 * 8 + CriticalLevel.code
        const output = theCriticalChannel.output
        const message = theCriticalChannel.output[0].chunk

        assert.equal(output.length, 1, `channel output should be equal to 1`)
        assert.equal(message.get("pri"), pri, `channel message pri property should be equal to ${pri}`)
        assert.deepEqual(message.get("level"), CriticalLevel, `channel message level property should be CriticalLevel`)
        done()
    } 

    theCriticalChannel.write(new LoggerMessage({level: DebugLevel, msg: TEST_TEXT_MESSAGE}))
    theCriticalChannel.write(new LoggerMessage({level: CriticalLevel, msg: TEST_TEXT_MESSAGE}), callback)
})

test(`write method: process payload with invalid publisher id`, function(t, done) {
    const theCriticalChannel = new WriteChannelTest({levels: CriticalLevel})

    const callback = () => {
        assert.equal(theCriticalChannel.output.length, 0, `channel output should be equal to 0`)
        done()
    } 

    theCriticalChannel.write(new LoggerMessage({pub: theCriticalChannel.id, level: DebugLevel, msg: TEST_TEXT_MESSAGE}))
    theCriticalChannel.write(new LoggerMessage({pub: theCriticalChannel.id, level: CriticalLevel, msg: TEST_TEXT_MESSAGE}), callback)
})

test(`process writing error`, function(t, done) {
    let i = 0
    const theChannel = new ErrorChannelTest()
    theChannel.error = TEST_ERROR
    theChannel.on(`error`, (err) => {
        assert.deepEqual(err, TEST_ERROR, `channel error should be equal ${TEST_ERROR}`)
        done()
    })
    theChannel.write(TEST_TEXT_MESSAGE)

})

test(`process error in blocked mode`, function(t, done) {
    let i = 0
    const theChannel = new ErrorChannelTest()
    theChannel.error = TEST_ERROR
    theChannel.drainMode = true

    theChannel.on(`error`, () => {})
    theChannel.write(`${++i} ${TEST_TEXT_MESSAGE}`)
    theChannel.write(`${++i} ${TEST_TEXT_MESSAGE}`)

    setTimeout(() => {
        assert.equal(theChannel.output.length, 1, `channel output shouldn\`t be empty`)
        assert.ok(theChannel.output[0].chunk instanceof LoggerMessage, `channel output chunk should contain instance of LoggerMessage`)
        assert.equal(theChannel.output[0].chunk.get(`msg`), `${1} ${TEST_TEXT_MESSAGE}`, `channel message should contain msg property equal to ${1} ${TEST_TEXT_MESSAGE}`)
        done()
    } , 10)    
})

test(`end method: process callback`, function(t, done) {
    const theChannel = new WriteChannelTest({levels: CriticalLevel})
    const theTransport = new TransportMock()

    theChannel.setTransport(theTransport)
    theChannel.end(done)

})

test(`end method: process last chunk`, function(t, done) {
    const theChannel = new WriteChannelTest()
    const theTransport = new TransportMock()

    const callback = () => {
        const pri = 1 * 8 + DebugLevel.code
        const message = theChannel.output[0].chunk
    
        assert.ok(theChannel.output.length, `channel output should be equal to 1`)
        assert.ok(message instanceof LoggerMessage, `channel message should contain instance of LoggerMessage`)
        assert.equal(message.get("pri"), pri, `channel message pri property should be equal to ${pri}`)
        assert.equal(message.get(`msg`), TEST_TEXT_MESSAGE, `channel message msg property equal to ${TEST_TEXT_MESSAGE}`)
        done()
    }

    theChannel.setTransport(theTransport)
    theChannel.end(TEST_TEXT_MESSAGE, callback)

    
})

test(`end method: process invalid chunk`, function(t, done) {
    const theChannel = new WriteChannelTest({levels: CriticalLevel})
    const theTransport = new TransportMock()

    const callback = () => {
        assert.ok(!theChannel.output.length, `channel output should be empty`)
        done()
    }

    theChannel.setTransport(theTransport)
    theChannel.end(new LoggerMessage({level: DebugLevel, msg: TEST_TEXT_MESSAGE}), "utf-8", callback)

})

