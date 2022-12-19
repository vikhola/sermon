const { LoggerUtil } = require("../util.js")

class TimerTimeError extends Error {
    constructor() {
        super("TimerTemplateError: time is not found.")
    }
}

class TimerCallbackError extends Error {
    constructor() {
        super("TimerTemplateError: callback should be a function.")
    }
}

class LoggerTimer extends LoggerUtil {
    timer
    delay

    constructor(delay) {
        super(["MM", month], ["dd", day], ["HH", hour], ["mm", minute], ["ss", second])
        if(delay) this.setDelay(delay)
    }

    stop() {
        clearTimeout(this.timer)
        return this
    }

    setDelay(delay) {
        this.delay = delay
    }

    execute(channel, callback) {
        if(!this.has(this.delay)) throw new TimerTimeError()
        if(typeof callback !== "function") throw new TimerCallbackError()
        if(this.timer) callback.call(channel)
        if(!this.callback) this.callback = this.callback = callback
        this.timer = setTimeout(this.execute, this.get(this.delay)(), channel, callback)
    }

}

function month(message) {
    const theUTCTime = new Date(new Date().getTime() + new Date().getTimezoneOffset() * -60000)
    const theRotationTime = new Date(theUTCTime)
    theRotationTime.setMonth(theRotationTime.getMonth() + 1, 1)
    theRotationTime.setUTCHours(0, 0, 0, 0)
    return theRotationTime.getTime() - theUTCTime.getTime()
}

function day(message) {
    const theUTCTime = new Date(new Date().getTime() + new Date().getTimezoneOffset() * -60000)
    const theRotationTime = new Date(theUTCTime)
    theRotationTime.setUTCDate(theRotationTime.getDate() + 1)
    theRotationTime.setUTCHours(0, 0, 0, 0)
    return theRotationTime.getTime() - theUTCTime.getTime()
}

function hour(message) {
    const theUTCTime = new Date(new Date().getTime() + new Date().getTimezoneOffset() * -60000)
    const theRotationTime = new Date(theUTCTime)
    theRotationTime.setHours(theRotationTime.getHours() + 1, 0, 0)
    return theRotationTime.getTime() - theUTCTime.getTime()
}

function minute(message) {
    const theUTCTime = new Date(new Date().getTime() + new Date().getTimezoneOffset() * -60000)
    const theRotationTime = new Date(theUTCTime)
    theRotationTime.setMinutes(theRotationTime.getMinutes() + 1, 0, 0)
    return theRotationTime.getTime() - theUTCTime.getTime()
}

function second(message) {
    const theUTCTime = new Date(new Date().getTime() + new Date().getTimezoneOffset() * -60000)
    const theRotationTime = new Date(theUTCTime)
    theRotationTime.setSeconds(theRotationTime.getSeconds() + 1, 0)
    return theRotationTime.getTime() - theUTCTime.getTime()
}

module.exports = { LoggerTimer }