App.Wallet.controller(
    'NewsCtrl',
    [
        '$scope',
        '$timeout',
        '$alert',
        'Reddit',
        function ($scope, $timeout, $alert, Reddit) {

            $scope.posts = Reddit.posts;

            Reddit.getPosts().then(function(posts) {
                $timeout(function() {
                    $scope.posts = posts;
                });
            });

            $scope.refreshNews = function () {
                Reddit.getPosts().then(
                    function(posts) {
                        $timeout(function() {
                            $scope.posts = posts;
                            $alert({
                                "title": "News",
                                "content": 'Refreshed',
                                "type": "success",
                                duration: 1
                            });
                        });
                    },
                    function(err, resp) {
                        $alert({
                            "title": "News",
                            "content": 'Error',
                            "type": "warning"
                        });
                    }
                );
            };

            $scope.openPost = function ($index) {
                var post = $scope.posts[$index];

                require('nw.gui').Shell.openExternal(post.data.url);
            }

        }
    ]
);