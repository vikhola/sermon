const assert = require("node:assert")
const { test } = require('node:test');
const { randomUUID } = require("node:crypto")
const util = require("node:util")
const { LoggerMessage } = require(`../lib/message.js`)
const { LoggerFormatter } = require("../lib/utils/util.formatter.js")

// Enviroment

const TEST_TEXT_MESSAGE = `text message`
const TEST_OBJECT_MESSAGE = { id: randomUUID(), text: "text", number: 123, method: function() {}}
const TEST_CUSTOM_TEMPLATE = `%msg% \n`

// Tests

test(`constructor: process template`, function() { 
    const template = `%strategy%`
    const theFormatter = new LoggerFormatter(template)
    assert.equal(theFormatter.template, template, `formatter template should be equal to ${template}`)
})

test(`execute method: process buffer`, function() {
    const buffer = Buffer.from(TEST_TEXT_MESSAGE)
    const theFormatter = new LoggerFormatter()
    assert.equal(theFormatter.execute(null, buffer), TEST_TEXT_MESSAGE, `should be returned passed message if test type of Buffer`)
})

test(`execute method: process non LoggerMessage instance`, function() {
    const theFormatter = new LoggerFormatter()
    const expected = util.format(TEST_OBJECT_MESSAGE)
    assert.equal(theFormatter.execute(null, TEST_OBJECT_MESSAGE), expected, `should be returned formatted by util lib message if test isn\`t type of Buffer or instance of LoggerMessage`)
})

test(`execute method: process custom template`, function() {
    const theLoggerDTO = new LoggerMessage({msg: TEST_OBJECT_MESSAGE})
    const theFormatter = new LoggerFormatter(TEST_CUSTOM_TEMPLATE)
    const expected = `${util.format(TEST_OBJECT_MESSAGE)} \n`
    assert.equal(theFormatter.execute(null, theLoggerDTO), expected, `should be returned transformed by custom template message`)
})

test(`execute method: process default template`, function() {
    const theLoggerDTO = new LoggerMessage({msg: TEST_OBJECT_MESSAGE})
    const theFormatter = new LoggerFormatter()
    const expected = `<-> - - - - - - - ${util.format(TEST_OBJECT_MESSAGE)} \n`
    assert.equal(theFormatter.execute(null, theLoggerDTO), expected, `should be returned transformed by default template message`)
})

test(`execute method: process structure data`, function() {
    const theLoggerDTO = new LoggerMessage({sd: TEST_OBJECT_MESSAGE})
    const theFormatter = new LoggerFormatter()
    const expected = `<-> - - - - - - [${TEST_OBJECT_MESSAGE.id} text=${TEST_OBJECT_MESSAGE.text} number=${TEST_OBJECT_MESSAGE.number} method=[Function: method]] - \n`
    assert.equal(theFormatter.execute(null, theLoggerDTO), expected, `should be returned transformed by default template message`)
})

test(`execute method: process structure data array`, function() {
    const theLoggerDTO = new LoggerMessage({sd: [TEST_OBJECT_MESSAGE, TEST_OBJECT_MESSAGE]})
    const theFormatter = new LoggerFormatter()
    const expected = `<-> - - - - - - [${TEST_OBJECT_MESSAGE.id} text=${TEST_OBJECT_MESSAGE.text} number=${TEST_OBJECT_MESSAGE.number} method=[Function: method]][${TEST_OBJECT_MESSAGE.id} text=${TEST_OBJECT_MESSAGE.text} number=${TEST_OBJECT_MESSAGE.number} method=[Function: method]] - \n`
    assert.equal(theFormatter.execute(null, theLoggerDTO), expected, `should be returned transformed by default template message`)
})
