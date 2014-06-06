App.Wallet.controller(
    'DashboardCtrl',
    [
        '$scope',
        '$timeout',
        'Reddit',
        function ($scope, $timeout, Reddit) {

            $scope.posts = Reddit.posts;

            Reddit.getPosts().then(function(posts) {
                $timeout(function() {
                    $scope.posts = posts;
                });
            });

            $scope.openPost = function ($index) {
                var post = $scope.posts[$index];

                require('nw.gui').Shell.openExternal(post.data.url);
            }

        }
    ]
);