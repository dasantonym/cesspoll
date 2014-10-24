module.exports = {
    update_interval: 30, // minutes
    jsdom_concurrency: 2, // concurrent jsdom processes for each worker
    kue: {
        admin: {
            active: true,
            port: 4444,
            login: 'admin',
            password: 'dumb-as-fuck'
        }
    },
    mongodb: {
        dbname: 'cesspoll',
        host: 'localhost',
        port: 27017
    }
};