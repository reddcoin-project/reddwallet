/* Filters*/

angular.module('app.filters', []).filter('interpolate', [
    'version', function (version) {
        return function (text) {
            return String(text).replace(/\%VERSION\%/mg, version);
        };
    }
]);

function smartTrim(string, maxLength) {

    if (!string) return string;
    if (maxLength < 1) return string;
    if (string.length <= maxLength) return string;
    if (maxLength == 1) return string.substring(0, 1) + '...';


    var midpoint = Math.ceil(string.length / 2);
    var toRemove = string.length - maxLength;
    var lStrip = Math.ceil(toRemove / 2);
    var rStrip = toRemove - lStrip;

    return string.substring(0, midpoint - lStrip) + '...' + string.substring(midpoint + rStrip);
}

/* A function that splits a string `limit` times and adds the remainder as a final array index.
 * > var a = 'convoluted.madeup.example';
 * > a.split('.', 1);
 * < ['convoluted']
 * // What I expected:
 * < ['convoluted', 'madeup.example']
 */
function properSplit(str, separator, limit) {
    str = str.split(separator);

    if(str.length > limit) {
        var ret = str.splice(0, limit);
        ret.push(str.join(separator));

        return ret;
    }

    return str;
}