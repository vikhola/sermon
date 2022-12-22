const { LoggerUtil } = require("../util.js")
const { DebugLevel } = require("../levels.js")
const { LoggerMessage } = require("../message.js")

class LoggerProcessor extends LoggerUtil {

    constructor() {
        super(
            ["procid", procid], ["version", version], ["facility", facility], ["hostname", hostname], 
            ["level", level], ["pri", priority], ["pub", publisher], ["timestamp", timestamp])
    }

    execute(channel, message) {
        if(!(message instanceof LoggerMessage)) {
            if(message && typeof message === "object" && Object.getPrototypeOf(message).isPrototypeOf(Object)) {
                message = new LoggerMessage({ ...message })
            } else {
                message = new LoggerMessage({ msg: message })
            }
        }
        this.forEach((value) => value.call(channel, message))
        return message
    }

}

function procid(message) {
    if(message.has("procid")) return message
    return message.set("procid", this.context.procid)
}

function version(message) {
    if(message.has("version")) return message
    return message.set("version", this.context.version)
}

function facility(message) {
    if(message.has("facility")) return message
    return message.set("facility", this.context.facility)
}

function hostname(message) {
    if(message.has("hostname")) return message
    return message.set("hostname", this.context.hostname)
}

function level(message) {
    if(message.has("level")) return message
    return message.set("level", DebugLevel)
}

function priority(message) {
    if(message.has("pri")) return message
    const level = message.get("level") || DebugLevel
    const facility = this.context?.facility || 1
    return message.set("pri", facility * 8 + level.code)
}

function publisher(message) {
    if(message.has("pub")) return message
    return message.set("pub", this.id)
}

function timestamp(message) {
    if(message.has("timestamp")) return message
    return message.set("timestamp", new Date().toISOString())
}

module.exports = { LoggerProcessor }