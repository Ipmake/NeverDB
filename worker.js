const { workerData, parentPort } = require('worker_threads')
const fs = require('fs')


parentPort.postMessage({ type: 'ready' })


parentPort.on('message', (message) => {
    switch (message.type) {
        case 'request':
            (async () => {
                switch (message.requestType) {
                    case 'get':
                        var { requestType, db, key } = message

                        try{
                            var data = JSON.parse(fs.readFileSync(`./${workerData.config.path}/${db}/${key}.nve`, 'utf8'))
                        }
                        catch(e) {
                            return parentPort.postMessage({ type: 'response', id: message.id, data: null, err: "DB or Key not found" })
                        }
        
                        parentPort.postMessage({
                            type: 'response',
                            requestType: requestType,
                            data: data,
                            id: message.id
                        })

                    break;

                    case 'post':
                        var { requestType, db, key, data } = message

                        try{
                            data._key = key
                            fs.writeFileSync(`./${workerData.config.path}/${db}/${key}.nve`, JSON.stringify(data))
                        }
                        catch(e) {
                            return parentPort.postMessage({ type: 'response', id: message.id, data: null, err: "DB or Key not found" })
                        }

                        parentPort.postMessage({
                            type: 'response',
                            requestType: requestType,
                            data: data,
                            id: message.id
                        })

                    break;

                }
            })()
    }

})