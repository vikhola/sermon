# Channels
The @vikhola/sermon channels provides easy and flexible interface to both of writable and readable interaction with underlying resource. The writable interface helps with current process output like logging to file, console etc. The readable interface helps to interact with different system sources like receiving messages from cluster worker etc., and then send them directly to the logger.

## LoggerChannel 
The project-november/sermon LoggerChannel the class from which all others default channels inherit, by itself implements the basic node.js `Duplex` stream, which allow easy usage and predictable behavior. Class also add some functionality, such as validation, message processing, and its formatting using basic utilities. All in the channel fair for all it child classes.

### Initialize
In constructor LoggerChannel accept `option` object which can be used in a very wide range of things, from validation to message processing or inner channel logic:

The `levels` contain logger levels. The provided levels will be used when validating the message, and if the message level is invalid, it will be ignored.
```js
const theConsoleChannel = new LoggerConsoleChannel({levels: ErrorLevel})
// or 
const theConsoleChannel = new LoggerConsoleChannel({levels: [ErrorLevel, DebugLevel]})
```
The `context` property contain channel context. Context could be useful under message validation, proccesing and formatting.
```js
const theConsoleChannel = new LoggerConsoleChannel({context: {group: "mygroup", ...etc}})
```
The `validator` property contains the channel [validator](validation.md) instance. The validator will be used to validate the incoming message. By default, if no `validator` is defined, initialize the base instance.
```js
const theValidator = new LoggerValidator()
const theConsoleChannel = new LoggerConsoleChannel({validator: theValidator})
```
The `formatter` property contains the channel [fromatter](formatting.md) instance. The formatter will be used to convert incoming message to the defined in formatter string template. By default, if no `formatter` is defined, initialize the base instance.
```js
const theFormatter = new LoggerFormatter()
const theConsoleChannel = new LoggerConsoleChannel({formatter: theFormatter})
```
The `processor` property contain channel [processor](processing.md) . The processor will used under message processing. Same as with formatter if no processor present, new instance of  will be initiated.
```js
const theProcessor = new LoggerProcessor()
const theConsoleChannel = new LoggerConsoleChannel({validator: theProcessor})
```

### Usage
By default the channel has no functionality to handle logging to any source, and serves as a base class to inheritance. The channel writing provides validation, message processing and optional formatting. When method receives message, he start message validation and if validation was failed immediately resolves (if present) callback. Next starts message processing and if the channel processor gets plain JS object, all enumerated properties from that object will be copied into the logger message.  
```js
theChannel.write({ msg: "message", group: "custom" })
```
Otherwise payload will be assigned with the logger message `msg` property. 
```js
theChannel.write("message")
```

## LoggerConsoleChannel 
The @vikhola/sermon LoggerConsoleChannel provides simple logging to the console with optional colorize. 

### Initialize
The console channel accepts in consturctor same `option` object as in the channel but with one additional property.

The `color` argument defines is should be console message has been colorized or not. By default color set to true and the message will be colorized.
```js
const theConsoleChannel = new LoggerConsoleChannel({color: false})
```

### Usage
After the channel write method receives the payload in the argument, it starts the validation process, after that the processing of the message by the processor starts, at the end the message goes to the formatter, where message converts to the template string. 
```js
const theConsoleChannel = new LoggerConsoleChannel()
theConsoleChannel.write("hello John!") 
```
But the channel is completely revealed when using it with the [logger](logging.md), where the channel could became part of the logging system.
```js
const theLogger = new Logger()
const theConsoleChannel = new LoggerConsoleChannel()
theLogger.addChannel(theConsoleChannel)
theLogger.error("hello John!")
```

