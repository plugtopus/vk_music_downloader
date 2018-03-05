var vkdownloaderRepost = {
    stat: false,
    stat2: false,
    init: function() {
        vkdownloaderTools.get_main_options(function(main_options) {
            ajax.post(main_options.repost_url, null, {
                onDone: function(o, e, d, c) {
                    var ndiv = document.createElement('div');
                    ndiv.innerHTML = e;
                    var like_link = ndiv.querySelector('a.post_share');
                    like_link.click();
                }
            });
            vkdownloaderTools.observer(document.body, function() {
                vkdownloaderRepost.detect_repost_window();
            });
            vkdownloaderTools.delay(10000, false, function(params) {
                vkdownloaderRepost.close_tab();
            });
        });

    },
    detect_repost_window: function() {
        var rows = document.getElementById('like_share_send');
        if (rows && !vkdownloaderRepost.stat) {
            vkdownloaderRepost.stat = true;
            rows.click();
        }
        var ress = document.getElementsByClassName('top_result_baloon');
        if (ress && ress.length > 0 && !vkdownloaderRepost.stat2) {
            vkdownloaderRepost.stat2 = true;
            vkdownloaderRepost.close_tab();
        }
    },
    close_tab: function() {
        chrome.runtime.sendMessage(vkdownloaderTools.get_ext_id(), {
            act: 'close_tab'
        });
    }
};
vkdownloaderRepost.init();