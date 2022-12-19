const { LoggerChannel } = require("../channel.js");

const CONSOLE_CHANNEL_DEFAULT_COLOR = "\u001b[0m"

class LoggerConsoleChannel extends LoggerChannel {
    color = true

    constructor(options = {}) {
        super(options)
        if("color" in options) this.color = options.color
        this.setTransport(process.stdout)
    }

    _colorize(level, message) {
        const color = level.color || CONSOLE_CHANNEL_DEFAULT_COLOR
        return `${color}${message}${CONSOLE_CHANNEL_DEFAULT_COLOR}`
    }

    _write(chunk, encoding, next) {
        const message = this.formatter.execute(this, chunk)
        this.transport.write(this.color ? this._colorize(chunk.get("level"), message) : message, next)
    }

}

module.exports = { LoggerConsoleChannel }