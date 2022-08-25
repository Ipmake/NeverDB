const config = require('./config.json')
const { Worker } = require('worker_threads')
const chalk = require('chalk')
const express = require('express')
const socket = require('socket.io')
const app = express()
const admin = require('./admin')

const ws = socket(config.port)

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


ws.on('connection', (socket) => {

    socket.data = {
        authenticated: false
    }

    socket.on('authenticate', (data) => {
        if(data.secret === config.secret) {
            socket.data.authenticated = true
            socket.emit('authenticated')
        } else {
            socket.emit({ type: 'error', message: 'Invalid secret' })
            socket.disconnect()
        }
    })



    socket.on('get', ({db, key}) => {
        if(!socket.data.authenticated) return socket.emit({ type: 'error', message: 'Not authenticated' }), socket.disconnect(), console.log(chalk.red(`[${new Date()}] Client not authenticated`))
        const worker = workers[nextThread[0]]
        switchThread(nextThread[0])
        const id = Math.floor(Math.random() * 999999999)
        
        worker.postMessage({
            type: 'request',
            requestType: 'get',

            db: db,
            key: key,
            id: id
        })

        new Promise((resolve, reject) => {
            worker.on('message', (message) => {
                if(message.type === 'response' && message.id === id) {
                    resolve(message.data)
                }
            }
            )
        })
        .then((message) => {
            socket.emit('response_get', message)
        })

    })

    socket.on('post', ({db, key, data}) => {
        if(!socket.data.authenticated) return socket.emit({ type: 'error', message: 'Not authenticated' }), socket.disconnect(), console.log(chalk.red(`[${new Date()}] Client not authenticated`))
        const worker = workers[nextThread[0]]
        switchThread(nextThread[0])
        const id = Math.floor(Math.random() * 999999999)
        
        worker.postMessage({
            type: 'request',
            requestType: 'post',

            db: db,
            key: key,
            data: data,
            id: id
        })

        new Promise((resolve, reject) => {
            worker.on('message', (message) => {
                if(message.type === 'response' && message.id === id) {
                    resolve(message.data)
                }
            }
            )
        })
        .then((message) => {
            socket.emit('response_post', message)
        })

    })






    socket.on('disconnect', () => {
    })
})





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