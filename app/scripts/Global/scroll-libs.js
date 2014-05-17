(function(angular, undefined){
    'use strict';

    function fakeNgModel(initValue){
        return {
            $setViewValue: function(value){
                this.$viewValue = value;
            },
            $viewValue: initValue
        };
    }

    angular.module('luegg.directives', [])
        .directive('scrollGlue', function(){
            return {
                priority: 1,
                require: ['?ngModel'],
                restrict: 'A',
                link: function(scope, $el, attrs, ctrls){
                    var el = $el[0],
                        ngModel = ctrls[0] || fakeNgModel(true);

                    function scrollToBottom(){
                        el.scrollTop = el.scrollHeight;
                    }

                    function shouldActivateAutoScroll(){
                        // + 1 catches off by one errors in chrome
                        return el.scrollTop + el.clientHeight + 1 >= el.scrollHeight;
                    }

                    scope.$watch(function(){
                        if(ngModel.$viewValue){
                            scrollToBottom();
                        }
                    });

                    $el.bind('scroll', function(){
                        var activate = shouldActivateAutoScroll();
                        if(activate !== ngModel.$viewValue){
                            scope.$apply(ngModel.$setViewValue.bind(ngModel, activate));
                        }
                    });
                }
            };
        });
}(angular));

angular.module('perfect_scrollbar', []).directive('perfectScrollbar', ['$parse', function($parse) {
    return {
        restrict: 'E',
        transclude: true,
        template:  '<div><div ng-transclude></div></div>',
        replace: true,
        link: function($scope, $elem, $attr) {
            $elem.perfectScrollbar({
                wheelSpeed: $parse($attr.wheelSpeed)() || 50,
                wheelPropagation: $parse($attr.wheelPropagation)() || false,
                minScrollbarLength: $parse($attr.minScrollbarLength)() || false,
                useBothWheelAxes: $parse($attr.useBothWheelAxes)() || false,
                suppressScrollX: $parse($attr.suppressScrollX)() || false,
                suppressScrollY: $parse($attr.suppressScrollY)() || false
            });

            if ($attr.refreshOnChange) {
                $scope.$watchCollection($attr.refreshOnChange, function(newNames, oldNames) {
                    // I'm not crazy about setting timeouts but it sounds like thie is unavoidable per
                    // http://stackoverflow.com/questions/11125078/is-there-a-post-render-callback-for-angular-js-directive
                    setTimeout(function() { $elem.perfectScrollbar('update'); }, 10);
                });
            }
        }
    };
}]);