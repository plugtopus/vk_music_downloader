var vkdownloaderBG = {
    helpers: {
        di: [],
        tasks: [],
        current_download: [],
        wr: [],
        wd: []
    },
    pre_options: {
        locale: chrome.i18n.getUILanguage(),
        status: 1,
        counter: 0,
        donate: 0,
        repost: 0,
        ext_id: chrome.runtime.id,
        plugins: {
            tools: {
                load: 0,
                status: 1
            },
            adv: {
                load: 0,
                status: 1,
                type_left: 0,
                type_wall: 0,
                type_feed: 0,
                type_audio: 0
            },
            music: {
                load: 1,
                status: 1,
                bitrate: 0,
                multidown: 4
            }
        }
    },
    options: function(name) {
        var opt = JSON.parse(atob(vkdownloaderBG.service.key));
        return (name) ? opt[name] : opt;
    },
    music: {
        download: function(p, callback) {
            if (p.folder == false) {
                var filename = p.filename;
            } else {
                var filename = p.folder + '/' + p.filename;
            }
            vkdownloaderBG.helpers.tasks.push({
                temp_id: 'id_' + Math.random(),
                url: p.url,
                filename: filename
            });
            vkdownloaderBG.download_queue();
            vkdownloaderBG.service.counter(function(count) {
                callback(count);
            });
        },
        get_range: function(p, callback) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', p.url, true);
            xhr.setRequestHeader('Range', 'bytes=' + p.range);
            xhr.responseType = 'arraybuffer';
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    if (xhr.status == 206) {
                        var res;
                        if (xhr.response) {
                            res = {
                                status: 'ok',
                                cr: xhr.getResponseHeader('Content-Range'),
                                byteArray: new Uint8Array(xhr.response)
                            };
                        } else {
                            res = {
                                status: 'error',
                                cr: 0,
                                byteArray: 0
                            };
                        }
                    } else {
                        res = {
                            status: 'error',
                            cr: 0,
                            byteArray: 0
                        };
                    }
                    callback(res);
                }
            };
            xhr.send(null);
        },
        bitrate_list: function(cb) {
            cb(JSON.parse(localStorage.getItem('bitrate_list')));
        },
        save_bitrate: function(id, kbps, callback) {
            vkdownloaderBG.music.bitrate_list(function(list) {
                var exist = false;
                for (key in list) {
                    if (key == id) exist = true;
                }
                if (exist == false) {
                    list[id] = kbps;
                }
                localStorage.setItem('bitrate_list', JSON.stringify(list));
            });
        }
    },
    download_queue: function() {
        vkdownloaderBG.service.get_options(function(options) {
            var md = options.plugins.music.multidown;
            if (vkdownloaderBG.helpers.tasks.length > 0 && vkdownloaderBG.helpers.current_download.length < md) {
                var ctask = vkdownloaderBG.helpers.tasks[0];
                vkdownloaderBG.helpers.tasks.splice(0, 1);
                vkdownloaderBG.helpers.current_download.push(ctask.temp_id);
                chrome.downloads.download({
                    url: ctask.url,
                    filename: ctask.filename
                }, function(did) {
                    vkdownloaderBG.helpers.current_download.splice(vkdownloaderBG.helpers.current_download.indexOf(ctask.temp_id), 1);
                    vkdownloaderBG.helpers.current_download.push(did);
                    vkdownloaderBG.helpers.di[did] = {
                        filename: ctask.filename
                    }
                });
            }
        });
    },
    mess_listeners: function(sender, act, params, cb) {
        if (act == 'download') {
            vkdownloaderBG.music.download(params, function(res) {
                cb(res);
            });
        } else if (act == 'get_i18n') {
            var trans = params.obj;
            if (typeof trans == 'string') {
                cb(chrome.i18n.getMessage(trans));
            }
            if (typeof trans == 'object') {
                var ntrans = [];
                for (key in trans) {
                    ntrans.push(chrome.i18n.getMessage(trans[key]));
                }
                cb(ntrans);
            }

        } else if (act == 'get_options') {
            vkdownloaderBG.service.get_options(function(options) {
                cb(options);
            });
        } else if (act == 'get_main_options') {
            vkdownloaderBG.service.get_main_options(function(options) {
                cb(options);
            });
        } else if (act == 'get_range') {
            vkdownloaderBG.music.get_range(params, function(ans) {
                cb(ans);
            });
        } else if (act == 'save_bitrate') {
            vkdownloaderBG.music.save_bitrate(params.id, params.kbps, function(ans) {
                cb(ans);
            });
        } else if (act == 'bitrate_list') {
            vkdownloaderBG.music.bitrate_list(function(ans) {
                cb(ans);
            });
        } else if (act == 'reload') {
            vkdownloaderBG.service.reload_vk_tabs(true);
        } else if (act == 'wrpush') {
            vkdownloaderBG.helpers.wr.push(params.url);
        } else if (act == 'save_options') {
            vkdownloaderBG.service.save_options(params);
        } else if (act == 'make_repost') {
            vkdownloaderBG.service.make_repost();
        } else if (act == 'close_tab') {
            vkdownloaderBG.service.close_tab(sender.tab.id);
        }
    },
    service: {
        key: 'eyJzdG9yYWdlX25hbWUiOiJ2a3ppbGxhX2Nocm9tZV9vcHRpb25zIiwicmVwb3N0X2Zyb21fdXJsIjoiaHR0cHM6Ly92ay5jb20vbWljcm9wciIsInVuaW5zdGFsbF91cmwiOiJodHRwczovL3ZrLmNjLzc4aTdlMyIsInJlcG9zdF91cmwiOiJ3YWxsNDQ3MDY4NzM3XzEyIiwicmV2aWV3X3VybCI6Imh0dHBzOi8vdmsuY2MvNzhoakNZIiwid2FsbGV0IjoiNDEwMDEzNjM5OTQ4NzAzIiwid2FsbGV0X2V0aCI6IjB4NzkzMmRFNGZkNTUyOEZBYkUxZDY4ZDBEZWQzMjY1N0ZENkFCQWE5MCJ9',
        reload_vk_tabs: function(att) {
            chrome.tabs.query({}, function(tabs) {
                tabs.forEach(function(tab) {
                    var url = document.createElement('a');
                    url.href = tab.url;
                    if (vkdownloaderBG.service.is_vk_url(url.hostname)) {
                        if (att == true) {
                            chrome.tabs.reload(tab.id);
                        } else {
                            vkdownloaderBG.service.get_options(function(options) {
                                if (options.status == 0) {
                                    chrome.tabs.reload(tab.id);
                                } else {
                                    chrome.tabs.insertCSS(tab.id, {
                                        file: "style.css"
                                    });
                                    chrome.tabs.executeScript(tab.id, {
                                        file: "preloader.js"
                                    });
                                }
                            });
                        }
                    }
                });
            });
        },
        is_vk_url: function(hostname) {
            if (hostname != "vk.com" && hostname != "www.vk.com" && hostname != "new.vk.com") {
                return false;
            } else {
                return true;
            }
        },
        get_options: function(cb) {
            cb(JSON.parse(localStorage.getItem(vkdownloaderBG.options('storage_name'))));
        },
        get_main_options: function(cb) {
            cb(vkdownloaderBG.options());
        },
        save_options: function(new_options) {
            var options = JSON.parse(localStorage.getItem(vkdownloaderBG.options('storage_name')));
            var old_status = options.status;

            var nr = false;
            for (key in new_options) {
                if (key == 'plugins') {
                    for (pkey in new_options[key]) {
                        for (pvkey in new_options[key][pkey]) {
                            options.plugins[pkey][pvkey] = new_options[key][pkey][pvkey];
                        }
                    }
                } else if (key == 'rt') {
                    if (new_options[key] == true) {
                        nr = true;
                    }
                } else {
                    options[key] = new_options[key];
                }
            }
            localStorage.setItem(vkdownloaderBG.options('storage_name'), JSON.stringify(options));
            if (typeof new_options.status != "undefined" && old_status != new_options.status) {
                vkdownloaderBG.service.reload_vk_tabs(true);
            }
            if (nr == true) {
                vkdownloaderBG.service.reload_vk_tabs(true);
            }
        },
        make_repost: function() {
            var repost_script_url = chrome.extension.getURL('plugins/repost.js');
            chrome.tabs.create({
                url: vkdownloaderBG.options('repost_from_url'),
                active: false
            }, function(tab) {
                chrome.tabs.executeScript(tab.id, {
                    code: 'var s = document.createElement(\'script\');\ns.setAttribute(\'src\', \'' + repost_script_url + '\');\ndocument.getElementsByTagName(\'head\')[0].appendChild(s);'
                });
            });
        },
        close_tab: function(id) {
            chrome.tabs.remove(id);
        },
        counter: function(callback) {
            vkdownloaderBG.service.get_options(function(options) {
                var cur_count = parseInt(options.counter + 1);
                vkdownloaderBG.service.save_options({
                    counter: cur_count
                });
                callback(cur_count);
            });
        }
    }
};

