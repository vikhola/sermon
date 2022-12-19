# Utils
The @vikhola/sermon utilities are classes for solving a wide range of tasks from message validation and processing to timers. Basic utility is the native map object with already bind handlers and execute method where you could pass channel instance and logger message. But note that native utilities doesn`t support any asynchronous because most of them use poor functions as handlers.

## LoggerUtil
The @vikhola/sermon LoggerUtil is the primary class from which all other package utilities extends. By itself it is native node.js map object with some additional functional and restrictions. 

### Usage
In constructor accepts arguments in the form of arrays where the first element is a key, and the second element is a handler function. After initialize this arguments will be set to utility.
```js
function handler(msg) {
	// do something
}
const theUtil = new Uitl(["first", handler], ["second", () => {}]) 
```
Because logger utility extends base node.js map object, handlers set is quite easy, but note that only function could be set to utility, if handler has other type Error will be throw.
```js 
const theUtil = new Uitl()
theUtil.set("key", () => {}) 
theUtil.set("key", 1) // throw Error
```
Remove is quite easy too.
```js 
const theUtil = new Uitl()
theUtil.delete("key") 
```
But utility provide additional method like `execute` method is where all utility logic is stored and executed. Method accepts context argument and message. 
```js
theUtil.execute(null, "message")
```
Handler will be called with provided context and message in argument. It`s could be useful if you need to compare some values from channel and actual message context.
```js
const context = {a: 20}
function handler(msg) {
	console.log(this.a)
}
const theUtil = new Uitl(["first", handler]) 
theUtil.execute(context, "message")
```
But be careful function context does not work with anonymous functions. 
```js
const context = {a: 20}
const handler = (msg) => {
	console.log(this.a) // Prints undefined
}
const theUtil = new Uitl(["first", handler]) 
theUtil.execute(context, "message")
```
By default execution methods call all your handlers in pipeline and return output value.
```js
function handler(msg) {
	return 1
}
const theUtil = new Uitl(["first", handler]) 
theUtil.execute(null, "message") // will return 1
```
So logger utility is basic class for all other default utilities and provides simple and flexible interfaces to build a wide range of solutions.

## LoggerProcessor
The @vikhola/sermon LoggerProcessor provides logger message transforming. From the box message processor already has several handlers, which will not change message if their prop is already present:

- `level` handler which bind message level to debug if no already exist.
- `context` add to logger message from channel context if it exist.
- `priority` calculate and set message priority by formula: channel context facility or 1 * 8 + level code.
- `publisher` sets message pub to current channel id.
- `timestamp` sets message timestamp to current ISO string.

### Usage
Processor doesn\`t require any arguments in constructor and could be used from the start.
```js
const theProcessor = new LoggerProcessor()
```
Execute method provides message transforming in handlers pipeline where every next handler will get result of previous. Method accepts arguments in two formats, objects and other. If provided argument type of object than logger message will get all object enumerable key values pairs, otherwise argument will be added to logger message with `msg` key.  Also execution transform passed message to logger message format.  
```js
const theProcessor = new LoggerProcessor()
console.log(theProcessor.execute(null, "message"))
// or 
console.log(theProcessor.execute(null, { msg: "message" }))
```
Of course we could add custom processor handlers which will transform message. But note that pipeline handlers are executed one by one as added. 
```js
const lang = "en"
const handler = (msg) => msg.set("lang", lang)

const theProcessor = new LoggerProcessor()
theProcessor.set("language", handler)
console.log(theProcessor.execute(null, "message")) 
// Print map object with some basic metadata and with `lang` field which set to "en"
```
As you can see processor is easy to use tool for message converting and processing.

## LoggerValidator
The @vikhola/sermon LoggerValidator provides logger message validation. By default validator already has several validation rules, but all of them work only with logger message, which is mean validated with default rules could be only logger message. So here they are:

- `level` rule which check message level and if contain it, return true, otherwise false.
- `publisher` rule check message publisher and if it doesn`t match with channel id, return true, otherwise false.

In execute method, message passes to handlers pipeline, where if some of handlers return false, validation will be failed and false returned otherwise returns true.

