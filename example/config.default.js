module.exports = {
    update_delay: 15, // minutes
    job_concurrency: 1, // simultaneous updates
    jsdom_concurrency: 1, // concurrent jsdom processes for each update worker
    tmp_folder: './tmp',
    crawlers: [
        'spiegel',
        'taz'
    ],
    kue: {
        admin: {
            active: false,
            port: 4444,
            login: 'admin',
            password: 'dumb-as-fuck'
        }
    },
    analysis: {
        active: false,
        hyphenation: {
            hyphen_example_path: '/home/me/hyphen-2.8.8/example',
            hyphen_dictionary_path: '/home/me/hyph_de_DE.dic'
        }
    },
    mongodb: {
        dbname: 'cesspoll',
        host: 'localhost',
        port: 27017
    }
};