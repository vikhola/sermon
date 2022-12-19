const fs = require("node:fs");
const fsp = require("node:fs/promises")
const path = require("node:path");
const byteFormat = require("bytes")
const dateFormat = require("date-format")
const { pipeline } = require("node:stream/promises");
const { createGzip } = require("node:zlib");
const { LoggerTimer } = require("../utils/util.timer.js")
const { LoggerChannel } = require("../channel.js");

const FILE_CHANNEL_EVENT_RESUME = "resume"
const FILE_CHANNEL_TEXT_OUTPUT_OPTIONS = { flags: "w", encoding: "utf-8" };
const FILE_CHANNEL_BYTE_OUTPUT_OPTIONS = { flags: "w", encoding: "binary" };

class FileChannelMessageSizeError extends Error {
    constructor() {
        super("ChannelSizeError: Message size over defined file size limit")
    } 
}

class LoggerFileChannel extends LoggerChannel  {
    dir
    compress = false
    filename
    namespace
    bytesWritten = 0
    fileCreatedAt
    fileDateTemplate = "yyyy-MM-dd-hh"
    fileRotationSize
    fileRotationTimer
    _pipelines = new Set()
    _pipelinesAbortController = new AbortController()
    
    constructor(dir, namespace, options = {}) {
        super(options)
        const dirPath = path.join(process.cwd(), dir)
        if(!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
        this.dir = dir
        this.namespace = namespace 
        this.compress = options.compress
        if(options.fileDateTemplate) this.fileDateTemplate = options.fileDateTemplate
        if(options.fileSizeLimit) this.fileRotationSize = byteFormat.parse(options.fileSizeLimit)
        if(options.fileTimeLimit) {
            this.fileRotationTimer = new LoggerTimer(options.fileTimeLimit)
            this.fileRotationTimer.execute(this, this._rotateFile.bind(this))
        }
        this._createTransport()
    }

    _write(chunk, encoding, callback) {
        const data = this.formatter.execute(this, chunk)
        const messageSize = Buffer.byteLength(data)
        const pendingFileSize = this.bytesWritten + messageSize 
        if(this.fileRotationSize) {
            if(messageSize > this.fileRotationSize) return callback(new FileChannelMessageSizeError())
            if(pendingFileSize > this.fileRotationSize) this._rotateFile()
        }
        if(this.isPaused()) this.once(FILE_CHANNEL_EVENT_RESUME, () => this._write(data, encoding, callback))
        else return this.transport.write(data, encoding, (err) => {
            this.bytesWritten += messageSize
            callback(err)
        })
    }

    _final(callback) {
        if(this.fileRotationTimer) this.fileRotationTimer.stop()
        if(this._pipelines.size) this.transport.end(() => {
            Promise.all(this._pipelines.values()).then(() => callback())
        })  
        else this.transport.end(callback)
    }

    _destroy(err, callback) {
        this.transport.destroy()
        if(this.fileRotationTimer) this.fileRotationTimer.stop()
        if(this._pipelines.size) {
            Promise.all(this._pipelines.values()).then(() => callback(err))
            this._pipelinesAbortController.abort()
        }
        else callback(err)
    }

    _rotateFile() {
        this.pause()
        this.bytesWritten = 0
        if(this.compress) return this.transport.end(() => {
            this._compressFile()
            this._createTransport()
        }) 
        else return this.transport.end(() => 
            fsp.unlink(this.path)
            .then(() => this._createTransport())
            .catch(this._handleErrorEvent)
        ) 
    }  

    _compressFile() {
        const destPath = path.join(fs.realpathSync(this.dir), `${this.filename}.gz`) 
        const sourcePath = this.path
        const theReadable = fs.createReadStream(sourcePath)
        const theWritable = fs.createWriteStream(destPath, FILE_CHANNEL_BYTE_OUTPUT_OPTIONS)
        const thePipeline = pipeline(theReadable, createGzip(), theWritable, { signal: this._pipelinesAbortController.signal })
        .then(() => {
            return fsp.unlink(sourcePath)
        }, (err) => {
            if(!(err instanceof AbortSignal)) this._handleErrorEvent(err)
            return fsp.unlink(destPath)
        })
        .catch(this._handleErrorEvent)
        .finally(() => this._pipelines.delete(thePipeline))
        this._pipelines.add(thePipeline)
    }

    _createTransport() {
        const currTimestamp = new Date(new Date().toUTCString())
        const currDateFormat = dateFormat(this.fileDateTemplate, currTimestamp)
        if(this.compress && this.fileCreatedAt === currDateFormat) {
            const count = parseInt((this.filename.match(/\(([^)]+)\)$/)?.at(1) || 0))
            this.filename = `${this.namespace}_${currDateFormat}(${count + 1})`
        } else {
            this.filename = `${this.namespace}_${currDateFormat}`
        }
        this.fileCreatedAt = currDateFormat
        this.path = path.join(fs.realpathSync(this.dir), `${this.filename}.log`)
        this.setTransport(fs.createWriteStream(this.path, FILE_CHANNEL_TEXT_OUTPUT_OPTIONS))
        this.resume()
    }

}

module.exports = { LoggerFileChannel }