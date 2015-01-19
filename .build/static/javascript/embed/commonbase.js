var showTitleBar = true;
var videoStarted = false;
var rollPromptTimeoutId;
var hideRollPromptButton;
var intervalHandle;
var currentStage;

var padding = { top: 0, right: 0, bottom: 0, left: 0 };
var titleBarHeight = 40;
var actualTitleBarHeight = 0;
var bottomLogoPadding = { top: 0, right: 0, bottom: 0, left: 0 };
var edgeToEdge = true;
var videoControlsBelow = false;
var menuPeek = false;
var appsWidth;
var appsHeight;
var appIframes = [];
var menuItemHeight = 32;
var menuItemHeightTouch = 64;
var menuItemBottomMargin = 3;

function setInitialMenuControlsAndTitle() {
    if (VBX.Layout.isState('touchscreen')) {
        document.querySelector('#menu1').style.display = 'block';
        if (showTitleBar) {
            document.querySelector('#title1').style.display = 'block';
        }
        if (VBX.Layout.isState('novideo-tech')) {
            hideControlsImmediate();
        }
    } else if (VBX.Layout.isState('keep-controls-visible')) {
        showMenu();
        showTitle();
        setTimeout(function () {
            showMenuMinimized();
            hideControlBar();
        }, 3000);
    } else if (!edgeToEdge) {
        showTitle();
        showMenuAndControlBar();
    } else if (window.location.href.indexOf('&ap=true') != -1 && !VBX.Layout.isState('novideo-tech')) {
        // jolt and autoplay - show controls for 3 seconds and then hide them
        showMenuAndControlBar();
        showTitle();
        setTimeout(function() {
            hideMenuAndControlBar();
            hideTitle(0.5);
        }, 3000);
    }
    else {
        hideMenuImmediate();
        hideControlsImmediate();
        hideTitle(0);
    }
}

