const assert = require("node:assert")
const { describe, test } = require('node:test');
const { LoggerUtil } = require("../lib/util.js")

// Enviroment

const TEST_MESSAGE = `text message`
const TEST_MESSAGE_MODIFIED = `text message modified`

class UtilHandlerError extends Error {
    constructor() {
        super("LoggerUtilHandlerError: handler should be a function")
    }
}

// Tests

test(`constructor: process data`, function() { 
    function test(message) {}
    const theUtil = new LoggerUtil(["test", test])
    assert.equal(theUtil.get("test"), test, `util should bind value to key ${"test"}`)
})

test(`set: process handler`, function () {
    function test(message) {}
    const theUtil = new LoggerUtil()
    theUtil.set("test", test)
    assert.equal(theUtil.get("test"), test, `util should bind handler to key ${"test"}`)
})

test(`set: process invalid handler`, function() {
    const theUtil = new LoggerUtil()
    assert.throws(
        () => theUtil .set("test", "test"), 
        new UtilHandlerError(), 
        `util should throw and error with invalid handler type`
    )
})

test(`execute method: process single handler execute`, function() {
    const theUtil = new LoggerUtil()
    function test(message) {
        assert.equal(message, TEST_MESSAGE, "message should be equal to provided in execute method")
        assert.deepStrictEqual(this, theUtil, "function should be called with provided in execute context")
    }
    theUtil.set("key", test)
    theUtil.execute(theUtil, TEST_MESSAGE)
})

test(`execute method: process multiple handlers execute`, function() {
    const theUtil = new LoggerUtil()
    function testOne(message) { return TEST_MESSAGE_MODIFIED }
    function testTwo(message) {
        assert.equal(message, TEST_MESSAGE_MODIFIED, "message should be equal to provided in execute method")
        return message
    }
    theUtil.set("one", testOne)
    theUtil.set("two", testTwo)
    assert.equal(theUtil.execute(theUtil, TEST_MESSAGE), TEST_MESSAGE_MODIFIED, "execute should return modified message")
})
