module.exports.extractFragments = function (input) {
    if (!input) {
        return [];
    }
    var fragments = input.split(/[.,;:!\n]/);
    var results = [];
    for (var i = 0; i < fragments.length; i += 1) {
        if (fragments[i] !== '') {
            results.push(fragments[i].trim());
        }
    }
    return results;
};

module.exports.normalizeText = function (input) {
    if (!input) {
        return '';
    }
    var compacted = input.replace(/\s\s+/g, ' ');
    return compacted;
};
