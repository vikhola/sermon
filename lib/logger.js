const os = require("node:os")
const { LoggerChannel } = require("./channel.js")
const LoggerLevels = require("./levels.js")

const LOGGER_LEVELS = Object.values(LoggerLevels)
const LOGGER_EVENT_DATA = "data"
const LOGGER_EVENT_ERROR = "error"
const LOGGER_EVENT_CLOSE = "close"
const LOGGER_EVENT_FINISH = "finish"
const LOGGER_ERROR_STACK_ID = "LOGGER_ERROR_STACK"

class LoggerChannelInstanceError extends Error {
    constructor() { 
        super("LoggerChannelError: Channel should be instance of LoggerChannel") 
    }
}

class Logger extends LoggerChannel {
    _channels = new Map()

    constructor(options = {}) {
        super(options)
        this.context = Object.assign({ 
            procid: process.pid, 
            version: 1, 
            facility: 1, 
            hostname: os.hostname() 
        }, this.context)
        LOGGER_LEVELS.forEach(level => this[level.name] = (message, context) => {
            return this.write({ level, msg: message, ...context })
        })
    }

    log(message, context = {}) {
        return this.write({ level: LoggerLevels.DebugLevel, msg: message, ...context })
    }

    addChannel(channel) {
        if(!(channel instanceof LoggerChannel)) throw new LoggerChannelInstanceError()
        if(this._channels.has(channel)) return this
        const listeners = [
            [LOGGER_EVENT_DATA,  this._handleChannelData.bind(this)],
            [LOGGER_EVENT_ERROR, this._handleChannelError.bind(this, channel)],
            [LOGGER_EVENT_CLOSE, this._handleChannelClose.bind(this, channel)],
            [LOGGER_EVENT_FINISH, this._handleChannelClose.bind(this, channel)],
        ]
        this._channels.set(channel, { listeners })
        listeners.forEach(listener => channel.on(...listener))
        return this
    }

    _write(message, encoding, callback) {
        this._channels.forEach((metadata, channel) => channel.write(message, encoding))
        return callback()
    }

    _final(callback) {
        const channels = []
        this._channels.forEach((metadata, channel) => channels.push(new Promise(resolve => channel.end(resolve))))
        Promise.all(channels).then(() => callback()).catch(e => callback(e))
    }

    _destroy(err, callback) {
        const channels = []
        this._channels.forEach((metadata, channel) => channels.push(new Promise(resolve => {
            channel.once(LOGGER_EVENT_CLOSE, resolve)
            channel.destroy()
        })))
        Promise.all(channels).then(() => callback(err)).catch(e => callback(e))
    }

    _handleChannelData(message) {
        if(!this.writableEnded && !this.destroyed) return this.write(message)
    }

    _handleChannelError(channel, error) {
        if(this.writableEnded || this.destroyed) this.emit(LOGGER_EVENT_ERROR, error)
        else return !(error instanceof Error) ? 
            this.crit(error, { pub: channel.id }) :
            this.crit(error.message, {pub: channel.id, sd: {id: LOGGER_ERROR_STACK_ID, stack: error.stack.replace(/[\n]/g, "\\n")}})
            
    }

    _handleChannelClose(channel) {
        const metadata = this._channels.get(channel)
        metadata.listeners.forEach(listener => channel.removeListener(...listener))
        this._channels.delete(channel)
    }

}

module.exports = { Logger }