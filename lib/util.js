class UtilHandlerError extends Error {
    constructor() {
        super("LoggerUtilHandlerError: handler should be a function")
    }
}

class LoggerUtil extends Map {

    constructor(...handlers) {
        if(handlers.some(([key, handler]) => typeof handler !== "function")) throw new UtilHandlerError()
        super(handlers)
        this.execute = this.execute.bind(this)
    }

    set(key, handler) {
        if(typeof handler !== "function") throw new UtilHandlerError()
        else return super.set(key, handler)
    }

    execute(channel, message) {
        this.forEach((value) => message = value.call(channel, message))
        return message
    }

}

module.exports = { LoggerUtil }