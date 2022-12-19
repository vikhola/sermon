const assert = require("node:assert")
const { describe, test } = require('node:test');
const os = require(`node:os`)
const util = require("node:util")
const process = require(`node:process`)
const { Logger } = require(`../lib/logger.js`)
const { LoggerChannel } = require(`../lib/channel.js`)
const { LoggerFormatter } = require(`../lib/utils/util.formatter.js`)
const { LoggerMessage } = require(`../lib/message.js`)
const LoggerLevels = require(`../lib/levels.js`);

// Enviroment

const TEST_TEXT_MESSAGE = `text test message`
const TEST_ERROR_MESSAGE = `TEST_ERROR`

class LoggerTestError extends Error {
    constructor() { 
        super(TEST_ERROR_MESSAGE) 
    }
}

class LoggerChannelInstanceError extends Error {
    constructor() { 
        super("LoggerChannelError: Channel should be instance of LoggerChannel") 
    }
}

class WritableChannelMock extends LoggerChannel {

    constructor(callback) { 
        super()
        this.callback = callback
    }

    _write(chunk, encoding, callback) {
        this.callback(chunk, callback)
    }

}

class ReadableChannelMock extends LoggerChannel {
    constructor(options) { super(options)}

    error() { 
        this.emit(`error`, new LoggerTestError) 
    }

    _write(chunk, encoding, callback) {
        this.push(chunk)
        callback()
    }

}

class EndChannelMock extends LoggerChannel {

    constructor(error) { 
        super()
        this.error = error
    }

    _final(callback) {
        setTimeout(() => callback(this.error), 1000)
    }

    _destroy(err, callback) {
        this.emit("error", this.error)
        setTimeout(() => callback(err), 1000)
    }

}

// Tests
    
test(`constructor: process context`, function() {
    const context = { procid: process.pid, version: 1, facility: 1, hostname: os.hostname() }
    const theLogger = new Logger()
    assert.deepEqual(theLogger.context, context, `logger context property should be equal to ${util.format(context)}`)
})

test(`constructor: process additional context`, function() {
    const context = { procid: process.pid, version: 1, facility: 1, hostname: os.hostname() }
    const theLogger = new Logger({context: { test: `test` }})
    assert.deepEqual(theLogger.context, {...context, test: `test` }, `logger context property should be equal to ${util.format({...context, test: `test` })}`)
})

test(`constructor: process rebind context`, function() {
    const context = { procid: process.pid, version: 1, facility: 1, hostname: os.hostname() }
    const theLogger = new Logger({context: { version: 2 }})
    assert.deepEqual(theLogger.context, {...context, version: 2 }, `logger context property should be equal to ${util.format({...context, version: 2 })}`)
}) 

test(`constructor: process formatter`, function() {
    const theLogger = new Logger({context: { version: 2 }})
    assert.ok(theLogger.formatter instanceof LoggerFormatter, `logger formatter property should be instance of LoggerFormatter`)
})

test(`constructor: process levels methods`, function() {
    const levels = Object.values(LoggerLevels)
    const theLogger = new Logger()
    levels.forEach(level => assert.ok(theLogger[level.name], `logger should have an method ${level.name}`))
})

test(`addChannel method: process instance of LoggerChannel`, function() {
    const theLogger = new Logger()
    const theChannel = new LoggerChannel()
    theLogger.addChannel(theChannel)
    assert.ok(theLogger._channels.has(theChannel), `channel _channels property should includes the provided channel`)
})

test(`addChannel method: process invalid instance of LoggerChannel`, function() {
    const theLogger = new Logger()
    assert.throws(() => theLogger.addChannel({}), new LoggerChannelInstanceError(), `logger should throw an error with invalid formatter instances`)
})

test(`emerg method: Lprocess write`, function() {
    const theLogger = new Logger()
    const theChannel = new WritableChannelMock((chunk) => {
        assert.ok(chunk instanceof LoggerMessage, `chunk should be instance of LoggerMessage`)
        assert.equal(chunk.get(`msg`), TEST_TEXT_MESSAGE, `chunk should contain msg property equal to ${TEST_TEXT_MESSAGE}`)
        assert.equal(chunk.get("level"), LoggerLevels.EmergencyLevel, "chunk level shoud be equal to EmergencyLevel")
    })
    theLogger.addChannel(theChannel)
    theLogger.emerg(TEST_TEXT_MESSAGE)
})

