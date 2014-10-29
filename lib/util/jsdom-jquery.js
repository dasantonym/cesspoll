module.exports = function () {
    var fs = require('fs'),
        path = require('path');
    return fs.readFileSync(path.join(__dirname, './jquery.min.js'), 'utf-8');
};