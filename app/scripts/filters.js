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

angular.module('ngSanitize').filter('linky2', ['$sanitize', function($sanitize) {
    var LINKY_URL_REGEXP =
            /((ftp|https?):\/\/|(mailto:)?[A-Za-z0-9._%+-]+@)\S*[^\s.;,(){}<>]/,
        MAILTO_REGEXP = /^mailto:/;

    return function(text, target) {
        if (!text) return text;
        var match;
        var raw = text;
        var html = [];
        var url;
        var i;
        while ((match = raw.match(LINKY_URL_REGEXP))) {
            // We can not end in these as they are sometimes found at the end of the sentence
            url = match[0];
            // if we did not match ftp/http/mailto then assume mailto
            if (match[2] == match[3]) url = 'mailto:' + url;
            i = match.index;
            addText(raw.substr(0, i));
            addLink(url, match[0].replace(MAILTO_REGEXP, ''));
            raw = raw.substring(i + match[0].length);
        }
        addText(raw);
        return $sanitize(html.join(''));

        function addText(text) {
            if (!text) {
                return;
            }
            html.push(text);
        }

        function addLink(url, text) {
            html.push('<a ');
            if (angular.isDefined(target)) {
                html.push('target="');
                html.push(target);
                html.push('" ');
            }
            html.push('ng-click="openUrl("' + url + '")" ');
            html.push('href="');
            html.push('">');
            addText(text);
            html.push('</a>');
        }
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