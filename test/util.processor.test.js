const assert = require("node:assert")
const os = require("node:os")
const { describe, test } = require('node:test');
const util = require("node:util")
const { randomUUID } = require("node:crypto")
const { DebugLevel, CriticalLevel } = require("../lib/levels.js")
const { LoggerMessage } = require(`../lib/message.js`)
const { LoggerProcessor } = require("../lib/utils/util.processor.js");

// Enviroment

const TEST_TEXT_MESSAGE = `text message`
const TEST_CONTEXT = {  id: randomUUID()}

// Tests

test(`execute method: process object`, function() {
    const theProcessor = new LoggerProcessor()
    const result = theProcessor.execute(null, {msg: TEST_TEXT_MESSAGE})
    assert.ok(result instanceof LoggerMessage, `returned value should be instance of LoggerMessage`)
    assert.equal(result.get("msg"), TEST_TEXT_MESSAGE, `returned LoggerMessage msg should be equal to ${TEST_TEXT_MESSAGE}`)
})

test(`execute method: process non object`, function() {
    const theProcessor = new LoggerProcessor()
    const result = theProcessor.execute(null, TEST_TEXT_MESSAGE)
    assert.ok(result instanceof LoggerMessage, `returned value should be instance of LoggerMessage`)
    assert.equal(result.get("msg"), TEST_TEXT_MESSAGE, `returned LoggerMessage msg should be equal to ${TEST_TEXT_MESSAGE}`)
})

test(`execute method: process LoggerMessage instance`, function() {
    const theMessage = new LoggerMessage({msg: TEST_TEXT_MESSAGE})
    const theProcessor = new LoggerProcessor()
    const result = theProcessor.execute(null, theMessage)
    assert.ok(result instanceof LoggerMessage, `returned value should be instance of LoggerMessage`)
    assert.equal(result.get("msg"), TEST_TEXT_MESSAGE, `returned LoggerMessage msg should be equal to ${TEST_TEXT_MESSAGE}`)
})

test(`execute method: process defined message level`, function() {
    const theProcessor = new LoggerProcessor()
    const theMessage = new LoggerMessage({level: CriticalLevel})
    const result = theProcessor.execute(null, theMessage)
    assert.equal(result.get("level"), CriticalLevel, `returned LoggerMessage level should be equal to ${util.format(CriticalLevel)}`)
})

test(`execute method: process non defined message level`, function() {
    const theProcessor = new LoggerProcessor()
    const theMessage = new LoggerMessage()
    const result = theProcessor.execute(null, theMessage)
    assert.equal(result.get("level"), DebugLevel, `returned LoggerMessage level should be equal to ${util.format(DebugLevel)}`)
})

test(`execute method: process defined message priority`, function() {
    const theProcessor = new LoggerProcessor()
    const theMessage = new LoggerMessage({pri: 123})
    const result = theProcessor.execute(null, theMessage)
    assert.equal(result.get("pri"), 123, `returned LoggerMessage pri should be equal to ${123}`)
})

test(`execute method: process  non defined message priority`, function() {
    const theProcessor = new LoggerProcessor()
    const theMessage = new LoggerMessage()
    const result = theProcessor.execute(null, theMessage)
    assert.equal(result.get("pri"), 15, `returned LoggerMessage pri should be equal to ${15}`)
})

test(`execute method: process defined message publisher`, function() {
    const id = randomUUID()
    const theProcessor = new LoggerProcessor()
    const theMessage = new LoggerMessage({pub: id})
    const result = theProcessor.execute(null, theMessage)
    assert.equal(result.get("pub"), id, `returned LoggerMessage pub should be equal to ${id}`)
})

test(`execute method: process message publisher without context`, function() {
    const theProcessor = new LoggerProcessor()
    const theMessage = new LoggerMessage()
    const result = theProcessor.execute(null, theMessage)
    assert.equal(result.get("pub"), undefined, `returned LoggerMessage pub should be equal undefined`)
})

test(`execute method: process message publisher with context`, function() {
    const theProcessor = new LoggerProcessor()
    const theMessage = new LoggerMessage()
    const result = theProcessor.execute(TEST_CONTEXT, theMessage)
    assert.equal(result.get("pub"), TEST_CONTEXT.id, `returned LoggerMessage pub should be equal to ${TEST_CONTEXT.id}`)
})

test(`execute method: process defined message timestamp`, function() {
    const timestamp = new Date()
    const theProcessor = new LoggerProcessor()
    const theMessage = new LoggerMessage({timestamp})
    const result = theProcessor.execute(TEST_CONTEXT, theMessage)
    assert.equal(result.get("timestamp"), timestamp, `returned LoggerMessage timestamp should be equal to ${timestamp}`)
})

test(`execute method: process non defined message timestamp`, function() {
    const theProcessor = new LoggerProcessor()
    const theMessage = new LoggerMessage()
    const timestamp = new Date().toISOString()
    const result = theProcessor.execute(TEST_CONTEXT, theMessage)
    assert.equal(result.get("timestamp"), timestamp, `returned LoggerMessage timestamp should be equal to ${timestamp}`)
})
