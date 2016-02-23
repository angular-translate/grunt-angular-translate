angular.module('linkService', [])

  .factory('linkService', function ($state, $document, $filter, $translate) {
    var linkService = {
        getTest: function () {
            $translate([
                'COMMON.A_VIRTUAL_LINK',
                'COMMON.A_TRANSLATION',
                'COMMON.A_TRUE_LINK',
            ]).then(function (translations) {
                console.log(translations);
            });
        }
    };

    return linkService;
  });