function onReady() {
    fixControlsOrder();

    if (videoControlsBelow) {
        VBX.addClass(document.body, 'video-controls-below');
    }

    hideRollPromptButton = document.querySelector('#apps1 .vbx-close-button').cloneNode(true);
    VBX.removeClass(hideRollPromptButton, 'vbx-close-button');
    VBX.addClass(hideRollPromptButton, 'vbx-hide-roll-prompt-button');
    document.querySelector('#apps1 .vbx-close-button').parentNode.appendChild(hideRollPromptButton);

    if (controlsExist()) {
        var shareButtons = document.querySelector('#shareButtons');
        var controlBar = document.querySelector('#video1 .vjs-control-bar');
        controlBar.appendChild(shareButtons);
    }

    var appsContainer = document.querySelector('#apps1');
    var embedApp = document.querySelector('#embedApp');
    var moreApp = document.querySelector('#moreApp');

    VBX.Layout.appendContainerItem(appsContainer, embedApp);
    VBX.Layout.appendContainerItem(appsContainer, moreApp);

    setInitialMenuControlsAndTitle();

    // Set up listeners

    VBX.listen(document.querySelector('#video1'), ['click', 'touchstart'], function (e) {
        initTimer();
    }, true);

    VBX.listen(hideRollPromptButton, 'click', function (e) {
        hideRollPrompt();
    });

  /*
    VBX.listen(document.querySelector('#video1'), 'resize', function (e) {
        updateVideoSize();
        updateMenu();
    });
    */

    VBX.listen(document.querySelector('#mask'), 'resize', function (e) {
      updateVideoSize();
      updateMenu();
      updateCustomLogoSize();
    });

    if (controlsExist()) {
        VBX.listen(document.querySelector('#video1 .vjs-control-bar'), 'resize', function (e) {
            updateMenu();
        });
    }

    VBX.listen(document.querySelector('#title1'), 'resize', function (e) {
        updateMenu();
    });

    VBX.listen(document.querySelector('#cta-button'), 'resize', function (e) {
      updateCustomLogoSize();
    });

    VBX.listen(document.querySelector('#menu1'), 'resize', function (e) {
        if (VBX.Layout.isState('mouseout || apps1-item-selected')) {
            hideMenuImmediate();
            updateMenu();
        }
    });

    VBX.listen(document.querySelector('#bottomLogo'), 'resize', function (e) {
        updateVideoSize();
    });

    VBX.listen(document.querySelector('#viewbixBranding'), 'resize', function (e) {
        updateVideoSize();
    });

    VBX.Layout.listen('customLogoUrl', function (value) {
        updateActualTitleBarHeight();
    });

    VBX.Layout.listen('title', function (value) {
        updateActualTitleBarHeight();
    });

    VBX.Layout.listen('ctaText', function (value) {
        updateActualTitleBarHeight();
    });


    // React to state changes
    VBX.Layout.onState('((mouseover && !mousestill) || iphone) && !apps1-item-selected', function () {
        showMenuAndControlBar();
    });

    VBX.Layout.onState('video-playing', function () {
        showYoutubeTouchTrapper();
    });

    VBX.Layout.onState('(mouseout) || apps1-item-selected || mousestill', function () {
        clearTimer();
        hideMenuAndControlBar();
    });

    VBX.Layout.onState('(mouseover && !mousestill) || apps1-item-selected', function () {
        showTitle();
    });

    VBX.Layout.onState('(mouseout || mousestill) && !apps1-item-selected && !keep-controls-visible', function () {
        hideTitle(0.5);
    });

    VBX.Layout.onState('video-ended && !apps1-item-selected && !novideo-tech', function () {
        showMenuAndControlBar();
        showTitle();
        hideYoutubeTouchTrapper();
    });

    VBX.Layout.onState('is-full-screen', function () {
        updateVideoSize();
    });

  VBX.Layout.onState('not-full-screen', function () {
      updateVideoSize();
  });

  VBX.Layout.onState('iphone', function () {
    updateVideoSize();
    updateMenu();
  });

    var ctaButtonTextColor = '#FFFFFF';
    var ctaButtonBackgroundColor = VBX.Layout.config('ctaButtonBackgroundColor');
    if (!VBX.ok(ctaButtonBackgroundColor)) {
      ctaButtonBackgroundColor = '16763904'; // Golden yellow is default CTA button color
      document.querySelector('#cta-button').style.backgroundColor = '#FFCC00';
    }
    if (VBX.colorIsBright(parseInt(ctaButtonBackgroundColor))) {
        ctaButtonTextColor = '#000000';
    }
    document.querySelector('#cta-button').style.color = ctaButtonTextColor;

    showControlBar();

    updateVideoSize();

    updateMenu();

}


function fixControlsOrder() {
    var volumeControl = document.querySelector('.vjs-volume-control');
    var muteControl = document.querySelector('.vjs-mute-control');
    var timeControl = document.querySelector('.vjs-current-time');
    if (volumeControl != null && timeControl != null && muteControl != null) {
        volumeControl.parentNode.insertBefore(volumeControl, timeControl);
        volumeControl.parentNode.insertBefore(muteControl, volumeControl);
    }
}


function onAppClose() {
    if (!VBX.Layout.isState('keep-controls-visible') && !VBX.Layout.isState('iphone')) {
        hideTitle(0.5);
    }
    initTimer();
}

function updateActualTitleBarHeight() {
  var customLogoUrl = VBX.Layout.config('customLogoUrl');
  var title = VBX.Layout.config('title');
  var ctaText = VBX.Layout.config('ctaText');
  var hasCustomLogo = (customLogoUrl != null && customLogoUrl.trim() != "");
  var hasTitleOrCustomLogo = hasCustomLogo || (title != null && title.trim() != "");
  var hasCtaText = (ctaText != null && ctaText.trim() != "");
  showTitleBar = hasTitleOrCustomLogo || hasCtaText;

  if (showTitleBar) {
      actualTitleBarHeight = titleBarHeight;
  } else {
      actualTitleBarHeight = padding.top;
  }

  updateCustomLogoSize();
}