test(`alert method: process write`, function() {
    const theLogger = new Logger()
    const theChannel = new WritableChannelMock((chunk) => {
        assert.ok(chunk instanceof LoggerMessage, `chunk should be instance of LoggerMessage`)
        assert.equal(chunk.get(`msg`), TEST_TEXT_MESSAGE, `chunk should contain msg property equal to ${TEST_TEXT_MESSAGE}`)
        assert.equal(chunk.get("level"), LoggerLevels.AlertLevel, "chunk level shoud be equal to AlertLevel")
    })
    theLogger.addChannel(theChannel)
    theLogger.alert(TEST_TEXT_MESSAGE)
})

test(`crit method: process write`, function() {
    const theLogger = new Logger()
    const theChannel = new WritableChannelMock((chunk) => {
        assert.ok(chunk instanceof LoggerMessage, `chunk should be instance of LoggerMessage`)
        assert.equal(chunk.get(`msg`), TEST_TEXT_MESSAGE, `chunk should contain msg property equal to ${TEST_TEXT_MESSAGE}`)
        assert.equal(chunk.get("level"), LoggerLevels.CriticalLevel, "chunk level shoud be equal to CriticalLevel")
    })
    theLogger.addChannel(theChannel)
    theLogger.crit(TEST_TEXT_MESSAGE)
})

test(`error method: process write`, function() {
    const theLogger = new Logger()
    const theChannel = new WritableChannelMock((chunk) => {
        assert.ok(chunk instanceof LoggerMessage, `chunk should be instance of LoggerMessage`)
        assert.equal(chunk.get(`msg`), TEST_TEXT_MESSAGE, `chunk should contain msg property equal to ${TEST_TEXT_MESSAGE}`)
        assert.equal(chunk.get("level"), LoggerLevels.ErrorLevel, "chunk level shoud be equal to ErrorLevel")
    })
    theLogger.addChannel(theChannel)
    theLogger.error(TEST_TEXT_MESSAGE)
})

test(`warn method: process write`, function() {
    const theLogger = new Logger()
    const theChannel = new WritableChannelMock((chunk) => {
        assert.ok(chunk instanceof LoggerMessage, `chunk should be instance of LoggerMessage`)
        assert.equal(chunk.get(`msg`), TEST_TEXT_MESSAGE, `chunk should contain msg property equal to ${TEST_TEXT_MESSAGE}`)
        assert.equal(chunk.get("level"), LoggerLevels.WarningLevel, "chunk level shoud be equal to WarningLevel")
    })
    theLogger.addChannel(theChannel)
    theLogger.warn(TEST_TEXT_MESSAGE)
})

test(`note method: process write`, function() {
    const theLogger = new Logger()
    const theChannel = new WritableChannelMock((chunk) => {
        assert.ok(chunk instanceof LoggerMessage, `chunk should be instance of LoggerMessage`)
        assert.equal(chunk.get(`msg`), TEST_TEXT_MESSAGE, `chunk should contain msg property equal to ${TEST_TEXT_MESSAGE}`)
        assert.equal(chunk.get("level"), LoggerLevels.NoticeLevel, "chunk level shoud be equal to NoticeLevel")
    })
    theLogger.addChannel(theChannel)
    theLogger.note(TEST_TEXT_MESSAGE)
})

test(`info method: process write`, function() {
    const theLogger = new Logger()
    const theChannel = new WritableChannelMock((chunk) => {
        assert.ok(chunk instanceof LoggerMessage, `chunk should be instance of LoggerMessage`)
        assert.equal(chunk.get(`msg`), TEST_TEXT_MESSAGE, `chunk should contain msg property equal to ${TEST_TEXT_MESSAGE}`)
        assert.equal(chunk.get("level"), LoggerLevels.InfoLevel, "chunk level shoud be equal to InfoLevel")
    })
    theLogger.addChannel(theChannel)
    theLogger.info(TEST_TEXT_MESSAGE)
})

