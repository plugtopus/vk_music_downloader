var InjectSPreloader = {
    init: function(options) {
        InjectSPreloader.create_ext_id_layer(options.ext_id);
        for (plg in options.plugins) {
            if (typeof options.plugins[plg] != "undefined" && options.plugins[plg].status && options.plugins[plg].status == 1 && options.plugins[plg].load == 0) {
                InjectSPreloader.inject_script(chrome.extension.getURL('/plugins/' + plg + '.js'));
            }
        }
    },
    inject_script: function(scr_url) {
        var s = document.createElement('script');
        s.setAttribute('src', scr_url);
        document.documentElement.appendChild(s);
    },
    create_ext_id_layer: function(ext_id) {
        var s = document.createElement('meta');
        s.setAttribute('name', 'vkdownloader-chrome-extension-extid');
        s.setAttribute('content', ext_id);
        document.getElementsByTagName('head')[0].appendChild(s);
    }
};

chrome.runtime.sendMessage({
    act: 'get_options'
}, function(options) {
    if (typeof options != "undefined" && options.status == 1) {
        InjectSPreloader.init(options);
    }
});