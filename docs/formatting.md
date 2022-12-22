# Formatting
The sermon formatting provides logger message formatting to the rfc5424 string. This is the third stage of message processing. The formatter takes string template with identifiers separated by a percent sign and handlers bind to them. When message processing begins, the identifier is replaced by the result of the handler attached to it. If no handler is attached, the identifier will be replaced by the property from the logger message, but if there is no property either, identifier will be replaced by "-".

## Initialize
LoggerFormatter accepts in consturctor a string template into which the passed in execute method message will be converted. If no template is present rfc5424 template will be used.
```js
const template = `%strategy%` // identifier
const theFormatter = new LoggerFormatter(template)
```

### Handlers
The message formatting proceed by template and binded to identifiers handlers. Every handler has his own key by which it can be updated, deleted and function executor. 
```js
function handler(message) {
	return "replacer"
}

const theProcessor = new LoggerProcessor()
theProcessor.set("handler", handler)

```

- The key `sd` has a handler convert structure data to rfc5424 format.

	```js
const rest = {a: 1, b: "something"}
const theMessage = new LoggerMessage({ sd: [ 
	{ id: 1, payload: "text", ...rest}, 
	{ id: 2, payload: rest, ...rest} 
]})
const theFormatter = new LoggerFormatter()
console.log(theFormatter.execute(null, theMessage))
	```

Every handler takes message in it argument and should return string which should replace template identifier. 
```js
const template = "%hello% %name%!\n"

function handler(message) {
	return message.get("lang") === "es" ? "Hola" : "Hello"
}
const theFormatter = new LoggerFormatter(template)
theFormatter.set("%hello%", handler)
const theConsoleChannel = new LoggerConsoleChannel({ formatter: theFormatter })
theConsoleChannel.write({name: "John", lang: "es"})
```
Also the formatter handlers get current channel to it context under pipeline execution. Except anonymous handlers.
```js
const context = { lang: { es: "Holla", default: "Hello"} }
const template = "%hello% %name%!\n"

function handler(message) {
	return this.context.lang[message.get("lang")] || this.context.lang.default
}
const theFormatter = new LoggerFormatter(template)
theFormatter.set("%hello%", handler)
const theConsoleChannel = new LoggerConsoleChannel({ formatter: theFormatter, context })
theConsoleChannel.write({name: "John", lang: "es"})
```
