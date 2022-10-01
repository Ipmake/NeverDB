const chalk = require('chalk')
const fs = require('fs')
const socketIO = require('socket.io')


module.exports = class {
    constructor(config, {workers, nextThread, switchThread}) {
        this.config = config

        this.workers = workers
        this.nextThread = nextThread
        this.switchThread = switchThread

        this.socket = socketIO(config.port)

        console.log(chalk.green(`Socket server listening on port ${config.port}`))

        this.listen()
    }

    listen() {
        this.socket.on('connection', (socket) => {
            console.log(chalk.green(`Socket connected: ${socket.id}`))

            socket.data = {
                authenticated: false
            }
        
            socket.on('authenticate', (data) => {
                if(data.secret === this.config.secret) {
                    socket.data.authenticated = true
                    socket.emit('authenticated')
                    console.log("Socket authenticated")
                } else {
                    socket.emit({ type: 'error', message: 'Invalid secret' })
                    console.log("Socket authenticated failed")
                }
            })
        
    

            // listen to all socket events
            socket.onAny((eventName, data) => {
                if(!socket.data.authenticated) return socket.emit({ type: 'error', message: 'Not authenticated' })
                var event = eventName.split('/')[0]

                // get the next thread
                var thread = this.nextThread[0]
                this.switchThread(thread)

                const localID = Math.round(Math.random() * 100000000)

                // send the event to the worker thread
                switch(event) {
                    case 'get':
                        this.workers[thread].postMessage({
                            type: 'request',
                            requestType: "get",
                            id: localID,
                            db: data.db,
                            key: data.key
                        })
        
                        this.workers[thread].on('message', (message) => {
                            if(message.id === localID) {
                                return socket.emit(`${eventName}/response`, message)
                            }
                        })
                    break;

                    case 'post':
                        this.workers[thread].postMessage({
                            type: 'request',
                            requestType: "post",
                            id: localID,
                            db: data.db,
                            key: data.key,
                            data: data.value
                        })

                        this.workers[thread].on('message', (message) => {
                            if(message.id === localID) {
                                return socket.emit(`${eventName}/response`, message)
                            }
                        })
                    break;

                    case 'postBit':
                        this.workers[thread].postMessage({
                            type: 'request',
                            requestType: "postBit",
                            id: localID,
                            db: data.db,
                            key: data.key,
                            data: data.value
                        })

                        this.workers[thread].on('message', (message) => {
                            if(message.id === localID) {
                                return socket.emit(`${eventName}/response`, message)
                            }
                        })
                    break;
                }

            });
        })
    }
}