function updateCustomLogoSize() {
  var customLogoUrl = VBX.Layout.config('customLogoUrl');
  var hasCustomLogo = (customLogoUrl != null && customLogoUrl.trim() != "");
  if (hasCustomLogo) {
    var ctaText = VBX.Layout.config('ctaText');
    var hasCtaText = (ctaText != null && ctaText.trim() != "");
    var bodyWidth = VBX.select('body').getSize().width;
    var ctaElement = document.querySelector('#cta-button');
    var ctaParentNode = ctaElement.parentNode;
    var ctaParentNodeDisplay = ctaParentNode.style.display;
    var availableCustomLogoWidth = bodyWidth;
    if (hasCtaText) {
      ctaParentNode.style.display = 'block';
      availableCustomLogoWidth = Math.round(ctaElement.getBoundingClientRect().left - 16);
      ctaParentNode.style.display = ctaParentNodeDisplay;
    }
    var customLogoElement = document.querySelector('.custom-logo');
    customLogoElement.style.maxWidth = availableCustomLogoWidth + 'px';
  }
}

function bodyClass(customLogoUrl, title, ctaText, showViewbixBranding, showFacebookButton, showTwitterButton, showShareButton) {
    var classes = {
        remove: "",
        add: ""
    };

    var hasTitleOrCustomLogo = (customLogoUrl != null && customLogoUrl.trim() != "") || (title != null && title.trim() != "");
    var hasCtaText = (ctaText != null && ctaText.trim() != "");
    showTitleBar = hasTitleOrCustomLogo || hasCtaText;

    if (showTitleBar) {
        classes["remove"] = "hide-title-bar";
    } else {
        classes["add"] = "hide-title-bar";
    }

    updateActualTitleBarHeight();

    if (VBX.toBoolean(showFacebookButton)) {
        classes["add"] += " show-facebook-button";
    } else {
        classes["remove"] += " show-facebook-button";
    }

    if (VBX.toBoolean(showTwitterButton)) {
        classes["add"] += " show-twitter-button";
    } else {
        classes["remove"] += " show-twitter-button";
    }

    if (VBX.toBoolean(showShareButton)) {
        classes["add"] += " show-share-button";
    } else {
        classes["remove"] += " show-share-button";
    }

    if (VBX.toBoolean(showViewbixBranding)) {
        classes["add"] += " show-viewbix-branding";
    } else {
        classes["remove"] += " show-viewbix-branding";
    }

    var keepControlsVisible = VBX.Layout.config('keepControlsVisible');

    if (VBX.toBoolean(keepControlsVisible)) {
        classes["add"] += " keep-controls-visible";
    } else {
        classes["remove"] += " keep-controls-visible";
    }

    var backgroundImage = VBX.Layout.config('backgroundImage');

    if (!VBX.empty(backgroundImage)) {
        classes["add"] += " has-background-image";
    } else {
        classes["remove"] += "has-background-image";
    }

    return classes;
}

function customLogoClass(customLogoUrl, scaleLogoToTitleBar) {
    var classes = {
        remove: "",
        add: ""
    };

    if (customLogoUrl != null && customLogoUrl.trim() != "") {
        classes["add"] = "has-custom-logo";

        if (VBX.toBoolean(scaleLogoToTitleBar)) {
            classes["add"] += " scale-logo-to-title-bar";
        } else {
            classes["remove"] = "scale-logo-to-title-bar";
        }
    } else {
        classes["remove"] = "has-custom-logo scale-logo-to-title-bar";
    }

    return classes;
}

function titleClass(customLogoUrl) {
    var classes = {
        remove: "",
        add: ""
    };

    if (customLogoUrl != null && customLogoUrl.trim() != "") {
        classes["add"] = "has-custom-logo";
    } else {
        classes["remove"] = "has-custom-logo";
    }

    return classes;
}

