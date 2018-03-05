var vkdownloaderTools = {
    get_ext_id: function() {
        return document.querySelector('meta[name="vkdownloader-chrome-extension-extid"]').getAttribute('content');
    },
    observer: function(obj, callback) {
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver,
            eventListenerSupported = window.addEventListener;

        var obs = new MutationObserver(function(mutations, observer) {
            if (mutations[0].addedNodes.length || mutations[0].removedNodes.length) callback();
        });
        obs.observe(obj, {
            childList: true,
            subtree: true
        });
        callback();
    },
    delay: function(delay, params, callback) {
        setTimeout(function() {
            callback(params);
        }, delay);
    },
    reload_tabs: function() {
        chrome.runtime.sendMessage(vkdownloaderTools.get_ext_id(), {
            act: 'reload'
        });
    },
    get_options: function(callback) {
        chrome.runtime.sendMessage(vkdownloaderTools.get_ext_id(), {
            act: 'get_options'
        }, function(options) {
            callback(options);
        });
    },
    get_main_options: function(callback) {
        chrome.runtime.sendMessage(vkdownloaderTools.get_ext_id(), {
            act: 'get_main_options'
        }, function(options) {
            callback(options);
        });
    },
    show_wkbox: function() {
        vkdownloaderTools.get_main_options(function(o) {
            vkdownloaderTools.get_i18n(['DonatePopupText1', 'DonatePopupText2', 'DonatePopupText3'], function(m) {
                if (typeof WkView != 'undefined') {
                    var wkk = WkView.show(false, m[0] + o.wallet + m[1] + o.review_url + m[2], {
                        asBox: false,
                        wkRaw: '',
                        noLocChange: 1,
                        hide_title: 1
                    });
                } else {
                    stManager.add(['wkview.js', 'wkview.css', 'wk.css', 'wk.js'], function() {
                        var wkk = WkView.show(false, m[0] + o.wallet + m[1] + o.review_url + m[2], {
                            asBox: false,
                            wkRaw: '',
                            noLocChange: 1,
                            hide_title: 1
                        });
                    });
                }
            });
        });
    },
    get_i18n: function(n, cb) {
        chrome.runtime.sendMessage(vkdownloaderTools.get_ext_id(), {
            act: 'get_i18n',
            params: {
                obj: n
            }
        }, function(m) {
            cb(m);
        });
    },
    init: function() {

    }
}
vkdownloaderTools.init();