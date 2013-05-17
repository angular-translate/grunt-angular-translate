angular.module( 'titleService', [])

.factory( 'titleService', function ( $document, $translate ) {
  var suffix = $translate( 'mySuffix ---' ),
      title;
  
  var titleService = {
    setSuffix: function setSuffix ( s ) {
      suffix = s;
    },
    getSuffix: function getSuffix () {
      return suffix;
    },
    setTitle: function setTitle ( t ) {
      title = t + suffix;

      $document.prop( 'title', title );
    },
    getTitle: function getTitle () {
      return $document.prop( 'title' );
    }
  };

  return titleService;
})

;

