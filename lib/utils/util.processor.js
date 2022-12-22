const os = require("node:os")
const { LoggerUtil } = require("../util.js")
const { DebugLevel } = require("../levels.js")
const { LoggerMessage } = require("../message.js")

class LoggerProcessor extends LoggerUtil {

    constructor() {
        super(
            ["procid", procid], ["version", version], ["facility", facility], ["hostname", hostname], 
            ["level", level], ["pri", priority], ["pub", publisher], ["timestamp", timestamp], ["appname", appname]
        )
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
    if(this.context?.procid) return message.set("procid", this.context.procid)
    else return message.set("procid", process.pid)
}

function version(message) {
    if(message.has("version")) return message
    if(this.context?.version) return message.set("version", this.context.version)
    else return message.set("version", 1)
}

function facility(message) {
    if(message.has("facility")) return message
    if(this.context?.facility) return message.set("facility", this.context.facility)
    else return message.set("facility", 1)
}

function appname(message) {
    if(message.has("app_name") || !this.context?.appname) return message
    else return message.set("appname", this.context?.hostname)
}

function hostname(message) {
    if(message.has("hostname")) return message
    if(this.context?.hostname) return message.set("hostname", this.context?.hostname)
    else return message.set("hostname", os.hostname() )
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