function bottomLogoClass(bottomLogoUrl, bottomLogoLink, bannerApps) {
    var classes = {
        remove: "",
        add: ""
    };

    if (bottomLogoUrl != null && bottomLogoUrl.trim() != "") {
      classes["add"] = "has-bottom-logo";

        if ((bottomLogoLink != null && bottomLogoLink.trim() != "") || (bannerApps != null && bannerApps.length > 0)) {
          classes["add"] += " banner-clickable";
        } else {
          classes["remove"] += " banner-clickable";
        }
      } else {
        classes["remove"] = "has-bottom-logo";
    }

    return classes;
}

function facebookButtonClass(showFacebookButton) {
    var classes = {
        remove: "",
        add: ""
    };

    if (VBX.toBoolean(showFacebookButton)) {
        classes["add"] = "show-facebook-button";
    } else {
        classes["remove"] = "show-facebook-button";
    }

    return classes;
}

function twitterButtonClass(showTwitterButton) {
    var classes = {
        remove: "",
        add: ""
    };

    if (VBX.toBoolean(showTwitterButton)) {
        classes["add"] = "show-twitter-button";
    } else {
        classes["remove"] = "show-twitter-button";
    }

    return classes;
}

function shareButtonClass(showShareButton) {
    var classes = {
        remove: "",
        add: ""
    };

    if (VBX.toBoolean(showShareButton)) {
        classes["add"] = "show-share-button";
    } else {
        classes["remove"] = "show-share-button";
    }

    return classes;
}

function showYoutubeTouchTrapper() {
  var touchTrapper = document.querySelector('#youtubetouchtrapper');
  if (!VBX.ok(touchTrapper)) {
    touchTrapper = document.createElement('div');
    touchTrapper.id = 'youtubetouchtrapper';
    touchTrapper.style.display = 'none';
    videoStarted = false;
  }

  if (VBX.ok(touchTrapper)) {
      if (!videoStarted) {
          videoStarted = true;
          initTimer();
          if (VBX.Layout.isState('touchscreen') && VBX.Layout.isState('youtube-tech') && !VBX.Layout.isState('iphone')) {
              document.querySelector('#video1').appendChild(touchTrapper);
              touchTrapper.style.display = 'block';
              updateYoutubeTouchTrapperSize();
          }
      } else {
          // this must be after the video was already played. Just make the div visible again
        if (VBX.Layout.isState('touchscreen') && VBX.Layout.isState('youtube-tech') && !VBX.Layout.isState('iphone')) {
            touchTrapper.style.display = 'block';
            updateYoutubeTouchTrapperSize();
          }
      }
  }
}

function hideYoutubeTouchTrapper() {
    var touchTrapper = document.querySelector('#youtubetouchtrapper');
    if (VBX.ok(touchTrapper)) {
        clearTimer();
        touchTrapper.style.display = 'none';
    }
}

function updateYoutubeTouchTrapperSize() {
  var videoElement = document.querySelector('#video1');
  var youtubeTouchTrapper = document.querySelector('#youtubetouchtrapper');
  if (VBX.ok(videoElement) && VBX.ok(youtubeTouchTrapper)) {
    youtubeTouchTrapper.style.height = videoElement.style.height;
    youtubeTouchTrapper.style.width = videoElement.style.width;
    youtubeTouchTrapper.style.left = '0px';
    youtubeTouchTrapper.style.top = '0px';
  }
}

function hideControlBar() {
    if (controlsExist() && edgeToEdge) {
        var $controls = VBX.select('#video1 .vjs-control-bar');
        var h = $controls.getSize().height;
        TweenLite.to($controls.first(), 0.5, { bottom: -h, ease: Cubic.easeIn });
    }
}


function hideMenuAndControlBar() {
    hideMenu();
    hideControlBar();
}

function showControlBar() {
    if (!VBX.Layout.isState('iphone') && controlsExist()) {
        var $controls = VBX.select('#video1 .vjs-control-bar');
        //$controls.first().style.display = 'block';
        if (edgeToEdge) {
            TweenLite.to($controls.first(), 0.5, { bottom: 0, ease: Cubic.easeOut });
        } else {
            var h = $controls.getSize().height;
            $controls.first().style.bottom = '-' + h + 'px';
        }

    }
}

