const assert = require("node:assert")
const { describe, test } = require('node:test');
const { LoggerTimer } = require("../lib/utils/util.timer.js")

// Enviroment

const TEST_MESSAGE = `text message`

class TimerTemplateError extends Error {

    constructor() {
        super("TimerTemplateError: time is not found.")
    }

}

class TimerCallbackError extends Error {

    constructor() {
        super("TimerTemplateError: callback should be a function.")
    }

}

// Tests


test(`constructor: process time`, function() { 
    const theTimer = new LoggerTimer("mm")
    assert.equal(theTimer.delay, "mm", `util should set delay to ${"mm"}`)
    theTimer.stop()
})

test(`execute method: process invalid time template`, function() {
    const theTimer = new LoggerTimer("aa")
    assert.throws(() => theTimer.execute(null, () => TEST_MESSAGE), new TimerTemplateError(), `timer should throw an error with invalid handler type`)
    theTimer.stop()
})

test(`execute method: process invalid handler`, function() {
    const theTimer = new LoggerTimer("ss")
    assert.throws(() => theTimer.execute(null, TEST_MESSAGE), new TimerCallbackError(), `timer should throw an error with invalid handler type`)
    theTimer.stop()
})

test(`execute method: process callback execution`, function(done) {
    const theTimer = new LoggerTimer("ss")
    const tracker = new assert.CallTracker();
    const execute = () => TEST_MESSAGE
    const callback = tracker.calls(execute, 2);
    theTimer.execute(null, callback)
    setTimeout(() => {
        theTimer.stop()
        done()
    }, 2500)
})

test(`stop method: process clear timeout`, function() {
    const theTimer = new LoggerTimer("ss")
    const execute = () => TEST_MESSAGE
    theTimer.execute(null, execute)
    theTimer.stop()
    assert.ok(theTimer.timer._destroyed, "timer timeout should be destroyed")
})
