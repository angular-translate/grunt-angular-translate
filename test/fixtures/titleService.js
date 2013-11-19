angular.module('titleService', [])

  .factory('titleService', function ($document, $filter, $translate) {
    $filter('translate')('JavascriptFilter 1/2 with var "{name}"', {name: 'name'});
    $filter('translate')('JavascriptFilter 2/2 without var');

    $translate('JavascriptServiceSimpleQuote 1/2 with var "{name}".', {name: 'name'});
    $translate("JavascriptServiceDoubleQuote 2/2 with var \"{name}\".", {name: 'name'});

    var titleService = {
    };

    return titleService;
  })

;