function showMenu() {
    // handles case where user clicks on app and menu is shown before hiding it.
    if (VBX.Layout.isState('apps1-item-selected')) {
        return;
    }
    // handles case where icons are minimized and user mouses out. Don't start showing before hiding. However, if the video has ended, we want to show the menus
    if (VBX.Layout.isState('mouseout') && !VBX.Layout.isState('video-ended')) { 
        return;
    }
    var menuElement = document.querySelector('#menu1');
    menuElement.style.display = 'block';
    TweenLite.to(menuElement, 0.5, { right: 0, ease: Cubic.easeOut });
}

function showMenuMinimized() {
    var $menu = VBX.select('#menu1');
    var $menuIcon = VBX.select('#menu1 img');
    var menuIconWidth;
    if ($menuIcon.length() == 0) {
      return;
    } else if ($menuIcon.length() == 1) {
        menuIconWidth = $menuIcon.getSize().width;
    } else {
        menuIconWidth = $menuIcon.getSize()[0].width;
    }

    var paddingLeft = $menuIcon.first().offsetLeft;

    var w = Math.ceil($menu.getSize().width) - Math.ceil(menuIconWidth + (2 * paddingLeft)) + 1;
    TweenLite.to($menu.first(), 0.5, { right: -w, ease: Cubic.easeIn });
}


function showMenuAndControlBar() {
    if (VBX.Layout.isState('touchscreen')) {
        initTimer();
    } else {
        showControlBar();
    }
    showMenu();
}

function showEmbedApp() {
    VBX.Layout.trackShare();

    var appsContainer = document.querySelector('#apps1');
    var embedApp = document.querySelector('#embedApp');
    var linkField = document.querySelector('#link-text');
    var embedField = document.querySelector('#embed-text');
    linkField.textContent = VBX.Layout.getPreviewUrl();
    embedField.textContent = VBX.Layout.getEmbed();
    VBX.Layout.selectContainerItem(appsContainer, embedApp);
    linkField.focus();
    linkField.select();
}

function showMoreApp() {
    var appsContainer = document.querySelector('#apps1');
    var moreApp = document.querySelector('#moreApp');
    VBX.Layout.selectContainerItem(appsContainer, moreApp);
}

function clearRollPromptTimeout() {
    if (VBX.ok(rollPromptTimeoutId)) {
        clearTimeout(rollPromptTimeoutId);
        rollPromptTimeoutId = null;
    }
}

function hideMenuImmediate() {
    document.querySelector('#menu1').style.right = (-Math.ceil(VBX.select('#menu1').getSize().width) + 1) + 'px';
}

function hideControlsImmediate() {
    if (controlsExist() || VBX.Layout.isState('novideo-tech')) {
        document.querySelector('#video1 .vjs-control-bar').style.bottom = (-VBX.select('#video1 .vjs-control-bar').getSize().height) + 'px';
    }
}

function showTitle() {
    if (!showTitleBar) {
        return;
    }

    document.querySelector('#title1').style.display = 'block';
    if (VBX.select('#title1 .custom-logo.has-custom-logo.scale-logo-to-title-bar').length() == 1 || VBX.select('#title1 .custom-logo.has-custom-logo').length() == 0) {
        TweenLite.to(document.querySelector('#title1'), 0.5, { top: 0, ease: Cubic.easeOut });
    } else {
        TweenLite.to(document.querySelector('#title1'), 0.5, { top: 0, autoAlpha: 1, ease: Cubic.easeOut });
    }
}

function hideTitle(duration) {
    if (!showTitleBar || !edgeToEdge) {
        return;
    }
    var $title = VBX.select('#title1');
    var h = $title.getSize().height;

    if (VBX.select('#title1 .custom-logo.has-custom-logo.scale-logo-to-title-bar').length() == 1 || VBX.select('#title1 .custom-logo.has-custom-logo').length() == 0) {
        TweenLite.to($title.first(), duration, { top: -h, ease: Cubic.easeIn });
    } else {
        TweenLite.to($title.first(), duration, { top: -h, autoAlpha: 0, ease: Cubic.easeIn });
    }
}