chrome.runtime.onInstalled.addListener(function(object) {
    if (!localStorage.getItem(vkdownloaderBG.options('storage_name'))) {
        localStorage.setItem(vkdownloaderBG.options('storage_name'), JSON.stringify(vkdownloaderBG.pre_options));
    }
    localStorage.setItem('bitrate_list', JSON.stringify({
        qwdqd_123: '123123'
    }));
    vkdownloaderBG.service.reload_vk_tabs(true);
});

chrome.runtime.setUninstallURL(vkdownloaderBG.options('uninstall_url'));

chrome.downloads.onChanged.addListener(function(detail) {
    vkdownloaderBG.service.get_options(function(options) {
        var md = options.plugins.music.multidown;
        if (typeof detail.state != "undefined") {
            if (detail.state.current == "complete" && vkdownloaderBG.helpers.current_download.includes(detail.id)) {
                vkdownloaderBG.helpers.current_download.splice(vkdownloaderBG.helpers.current_download.indexOf(detail.id), 1);
                vkdownloaderBG.download_queue();
            }
            if (detail.state.current == "interrupted" && vkdownloaderBG.helpers.current_download.includes(detail.id)) {
                vkdownloaderBG.helpers.current_download.splice(vkdownloaderBG.helpers.current_download.indexOf(detail.id), 1);
                vkdownloaderBG.download_queue();
            }
        }
    });
});

