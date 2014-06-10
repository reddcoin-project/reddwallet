App.Wallet.controller(
    'AnnouncementCtrl',
    [
        '$scope',
        '$timeout',
        '$alert',
        'News',
        function ($scope, $timeout, $alert, News) {

            $scope.hasRun = false;

            $scope.postData = [];
            $scope.refreshNews = function () {
                $timeout(function() {
                    if (!$scope.hasRun) {
                        News.loadAnnouncements();
                    }

                    var announcementDeferred = News.getAnnouncements();

                    if (announcementDeferred.then == undefined) {
                        $scope.postData = announcementDeferred;
                    } else {
                        announcementDeferred.then(function(announcements) {
                            $scope.postData = announcements;
                        });
                    }
                });

                if ($scope.hasRun) {
                    $timeout(function () {
                        $alert({
                            "title": "Announcement",
                            "content": 'Refreshed',
                            "type": "success",
                            duration: 1
                        });
                    });
                } else {
                    $scope.hasRun = true;
                }

            };

            $scope.refreshNews();

            $scope.openPost = function ($index) {
                var post = $scope.postData.items[$index];

                require('nw.gui').Shell.openExternal(post.data.url);
            }

        }
    ]
);