function showRollPrompt() {
    clearRollPromptTimeout();

    document.querySelector('#apps1 .vbx-close-button').style.display = 'none';
    TweenLite.to(document.querySelector('#apps1 .vbx-close-button'), 0, { autoAlpha: 0 });
    TweenLite.to(document.querySelector('#apps1 .vbx-hide-roll-prompt-button'), 0, { autoAlpha: 0 });
    document.querySelector('#apps1 .vbx-hide-roll-prompt-button').style.display = 'block';

    TweenLite.to(document.querySelector('#apps1 .vbx-hide-roll-prompt-button'), 0.5, { delay: 0.5, autoAlpha: 1 });

    var rollPromptElement = document.querySelector('#rollPrompt');
    rollPromptElement.style.display = 'block';
    TweenLite.to(rollPromptElement, 0.5, { left: 0, ease: Cubic.easeOut });

    rollPromptTimeoutId = setTimeout(hideRollPrompt, 3000);
}

function hideRollPrompt() {
    clearRollPromptTimeout();

    document.querySelector('#apps1 .vbx-hide-roll-prompt-button').style.display = 'none';
    var closebuttonElement = document.querySelector('#apps1 .vbx-close-button');
    closebuttonElement.style.display = 'block';
    TweenLite.to(closebuttonElement, 0.5, { delay: 0.5, autoAlpha: 1 });

    var bodyWidth = VBX.select('body').getSize().width;
    TweenLite.to(document.querySelector('#rollPrompt'), 0.5, { left: bodyWidth, ease: Cubic.easeIn });
}

function gotoStage1() {
    currentStage = 1;
    // show everything in stage 1
    showMenu();
    showControlBar();
    showTitle();
}

function gotoStage2() {
    currentStage = 2;
        showMenuMinimized();
    }

function gotoStage3() {
    if (VBX.Layout.isState('keep-controls-visible')) {
        hideControlBar();
    } else {
        hideMenuAndControlBar();
        hideTitle(0.5);
    }
    clearTimer();
}

function clearTimer() {
    clearInterval(intervalHandle);
    intervalHandle = null;
}

function initTimer() {
    if ((!VBX.Layout.isState('touchscreen') || VBX.Layout.isState('iphone'))) {
        return;
    }
    clearTimer();
    gotoStage1();
    if (!VBX.Layout.isState('keep-controls-visible')) {
    VBX.Layout.removeStateClasses('mouseover');
    }
    if (intervalHandle != null) {
        clearTimer();
    }
    intervalHandle = setInterval(function () {
        switch (currentStage) {
            case 1:
                gotoStage2();
                break;
            case 2:
                gotoStage3();
                break;
        }
    }, 2000);
};

function controlsExist() {
    // controls don't exist for edgetoedge poster-only players
    return (VBX.select('#video1 .vjs-control-bar').length() > 0 && (!VBX.Layout.isState('novideo-tech') || !edgeToEdge));
}

function updateMenu() {
  var totalMenuItemHeight = VBX.Layout.isState('touchscreen') ? menuItemHeightTouch + menuItemBottomMargin : menuItemHeight + menuItemBottomMargin;

  var menuTop;
  if (showTitleBar) {
      menuTop = VBX.select('#title1').getSize().height + 10;
  } else {
      menuTop = 10;
  }
  var videoHeight = VBX.select('#video1').getSize().height;
  var controlsHeight = controlsExist() ? VBX.select('#video1 .vjs-control-bar').getSize().height : 0;
  var availableMenuHeight = videoHeight - menuTop - controlsHeight - 10;
  var maxItems = Math.max(1, Math.floor(availableMenuHeight / totalMenuItemHeight));
  VBX.Layout.setMenuMaxItems('menu1', maxItems);
  VBX.Layout.setMenuTop('menu1', menuTop.toString() + "px");
}

