const { LoggerUtil } = require("../util.js")
const { DebugLevel } = require("../levels.js")
const { LoggerMessage } = require("../message.js")

class LoggerProcessor extends LoggerUtil {

    constructor() {
        super(["level", level], ["pri", priority], ["pub", publisher], ["timestamp", timestamp])
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