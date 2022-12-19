const util = require("node:util")
const cluster = require("node:cluster")
const assert = require("node:assert")
const { describe, test } = require('node:test');
const { LoggerClusterChannel } = require("../lib/channels/channel.cluster.js")
const { LoggerFormatter } = require("../lib/utils/util.formatter.js")
const { DebugLevel } = require("../lib/levels.js")

// Enviroment

class ClusterChannelWorkerInstanceError extends Error {
    constructor() {
        super("ChannelWorkerType: Worker should be instance of cluster.Worker")
    }
}

// Tests

if(!cluster.isWorker) {
    const worker = cluster.fork()

    test("constructor process transport", function(t, done) {
        const theChannel = new LoggerClusterChannel(worker)
        assert.deepEqual(theChannel.transport, worker, "channel transport property should be equal to worker")
        theChannel.end(done)
    })

    test("constructor process undefined worker", function() {
        assert.throws(
            () => new LoggerClusterChannel(), 
            new ClusterChannelWorkerInstanceError(), 
            `channel should throw an ${util.format(new ClusterChannelWorkerInstanceError())}`
        )
    })

    test("process worker listening", function(t,done) {
        const theChannel = new LoggerClusterChannel(worker)
        theChannel.on("data", message => {
            try {
                assert.equal(message.get("msg"), "<15> test message", "message msg should be equal to provided <15> test message")
                assert.equal(message.transform, false, "message transform should be equal to provided false")
                assert.deepStrictEqual(message.get("level"), DebugLevel, "message level should be equal to provided DebugLevel")
                theChannel.end(done)
            }catch(e) {
                done(e)
            }finally {
                worker.kill(1)
            }    
        })
    })

} else {
    const worker = cluster.worker

    test("constructor process transport", function(t, done) {
        const theChannel = new LoggerClusterChannel(worker)
        assert.equal(theChannel.transport, worker,  "channel transport property should be equal to worker")
        theChannel.end(done)
    })

    test("process worker writing", function(t, done) {
        const theChannel = new LoggerClusterChannel(worker, { formatter: new LoggerFormatter("<%pri%> %msg%") })
        theChannel.write("test message", (err) => theChannel.end(done))  
    })

}