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
         * The `levels` property contain the channel levels.
         * The levels could be used until message level validation.
         */
        levels: LoggerLevels | LoggerLevels[]
        /**
         * The `context` property contain the context.
         * The context could be could be used until message processing, validation and formatting.
         */
        context?: Object
        /**
         * The `validator` property contain {@link LoggerValidator}.
         * The validator validate incoming message.
         * By default if no validator defined the channel will create his own {@link LoggerValidator} instance.
         */
        validator?: LoggerValidator
        /**
         * The `formatter` property contain {@link LoggerFormatter}.
         * The formatter used under message formatting to convert the logger message to string template. 
         * If no `formatter` present will be setted default {@link LoggerFormatter}
         */
        formatter?: LoggerFormatter
        /**
         * The `processor` property contain {@link LoggerProcessor}.
         * The processor convert incoming message to the logger message and add properties to it. 
         * If no `processor` present will be setted default {@link LoggerProcessor}
         */
        processor?: LoggerProcessor

    }

    interface ILoggerOptions {
        /**
         * The `levels` property contain the logger levels.
         * The levels could be used until message level validation in relay mode.
         */
        levels: LoggerLevels | LoggerLevels[]
        /**
         * The `context` property contain the logger context.
         * The context could be could be used until message processing, validation and formatting.
         */
        context?: Object
        /**
         * The `validator` property contain {@link LoggerValidator}.
         * The validator validate incoming message.
         * By default if no validator defined the logger will create his own {@link LoggerValidator} instance.
         */
        validator?: LoggerValidator
        /**
         * The `processor` property contain {@link LoggerProcessor}.
         * The processor  will be used under message processing and could be useful 
         * if need to add some specific metadata to the message and process it later by the channels. 
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
         * The `fileSizeLimit` property sets the file size limit.
         * This property indicate the limit after which the rotation will be performed. 
         * File size could be number in bytes or human readable format.
         */
        fileSizeLimit?: number | string
        /** 
         * The `fileSizeLimit` property sets the rotation time for the file. 
         * Accepts values in date format identifiers i.e. "MM" - month, "dd" - day, "HH" - hour, "mm" - minute.
         */
        fileTimeLimit?: number | string
        /** 
         * The `fileDateTemplate` property defines current channel filename timestamp template. 
         * This property will be used when creating the log file, namely when creating the file name.
         * By default it is `yyyy-MM-dd-hh`.
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
         * The `channel.levels` contain current array of the logger levels.
         */
        levels: LoggerLevels[]
        /**
         * The `channel.context` is the current channel context.
         */
        context: {}
        /**
         * The `channel.validator` is current channel {@link LoggerValidator} instance.
         */
        validator: LoggerValidator
        /**
         * The `channel.processor` is current channel {@link LoggerProcessor} instance.
         */
        processor: LoggerProcessor
        /**
        * The `channel.formatter` is current channel {@link LoggerFormatter} instance.
        */
        formatter?: LoggerFormatter
        /**
         * The `channel.transport` the current channel transport.
         */
        transport?: ILoggerChannelTransport
        
        constructor(options: ILoggerChannelOptions) 
        /**
         * The `channel.setLevels()` method sets channel levels to provided logger level or an array of levels.
         * If provided value contain ither than the logger level, method will throw an Error. 
         * 
         * @param levels 
         * @return Current {@link LoggerChannel} instance. 
         */
        setLevels(levels: LoggerLevels | LoggerLevels[]): this
        /**
         * The `channel.setTransport()` method set channel `transport` to provided argument.
         * The transport should extends event emitter or realize his basic interface with event subscribe. 
         * Also the channel subscribes to the transport `error` event.
         * By default channels hasn`t any transport.
         * 
         * @param transport Transport to set
         * @return Current {@link LoggerChannel} instance.
         */
        setTransport(transport: ILoggerChannelTransport): this
        /**
         * The `channel.push()` method extends the parent `push()` method. 
         * Add the message processing all by current channel {@link LoggerProcessor}. 
         * 
         * @param message Data to write. 
         * @return `true` if additional messages may continue to be pushed; `false` otherwise.
         */  
        push(message: any): boolean
        /**
         * The `channel.write()` extends the parent `write()` method.
         * The write method add additional validation and message processing. When the write method receives message, 
         * it start message validation and if validation was failed immediately resolves (if present) callback, 
         * otherwise method send to the super method result of channel processor message.    
         * 
         * @param message message to write. 
         * @param callback Callback for when this message of data is flushed.
         * @return `false` if the stream wishes for the calling code to wait for the `'drain'` event to 
         * be emitted before continuing to write additional data; otherwise `true`.
         */  
        write(message: any, callback?: (error: Error | null | undefined) => void): boolean;
        /**
         * The `channel.write()` extends the parent `write()` method.
         * The write method add additional validation and message processing. When the write method receives message, 
         * it start message validation and if validation was failed immediately resolves (if present) callback, 
         * otherwise method send to the super method result of channel processor message.     
         * 
         * @param message message to write. 
         * @param [encoding='utf8'] The encoding, will be passed with message to all added channels.
         * @param callback Callback for when this message of data is flushed.
         * @return `false` if the stream wishes for the calling code to wait for the `'drain'` event to 
         * be emitted before continuing to write additional data; otherwise `true`.
         */ 
        write(message: any, encoding: BufferEncoding, callback?: (error: Error | null | undefined) => void): boolean;
        /**
         * The `channel._read()` is mock to make {@link Readable} part of {@link Duplex} work.
         * 
         * @param size Optional argument to specify how much data to read.
         * @return Undefined.
         */
        _read(size?: number): void
        /**
         * The `channel._handle ErrorEvent()` method handles the transport `error`. . 
         * This method is private and shouldn't be called directly.
         * 
         * @param error Throwed error.
         * @return Undefined.
         */
        _handleErrorEvent<T extends Error>(error: T): void
    }

    export class LoggerFileChannel extends LoggerChannel {
        /**
         * The `channel.dir` is the current file channel directory where will be save logs relevant and already compressed.
         */
        dir: string
        /** 
         * The `channel.file` is the file name which will be used in the creation of the file name.
         */
        filename: string
        /** 
         * The `channel.compress` defines is should be file after rotation will be compressed or deleted.
         */
        compress: boolean
        /**
         * The `channel.bytesWritten` current number of bytes written to the file.
         */
        bytesWritten: number
        /**
         * The `channel.fileCreatedAt` is the current file creation date template.
         */
        fileCreatedAt?: string
        /**
         * The `channel.fileRotationSize` is the file size limit in milliseconds.
         */
        fileRotationSize?: number
        /**
         * The `channel.fileRotationTimer` is the file rotation {@link LoggerTimer}.
         */
        fileRotationTimer?: number
        /**
         * The `channel._pipelines` is the current file compression pipelines.
         */
        _pipelines: Set<PipelinePromise<WriteStream>>
        constructor(dir: string, filename: string, options: ILoggerFileChannelOptions) 
        /**
         * The `channel._write()` method provides implementation of interaction with underlying file streams
         * and optional file rotation functionality.
         * 
         * @param message Message to write. 
         * @param [encoding='utf8'] The encoding, will be passed with message to file.
         * @param callback Callback for when this message of data is flushed.
         * @return Undefined.
         */
        _write(message: LoggerMessage, encoding: string, callback: (error: Error | null | undefined) => void): void
        /**
         * The `channel._final()` method provides implementation of stream `final` event.
         * When the _final has been called, clears fileRotationTimer interval and 
         * await for all current processing compress pipelines.
         * 
         * @param callback Callback for when all `end` operations is ended.
         * @return Undefined.
         */
        _final(callback: (error?: Error | null) => void): void;
        /**
         * The `channel._destroy()` method provides implementation of stream `destroy` event.
         * When the _destroy has been called, clears fileRotationTimer interval and 
         * destroy all current processing compress pipelines.
         * 
         * @param error Optional error. 
         * @param callback Callback for when all `destroy` operations is ended.
         * @return Undefined.
         */
        _destroy(error: Error | null, callback: (error: Error | null) => void): void;
        /**
         * The `channel._rotateFile()` method provides implementation of file rotation.
         * If `compress` set to true the _rotateFile start file compressing 
         * otherwise old log file will be immediately removed.
         * 
         * @return Undefined.
         */
        _rotateFile(): void;
        /**
         * The `channel._compressFile()` method provides implementation of file compress.
         * Method creates a new file and starts compressing pipeline, than remove the source log file.
         * 
         * @return Undefined.
         */
        _compressFile(): void;
    }

    export class LoggerConsoleChannel extends LoggerChannel {
        /**
         * The `channel.color` is should message has been colorize.
         */
        color: boolean
        constructor(options: ILoggerConsoleChannelOptions) 
        /**
         * The `channel._colorize()` method provides implementation of message colorize.
         * Colorize passed message using `level.color`.
         * 
         * @param level Level used to color message.
         * @param message Message to color.
         * @returns Colored message.
         */
        _colorize(level: LoggerLevels, message: string): string
        /**
         * The `channel._write()` method provides implementation of interaction with stdout.
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
         * The `channel.setTransport()` set transport to provided `cluster.worker`.
         * 
         * @param transport transport to set
         * @return current {@link LoggerClusterChannel}.
         */
        setTransport(transport: Worker): this
        /**
         * The `channel._write()` method provides implementation of interaction with `cluster.worker`.
         * 
         * @param message Message to write. 
         * @param [encoding='utf8'] The encoding.
         * @param callback Callback for when this message of data is flushed.
         * @return Undefined.
         */
        _write(message: LoggerMessage, encoding: string, callback: (error: Error | null | undefined) => void): void
        /**
         * The `channel._final()` method provides implementation of stream `final` event.
         * 
         * @param callback callback when all operations is ended.
         * @return Undefined.
         */
        _final(callback: (error?: Error | null) => void): void;
        /**
         * The `channel._handleMessageEvent()` provides implementation of transport `message` event handling. 
         * The method listen to transport `message` event and sends payload to the current message consumers. 
         * 
         * @param message message from the transport.
         * @return Undefined.
         */
        _handleMessageEvent(message: unknown): void
    }

    export class LoggerUtil extends Map {
        constructor(...args: [any, Function])
        /**
         * The `util.set()` associate function handler for the passed key.
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
         * The `formatter.execute()` method format message to the current formatter template.
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
         * The `timer.ended` is timer ended. 
         */  
        ended: boolean
        /**
         * The `timer.timer` is interval timer. 
         */  
        timer: NodeJS.Timer
        /**
         * The `timer.delay` is timer execution delay.
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
         * The `validator.execute()` method validate provided message using associated handlers.
         * Return true if validation was succeed and false otherwise.
         * 
         * @param message message to validate.
         * @return formatted argument.
         */    
        execute(channel: any, message: any): void
    }

    export class LoggerMessage extends Map {
        constructor()
        /**
         * The `message.toString()` method stringify current message payload.
         * Return associated payload converted to the string.
         */ 
        toString(): string 
        /**
         * The `message._stringify()` method is implementation of stringify.
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
         * The `logger._channels` contain added to the logger channels.
         */
        _channels: Set<LoggerChannel>
        constructor(options?: ILoggerOptions)
        /**
         * The `logger.log()` method writes a message and optional context channels with the DebugLevel.
         * @param message Message argument.
         * @param context Optional context argument.
         * @return Undefined.
         */
        log(message: any, context?: object): void
        /**
         * The `logger.info()` method writes a message and optional context with the InfoLevel.
         * @param message Message argument.
         * @param context Optional context argument.
         * @return Undefined.
         */
        info(message: any, context?: object): void
        /**
         * The `logger.error()` method writes a message and optional context with the ErrorLevel.
         *
         * @param message Message argument.
         * @param context Optional context argument.
         * @return Undefined.
         */
        error(message: any, context?: object): void
        /**
         * The `logger.alert()` method writes a message and optional context with the AlertLevel.
         *
         * @param message Message argument.
         * @param context Optional context argument.
         * @return Undefined.
         */
        alert(message: any, context?: object): void
        /**
         * The `logger.debug()` method writes a message and optional context with the DebugLevel.
         *
         * @param message Message argument.
         * @param context Optional context argument.
         * @return Undefined.
         */
        debug(message: any, context?: object): void
        /**
         * The `logger.note()` method writes a message and optional context with the NoticeLevel.
         *
         * @param message Message argument.
         * @param context Optional context argument.
         * @return Undefined.
         */
        note(message: any, context?: object): void
        /**
         * The `logger.warn()` method writes a message and optional context with the WarningLevel.
         *
         * @param message Message argument.
         * @param context Optional context argument.
         * @return Undefined.
         */
        warn(message: any, context?: object): void
        /**
         * The `logger.crit()` method writes a message and optional context with the CriticalLevel.
         *
         * @param message Message argument.
         * @param context Optional context argument.
         * @return Undefined.
         */
        crit(message: any, context?: object): void
        /**
         * The `logger.emerg()` method writes a message and optional context with the EmergencyLevel.
         *
         * @param message Message argument.
         * @param context Optional context argument.
         * @return Undefined.
         */
        emerg(message: any, context?: object): void
        /**
         * The `logger.addChannel()` method add provided {@link LoggerChannel} instance to the logger.
         * If channel isn\`t instance of {@link LoggerChannel} method will throw an Error.
         * If {@link LoggerChannel} hasn\`t defined formatter, method will set channel formatter to the 
         * Logger formatter instance.
         * 
         * @param channel Argument to specify channel instance.
         * @return Current {@link Logger} instance.
         */
        addChannel(channel: LoggerChannel): this
        /**
         * The `logger._write()` method provides implementation of interaction with added to the logger channels.
         * The writes incoming {@link LoggerMessage} to the logger channels, and resolve incoming callback.
         * 
         * @param message Data to write. 
         * @param [encoding='utf8'] The encoding, will be passed with message to all added channels.
         * @param callback Callback for when this message of data is flushed.
         * @return Undefined.
        */
        _write(message: LoggerMessage, encoding: BufferEncoding, callback: (error?: Error | null) => void): void;
        /**
         * The `logger._handleChannelData()` method provides implementation of interaction with the channel `data` event.
         * The method calls when channel emit `data` event and write incoming message to all added channels.
         * If the logger was destroyed or ended message will be ignored.
         * 
         * @param message Incoming data.
         * @return Undefined.
         */
        _handleChannelData(message: LoggerMessage): void
        /**
         * The `logger._handleChannelClose()` method provides implementation of interaction with the channel `close` event.
         * The method calls when channel emit `close` event and remove provided channel from logger channels pool.
         * 
         * @param channel Closed channel.
         * @return Undefined.
         */
        _handleChannelClose(channel: LoggerChannel): void
        /**
         * The `logger._handleChannelError()` method provides implementation of interaction with the channel `error` event.
         * Write error message with emergency level to rest channels. 
         * If the logger is destroyed or ended emmit error to it instance.
         * 
         * @param error Throwed error.
         * @return Undefined.
         */
        _handleChannelError<T extends Error>(error: T): void
    }
 
}