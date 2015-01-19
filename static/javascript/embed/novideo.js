/**
 * @fileoverview Novideo Media Controller - Wrapper for Novideo API
 */

/**
 * Novideo Media Controller - Wrapper for Novideo Media API
 * @param {videojs.Player|Object} player
 * @param {Object=} options
 * @param {Function=} ready
 * @constructor
 */
vjs.Novideo = videojs.MediaTechController.extend({
    init: function (player, options, ready) {
        videojs.MediaTechController.call(this, player, options, ready);

        // Copy the JavaScript options if they exists
        if (typeof options['source'] != 'undefined') {
            for (var key in options['source']) {
                player.options()[key] = options['source'][key];
            }
        }

        this.player_ = player;
        this.player_el_ = document.getElementById(this.player_.id());


        // Copy the JavaScript options if they exists
        if (typeof options['source'] != 'undefined') {
            for (var key in options['source']) {
                player.options()[key] = options['source'][key];
            }
        }

        // We might have to move this to the load (it changes player_.controls and doesn't change them back so 
        // when we're trying out different techs, it will keep the controls off even if we don't choose this tech
        //this.player_.controls(false);

        this.id_ = this.player_.id() + '_Novideo_api';

        this.el_ = videojs.Component.prototype.createEl('div', {
            id: this.id_,
            className: 'vjs-tech',
            scrolling: 'no',
            marginWidth: 0,
            marginHeight: 0,
            frameBorder: 0,
            webkitAllowFullScreen: 'true',
            mozallowfullscreen: 'true',
            allowFullScreen: 'true'
        });

        this.player_el_.insertBefore(this.el_, this.player_el_.firstChild);

        var self = this;
        this.el_.onload = function () { self.onLoad(); };
        this.isReady_ = true;
    }
});

vjs.Novideo.prototype.dispose = function () {
    this.el_.parentNode.removeChild(this.el_);

    videojs.MediaTechController.prototype.dispose.call(this);
};

vjs.Novideo.prototype.src = function (src) { };

vjs.Novideo.prototype.load = function () { };
vjs.Novideo.prototype.play = function () { };
vjs.Novideo.prototype.pause = function () { };
vjs.Novideo.prototype.paused = function () { return true; };

vjs.Novideo.prototype.currentTime = function () { return 0; };

vjs.Novideo.prototype.setCurrentTime = function (seconds) { };

vjs.Novideo.prototype.duration = function () { return 0; };
vjs.Novideo.prototype.buffered = function () { return videojs.createTimeRange(0, 0); };

vjs.Novideo.prototype.volume = function () { return 0; };
vjs.Novideo.prototype.setVolume = function (percentAsDecimal) {};

vjs.Novideo.prototype.muted = function () { return false; };
vjs.Novideo.prototype.setMuted = function (muted) {};

vjs.Novideo.prototype.onReady = function () {
    this.isReady_ = true;
    this.triggerReady();
};

vjs.Novideo.prototype.onLoad = function () { };

vjs.Novideo.prototype.onLoadProgress = function (data) {};

vjs.Novideo.prototype.onPlayProgress = function (data) {};

vjs.Novideo.prototype.onPlay = function () { };

vjs.Novideo.prototype.onPause = function () {};

vjs.Novideo.prototype.onFinish = function () {};

vjs.Novideo.prototype.onSeek = function (data) {};

vjs.Novideo.prototype.onError = function (error) {
    this.player_.error = error;
    this.player_.trigger('error');
};

vjs.Novideo.isSupported = function () {
    return true;
};

vjs.Novideo.prototype.supportsFullScreen = function () {return true;};

vjs.Novideo.canPlaySource = function (srcObj) {
    if (srcObj.src == '' && srcObj.type == '') {
        return true;
    } else {
        return false;
    }

};

vjs.Novideo.makeQueryString = function (args) {
    var array = [];
    for (var key in args) {
        if (args.hasOwnProperty(key)) {
            array.push(encodeURIComponent(key) + '=' + encodeURIComponent(args[key]));
        }
    }

    return array.join('&');
};