function updateVideoSize() {
    var backgroundImageUrl = VBX.Layout.config('backgroundImage');
    var hasBackgroundImage = !VBX.empty(backgroundImageUrl);
    var bottomLogoHeight = document.querySelector('#bottomLogo img').offsetHeight;
    var bottomSliceHeight = bottomLogoHeight == 0 ? padding.bottom : hasBackgroundImage ? bottomLogoHeight : bottomLogoHeight + bottomLogoPadding.top + bottomLogoPadding.bottom;

    var showViewbixBranding = VBX.toBoolean(VBX.Layout.config('showViewbixBranding'));
    var viewbixBrandingHeight = showViewbixBranding ? 10 : 0;

    var bodyHeight = VBX.select('body').getSize().height;
    var bodyWidth = VBX.select('body').getSize().width;

    var controlsHeight = controlsExist() ? VBX.select('#video1 .vjs-control-bar').getSize().height : 0;

    var videoTop = (edgeToEdge ? 0 : actualTitleBarHeight);
    var videoElement = document.querySelector('#video1');
    videoElement.style.height = ((bodyHeight - videoTop - bottomSliceHeight - viewbixBrandingHeight - (edgeToEdge || VBX.Layout.isState('iphone') ? 0 : controlsHeight)) + 'px');
    videoElement.style.width = (bodyWidth - padding.left - padding.right) + 'px';
    videoElement.style.left = (padding.left) + 'px';
    videoElement.style.top = videoTop + 'px';

    updateYoutubeTouchTrapperSize();

    var appsTop;
    if (showTitleBar) {
        appsTop = VBX.select('#title1').getSize().height;
    } else {
        appsTop = padding.top;
    }

    var appsElement = document.querySelector('#apps1');
    appsWidth = (bodyWidth - padding.left - padding.right) + 'px';
    appsHeight = (bodyHeight - bottomSliceHeight - viewbixBrandingHeight - appsTop) + 'px';
    appsElement.style.width = appsWidth
    appsElement.style.height = appsHeight;
    appsElement.style.left = (padding.left) + 'px';
    appsElement.style.top = (appsTop) + 'px';

    resizeAppIframes();

    var background = document.querySelector('#background');
    if (background != null) {
        background.style.height = (bodyHeight - viewbixBrandingHeight) + 'px';
        background.style.display = edgeToEdge ? 'none' : 'block';
    }

    if (!edgeToEdge && hasBackgroundImage) {
        background.style.borderWidth = '39px 5px ' + bottomSliceHeight + 'px 5px';
        background.style.borderImage = 'url("' + backgroundImageUrl + '") 39 5 ' + bottomSliceHeight + ' 5 stretch';
        background.style.borderImageWidth = background.style.borderWidth;

        if (!VBX.supports('borderImage')) {
            background.style.backgroundImage = backgroundImageUrl;
            background.style.backgroundSize = '100% 100%';
            background.style.padding = '39px 5px ' + bottomSliceHeight + 'px 5px';
        }
    }

    document.querySelector('#rollPrompt').style.left = bodyWidth + 'px';
}

function hideMenu() {
    if (menuPeek && !VBX.Layout.isState('apps1-item-selected')) {
        showMenuMinimized();
    }
    else if (VBX.Layout.isState('keep-controls-visible') && !VBX.Layout.isState('apps1-item-selected')) {
        gotoStage2();
    }
    else {
        var $menu = VBX.select('#menu1');
        var w = Math.ceil($menu.getSize().width) + 1;
        TweenLite.to($menu.first(), 0.5, { right: -w, ease: Cubic.easeIn });
    }
}

function resizeAppIframes() {
    // Resize all app iframes explicitly. Must be explicit for scrolling in iOs.
    for (var i = 0; i < appIframes.length; ++i) {
        resizeAppIframe(appIframes[i]);

    }
}

function resizeAppIframe(iframe) {
    if (VBX.ok(appsWidth) && VBX.ok(appsHeight)) {
        iframe.style.width = appsWidth;
        iframe.style.height = appsHeight;
    }
}


function onAppIframeCreated(iframe) {
    appIframes.push(iframe);
    resizeAppIframe(iframe);
}