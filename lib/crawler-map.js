var spiegelCrawler = require('./crawlers/spiegel'),
    tazCrawler = require('./crawlers/taz');

module.exports = {
    'spiegel': spiegelCrawler,
    'taz': tazCrawler
};
