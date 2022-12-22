# Logger

The sermon Logger can be both an entry point for the entire log system, and as a subsystem relay which takes messages and send them to the underlying channels. 

## Initialize
The logger options could change behavior depending on how logger instance is used. In relay mode when channel added to different logger instance most of them keep the same functionality as in the logger channel, but if the logger instance uses as entry point some can be unused or acquire additional functionality.

The `levels` contain logger levels. The provided levels will be used when validating the message, and if the message level is invalid, it will be ignored.
```js
const theLogger = new Logger({levels: ErrorLevel})
// or 
const theLogger = new Logger({levels: [ErrorLevel, DebugLevel]})
```
The `context` property contain logger context. The provided context will be added to the logger message which lately will be passed to underlying channels. Context also could be useful under message validation and processing.
```js
const theLogger = new Logger({context: {group: "mygroup", ...etc}})
```
The `validator` property contains the logger validator. The validator will be used to validate the incoming message. By default, if no `validator` is defined, initialize the base [validator](validation.md) instance.
```js
const theValidator = new LoggerValidator()
const theLogger = new Logger({validator: theValidator})
```
The `processor` property contain channel processor. The processor will used under message processing.  Same as with validator if no processor present, new instance of [processor](processing.md) will be initiated.
```js
const theProcessor = new LoggerProcessor()
const theLogger = new Logger({validator: theProcessor})
```

## Channels
As already mentioned, the logger can be used as an entry point for entire logging system. To did it the logger needs some [channels](channels.md) which could sent the logger messages to they own underlying systems. There is no limit to the added channels count.
```js
const theLogger = new Logger()
const theConsoleChannel = new LoggerConsoleChannel()
```
The logger also could be added to another logger instance. In this case the logger will work as relay to the added to him channels.
```js
const theMainLogger = new Logger()
const theRelayLogger = new Logger()

theMainLogger.addChannel(theRelayLogger)
```

## Writing
Logger messaging works almost the same as in it [parent](channel.md). After the logger write method receives the payload in the argument, it starts the validation process, after that the processing of the message by the processor starts, where the message is optionally converted and transferred to the handlers pipeline where message level sets to `debug`. 
```js
theLogger.write("message")
```
But unlike it parent the logger state does not wait for a response that the message was successfully sent and does not add a message to the internal queue while waiting. This is done in order to prevent a bottleneck situation for the entire system and this is fair how to independent logger and relay instances. 

Additional the logger implement list of level writing methods were every the logger level write method are correspond to the level with which message will be sent. The level has it unique code which could be and by default used to message priority calculation, message colorize like in LoggerConsoleChannel and under channel validation.

- `emerg` correspond to emergency level and have code 0.
- `alert` method correspond to alert level and have code 1.
- `crit` -- method correspond to critical level and have code 2.
- `error` method correspond to error level and have code 3.
- `warn` method correspond to warning level and have code 4.
- `note` method correspond to notice level and have code 5.
- `info` method correspond to info level and have code 6.
- `debug` method correspond to warning level and have code 7.

The level writing methods accept same types of messages as write method. Plain JS object, where all of its properties will be assigned to the logger message.
```js
theLogger.info({ msg: "message", group: "custom" })
```
Message with context which will be assigned to the logger message.
```js
theLogger.info("message", { group: "custom" })
```
And just message which will be assigned the `msg` property of the logger message.
```js
theLogger.info("message")
```
There is no difference in the write method between entry point or relay mode except payload. In relay mode the write method mostly receives the logger messages which doesn\`t require convertion and already have `level` prop.


## Errors 
The logger subscribes to the channels `error` event. When the channel emit error event the logger send it to rest of channels with critical level. 
```js
const theLogger = new Logger()
const theConsoleChannel = new LoggerConsoleChannel()
const theFileChannel = new LoggerFileChannel("./dir", "filename")

theLogger.addChannel(theFileChannel)
theLogger.addChannel(theConsoleChannel)
theFileChannel.emit("error", new Error("custom error"))
```
But if under the logger shutdown initiated by end or destroy methods some channel will emit `error` provided by the channel exception will be emit by the logger itself. 

Almost in the same way error handling works if the logger added to another logger instance. Error will be handled only by the logger instance to which this channel has been added. But if parent logger instance is not ended or destroyed `error` event could be handled by it.
```js
const theMainLogger = new Logger()
const theRelayLogger = new Logger()
const theConsoleChannel = new LoggerConsoleChannel()
const theFileChannel = new LoggerFileChannel("./dir", "filename")

theRelayLogger.addChannel(theConsoleChannel)
theMainLogger.addChannel(theFileChannel)
theMainLogger.addChannel(theRelayLogger)
```

## Shutdown
The logger instance could be shutdown by two methods `end` and `destroy`, main difference between them is the way how they work with channels added to them. 

The logger `end` method finish all added channels. Method will wait until channels complete internal processes, like emitting rest of data to output etc., this is allow to use `end` method as the logger graceful shutdown and all underlying channels. 
```js
theLogger.end()
```
Method accepts same as the native stream `end` arguments: optional message which will be processed same as in write method, encoding and callback which will be resolved after shutdown complete. 
```js
theLogger.end(callback)
theLogger.end("message", callback)
```

The logger `destroy` method destroys all added channels. Same as with the end method the logger will wait until channels has been destroyed. Main difference between destroy and the end method it is the channel destroy logic it doesn\`t wait until internal processes has been ended, but the end do. 
```js
theLogger.destroy()
```
Method accepts same as the native stream `destroy` method optional error which will be emitted in `error` event. 
```js
theLogger.destroy(error)
```