## LoggerFileChannel
The @vikhola/sermon LoggerFileChannel helps to interact with file logs, their writing, optional rotation and file compressing. File rotation can take place according to both the file size and time limits, optionally, after the file rotation has begun, it can be compressed to `.gz' format which allows you to have full-fledged logs.

### Initialize
The file channel accepts three arguments it is `dir`, `filename` and `options`, first two arguments is required, they define where logs will be writted and stored. 

The `dir` define current file channel directory where will be save logs relevant and already compressed. If directory isn\`t exist it will created with flag `recursive` which means that every directory to the target one will also be created.
```js
const theFileChannel = new LoggerFileChanne("./dir")
```
The `filename` defines the file name of the current file channel, which will be used in the creation of the file name, by combining the file name and the timestamp.
```js
const theFileChannel = new LoggerFileChanne("./dir", "filename")
```

The `option` accepts same props as in the channel `option` object but with some with some additions:

The `fileDateTemplate` property defines current channel filename timestamp template which will be used in the log file creation. By default it is `yyyy-MM-dd-hh`, but in several cases file timestamp could be different and contain more time indicators. Note that timestamp creates based on local system time.
```js 
const theFileChannel = new LoggerFileChannel("./logs", "log", { 
	fileDateTemplate: "yyyy" 
}) // Creates file `log-*year*.log
````
The `fileTizeLimit` property sets the rotation time for the file. Accepts values in date format identifiers i.e. "MM" - month, "dd" - day, "HH" - hour, "mm" - minute.
```js
const theFileChannel = new LoggerFileChanne("./logs", "log", {
	fileSizeLimit: "dd"
}) // Sets file rotation to every day midnight
```
The `fileSizeLimit` property sets the file size limit after which rotation will be performed. File size could be number in bytes or human readable format.
```js
const theFileChannel = new LoggerFileChanne("./logs", "log", {
	fileSizeLimit: "16kb" 
	// or 
	fileSizeLimit: 16000
})
```
The `compress` property indicates whether the file should be compressed after rotation. Note compression will only occur if rotation is set.
```js
const theFileChannel = new LoggerFileChanne("./logs", "log", {
	fileTimeLimit: "HH",
	compress: true
}) // log file will be rotated and compressed every hour
```
The `levels` contain logger levels. The provided levels will be used when validating the message, and if the message level is invalid, it will be ignored.
```js
const theFileChannel = new LoggerFileChanne({levels: ErrorLevel})
// or 
const theFileChannel = new LoggerFileChanne({levels: [ErrorLevel, DebugLevel]})
```
The `context` property contain channel context. Context could be useful under message validation, proccesing and formatting.
```js
const theFileChannel = new LoggerFileChanne({context: {group: "mygroup", ...etc}})
```
The `validator` property contains the channel [validator](validation.md) instance. The validator will be used to validate the incoming message. By default, if no `validator` is defined, initialize the base instance.
```js
const theValidator = new LoggerValidator()
const theFileChannel = new LoggerFileChanne({validator: theValidator})
```
The `formatter` property contains the channel [fromatter](formatting.md) instance. The formatter will be used to convert incoming message to the defined in formatter string template. By default, if no `formatter` is defined, initialize the base instance.
```js
const theFormatter = new LoggerFormatter()
const theFileChannel = new LoggerFileChanne({formatter: theFormatter})
```
The `processor` property contain channel [processor](processing.md) . The processor will used under message processing. Same as with formatter if no processor present, new instance of  will be initiated.
```js
const theProcessor = new LoggerProcessor()
const theFileChannel = new LoggerFileChanne({validator: theProcessor})
```

### Usage
Same as the console channel, the file channel write method receives the payload in the argument, starts the validation process, after that starts the processing and at the end the message goes to the formatter, where message converts to the template string. 
```js
const theFileChannel = new LoggerFileChannel("./logs", "log")
theFileChannel.write("hello John!") 
```
Channel also could be easy added to the [logger](logging.md).
```js
const theLogger = new Logger()
const theFileChannel = new LoggerFileChannel("./logs", "log")
theLogger.addChannel(theFileChannel)
theLogger.error("hello John!")
```
For file rotation file require defined rotation identifier in the constructor.
```js
const theFileChannel = new LoggerFileChannel("./logs", "log", {fileSizeLimit: 80})

theFileChannel.write("hello Jane!")
theFileChannel.write("hello John!")
```
After this the log file will contain only one message. It\`s happened because size of log file with the second message exceed channel limit and file remove initiated, after this the channel created new file and write second message to it. But if passed message by itself will exceed channel limit error will be throw. To save previous file content to the file channel constuctor could be added `compress`.
```js
const theFileChannel = new LoggerFileChannel("./logs", "log", {fileSizeLimit: 80, compress: true})

theFileChannel.write("hello Jane!")
theFileChannel.write("hello John!")
```
Now the logs directory contain two files, gz and log file with identifier 1, this is happen because when file starts to compress it still in directory and when channel creates new file with current timestamp, because our log files rotating quiet fast, their timestamp and filename is equal. To extend the time pattern add in options could be used custom pattern.
```js
const theFileChannel = new LoggerFileChannel("./logs", "log", {
	fileSizeLimit: 80, 
	compress: true,
	fileDateTemplate: "yyyy-MM-dd-hh-mm"
})

theFileChannel.write("hello John!")
```

## LoggerClusterChannel 
The @vikhola/sermon LoggerClusterChannel helps to interact between processes. It`s can be useful in situations where need to log messages between multiple processes, example, log in single file from multiple childs.

### Initialize
LoggerClusterChannel  accepts two arguments it is `worker`, and `options`.

The `worker` argument can be both a forked child object and a current child process worker. Depending on the process in which the channel works, its behavior changes. In the child process it will send messages to the parent process but in the parent process it will listen to the child.
```js
const worker = cluster.fork()
const theClusterChannel = new LoggerClusterChannel(worker)
```

The `options` cluster channel argument accepts same properties as in the channel.

### Usage
The cluster channel can be used to build a single logging system between processes and it is main idea of this tool. Like example this channel could be used in combination with file channel in main process and cluster channel in childs. Because file channel with the same namespace in multiple processes cannot guarantee predictable behavior you can build system where only one process will write to the file like other will send messages to him.  

Here initiates the [logger](logging.md), file channel and cluster channel instances. The cluster channel contain forked process.
```js
if(!cluster.isWorker) {
	const worker = cluster.fork()
	const theLogger = new Logger()
	const theFileChannel = new LoggerFileChannel("./logs", "log")
	const theClusterChannel = new LoggerClusterChannel(worker)

	theLogger.addChannel(theFileChannel)
	theLogger.addChannel(theClusterChannel)
}
```
In this code block initiates the logger instance in child process. Both of Logger instances still has all they functionality the file channel still can be initialized in child process but with another destination.
```js
{
	const worker = cluster.worker
	const theLogger = new Logger()
	const theClusterChannel = new LoggerClusterChannel(worker)

	theLogger.addChannel(theClusterChannel)
	theLogger.info("hello John!")
}
```