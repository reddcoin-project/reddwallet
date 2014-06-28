App.Wallet.controller(
    'AnnouncementCtrl',
    [
        '$scope',
        '$timeout',
        '$alert',
        'News',
        function ($scope, $timeout, $alert, News) {

            $scope.hasRun = false;
            $scope.loaded = false;
            $scope.postData = [];
            $scope.refreshNews = function () {
                $timeout(function() {
                    $scope.loaded = false;

                    News.loadAnnouncements();

                    var announcementDeferred = News.getAnnouncements();

                    if (announcementDeferred.then == undefined) {
                        $scope.postData = announcementDeferred;
                        $scope.loaded = true;
                    } else {
                        announcementDeferred.then(function(announcements) {
                            $scope.postData = announcements;
                            $scope.loaded = true;
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