const { Logger } = require("./lib/logger.js")
const { LoggerUtil } = require("./lib/util.js")
const { LoggerChannel } = require("./lib/channel")
const { LoggerMessage } = require("./lib/message.js")
const { LoggerTimer } = require("./lib/utils/util.timer.js")
const { LoggerProcessor } = require("./lib/utils/util.processor.js")
const { LoggerFormatter } = require("./lib/utils/util.formatter.js")
const { LoggerValidator } = require("./lib/utils/util.validator.js")
const { LoggerFileChannel } = require("./lib/channels/channel.file.js")
const { LoggerClusterChannel } = require("./lib/channels/channel.cluster.js")
const { LoggerConsoleChannel } = require("./lib/channels/channel.console.js")

module.exports = {
    Logger,
    LoggerUtil,
    LoggerChannel,
    LoggerFileChannel,
    LoggerClusterChannel,
    LoggerConsoleChannel,
    LoggerMessage,
    LoggerTimer,
    LoggerProcessor,
    LoggerFormatter,
    LoggerValidator,
    ...require("./lib/levels.js")
}