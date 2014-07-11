/* Directives*/

angular.module('app.directives', ['app.services']).directive('appVersion', [
    'version', function(version) {
        return function(scope, elm, attrs) {
            return elm.text(version);
        };
    },
    'focusMe', function($timeout) {
        return {
            scope: { trigger: '@focusMe' },
            link: function(scope, element) {
                scope.$watch('trigger', function(value) {
                    if(value === "true") {
                        $timeout(function() {
                            element[0].focus();
                        });
                    }
                });
            }
        }
    }
]);

App.directive('parseUrl', ['$compile', '$sce', function($compile, $sce) {
    var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/gi;
    return {
        restrict: 'A',
        require: 'ngModel',
        replace: true,
        scope: { ngModel: '=ngModel' },
        link: function compile(scope, element, attrs, controller) {

            scope.openUrl = function (url) {
                require('nw.gui').Shell.openExternal(url);
            };

            scope.$watch('ngModel', function(value) {
                if (value == null || value.length == 0) {
                    return;
                }

                angular.forEach(value.match(urlPattern), function(url) {
                    url = url.replace(/\s/g, "X").trim();
                    url = url.replace(/(\r\n|\n|\r)/gm,"");
                    value = value.replace(url, '<a href="" ng-click="openUrl(\''+ url + '\')">' + url + '</a>');
                });

                element.html(value);

                $compile(element.contents())(scope);
            });
        }
    };
}]);

/*
App.directive('focusMe', function($timeout) {
    return {
        scope: { trigger: '@focusMe' },
        link: function(scope, element) {
            scope.$watch('trigger', function(value) {
                if(value === "true") {
                    $timeout(function() {
                        element[0].focus();
                    });
                }
            });
        }
    };
});*/
