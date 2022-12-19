const fs = require(`node:fs`)
const path = require(`node:path`)
const util = require(`node:util`)
const assert = require("node:assert")
const { test } = require('node:test');
const dateFormat = require("date-format")
const { gunzipSync } = require("node:zlib")
const { LoggerFormatter } = require(`../lib/utils/util.formatter.js`)
const { LoggerFileChannel } = require(`../lib/channels/channel.file.js`)

// Enviroment


const TEST_ERROR = new Error("test_error_message")
const TEST_MESSAGE = "%s Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Mauris commodo quis imperdiet massa tincidunt nunc pulvinar. Neque gravida in fermentum et sollicitudin ac orci. Risus ultricies tristique nulla aliquet enim. Sed turpis tincidunt id aliquet. Id diam vel quam elementum pulvinar. Sit amet tellus cras adipiscing. Pellentesque sit amet porttitor eget dolor. Vestibulum morbi blandit cursus risus at. Diam maecenas ultricies mi eget mauris pharetra et ultrices."

const TEST_DIR = `./test`
const TEST_FILE_NAME = `channel.file.test(somestuff)`
const TEST_HOUR_DATE_FORMAT = "yyyy-MM-dd-hh"
const TEST_MINUTE_DATE_FORMAT = "yyyy-MM-dd-hh-mm"
const TEST_NUMBER_SIZE_LIMIT = Buffer.byteLength(TEST_MESSAGE)

// Tests

const formatter = new LoggerFormatter(`%msg%`)

function getPath(filename, ending, template = TEST_HOUR_DATE_FORMAT) {
    return path.join(fs.realpathSync(TEST_DIR), `${filename}_${dateFormat(template, new Date(new Date().toUTCString()))}${ending}`)  
}

test(`constructor: process path`, function(t, done) {
    const theChannel = new LoggerFileChannel(TEST_DIR, TEST_FILE_NAME)
    const filePath = getPath(TEST_FILE_NAME, ".log")
    theChannel.end(() => {
        assert.equal(theChannel.namespace, TEST_FILE_NAME, `channel namespace property should be equal to ${TEST_FILE_NAME}g`)
        assert.equal(theChannel.path, filePath, `channel path property should be equal to ${filePath}`)
        fs.unlinkSync(filePath)
        done()
    })
})

test(`constructor: process fileDateTemplate`, function(t, done) {
    const theChannel = new LoggerFileChannel(TEST_DIR, TEST_FILE_NAME, { fileDateTemplate: TEST_MINUTE_DATE_FORMAT })
    const filePath = getPath(TEST_FILE_NAME, ".log", TEST_MINUTE_DATE_FORMAT)
    theChannel.end(() => {
        assert.equal(theChannel.namespace, TEST_FILE_NAME, `channel namespace property should be equal to ${TEST_FILE_NAME}g`)
        assert.equal(theChannel.path, filePath, `channel path property should be equal to ${filePath}`)
        fs.unlinkSync(filePath)
        done()
    })
})

test(`write method: process payload`, function(t, done) {
    const filePath = getPath(TEST_FILE_NAME, ".log")

    const theChannel = new LoggerFileChannel(TEST_DIR, TEST_FILE_NAME, {
        formatter,
        fileSizeLimit: TEST_NUMBER_SIZE_LIMIT, 
    })

    theChannel.write(util.format(TEST_MESSAGE, 0), () => {
        const payload = fs.readFileSync(filePath).toString()
        const expectedMessage = util.format(TEST_MESSAGE, 0)    
        assert.equal(payload, expectedMessage, `file content should be equal to ${expectedMessage}`)
        theChannel.end(() => {
            fs.unlinkSync(filePath)
            done()
        }) 
    })
})

test(`process size rotation`, function(t, done) {
    
    const filePath = getPath(TEST_FILE_NAME, ".log")

    const theChannel = new LoggerFileChannel(TEST_DIR, TEST_FILE_NAME, {
        formatter,
        fileSizeLimit: TEST_NUMBER_SIZE_LIMIT, 
    })

    let i = 0

    theChannel.write(util.format(TEST_MESSAGE, i))
    theChannel.write(util.format(TEST_MESSAGE, ++i))
    theChannel.write(util.format(TEST_MESSAGE, ++i))
    theChannel.write(util.format(TEST_MESSAGE, ++i))
    theChannel.write(util.format(TEST_MESSAGE, ++i), () => {
        const payload = fs.readFileSync(filePath).toString()
        const expectedMessage = util.format(TEST_MESSAGE, i)    
        assert.equal(payload, expectedMessage, `file content should be equal to ${expectedMessage}`)
        theChannel.end(() => {
            fs.unlinkSync(filePath)
            done()
        }) 
    })
})

