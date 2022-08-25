const chalk = require('chalk')
const fs = require('fs')

module.exports = class {
    constructor(app, config) {
        this.app = app
        this.config = config

        this.app.use((req, res, next) => {
            res.setHeader('X-Powered-By', 'NeverDB')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Credit', 'IPGsystems')
            next()
        })

        this.app.listen(config.adminPort, () => {
            console.log(chalk.green(`Admin server listening on port ${config.adminPort}`))
        })


        this.init()
        this.admin()
    }

    async admin() {
        this.app.get('/', async (req, res) => {
            res.send('Admin server')
        })

        this.app.post('/db/create/:id', async (req, res) => {
            if(req.body.secret !== this.config.secret) return res.send({ type: 'error', message: 'Invalid secret' })
            try {
                fs.mkdirSync(`${this.config.path}/${req.params.id}`)
                res.send('DB created')
            } catch(e) {
                console.log(chalk.red(`[${new Date()}] ${e}`))
                res.status(500).send(e.stack)
            }
        })

        this.app.post('/db/update/:id/:new', async (req, res) => {
            if(req.body.secret !== this.config.secret) return res.send({ type: 'error', message: 'Invalid secret' })
            try {
                fs.renameSync(`${this.config.path}/${req.params.id}`, `${this.config.path}/${req.params.new}`)
                res.send('DB Updated')
            } catch(e) {
                console.log(chalk.red(`[${new Date()}] ${e}`))
                res.status(500).send(e.stack)
            }
        })

        this.app.post('/db/delete/:id', async (req, res) => {
            if(req.body.secret !== this.config.secret) return res.send({ type: 'error', message: 'Invalid secret' })
            try {
                fs.rmSync(`${this.config.path}/${req.params.id}`, { recursive: true, maxRetries: 10, force: true })
                res.send('DB deleted')
            } catch(e) {
                console.log(chalk.red(`[${new Date()}] ${e}`))
                res.status(500).send(e.stack)
            }
        })

        this.app.post('/db/list', async (req, res) => {
            if(req.body.secret !== this.config.secret) return res.send({ type: 'error', message: 'Invalid secret' })
            try {
                res.send(fs.readdirSync(this.config.path))
            } catch(e) {
                console.log(chalk.red(`[${new Date()}] ${e}`))
                res.status(500).send(e.stack)
            }
        })
    }

    async init() {

        this.app.post('/data/get/:db/:key' , async (req, res) => {
            if(req.body.secret !== this.config.secret) return res.send({ type: 'error', message: 'Invalid secret' })
            try {
                var data = JSON.parse(fs.readFileSync(`${this.config.path}/${req.params.db}/${req.params.key}.nte`, 'utf8'))
                res.send(data)
            }
            catch(e) {
                console.log(chalk.red(`[${new Date()}] ${e}`))
                res.status(500).send(e.stack)
            }
        })

        this.app.post('/data/update/:db/:key' , async (req, res) => {
            if(req.body.secret !== this.config.secret) return res.send({ type: 'error', message: 'Invalid secret' })
            try {
                req.body.data._key = req.params.key
                fs.writeFileSync(`${this.config.path}/${req.params.db}/${req.params.key}.nte`, JSON.stringify(req.body.data))
                res.send(req.body.data)
            }
            catch(e) {
                console.log(chalk.red(`[${new Date()}] ${e}`))
                res.status(500).send(e.stack)
            }
        })


    }
}