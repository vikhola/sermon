const { isWorker, Worker } = require('node:cluster');
const { LoggerChannel } = require("../channel.js");
const { LoggerMessage } = require("../message.js")
const LoggerLevels = require("../levels.js");

const LOGGER_LEVELS = Object.values(LoggerLevels)
const CLUSTER_CHANNEL_EVENT_ERROR = "error"
const CLUSTER_CHANNEL_EVENT_MESSAGE = "message"
const CLUSTER_CHANNEL_WRITE_COMMAND = "CLUSTER_CHANNEL_WRITE_COMMAND"

class ClusterChannelWorkerInstanceError extends Error {
    constructor() {
        super("ChannelWorkerType: Worker should be instance of cluster.Worker")
    }

}

class ClusterChannelMessage {
    cmd = CLUSTER_CHANNEL_WRITE_COMMAND
    level
    data

    constructor(level, data) {
        this.level = level
        this.data = data
    }

}

class LoggerClusterChannel extends LoggerChannel {

    constructor(worker, options = {}) {
        super(options)
        if(!(worker instanceof Worker)) throw new ClusterChannelWorkerInstanceError()
        this._handleMessageEvent = this._handleMessageEvent.bind(this)
        this.setTransport(worker)
    }

    setTransport(transport) {
        if(!isWorker) {
            if(this.transportd) this.transport.removeListener(CLUSTER_CHANNEL_EVENT_MESSAGE, this._handleMessageEvent)
            transport.on(CLUSTER_CHANNEL_EVENT_MESSAGE, this._handleMessageEvent)
        }
        return super.setTransport(transport)
    }

    _read(size) {}

    _write(chunk, encoding, callback) {
        const level = chunk.get("level")
        const message = this.formatter.execute(this, chunk)
        return this.transport.send(new ClusterChannelMessage(level.name, message), callback)
    }

    _final(callback) {
        if(!isWorker) this.transport.removeListener(CLUSTER_CHANNEL_EVENT_MESSAGE, this._handleMessageEvent)    
        this.transport.removeListener(CLUSTER_CHANNEL_EVENT_ERROR, this._handleErrorEvent)
        return callback()  
    }

    _handleMessageEvent(message) {
        if(!message.cmd || message.cmd !== CLUSTER_CHANNEL_WRITE_COMMAND) return 
        const msg = message.data
        const level = LOGGER_LEVELS.find(level => level.name === message.level)
        const theMessageDTO = new LoggerMessage({ msg, level })
        theMessageDTO.transform = false
        this.push(theMessageDTO)
    }

}

module.exports = { LoggerClusterChannel }