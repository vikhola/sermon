const assert = require("node:assert")
const { test } = require('node:test');
const util =require(`node:util`)
const { DebugLevel } = require(`../lib/levels.js`)
const { LoggerMessage } = require(`../lib/message.js`)

// Enviroment

const TEST_MESSAGE = `goodbye world`
const timestamp = new Date().toISOString()
const TEST_ERROR = new Error(`test`)
const TEST_CONTENT = Object.freeze({
    version: 1,
    msg: TEST_MESSAGE,
    hostname: `host_name`,
    app_name: `app_name`,
    timestamp,
    msgid: 10,
})
const TEST_STRINGIFY_CONTENT = {
    level: DebugLevel,
    version: 1,
    number: 1,
    format: true,
    procid: 1,
    facility: 1,
    msg: TEST_MESSAGE,
    hostname: `host_name`,
    app_name: `app_name`,
    bigint: BigInt(100),
    func: () => {},
    arr: [`a`, 1, () => {}, {nestedArrObj: `testNestedArrObj`}, TEST_ERROR],
    nestedArr: [[`a`, `b`, {nestedArrObj: `testNestedArrObj`}]],
    error: TEST_ERROR,
}

// Tests

test(`constructor: process set content`, function() { 
    const theDTO = new LoggerMessage(TEST_CONTENT) 
    Object.entries(TEST_CONTENT).forEach(([key, value]) => {
        assert.deepEqual(theDTO.get(key), value, `message should set provided ${key} to ${value}`)
    })
})
    
test(`toString method: process stringify basic content`, function (){
    const theDTO = new LoggerMessage(TEST_STRINGIFY_CONTENT)
    const stringify = (value) => {
        if(typeof value !== `object`) return util.format(value)
        return Object.getOwnPropertyNames(value).reduce((acc, key) => { 
            return Object.assign(acc, {[key]: util.format(value[key]) })
        }, {})
    }
    const expected = JSON.stringify(Object.getOwnPropertyNames(TEST_STRINGIFY_CONTENT).reduce((acc, name) => {
        const value = TEST_STRINGIFY_CONTENT[name]
        if(name === `level`) return Object.assign(acc, {[name]: value.name})
        else if(name === `arr`) return Object.assign(acc, { [name]:  value.map(value => stringify(value)) })
        else if(name === `nestedArr`) return Object.assign(acc, { [name]:  [value[0].map(value => stringify(value))] })
        else return Object.assign(acc, {[name]: stringify(value)})
    }, {}))
    assert.deepEqual(JSON.parse(theDTO.toString()), JSON.parse(expected), `message after serialize should return value equal to fixture`)
})
        