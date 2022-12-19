const assert = require("node:assert")
const { describe, test } = require('node:test');
const { Writable } = require("node:stream")
const { LoggerConsoleChannel } = require("../lib/channels/channel.console.js")
const { LoggerFormatter } = require("../lib/utils/util.formatter.js")
const { LoggerMessage } = require("../lib/message.js")
const LoggerLevels = require("../lib/levels.js")

// Enviroment

const TEST_TEXT_MESSAGE = "text test message"
const TEST_OBJECT_MESSAGE = new LoggerMessage({level: LoggerLevels.CriticalLevel, msg: "object test message"})

const theFormatter = new LoggerFormatter("%msg%")
class StreamMock extends Writable {
    buffer = []
 
    constructor(options) {
        super(options)
    }

    find(cb) {
        return this.buffer.find(cb)
    }

    _write(chunk, encoding, callback) {
        this.buffer.push(chunk)
        callback()
    }

}

// Tests

test("constructor process color", function() {
    const theChannel = new LoggerConsoleChannel({color: true})
    assert.equal(theChannel.color, true, "channel color property should be equal to true")
})

test("constructor process transport", function() {
    const theChannel = new LoggerConsoleChannel({color: true})
    assert.deepStrictEqual(theChannel.transport, process.stdout, "channel transport property should be equal to process.stdout")
})

test("write method: process payload", function(t, done) {
    const theChannel = new LoggerConsoleChannel({ formatter: theFormatter })
    const theTransport = new StreamMock()
    const expectedMessage = `${"\u001b[34m"}${TEST_TEXT_MESSAGE}${"\u001b[0m"}`
    theChannel.transport = theTransport

    theChannel.write(TEST_TEXT_MESSAGE, () => {
        const textMessage = theTransport.buffer[0].toString()
        assert.equal(textMessage, expectedMessage, `channel output should be equal to ${expectedMessage}`)
        done()
    })
})

test("write method: process payload with colorize", function(t, done) {
    const theChannel = new LoggerConsoleChannel({ color: true, formatter: theFormatter })
    const theTransport = new StreamMock()
    const expectedMessage = `${LoggerLevels.CriticalLevel.color}${TEST_OBJECT_MESSAGE.get("msg")}${"\u001b[0m"}`
    theChannel.transport = theTransport

    theChannel.write(TEST_OBJECT_MESSAGE, () => {
        const textMessage = theTransport.buffer[0].toString()
        assert.equal(textMessage, expectedMessage, `channel output should be equal to ${expectedMessage}`)
        done()
    })

})

