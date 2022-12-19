const { Duplex } = require("node:stream");
const { randomUUID } = require("node:crypto");
const { LoggerFormatter } = require("./utils/util.formatter")
const { LoggerProcessor } = require("./utils/util.processor");
const { LoggerValidator } = require("./utils/util.validator");
const LoggerLevels = require("./levels");

const LOGGER_LEVELS = Object.values(LoggerLevels)
const CHANNEL_EVENT_ERROR = "error"

class ChannelInstanceError extends Error {
    constructor() { 
        super("ChannnelLevelError: The levels argument should includes only LoggerLevels") 
    }
}

class LoggerChannel extends Duplex {
    id = randomUUID()
    levels = LOGGER_LEVELS
    context = {}
    timer
    validator
    processor
    formatter
    transport

    constructor(options = {}) {
        super({objectMode: true, writableHighWaterMark: 50})
        Object.assign(this.context, options.context)
        if(options.levels) this.setLevels(options.levels)
        this.formatter = options.formatter || new LoggerFormatter()
        this.validator = options.validator || new LoggerValidator()
        this.processor = options.processor || new LoggerProcessor()
        this._handleErrorEvent = this._handleErrorEvent.bind(this)
    }

    setLevels(payload) {
        const levels = Array.isArray(payload) ? payload : [payload]
        if(levels.every(level => LOGGER_LEVELS.includes(level))) this.levels = levels
        else throw new ChannelInstanceError()
        return this
    }

    setTransport(transport) {
        if(this.transport) {
            this.transport.removeListener(CHANNEL_EVENT_ERROR, this._handleErrorEvent)
        }
        this.transport = transport
        this.transport.on(CHANNEL_EVENT_ERROR, this._handleErrorEvent)
        return this
    }

    push(message) {
        return super.push(this.processor.execute(this, message))
    }

    end(message, encoding, callback) {
        if(!message || typeof message === "function") return super.end(message)
        else if(!this.validator.execute(this, message)) {
            if(typeof encoding === "function") return super.end(encoding)
            if(typeof callback === "function") return super.end(callback)
            else return super.end()
        }
        else return super.end(this.processor.execute(this, message), encoding, callback)
    }

    write(message, encoding, callback) {
        const state = this._writableState
        if(!this.validator.execute(this, message)) {
            if(typeof encoding === "function") encoding()
            if(typeof callback === "function") callback()
            return state.needDrain
        }
        return super.write(this.processor.execute(this, message), encoding, callback)
    }

    _read(size) {}

    _handleErrorEvent(err) {
        this.destroy(err)
    }

}

module.exports = { LoggerChannel }