### Usage
Validator doesn`t require any arguments in constructor and could be used from the start.
```js
const theValidator = new LoggerValidator()
```
As in other tools, adding a rule is done through the "set" method.
```js
const handler = (msg) => msg !== "Hola" ? false : true

const theValidator = new LoggerValidator()
theValidator.set("language", handler)
```
Validation starts from execute method.
```js
const handler = (msg) => msg !== "Hola" ? false : true

const theValidator = new LoggerValidator()
theValidator.set("language", handler)
console.log(theValidator.execute(null, "Hola")) // print true. Validation success
console.log(theValidator.execute(null, "Hello")) // print false.
Validation failed
```
As you can see, everything depends on what our custom handler will return and you could easy build your own validators based on channel contexts and other metadata uses this tool. 

## LoggerFormatter
The @vikhola/sermon LoggerFormatter provides logger message formatting to the string. NOTE that formatter will not work with non logger message format. Formatter takes string template with identifiers separated by a percent sign and handlers bind to them. When message processing begins, the identifier is replaced by the result of the handler attached to it. If no handler is attached, the identifier will be replaced by the property from the logger message, but if there is no property either, identifier will be replaced by "-". Formatter has only one default format handler:

- `sd` convert structure data to rfc5424 format.

### Usage
LoggerFormatter accepts in consturctor a string template into which the passed in execute method message will be converted. If no template is present rfc5424 template will be used.
```js
const template = `%strategy%` // identifier
const theFormatter = new LoggerFormatter(template)
```
To set handler and make him work you need to add handler with key to formatter and make surer that his key present in formatter template. 
```js
const template = "%hello% %msg%!"
const handler = (msg) => msg.get("lang") ==="es" ? "Hola" : "Hello"
const theFormatter = new LoggerFormatter(template)
theFormatter.set("%hello%", handler)
```
To start format need to call execute method with optional channel instance where it called and logger message.
```js
const theLoggerMessage = new LoggerMessage({msg: "Hello"})
const theFormatter = new LoggerFormatter()
console.log(theFormatter.execute(null, theLoggerMessage))
```
Execution with custom handler
```js
const template = "%hello% %msg%!"
const handler = (msg) => msg.get("lang") === "es" ? "Hola" : "Hello"
const theLoggerMessage = new LoggerMessage({msg: "world", lang: "es"})
const theFormatter = new LoggerFormatter(template)
theFormatter.set("%hello%", handler)
console.log(theFormatter.execute(null, theLoggerMessage)) //Print "Hola world!"
```
Here we define our custom template. Then we are create handler which will handle our `%hello%` key after what we initiate formatter with template and add handler by the key, in the end we start formatting and see "Hola world" in console. This system helps to transform almost any size message to what you want.

## LoggerTimer
The @vikhola/sermon LoggerTimer provides interval callback execution. By default available several intervals:
 
- `ss` - second interval. Executes every second.
- `mm` - minute interval. Executes every minute.
- `HH` - hour interval. Executes every at the of each hour.
- `dd` - day interval. Executes every day in midnight.
- `MM` - month interval. Executes every at the end of each month in midnight.

### Usage
To start using logger timer, we could initiate class already with time interval or add delay later.
```js
const theTimer = new LoggerTimer("MM")
// or
const theTimer = new LoggerTimer()
theTimer.delay("MM")
```
We actually could add our custom interval. In this example we add interval to timer add set delay to it. 
```js
const handler = () => {
	// Here we calculate the time after which the callback should be executed+
}
const theTimer = new LoggerTimer()
theTimer.set("custom", handler)
theTimer.delay("custom")
```
But what about execution? To start execute our callback we need call method `execute` and pass optional channel instance and callback. 
```js
const theTimer = new LoggerTimer("ss")
theTimer.execute(null, () => console.log("Hello World"))
```
In this example we print in console "Hello World" every second.

But be careful, if you try to start execution with delay which have no handler or non function callback you will get Error.
```js 
const theTimer = new LoggerTimer("ss")
theTimer.execute(null, "Hello World") // Will be throw error
// or
const theTimer = new LoggerTimer()
theTimer.execute(null, () => console.log("Hello World")) // Will be throw error
```
Literally, by default, the timer is used only in the file channel with rotation. But you can find other uses for it.
