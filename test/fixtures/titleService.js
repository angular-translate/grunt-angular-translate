angular.module('titleService', [])

  .factory('titleService', function ($state, $document, $filter, $translate) {

    $state.state('home', {
      url: '/home',
      data: {
        pageTitleSimple: /* i18nextract */'mySingleQ\'uotedCommentTranslation \'',
        pageTitleDouble: /* i18nextract */"myDoubleQuotedCommentTranslation \"e\"s\""
      }
    });

    $filter('translate')('JavascriptFilter 1/2 with var "{name}"', {name: 'name'});
    $filter('translate')('JavascriptFilter 2/2 without var');

    $translate('JavascriptServiceSimpleQuote 1/2 with var "{name}".', {name: 'name'});
    $translate("JavascriptServiceDoubleQuote 2/2 with var \"{name}\".", {name: 'name'});
    $translate.instant('JavascriptServiceInstantSimpleQuote 1/2 with var "{name}".', {name: 'name'});
    $translate.instant("JavascriptServiceInstantDoubleQuote 2/2 with var \"{name}\".", {name: 'name'});

    var titleService = {
    };

    return titleService;
  })

;