test(`debug method: process write`, function() {
    const theLogger = new Logger()
    const theChannel = new WritableChannelMock((chunk) => {
        assert.ok(chunk instanceof LoggerMessage, `chunk should be instance of LoggerMessage`)
        assert.equal(chunk.get(`msg`), TEST_TEXT_MESSAGE, `chunk should contain msg property equal to ${TEST_TEXT_MESSAGE}`)
        assert.equal(chunk.get("level"), LoggerLevels.DebugLevel, "chunk level shoud be equal to DebugLevel")
    })
    theLogger.addChannel(theChannel)
    theLogger.debug(TEST_TEXT_MESSAGE)
})

test(`process readable LoggerChannel`, function(t, done) {
    const theLogger = new Logger()
    const theReadableChannel = new ReadableChannelMock()
    const theWritableChannel = new WritableChannelMock((chunk) => {
        assert.ok(chunk instanceof LoggerMessage, `chunk should be instance of LoggerMessage`)
        assert.equal(chunk.get("pub"), theReadableChannel.id, `chunk id property should be equal to ${theReadableChannel.id}`)
        assert.equal(chunk.get(`msg`), TEST_TEXT_MESSAGE, `chunk should contain msg property equal to ${TEST_TEXT_MESSAGE}`)
        done()
    })
    theLogger.addChannel(theReadableChannel)
    theLogger.addChannel(theWritableChannel)
    theReadableChannel.write(TEST_TEXT_MESSAGE)
})      

test(`process LoggerChannel error`, function(t, done) {
    const theLogger = new Logger()
    const theReadableChannel = new ReadableChannelMock()
    const theWritableChannelMock = new WritableChannelMock((chunk) => {
        assert.ok(chunk instanceof LoggerMessage, `chunk should be instance of LoggerMessage`)
        assert.equal(chunk.get("pub"), theReadableChannel.id, `chunk id property should be equal to ${theReadableChannel.id}`)
        assert.deepEqual(chunk.get(`msg`), new LoggerTestError, `chunk should contain msg property equal to ${"LoggerTestError"}}`)
        assert.deepStrictEqual(chunk.get(`level`), LoggerLevels.CriticalLevel, `dto should be sended with critical level`)
        done()
    })
    theLogger.addChannel(theReadableChannel)
    theLogger.addChannel(theWritableChannelMock)
    theReadableChannel.error()
})

test(`end method: process close`, function(t, done) {
    const theLogger = new Logger()
    const theWritableChannelMock = new EndChannelMock()
    theLogger.addChannel(theWritableChannelMock)
    theLogger.end(() => {
        assert.ok(theWritableChannelMock.writableEnded, "writable channel should be ended")
        assert.ok(!theLogger._channels.has(theWritableChannelMock), "writable channel should be removed")
        done()
    })
})

test(`end method: process error`, function(t, done) {
    const theLogger = new Logger()
    const theWritableChannelMock = new EndChannelMock(new LoggerTestError)
    theLogger.addChannel(theWritableChannelMock)
    theLogger.on("error", (error) => {
        assert.deepEqual(error, new LoggerTestError, `logger after end should emmit error equal to LoggerTestError`)
    })
    theLogger.end(done)
})

test(`destroy method: process destroy`, function(t, done) {
    const theLogger = new Logger()
    const theWritableChannelMock = new WritableChannelMock()
    theLogger.addChannel(theWritableChannelMock)
    theLogger.on("close", () => {
        assert.ok(theWritableChannelMock.destroyed, "writable channel should be destroyed")
        done()
    })
    theLogger.destroy()
})

test(`destroy method: process error`, function(t, done) {
    const theLogger = new Logger()
    const theWritableChannelMock = new EndChannelMock(new LoggerTestError)
    theLogger.addChannel(theWritableChannelMock)
    theLogger.on("error", (error) => {
        assert.deepEqual(error, new LoggerTestError, `logger after end should emmit error equal to LoggerTestError`)
        done()
    })
    theLogger.destroy()
})

