# @vikhola/sermon
- [Validation](https://github.com/vikhola/sermon/blob/main/docs/validation.md)
- [Processing](https://github.com/vikhola/sermon/blob/main/docs/processing.md)
- [Formatting](https://github.com/vikhola/sermon/blob/main/docs/formatting.md)
- [Logger](https://github.com/vikhola/sermon/blob/main/docs/logger.md)
- [Channels](https://github.com/vikhola/sermon/blob/main/docs/channels.md)


## About
@vikhola/sermon is a lightweight, easy to use TypeScript and JavaScript logger utility for creating simple and/or complex logging systems. 

## Motivation
Motivation of creating this package was a provide simple and clear logging utility. Package had to meet several criteria, have an easy-to-understand implementation, a minimal with completely transparency list of dependencies and realize base [rfc5424](https://www.rfc-editor.org/rfc/rfc5424) standart.

## Installation
```sh
$ npm i @vikhola/sermon
```

## The Basics
Let’s take a look at the basic usage and APIs of @vikhola/sermon with JavaScript:

### Example 1: One destination logging
```js 
const { Logger, LoggerConsoleChannel } = require('@vikhola/sermon')

const theLogger = new Logger()
const theConsoleChannel = new LoggerConsoleChannel()

theLogger.addChannel(theConsoleChannel)

theLogger.info("hello world!") // print "<14> 1 *timestamp* *hostname* - *pid* - - hello world!"
```

What happen in this example? First we creating an entry point of our logger and add console channel to it. Then we call info method  and our message with info level and some added by entry point metadata sends to all added channels, in this example in console channel. After this, we can saw in console our message and formatted to [rfc5424](https://www.rfc-editor.org/rfc/rfc5424) standart.

### Example 2: Multiple destination logging
We already created basic console logging, but what about file logging? Let`s update our example!
```js 
const { Logger, LoggerConsoleChannel, LoggerFileChannel } = require("@vikhola/sermon")

const theLogger = new Logger()
const theFileChannel = new LoggerFileChannel("./logs", "test")
const theConsoleChannel = new LoggerConsoleChannel()

theLogger.addChannel(theFileChannel)
theLogger.addChannel(theConsoleChannel)

theLogger.info("hello world!")
```
Just like in our previous example, message printed in console but where is log file? Let's go to the directory called "logs" (which should be in directory where you installed this package) and open there a file which looking like "test_*timestamp*.log". Voila! Now we can log both in console and in file!

### Example 3: Level based logging
So now we can log message to the console and to the file. But what to do if we want to log to the console only error messages?! Let`s do this!
```js 
const { Logger, ErrorLevel, LoggerConsoleChannel, LoggerFileChannel } = require("@vikhola/sermon")

const theLogger = new Logger()
const theFileChannel = new LoggerFileChannel("./", "test")
const theConsoleChannel = new LoggerConsoleChannel({levels: ErrorLevel}) 

theLogger.addChannel(theFileChannel)
theLogger.addChannel(theConsoleChannel)

theLogger.info("hello world!")
theLogger.error("oops error")
```

As you can see in console printed only our "error" message, but if you take a look to the log file you will find our error and info messages. 

But what if we want to log multiple levels in channel?
```js 
const theConsoleChannel = new LoggerConsoleChannel({levels: [ErrorLevel, DebugLevel]}) 
```
You can try it by yourself!

### Example 4: Logging contexts and messages utilities
Here we go! Now we have completed example. But what about details in our message? It is easy to realize with context as structure data.
```js 
const { Logger, LoggerConsoleChannel } = require("@vikhola/sermon")

const data = "some data"
const theLogger = new Logger()
const theConsoleChannel = new LoggerConsoleChannel()

theLogger.addChannel(theConsoleChannel)

theLogger.error("oops error", {sd: [{id: 1, data}]})
``` 
Now in the console will be printed the error message with additional structure data. But context could serve to provide some filtration. Let's create specific message logging by groups! 
```js
const { Logger, LoggerConsoleChannel, LoggerFileChannel } = require("@vikhola/sermon")

const group = "my custom group"

function groupValidator(message) {
    if(message.get("group") === group) return true
}

const theLogger = new Logger()

const theFileChannel = new LoggerFileChannel("./", "test")
const theConsoleChannel = new LoggerConsoleChannel()

theFileChannel.validator.set("group", groupValidator)

theLogger.addChannel(theFileChannel)
theLogger.addChannel(theConsoleChannel)

theLogger.info("hello world!")
theLogger.error("oops error", {group})
```
If you look at the log file, you will see that only the second message was logged. But what happened here? We linked the rule to our file feed inspection tool and passed the group with the message context. Our file channel then received and validated message with the `group` and, if it was valid, returned true and the file channel wrote it to a file. But what if we need more flexibility for groups and such? Let's update our previous example!
```js 
const { Logger, LoggerValidator, LoggerConsoleChannel, LoggerFileChannel } = require("@vikhola/sermon")

const group = "my custom group"

function groupValidator(message) {
    if(message.get("group") === this.context.group) return true
}

const theLogger = new Logger()
const theValidator = new LoggerValidator()
const theFileChannel = new LoggerFileChannel("./", "test", {validator: theValidator, context: {group}})
const theConsoleChannel = new LoggerConsoleChannel()

theLogger.addChannel(theFileChannel)
theLogger.addChannel(theConsoleChannel)

theValidator.set("group", groupValidator)

theLogger.info("hello world!")
theLogger.error("oops error", {group})
```
So what's happening now and what's the difference? We created a new validator and bound it to our file feed with an additional context using `group`, after that we added our rule to the validator instance. After the message was passed to the validation rule, it compared the message `group` against the current context of the file channel `group`. 

That`s probably all! You can find more information and details in the documentation!

## License

MIT License

Copyright (c) 2022 Denys Medvediev

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