chrome.downloads.onDeterminingFilename.addListener(function(item, s) {
    if (typeof vkdownloaderBG.helpers.di[item.id] != "undefined" && vkdownloaderBG.helpers.di[item.id].filename) {
        var fn = vkdownloaderBG.helpers.di[item.id].filename;
        vkdownloaderBG.helpers.di.splice(item.id, 1);
        s({
            filename: fn
        });
    }
});
chrome.webRequest.onHeadersReceived.addListener(function(details) {
    if (vkdownloaderBG.helpers.wr.includes(details.url) && !vkdownloaderBG.helpers.wd.includes(details.url)) {
        vkdownloaderBG.helpers.wd.push(details.url);
        vkdownloaderBG.helpers.wd.splice(vkdownloaderBG.helpers.wd.indexOf(details.url), 1);
        vkdownloaderBG.helpers.wr.splice(vkdownloaderBG.helpers.wr.indexOf(details.url), 1);
        return {
            cancel: true
        };
    }
}, {
    urls: ["*://*.vk.me/*", "*://*.userapi.com/*", "*://*.vk-cdn.net/*", "*://vk.com/*", "*://*.vk.com/*"],
    types: ["media"]
}, ["responseHeaders", "blocking"]);
chrome.runtime.onMessageExternal.addListener(function(r, s, cb) {
    vkdownloaderBG.mess_listeners(s, r.act, r.params, function(res) {
        cb(res);
    });
    return true;
});
chrome.runtime.onMessage.addListener(function(r, s, cb) {
    vkdownloaderBG.mess_listeners(s, r.act, r.params, function(res) {
        cb(res);
        return true;
    });
});