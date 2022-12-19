const util = require("node:util")
const { LoggerUtil } = require("../util.js")
const { LoggerMessage } = require("../message.js")

const FORMATTER_TEMPLATE = "<%pri%> %version% %timestamp% %hostname% %app_name% %procid% %msgid% %sd% %msg% \n"

class LoggerFormatter extends LoggerUtil {
    matcher
    template

    constructor(template = FORMATTER_TEMPLATE) {
        super(["%sd%", structureData], ["%msg%", message])
        this.template = template
        this.matcher = new RegExp(`${template.match(/\%(.*?)\%/gi).join("|")}`, "gi")
    }

    execute(channel, message) {
        if(message instanceof Buffer) return message
        else if(!(message instanceof LoggerMessage)) return util.format(message)
        else if(message.format) return util.format(message.get("msg")) 
        else return `${this.template}`.replace(this.matcher, (key) => {
            if(this.has(key)) return this.get(key).call(channel, message) 
            const payload = message.get(key.substring(1, key.length - 1))
            return payload ? util.format(payload) : "-"
        })
    }
    
}

function message(message) {
    const msg = message.get("msg")
    if(!msg) return "-"
    if(msg instanceof Error) return util.format(msg.message)
    else return util.format(msg)
}

function structureData(message) {
    const sd = message.get("sd")
    if(!sd) return "-"
    if(typeof sd === "string") return sd
    if(typeof sd !== "object") throw new Error(MESSAGE_HANDLER_STRUCTURE_DATA_ERROR_TYPE)
    const transformer = (sd) => {
        const { id, ...rest } = sd   
        if(!id) throw new Error(MESSAGE_HANDLER_STRUCTURE_DATA_ERROR_ID)
        return `[${id} ${Object.entries(rest).map(([key, value]) => `${key}=${util.format(value)}`).join(' ')}]`
    }
    return !Array.isArray(sd) ? transformer(sd) : sd.map(item => transformer(item)).join("")
}

module.exports = {
    LoggerFormatter, 
}