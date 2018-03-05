var InjectPreloader = {
    urls: [],
    outurls: [],
    init: function(options) {
        for (plg in options.plugins) {
            if (typeof options.plugins[plg] != "undefined" && options.plugins[plg].status && options.plugins[plg].status == 1 && options.plugins[plg].load == 1) {
                InjectPreloader.urls.push('/plugins/' + plg + '.js');
            }
            if (typeof options.plugins[plg] != "undefined" && options.plugins[plg].status == 0 && options.plugins[plg].load == 1) {
                InjectPreloader.outurls.push('/plugins/' + plg + '.js');
            }
        }
        for (var i = 0; i < InjectPreloader.urls.length; i++) {
            var scr = InjectPreloader.urls[i];
            var scr_url = chrome.extension.getURL(scr);
            if (!InjectPreloader.check_script(scr_url)) {
                InjectPreloader.inject_script(scr_url);
            }
        }
        for (var i = 0; i < InjectPreloader.outurls.length; i++) {
            var scr = InjectPreloader.outurls[i];
            var scr_url = chrome.extension.getURL(scr);
            if (InjectPreloader.check_script(scr_url)) {
                InjectPreloader.reload();
            }
        }
    },
    check_script: function(scr_url) {
        var s = document.getElementsByTagName('script');
        for (var i = s.length; i--;) {
            if (s[i].src == scr_url) return true;
        }
        return false;
    },
    inject_script: function(scr_url) {
        var s = document.createElement('script');
        s.setAttribute('src', scr_url);
        document.getElementsByTagName('head')[0].appendChild(s);
    },
    reload: function() {
        chrome.runtime.sendMessage({
            act: 'reload'
        });
    }
};

chrome.runtime.sendMessage({
    act: 'get_options'
}, function(options) {
    if (typeof options != "undefined" && options.status == 1) {
        InjectPreloader.init(options);
    }
});