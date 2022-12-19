declare module "@vikhola/sermon" {
    import { Worker } from "node:cluster"
    import { WriteStream } from "node:fs"
    import { Duplex, PipelinePromise } from "node:stream"
    import { EventEmitter } from "node:events"
    
    export class EmergencyLevel {
        static name: "emerg"
        static code:  0
        static color:  "\u001b[33;1m"
    }
    
    export class AlertLevel {
        static name:  "alert"
        static code:  1
        static color:  "\u001b[33m"
    }
    
    export class CriticalLevel {
        static name:  "crit"
        static code:  2
        static color:  "\u001b[31;1m"
    }
    
    export class ErrorLevel {
        static name:  "error"
        static code:  3
        static color:  "\u001b[31m"
    }
    
    export class WarningLevel {
        static name:  "warn"
        static code:  4
        static color:  "\u001b[31m"
    }
    
    export class NoticeLevel {
        static name:  "note"
        static code:  5
        static color:  "\u001b[35m"
    }
    
    export class InfoLevel {
        static name:  "info"
        static code:  6
        static color:  "\u001b[0m"
    }
    
    export class DebugLevel {
        static name:  "debug"
        static code:  7
        static color:  "\u001b[34m"
    }

    type LoggerLevels = EmergencyLevel | AlertLevel | CriticalLevel | ErrorLevel | WarningLevel | NoticeLevel | InfoLevel | DebugLevel

    interface ILoggerChannelTransport extends EventEmitter {}

    interface ILoggerChannelOptions {
        /**
         * The `levels` property contain channel levels which will be used until message level validation.
         */
        levels: LoggerLevels | LoggerLevels[]
        /**
         * The `context` property contain channel context which could be used until message processing.
         */
        context?: Object
        /**
         * The `validator` property contain {@link LoggerValidator} which will be used to validate incoming message.
         * By default if no validator defined channel will create his own {@link LoggerValidator} instance.
         */
        validator?: LoggerValidator
        /**
         * The `formatter` property contain {@link LoggerFormatter} which could be used under message formatting. 
         * It helps convert default logger message which already has been processed by 
         * {@link LoggerProcessor} to string or other format.
         * If no `processor` present will be setted default {@link LoggerFormatter}
         */
        formatter?: LoggerFormatter
        /**
         * The `processor` property contain {@link LoggerProcessor} which will be used under message processing. 
         * If no `processor` present will be setted default {@link LoggerProcessor}
         */
        processor?: LoggerProcessor

    }

    interface ILoggerOptions {
        /**
         * The `levels` property contain the logger levels which will be used until message level validation.
         */
        levels: LoggerLevels | LoggerLevels[]
        /**
         * The `context` property contain the logger context which could be used until message processing.
         */
        context?: Object
        /**
         * The `validator` property contain {@link LoggerValidator} which will be used to validate incoming message.
         * By default if no validator defined the logger  will create his own {@link LoggerValidator} instance.
         */
        validator?: LoggerValidator
        /**
         * The `processor` property contain {@link LoggerProcessor} which will be used under message processing. 
         * It can be useful if need to add some specific for this channel metadata to the message 
         * which will be used later. 
         * If no `processor` present will be setted default {@link LoggerProcessor}
         */
        processor?: LoggerProcessor
    }

    interface ILoggerFileChannelOptions extends ILoggerChannelOptions {
        /** 
         * The `compress` property indicates whether the file should be compressed after rotation.
         */
        compress?: boolean
        /** 
         * The `fileSizeLimit` property sets the file size limit after which rotation will be performed. 
         * File size could be number in bytes or human readable format.
         */
        fileSizeLimit?: number | string
        /** 
         * The `fileSizeLimit` property sets the rotation time for the file. 
         * Accepts values in date format identifiers i.e. "MM" - month, "dd" - day, "HH" - hour, "mm" - minute.
         */
        fileTimeLimit?: number | string
        /** 
         * The `fileDateTemplate` property defines current channel filename 
         * timestamp template which will be used in the log file creation. 
         * By default it is `yyyy-MM-dd-hh`, 
         * but in several cases file timestamp could be different and contain more time indicators.
         */ 
        fileDateTemplate?: string
    }

    interface ILoggerConsoleChannelOptions extends ILoggerChannelOptions {}

    interface ILoggerOptions extends ILoggerChannelOptions {}

    interface ILoggerContext {
        /**
         * Current process pid.
         */
        procid: number, 
        /**
         * Current version.
         * 
         * @default 1
         */
        version: 1, 
        /**
         * Current facility.
         * 
         * @default 1
         */
        facility: 1, 
        /**
         * Current system hostname.
         * 
         * @default 1
         */
        hostname: string
    }

    export class LoggerChannel extends Duplex {
        /**
         * The `channel.id` is unique channel identificator.
         */
        id: string
        /**
         * The `channel.levels` contain current array of LoggerLevels.
         */
        levels: LoggerLevels[]
        /**
         * The `channel.context` current channel context.
         */
        context: {}
        /**
         * The `channel.validator` is current channel {@link LoggerValidator} instance.
         */
        validator: LoggerFormatter
        /**
         * The `channel.formatter` is current channel {@link LoggerProcessor} instance.
         */
        processor: LoggerFormatter
        /**
         * The `channel.transport`  current channel transport.
         */
        transport?: ILoggerChannelTransport

        constructor(options: ILoggerChannelOptions) 
        /**
         * The `channel.setLevels()` method sets channel levels to provided logger level or an array of levels.
         * 
         * If provided value level isn`t logger level or array includes anything else, method will throw an Error. 
         * 
         * @param levels 
         * @return Current {@link LoggerChannel} instance. 
         */
        setLevels(levels: LoggerLevels | LoggerLevels[]): this
        /**
         * The `channel.setTransport()` method set channel `transport` to provided argument and subscribe to it `error` event.
         * Transport could be anything what extends event emitter or realize his basic interface with event subscribe. 
         * By default channels hasn`t any transport.
         * 
         * @param transport Transport to set
         * @return Current {@link LoggerChannel} instance.
         */
        setTransport(transport: ILoggerChannelTransport): this
        /**
         * The `channel.push()` method extends parent method and process all 
         * passed messages by current channel {@link LoggerProcessor}. 
         * 
         * @param message Data to write. 
         * @return `true` if additional messages may continue to be pushed; `false` otherwise.
         */  
        push(message: any): boolean
        /**
         * The `channel.write()` extends parent method and add additional validation and message processing. 
         * When method receives message, he start message validation and if validation was failed immediately 
         * resolves (if present) callback, otherwise method send to the super method result of channel processor message.    
         * 
         * @param message message to write. 
         * @param callback Callback for when this message of data is flushed.
         * @return `false` if the stream wishes for the calling code to wait for the `'drain'` event to 
         * be emitted before continuing to write additional data; otherwise `true`.
         */  
        write(message: any, callback?: (error: Error | null | undefined) => void): boolean;
        /**
         * The `channel.write()` extends parent method and add additional validation and message processing. 
         * When method receives message, he start message validation and if validation was failed immediately 
         * resolves (if present) callback, otherwise method send to the super method result of channel processor message. 
         * 
         * @param message message to write. 
         * @param [encoding='utf8'] The encoding, will be passed with message to all added channels.
         * @param callback Callback for when this message of data is flushed.
         * @return `false` if the stream wishes for the calling code to wait for the `'drain'` event to 
         * be emitted before continuing to write additional data; otherwise `true`.
         */ 
        write(message: any, encoding: BufferEncoding, callback?: (error: Error | null | undefined) => void): boolean;
        /**
         * The `channel._read()` method is mock to make {@link Readable} part of {@link Duplex} work.
         * 
         * @param size Optional argument to specify how much data to read.
         * @return Undefined.
         */
        _read(size?: number): void
        /**
         * The `channel._handle ErrorEvent()` method handles current transport `error` 
         * event and after calling destroy channel with provided error. 
         * This method is private and shouldn't be called directly.
         * 
         * @param error Throwed error.
         * @return Undefined.
         */
        _handleErrorEvent<T extends Error>(error: T): void
    }

    export class LoggerFileChannel extends LoggerChannel {
        /**
         * The `dir` define current file channel directory where will be save logs relevant and already compressed.
         */
        dir: string
        /** 
         * The `file` defines the file name of the current file channel,
         * which will be used in the creation of the file name, 
         * by combining the file name and the timestamp.
         */
        filename: string
        /** 
         * The `channel.compress` indicates if after rotation file will be compressed or deleted.
         */
        compress: boolean
        /**
         * The `channel.bytesWritten` number of bytes written to the file.
         */
        bytesWritten: number
        /**
         * The `channel.bytesWritten` is current file creation date template.
         */
        fileCreatedAt?: string
        /**
         * The `channel.fileRotationSize` file size limit in milliseconds.
         */
        fileRotationSize?: number
        /**
         * The `channel.fileRotationTimer` file rotation {@link LoggerTimer}.
         */
        fileRotationTimer?: number
        /**
         * The `channel._pipelines` current file compression pipelines.
         */
        _pipelines: Set<PipelinePromise<WriteStream>>
        constructor(dir: string, filename: string, options: ILoggerFileChannelOptions) 
        /**
         * Method provides implementation of interaction with underlying file streams, 
         * and optional file rotation functionality. After the method receives the message, 
         * it calls {@link LoggerFormatter}, after which it calculates the size of the formatted message 
         * and adds its size to bytesWritten, if pending file size exceed limit call file rotation.
         * 
         * @param message Message to write. 
         * @param [encoding='utf8'] The encoding, will be passed with message to file.
         * @param callback Callback for when this message of data is flushed.
         * @return Undefined.
         */
        _write(message: LoggerMessage, encoding: string, callback: (error: Error | null | undefined) => void): void
        /**
         * Method provides implementation of stream `final` event, where it close current file transport, 
         * clear fileRotationTimer interval and await for all current processing compress pipelines.
         * 
         * @param callback Callback for when all `end` operations is ended.
         * @return Undefined.
         */
        _final(callback: (error?: Error | null) => void): void;
        /**
         * Method provides implementation of stream `destroy` event, where destroy current file transport,
         * clear fileRotationTimer interval and destroy all current processing compress pipelines.
         * 
         * @param error Optional error. 
         * @param callback Callback for when all `destroy` operations is ended.
         * @return Undefined.
         */
        _destroy(error: Error | null, callback: (error: Error | null) => void): void;
        /**
         * Method end current file transport start it rotation and open new file transport, 
         * if `compress` set to true it start file compressing otherwise old log file will be immediately removed.
         * 
         * @return Undefined.
         */
        _rotateFile(): void;
        /**
         * Method creates a new file and starts compressing the old log file using a pipeline, 
         * then adds it to `_pipelines`. After the completion of the pipeline, the old log file is deleted.
         * 
         * @return Undefined.
         */
        _compressFile(): void;
    }

    export class LoggerConsoleChannel extends LoggerChannel {
        /**
         * The `channel.color` indicates is should been colorize.
         */
        color: boolean
        constructor(options: ILoggerConsoleChannelOptions) 
        /**
         * The `channel._colorize()` colorize passed message using `level.color`.
         * 
         * @param level Level used to color message.
         * @param message Message to color.
         * @returns Colored message.
         */
        _colorize(level: LoggerLevels, message: string): string
        /**
         * The `channel._write()` method format, optionally colorize and writes passed message to stdout.
         * 
         * @param message Message to write. 
         * @param [encoding='utf8'] The encoding, will be passed with message to file.
         * @param callback Callback for when this message of data is flushed.
         * @return Undefined.
         */
        _write(message: LoggerMessage, encoding: string, callback: (error: Error | null | undefined) => void): void
    }

    export class LoggerClusterChannel extends LoggerChannel {
        constructor(worker: Worker, options: ILoggerChannelOptions)
        /**
         * The `channel.setTransport()` method set `channel.transport` to provided `cluster.worker`
         * instance and subscribe to it `message` event.
         * 
         * @param transport transport to set
         * @return current {@link LoggerClusterChannel}.
         */
        setTransport(transport: Worker): this
        /**
         * The `channel._write()` method transform provided message, and write it to the transport.
         * 
         * @param message Message to write. 
         * @param [encoding='utf8'] The encoding.
         * @param callback Callback for when this message of data is flushed.
         * @return Undefined.
         */
        _write(message: LoggerMessage, encoding: string, callback: (error: Error | null | undefined) => void): void
        /**
         * The `channel._final()` method calls after channel `end`.
         * 
         * @param callback callback when all operations is ended.
         * @return Undefined.
         */
        _final(callback: (error?: Error | null) => void): void;
        /**
         * The `channel._handleMessageEvent()` method listen to transport `message` event, with 
         * `CLUSTER_CHANNEL_WRITE_COMMAND` command and send it to the current message consumers. 
         * 
         * @param message message from the transport.
         * @return Undefined.
         */
        _handleMessageEvent(message: unknown): void
    }

    export class LoggerUtil extends Map {
        constructor(...args: [any, Function])
        /**
         * The `util.set()` associate handler for the passed key.
         * If handler isn`t type of `function` will be throwed an Error.
         * 
         * @param key handler key.
         * @param handler util handler.
         * @return Current {@link LoggerUtil} instance.
         */
        set(key: any, handler: Function): this
        /**
         * The `util.execute()` method transform provided message using associated handlers and return it.
         * 
         * @param message message to transform.
         * @return Transformed to string message.
         */    
        execute(channel: any, message: any): any
    }

    export class LoggerFormatter extends LoggerUtil {
        /**
         * The `formatter.matcher` is a template RegExp replacer.
         */
        matcher: RegExp
        /**
         * The `formatter.template` is a message template.
         */
        template: string
        /**
         * @param template message template.
         */
        constructor(template: string) 
        /**
         * The `formatter.execute()` method format current formatter template using associated handlers and passed message. 
         * If message isn`t instance {@link LoggerMessage} and instance of Buffer method will return it otherwise
         * will be returned formatted message string. 
         * 
         * @param message message to format.
         * @return formatted message.
         */    
        execute(channel: any, message: any): void
    }

    export class LoggerProcessor extends LoggerUtil {
        /**
         * The `processor.execute()` method transform provided message using associated handlers and return it.
         * If message isn`t instance of {@link LoggerMessage} method will transform and pass it to 
         * associated handlers.
         * 
         * @param message message to process.
         * @return transformed argument.
         */    
        execute(channel: any, message: any): void
    }

    export class LoggerTimer extends LoggerUtil {
        /**
         * The `timer.ended` timer is ended. 
         */  
        ended: boolean
        /**
         * The `timer.timer` interval timer. 
         */  
        timer: NodeJS.Timer
        /**
         * The `timer.delay` timer execution delay.
         */   
        delay: string
        /**
         * The `timer.ended` timer is ended. 
         * 
         * @param delay timer execution delay
         */  
        constructor(delay: string)
        /**
         * The `timer.stop()` stop current execution interval.
         */    
        stop(): this
        /**
         * The `timer.execute()` intervaly executes callback after defined delay.
         * 
         * @param callback callback to execute.
         * @return formatted argument.
         */    
        execute(channel: any, callback: Function): void
    }

    export class LoggerValidator extends LoggerUtil {
        /**
         * The `validator.execute()` method validate provided message using associated handlers and return true 
         * if validation was succeed and false otherwise.
         * 
         * @param message message to validate.
         * @return formatted argument.
         */    
        execute(channel: any, message: any): void
    }

    export class LoggerMessage extends Map {
        constructor()
        /**
         * The `message.toString()` method stringify and return associated payload.
         */ 
        toString(): string 
        /**
         * The `dto._stringify()` method stringify provided value.
         * If message type of `object` method will stringify and return object with ownPropertiesNames
         * otherwise method will return message string.
         * 
         * @param value data to stringify.
         * @return transformed to string value.
         */ 
        _stringify(value: any): string
    }

    export class Logger extends LoggerChannel {
        /**
         * The `logger.context` contain basic system and logging information.
         */
        context: ILoggerContext
        /**
         * The `logger._channels` contain current added LoggerChanels.
         */
        _channels: Set<LoggerChannel>
        constructor(options?: ILoggerOptions)
        /**
         * The `logger.log()` method outputs a message and optional context to the logger channels with DebugLevel.
         * 
         * @param message Message argument.
         * @param context Optional context argument.
         * @return Undefined.
         */
        log(message: any, context?: object): void
        /**
         * The `logger.info()` method outputs a message and optional context to the logger channels with InfoLevel.
         * @param message Message argument.
         * @param context Optional context argument.
         * @return Undefined.
         */
        info(message: any, context?: object): void
        /**
         * The `logger.error()` method outputs a message and optional context to the logger channels with ErrorLevel.
         *
         * @param message Message argument.
         * @param context Optional context argument.
         * @return Undefined.
         */
        error(message: any, context?: object): void
        /**
         * The `logger.alert()` method outputs a message and optional context to the logger channels with AlertLevel.
         *
         * @param message Message argument.
         * @param context Optional context argument.
         * @return Undefined.
         */
        alert(message: any, context?: object): void
        /**
         * The `logger.debug()` method outputs a message and optional context to the logger channels with DebugLevel.
         *
         * @param message Message argument.
         * @param context Optional context argument.
         * @return Undefined.
         */
        debug(message: any, context?: object): void
        /**
         * The `logger.note()` method outputs a message and optional context to the logger channels with NoticeLevel.
         *
         * @param message Message argument.
         * @param context Optional context argument.
         * @return Undefined.
         */
        note(message: any, context?: object): void
        /**
         * The `logger.warn()` method outputs a message and optional context to the logger channels with WarningLevel.
         *
         * @param message Message argument.
         * @param context Optional context argument.
         * @return Undefined.
         */
        warn(message: any, context?: object): void
        /**
         * The `logger.crit()` method outputs a message and optional context to the logger channels with CriticalLevel.
         *
         * @param message Message argument.
         * @param context Optional context argument.
         * @return Undefined.
         */
        crit(message: any, context?: object): void
        /**
         * The `logger.emerg()` method outputs a message and optional context to the logger channels with EmergencyLevel.
         *
         * @param message Message argument.
         * @param context Optional context argument.
         * @return Undefined.
         */
        emerg(message: any, context?: object): void
        /**
         * The `logger.addChannel()` method add provided {@link LoggerChannel} instance to the logger.
         * 
         * If channel isn\`t instance of {@link LoggerChannel} method will throw an Error.
         * 
         * If {@link LoggerChannel} hasn\`t defined formatter, method will set channel formatter to the 
         * Logger formatter instance.
         * 
         * @param channel Argument to specify channel instance.
         * @return Current {@link Logger} instance.
         */
        addChannel(channel: LoggerChannel): this
        /**
         * The `logger._write()` method calls by {@link write} and writes incoming {@link LoggerMessage} with encoding 
         * to the logger channels, and resolve incoming callback.
         * 
         * @param message Data to write. 
         * @param [encoding='utf8'] The encoding, will be passed with message to all added channels.
         * @param callback Callback for when this message of data is flushed.
         * @return Undefined.
        */
        _write(message: LoggerMessage, encoding: BufferEncoding, callback: (error?: Error | null) => void): void;
        /**
         * The `logger._handleChannelData()` method calls when channel emit `data` event and write incoming message 
         * to all added channels.
         * If the logger was destroyed or ended message will be ignored.
         * 
         * @param message Incoming data.
         * @return Undefined.
         */
        _handleChannelData(message: LoggerMessage): void
        /**
         * The `logger._handleChannelClose()` method calls when channel emit `close` event and remove 
         * provided channel from logger channels pool.
         * 
         * @param channel Closed channel.
         * @return Undefined.
         */
        _handleChannelClose(channel: LoggerChannel): void
        /**
         * The `logger._handleChannelError()` method calls when channel emit `error` event. 
         * Write error message with emergency level to rest channels. 
         * If the logger is destroyed or ended emmit error to it instance.
         * 
         * @param error Throwed error.
         * @return Undefined.
         */
        _handleChannelError<T extends Error>(error: T): void
    }
 
}