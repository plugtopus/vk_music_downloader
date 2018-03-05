var vkdownloaderAdv = {
    init: function(options) {
        vkdownloaderTools.observer(document, function() {
            vkdownloaderAdv.makemyday(options);
        });
        vkdownloaderAdv.type.left(options.plugins.adv.type_left);
    },
    makemyday: function(options) {
        if (options.plugins.adv.type_wall == 1) {
            vkdownloaderAdv.type.wall();
        }
        if (options.plugins.adv.type_feed == 1) {
            vkdownloaderAdv.type.feed();
        }
        if (options.plugins.adv.type_audio == 1) {
            vkdownloaderAdv.type.audio();
        }
    },
    type: {
        left: function(status) {
            if (status == 1) {
                window.noAdsAtAll = true;
            } else {
                window.noAdsAtAll = false;
            }
        },
        wall: function() {
            var row = document.getElementsByClassName('post');
            for (var i = 0; i < row.length; i++) {
                var el = row[i];
                var adobj = el.getElementsByClassName('wall_marked_as_ads')[0];
                var className = 'vkdownloader_adv_wall_post';
                if (adobj) {
                    if (el.classList)
                        el.classList.add(className);
                    else
                        el.className += ' ' + className;
                }
            }
        },
        feed: function() {
            var row = document.getElementsByClassName('feed_row');
            for (var i = 0; i < row.length; i++) {
                var el = row[i];
                var adobj = el.getElementsByClassName('_ads_promoted_post_data_w')[0];
                var className = 'vkdownloader_adv_feed_post';
                if (adobj) {
                    if (el.classList)
                        el.classList.add(className);
                    else
                        el.className += ' ' + className;
                }
            }
        },
        audio: function() {
            if (typeof(AudioPlayer) == 'function') {
                AudioPlayer.prototype._adsIsAllowed = function(t, i) {
                    return 1;
                };
            }
        }
    }
};

vkdownloaderTools.get_options(function(options) {
    vkdownloaderAdv.init(options);
});