module.exports = {
    update_interval: 30, // minutes
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