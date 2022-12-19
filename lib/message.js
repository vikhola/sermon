const util = require("node:util")

class LoggerMessage extends Map {
    transform = true

    constructor(data = {}) {
        super()
        Object.getOwnPropertyNames(data).forEach((key) => this.set(key, data[key]))
    }

    toString() {
        const payload = {}
        this.forEach((value, key) => { 
            if(key === "level") Object.assign(payload, {level: value.name})
            else Object.assign(payload, {[key]: this._stringify(value)})
        })
        return JSON.stringify(payload)
    }

    _stringify(value) {
        if(typeof value !== "object") return util.format(value)
        if(Array.isArray(value)) return value.map(value => this._stringify(value))
        return Object.getOwnPropertyNames(value).reduce((acc, key) => { 
            return Object.assign(acc, {[key]: util.format(value[key]) })
        }, {})
    }

}

module.exports = { LoggerMessage }