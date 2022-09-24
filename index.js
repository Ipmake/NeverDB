const config = require('./config.json')
const { Worker } = require('worker_threads')
const chalk = require('chalk')
const express = require('express')
const app = express()
const admin = require('./admin')
const socket = require('./socket')

app.use(express.json());

new admin(app, config)



var workers = []
var nextThread = []

// launch the config.threads ammount as worker threads
for (let i = 0; i < config.threads; i++) {
    const worker = new Worker('./worker.js', {
        workerData: {
            config: config
        }
    })
    workers.push(worker)
    nextThread.push(workers.length - 1)
}





async function switchThread(thread) {
    nextThread.push(thread)
    nextThread.shift()
}


process.on('uncaughtException', (err) => {
    console.log(chalk.red(err.stack))
})

process.on('unhandledRejection', (err) => {
    console.log(chalk.red(err.stack))
})

new socket(config, {workers, nextThread, switchThread})