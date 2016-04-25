$(document).ready(function() {
  $('footer').load('templates/footer.html');
  
  resizeContentHeight();
  $(window).on('resize', resizeContentHeight);

  function resizeContentHeight() { 
    var windowHeight = $(window).height();
    $('.content').height(calcContentHeight(windowHeight));
  }

  function calcContentHeight(height) {
    if (height <= 350) { return height; }
    else if (height <= 600) { return 365; } // iPhone5
    else if (height <= 700) { return 375; } // iPhone6
    else if (height <= 775) { return 385; } // iPhone6+ & Nexus 6P
    else if (height <= 775) { return 385; } // iPhone6+
    else if (height <= 1025) { return 405; } // iPad
    else if (height <= 1200) { return 425; } // normal browser
    else return 430; // large browser
  }
});