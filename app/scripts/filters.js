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

angular.module('app.filters').filter('to_trusted', ['$sce', function($sce){
    return function(text) {
        return $sce.trustAsHtml(text);
    };
}]);

angular.module('app.filters').filter('stakedate', ['$filter', function ($filter) {
    return function(timestamp) {

        if (timestamp == null || timestamp == -1) {
            return "Unknown";
        }

        var currentTimestamp = new Date().getTime();
        var millisecondsToStake = currentTimestamp + (timestamp * 1000);

        var date = $filter('date')(new Date(millisecondsToStake), 'yyyy-dd-MM HH:mm:ss');

        return date.toUpperCase();
    }
}]);

angular.module('app.filters').filter('staketime', ['$filter', function ($filter) {
    return function(timestamp) {

        if (timestamp == null || timestamp == -1) {
            return "Unknown";
        }

        var days = timestamp / 60 / 60 / 24;
        var hours = (timestamp % 84600) / 60 / 60;


        return Math.floor(days) + " days, " + Math.floor(hours) + " hours";
    }
}]);


angular.module('app.filters').filter('link2fn', ['$sce', function($sce){
    return function(text) {
        var openingTagMatches = text.match(/<a href=".*">/);
        if (openingTagMatches.length > 0) {

            var url = openingTagMatches[0].substring(7); // Cut off front
            url = url.substring(1, url.length - 1); // Cut off back

            // Build new one (url already has the quotes (") within the match
            var newTag = '<a ng-click="openUrl(' + url.trim() + ')">';

            text = text.replace(/<a href=".*">/, newTag);
        }

        return $sce.trustAsHtml(text);
    };
}]);

angular.module('app.filters').filter('cut', function () {
    return function (value, wordwise, max, tail) {
        if (!value) return '';

        max = parseInt(max, 10);
        if (!max) return value;
        if (value.length <= max) return value;

        value = value.substr(0, max);
        if (wordwise) {
            var lastspace = value.lastIndexOf(' ');
            if (lastspace != -1) {
                value = value.substr(0, lastspace);
            }
        }

        return value + (tail || ' …');
    };
});

function nl2br (str) {
    return (str + '').replace(/\n/g, "<br />");
}