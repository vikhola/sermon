const assert = require("node:assert")
const { describe, test } = require('node:test');
const { randomUUID } = require("node:crypto")
const { LoggerMessage } = require(`../lib/message.js`)
const { LoggerValidator } = require("../lib/utils/util.validator.js")
const { DebugLevel, CriticalLevel } = require("../lib/levels.js")

// Enviroment

const TEST_TEXT_MESSAGE = `text message`
const TEST_CONTEXT = { id: randomUUID(), levels: [DebugLevel] }

// Tests

test(`execute method: process non LoggerMessage instance`, function() {
    const theProcessor = new LoggerValidator()
    const result = theProcessor.execute(null, TEST_TEXT_MESSAGE)
    assert.ok(result, `returned value should be equal true`)
})

test(`execute method: process valid level`, function() {
    const theProcessor = new LoggerValidator()
    const theMessage = new LoggerMessage({level: DebugLevel})
    const result = theProcessor.execute(TEST_CONTEXT, theMessage)
    assert.ok(result, `value should be equal true`)
})

test(`execute method: process invalid level`, function() {
    const theProcessor = new LoggerValidator()
    const theMessage = new LoggerMessage({level: CriticalLevel})
    const result = theProcessor.execute(TEST_CONTEXT, theMessage)
    assert.ok(!result, `value should be equal false`)
})

test(`execute method: process valid publisher`, function() {
    const theProcessor = new LoggerValidator()
    const theMessage = new LoggerMessage({pub: randomUUID()})
    const result = theProcessor.execute(TEST_CONTEXT, theMessage)
    assert.ok(!result, `value should be equal true`)
})

test(`execute method: process invalid publisher`, function() {
    const theProcessor = new LoggerValidator()
    const theMessage = new LoggerMessage({pub: TEST_CONTEXT.id})
    const result = theProcessor.execute(TEST_CONTEXT, theMessage)
    assert.ok(!result, `value should be equal true`)
})