test(`process size rotation with compression`, function(t, done) {
    const zipPath = getPath(TEST_FILE_NAME, ".gz")
    const fFilePath = getPath(TEST_FILE_NAME, ".log")
    const sFilePath = getPath(TEST_FILE_NAME, "(1).log")
  
    const theChannel = new LoggerFileChannel(TEST_DIR, TEST_FILE_NAME, {
        formatter,
        compress: true,
        fileSizeLimit: TEST_NUMBER_SIZE_LIMIT * 2, 
    })

    theChannel.write(util.format(TEST_MESSAGE, 1))
    theChannel.write(util.format(TEST_MESSAGE, 2))
    theChannel.write(util.format(TEST_MESSAGE, 3))

    theChannel.end(() => {
        const payload = fs.readFileSync(zipPath)
        const expected = util.format(TEST_MESSAGE, 1) + util.format(TEST_MESSAGE, 2)
        assert.ok(!fs.existsSync(fFilePath), "compression source file should be removed")
        assert.ok(fs.existsSync(sFilePath),  `should be created new log with name ${sFilePath}`)
        assert.equal(gunzipSync(payload).toString(), expected, `file content should be equal to ${expected}`)
        fs.unlinkSync(zipPath)
        fs.unlinkSync(sFilePath)
        done()
    })

})

test(`process time rotation`, function(t, done) {
    const fFilePath = getPath(TEST_FILE_NAME, ".log")

    const theChannel = new LoggerFileChannel(TEST_DIR, TEST_FILE_NAME, {
        formatter,
        fileTimeLimit: "ss", 
    })

    theChannel.write(util.format(TEST_MESSAGE, 1))
    theChannel.write(util.format(TEST_MESSAGE, 2))
    theChannel.write(util.format(TEST_MESSAGE, 3))

    setTimeout(() => {
        theChannel.end(() => { 
            const payload = fs.readFileSync(fFilePath).toString()
            assert.equal(payload, "", `file content should be rotated and empty`)
            fs.unlinkSync(fFilePath)
            done()
        })
    }, 1200)
})

test(`process time rotation with compression`, function(t, done) {
    const zipPath = getPath(TEST_FILE_NAME, ".gz")
    const fFilePath = getPath(TEST_FILE_NAME, ".log")
    const sFilePath = getPath(TEST_FILE_NAME, "(1).log")

    const theChannel = new LoggerFileChannel(TEST_DIR, TEST_FILE_NAME, {
        formatter,
        compress: true,
        fileTimeLimit: "ss",
    })

    theChannel.write(util.format(TEST_MESSAGE, 1))
    theChannel.write(util.format(TEST_MESSAGE, 2))

    setTimeout(() => {
        theChannel.destroy()
        const payload = fs.readFileSync(zipPath)
        const expected = util.format(TEST_MESSAGE, 1) + util.format(TEST_MESSAGE, 2)
        assert.equal(gunzipSync(payload).toString(), expected, `file content should be equal to ${expected}`)
        assert.ok(fs.existsSync(sFilePath), `should be created new log with name ${sFilePath}`)
        assert.ok(!fs.existsSync(fFilePath), "compression source file should be removed")
        fs.unlinkSync(zipPath)
        fs.unlinkSync(sFilePath)
        done()
    }, 1000)
})

