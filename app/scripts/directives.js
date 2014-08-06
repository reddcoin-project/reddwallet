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

angular.module('app.directives', ['app.services']).directive('ngTab', function () {
    return function (scope, element, attrs) {
        element.bind("keydown", function (event) {
            if(event.which === 9) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngTab);
                });

                event.preventDefault();
            }
        });
    }
});