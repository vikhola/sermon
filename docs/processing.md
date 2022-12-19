# Processing
The @vikhola/sermon processing provides the message transforming. This is the second stage of message processing. The message transforming executes inside the channel or logger instances, takes a payload, convert it to the logger message and starts message transforming, where adds, updates and removes message props.

## Initialize 
The initialization of logger processor is easy and it constructor doesn`t accept any parameters.
```js
const theProcessor = new LoggerProcessor()
```

## Handlers
The message transforming proceed by handlers pipeline. The handler pipeline transforming message by handlers which was added to the processor instance. Every handler has his own key by which it can be updated, deleted and function executor. 
```js
function handler(message) {
	message.set("key", value)
}

const theProcessor = new LoggerProcessor()
theProcessor.set("handler", handler)
```
Also several handlers available in the processor from the start. Every of this handler will not change message if their prop is already present.

- The key `level` has a handler which bind message level to `debug` if no already exist.

	```js
const theMessage = new LoggerMessage()
const theProcessor = new LoggerProcessor()
console.log(theProcessor.execute(null, theMessage).get("level"))
	```
- The key `pri` has a handler which calculate and set message priority by formula: channel context facility or 1 * 8 + level code.

	```js
const theMessage = new LoggerMessage()
const theProcessor = new LoggerProcessor()
console.log(theProcessor.execute(null, theMessage).get("pri"))
	```

- The key `pub` has a handler which sets message pub to the current context id.

	```js
const theChannel = new LoggerChannel()
const theMessage = new LoggerMessage()
const theProcessor = new LoggerProcessor()
console.log(theProcessor.execute(theChannel, theMessage).get("pub"))
	```

- The key `timestamp` has a handler which sets message timestamp to current ISO string.

	```js
const theChannel = new LoggerChannel()
const theMessage = new LoggerMessage()
const theProcessor = new LoggerProcessor()
console.log(theProcessor.execute(null, theMessage).get("timestamp"))
	```

In argument handler accepts payload and if it is not the logger message, payload will be assigned with it `msg` property.  
```js
const theProcessor = new LoggerProcessor()
console.log(theProcessor.execute(null, "message"))
```
Except situation where payload argument is the plain JS object. in this case all it props will be assigned with the logger message.
```js
const theProcessor = new LoggerProcessor()
const theMessage = theProcessor.execute(null, { a: 20, b: "message" })
console.log(theMessage)
```
Every handler under validation get current channel or logger to it context under pipeline execution. Except anonymous handlers.
```js
function handler(message) {
	return message.set("sd", {id: 1, group: this.context.group}) 
}

const theProcessor = new LoggerProcessor()
theProcessor.set("handler", handler)
const theConsoleChannel = new LoggerConsoleChannel({ processor: theProcessor, context: {group: "сonsole"} })
theConsoleChannel.write("message")
```

## Logger 
The logger message processing serves to form messages that will be validated and processed by underlying channels. This is allows the message processing to be used in a wide range of things,  for example, instead of manually adding property to message it could be done by the processor.
```js
function handler(message) {
	return message.set("sd", [
	{id: 2, logger: this.id, day: "monday"},
	{id: 1, group: this.context.group}
]) 
}

const theProcessor = new LoggerProcessor()
theProcessor.set("group", handler)
const theLogger = new Logger({ processor: theProcessor, context: {group: "file"} })
const theConsoleChannel = new LoggerConsoleChannel()
theLogger.addChannel(theConsoleChannel)
theLogger.info("message")
```
As mention before the processor convert incoming message to the logger message and all added to processor handlers changes the logger message, but it is still available to change incoming message. By default message will be assigned to `msg` key.
```js
function handler(message) {
	return message.set("msg", message.get("msg") * 2) 
}

const theProcessor = new LoggerProcessor()
theProcessor.set("multiply", handler)
const theLogger = new Logger({ processor: theProcessor })
const theConsoleChannel = new LoggerConsoleChannel()
theLogger.addChannel(theConsoleChannel)
theLogger.info(200) // processor will multiply message
```

## Channel
The channel message transform is the same as in the logger, and serves to message transforming on site.
```js
function handler(message) {
	return message.set("sd", {id: this.id, group: this.context.group}]) 
}

const theProcessor = new LoggerProcessor()
theProcessor.set("group", handler)
const theConsoleChannel = new LoggerConsoleChannel({ processor: theProcessor, context: {group: "console"} })
theConsoleChannel.write("message")
```