test(`process compression error`, function(t, done) {
    const zipPath = getPath(TEST_FILE_NAME, ".gz")
    const fFilePath = getPath(TEST_FILE_NAME, ".log")
    const sFilePath = getPath(TEST_FILE_NAME, "(1).log")

    const theChannel = new LoggerFileChannel(TEST_DIR, TEST_FILE_NAME, {
        compress: true,
        formatter,
        fileSizeLimit: TEST_NUMBER_SIZE_LIMIT, 
    })

    theChannel.on("error", (err) => {
        const state = theChannel._writableState
        assert.ok(state.destroyed, `channel should be destroyed`)
        assert.deepEqual(err, TEST_ERROR, `channel error should be equal ${TEST_ERROR}`)
        theChannel.on("close", () => {
            assert.ok(!fs.existsSync(zipPath), "channel zip file should be removed")
            fs.unlinkSync(fFilePath)
            fs.unlinkSync(sFilePath)
            done()
        })
    })

    theChannel.write(util.format(TEST_MESSAGE, 1))
    theChannel.write(util.format(TEST_MESSAGE, 2), () => {
        theChannel.destroy(TEST_ERROR)
    }) 

})

test(`destory method: process destroy compression`, function(t, done) {

    const fFilePath = getPath(TEST_FILE_NAME, ".log")
    const sFilePath = getPath(TEST_FILE_NAME, "(1).log")
    const tFilePath = getPath(TEST_FILE_NAME, "(2).log")

    const fZipPath = getPath(TEST_FILE_NAME, ".gz")
    const sZipPath = getPath(TEST_FILE_NAME, "(1).gz")

    const theChannel = new LoggerFileChannel(TEST_DIR, TEST_FILE_NAME, {
        formatter,
        compress: true,
        fileSizeLimit: TEST_NUMBER_SIZE_LIMIT, 
    })

    theChannel.on("close", () => {
        const fExpected = util.format(TEST_MESSAGE, 1)
        const sExpected = util.format(TEST_MESSAGE, 2)
        const tExpected = util.format(TEST_MESSAGE, 3)
        assert.equal(fs.readFileSync(fFilePath).toString(), fExpected, `first file content should be equal to ${fExpected}`)
        assert.equal(fs.readFileSync(sFilePath).toString(), sExpected, `second file content should be equal to ${sExpected}`)
        assert.equal(fs.readFileSync(tFilePath).toString(), tExpected, `third file content should be equal to ${tExpected}`)
        assert.ok(!fs.existsSync(fZipPath), "first pipeline zip file should be unexist")
        assert.ok(!fs.existsSync(sZipPath), "second pipeline zip file should be unexist" )
        fs.unlinkSync(fFilePath)
        fs.unlinkSync(sFilePath)
        fs.unlinkSync(tFilePath)
        done()
    })

    theChannel.write(util.format(TEST_MESSAGE, 1))
    theChannel.write(util.format(TEST_MESSAGE, 2))
    theChannel.write(util.format(TEST_MESSAGE, 3), () => theChannel.destroy())
    
})

test(`end method: process end compression`, function(t, done) {
    
    const fFilePath = getPath(TEST_FILE_NAME, ".log")
    const sFilePath = getPath(TEST_FILE_NAME, "(1).log")
    const tFilePath = getPath(TEST_FILE_NAME, "(2).log")

    const fZipPath = getPath(TEST_FILE_NAME, ".gz")
    const sZipPath = getPath(TEST_FILE_NAME, "(1).gz")

    const theChannel = new LoggerFileChannel(TEST_DIR, TEST_FILE_NAME, {
        formatter,
        compress: true,
        fileSizeLimit: TEST_NUMBER_SIZE_LIMIT, 
    })

    theChannel.write(util.format(TEST_MESSAGE, 1))
    theChannel.write(util.format(TEST_MESSAGE, 2))
    theChannel.write(util.format(TEST_MESSAGE, 3))

    theChannel.end(() => {
        const fExpected = util.format(TEST_MESSAGE, 1)
        const sExpected = util.format(TEST_MESSAGE, 2)
        assert.equal(gunzipSync(fs.readFileSync(fZipPath)).toString(), fExpected, `first zip file content should be equal to ${fExpected}`)
        assert.equal(gunzipSync(fs.readFileSync(sZipPath)).toString(), sExpected, `second zip file content should be equal to ${sExpected}`)
        assert.ok(!fs.existsSync(fFilePath), "first source file should be unexist")
        assert.ok(!fs.existsSync(sFilePath), "second source file should be unexist" )
        fs.unlinkSync(fZipPath)
        fs.unlinkSync(sZipPath)
        fs.unlinkSync(tFilePath)
        done()
    })
})
