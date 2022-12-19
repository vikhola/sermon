const { LoggerUtil } = require("../util.js")
const { LoggerMessage } = require("../message.js")

class LoggerValidator extends LoggerUtil {

    constructor() {
        super(["level", level], ["pub", publisher])
    }

    execute(channel, message) {
        for(let [key, value] of this) {
            if(!value.call(channel, message)) return false
        }
        return true
    }

}

function level(message) {
    if(!(message instanceof LoggerMessage)) return true
    else return this.levels.includes(message.get("level"))
}

function publisher(message) {
    if(!(message instanceof LoggerMessage)) return true
    else return message.get("pub") !== this.id
}

module.exports = { LoggerValidator }