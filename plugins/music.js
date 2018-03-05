var vkdownloaderMusic = {
    options: {
        ap_id_prefix: 'vkzmp_',
        multi_request_limit: 9,
        queue_delay_ms: 1000
    },
    tracks: [],
    ntracks: [],
    btrs: [],
    btrs_inwork: [],
    init: function() {
        vkdownloaderTools.observer(document.body, function() {
            vkdownloaderTools.get_options(function(o) {
                vkdownloaderMusic.makemyday(o);
            });

        });
    },
    get_rows: {
        single: function(audio_row, callback) {
            callback(document.getElementsByClassName(audio_row));
        },
        playlist: function(cont, audio_row, callback) {
            var container = document.getElementById(cont);
            callback(container.getElementsByClassName(audio_row));
        }
    },
    get_link: {
        pre: function(track_id, callback) {
            vkdownloaderMusic.service.request.ids_info(track_id, function(data) {
                vkdownloaderMusic.get_link.end(data[0][2], function(url) {
                    callback(url);
                });
            });
        },
        end: function(preurl, callback) {
            var plrs = [],
                id = vkdownloaderMusic.options.ap_id_prefix + Math.random();
            plrs[id] = new AudioPlayerHTML5({
                onFrequency: function() {},
            });
            plrs[id].setUrl(preurl);
            var src = plrs[id]._currentAudioEl.src;
            plrs[id].stop();
            chrome.runtime.sendMessage(vkdownloaderTools.get_ext_id(), {
                act: 'wrpush',
                params: {
                    url: src
                }
            });
            callback(src);
        }
    },
    insert_link: {
        user_playlist: function(playlist) {
            vkdownloaderTools.get_i18n('downloadAll', function(m) {
                var h2 = document.body.querySelector('#page_layout .audio_page__audio_rows h2');
                var link = document.createElement('a');
                link.innerHTML = m;
                link.className = 'vkdownloader_download_user_playlist_link';
                link.setAttribute('data-playlist-id', playlist.playlist_id);
                link.setAttribute('data-owner-id', playlist.owner_id);
                link.href = '#';
                link.addEventListener('click', function(e) {
                    e.cancelBubble = true;
                    e.preventDefault();
                    var curell = e.target || e.srcElement;
                    vkdownloaderMusic.download.playlist(curell);
                    return false;
                }, false);
                h2.parentNode.insertBefore(link, h2.nextSibling);
            });
        },
        playlist: function(row, playlist) {
            vkdownloaderTools.get_i18n('download', function(m) {
                var insaf = row.querySelector('.audio_pl_snippet_shuffle');
                var link = document.createElement('a');
                link.innerHTML = m;
                link.className = 'vkdownloader_download_playlist_link';
                link.setAttribute('data-playlist-id', playlist.playlist_id);
                link.setAttribute('data-owner-id', playlist.owner_id);
                link.href = '#';
                link.addEventListener('click', function(e) {
                    e.cancelBubble = true;
                    e.preventDefault();
                    var curell = e.target || e.srcElement;
                    vkdownloaderMusic.download.playlist(curell);
                    return false;
                }, false);
                insaf.parentNode.insertBefore(link, insaf.nextSibling);
            });
        },
        single: function(track) {
            vkdownloaderTools.get_i18n('downloadTrackLabel', function(m) {
                vkdownloaderMusic.tracks[track.id] = track;
                var link = document.createElement('a');
                link.className = 'VK_Downloader_link';
                link.setAttribute('download', track.filename);
                link.setAttribute('data-track-id', track.id);
                link.setAttribute('data-tooltip-label', m);
                link.setAttribute('onmouseover', 'vkdownloaderMusic.service.show_tooltip(this)');
                link.href = '#';
                link.addEventListener('click', function(e) {
                    e.cancelBubble = true;
                    e.preventDefault();
                    var curell = e.target || e.srcElement;
                    vkdownloaderMusic.download.track(curell);
                    return false;
                }, false);
                track.layer.insertBefore(link, track.layer.firstChild);
            });
        }
    },
    bitrate: {
        get_bitrate: function(track_id, callback) {
            chrome.runtime.sendMessage(vkdownloaderTools.get_ext_id(), {
                act: 'get_range',
                params: {
                    url: vkdownloaderMusic.tracks[track_id].url,
                    range: '0-45'
                }
            }, function(res) {
                if (res.status == 'ok') {
                    var byteArray = res.byteArray;
                    var filesize = res.cr.replace(/^.*\/([0-9]+)$/ig, '$1');
                    vkdownloaderMusic.tracks[track_id].filesize = (filesize / 1048576).toFixed(1);
                    vkdownloaderMusic.bitrate.check_for_id3(byteArray, vkdownloaderMusic.tracks[track_id].url, function(fmb) {
                        if (fmb == 'vbr') {
                            callback('VBR');
                        } else {
                            if (fmb == 'cbr') {
                                callback(vkdownloaderMusic.bitrate.unknown_bitrate(filesize, duration));
                            } else if (fmb == 'no') {
                                callback('~');
                            } else {
                                vkdownloaderMusic.bitrate.convert_bin_to_params(fmb, function(params) {
                                    if (params.bitrate == 'cbr') {
                                        var btr = vkdownloaderMusic.bitrate.unknown_bitrate(filesize, duration)
                                    } else {
                                        var btr = params.bitrate;
                                    }
                                    callback(btr);
                                });
                            }
                        }
                    });
                } else {
                    callback('~');
                }
            });
        },
        update: function(track_id, bitrate) {
            var btr_wrap = vkdownloaderMusic.tracks[track_id].layer.querySelector('.audio_row__duration');
            var btr = document.createElement('div');
            btr.className = 'vkdownloader_audio_btr_label';
            btr.innerHTML = '' + bitrate + '';
            btr.setAttribute('data-btr', '' + bitrate + '');
            btr_wrap.insertBefore(btr, btr_wrap.firstChild);
            VkdownloaderMusic.tracks[track_id].btr = bitrate;

            chrome.runtime.sendMessage(vkdownloaderTools.get_ext_id(), {
                act: 'save_bitrate',
                params: {
                    id: track_id,
                    kbps: bitrate
                }
            });
        },
        check_for_id3: function(byteArray, url, callback) {
            if (vkdownloaderMusic.bitrate.is_vbr(byteArray)) {
                callback('vbr');
            } else {
                if (byteArray[0] == 73 && byteArray[1] == 68 && byteArray[2] == 51) {
                    var bin_array = vkdownloaderMusic.bitrate.u8_to_bin_array(byteArray);
                    var bin_size = '';
                    for (var i = 6; i < 10; i++) {
                        var sliced_bin = bin_array[i].slice(1);
                        bin_size += sliced_bin;
                    }
                    var dec_size = parseInt(bin_size, 2) + 10;
                    var range_from = dec_size;
                    var range_to = dec_size + 451;
                    chrome.runtime.sendMessage(vkdownloaderTools.get_ext_id(), {
                        act: 'get_range',
                        params: {
                            url: url,
                            range: range_from + '-' + range_to
                        }
                    }, function(res) {
                        if (res.status == 'ok') {
                            if (vkdownloaderMusic.bitrate.is_vbr(res.byteArray)) {
                                callback('vbr');
                            } else {
                                var nbin_array = vkdownloaderMusic.bitrate.u8_to_bin_array(res.byteArray);
                                var si;
                                var is_magic_eleven = true;
                                for (var i = 0; i < nbin_array.length; i++) {
                                    if (nbin_array[i] == '11111111' && si == undefined) {
                                        si = i;
                                        is_magic_eleven = false;
                                    }
                                }
                                if (is_magic_eleven) {
                                    callback('cbr');
                                } else {
                                    var four_magic_bytes = nbin_array[si] + nbin_array[si + 1] + nbin_array[si + 2] + nbin_array[si + 3];
                                    callback(four_magic_bytes);
                                }
                            }
                        } else {
                            callback('no');
                        }
                    });
                } else {
                    var nbin_array = vkdownloaderMusic.bitrate.u8_to_bin_array(byteArray);
                    var four_magic_bytes = nbin_array[0] + nbin_array[1] + nbin_array[2] + nbin_array[3];
                    callback(four_magic_bytes);
                }
            }
        },
        u8_to_bin_array: function(byteArray) {
            var bs = [];
            for (key in byteArray) {
                bs.push(vkdownloaderMusic.bitrate.lpad(byteArray[key].toString(2), "0", 8));
            }
            return bs;
        },
        lpad: function(obj, str, num) {
            return vkdownloaderMusic.bitrate.repeat(str, num - obj.length) + obj;
        },
        repeat: function(str, num) {
            if (str.length === 0 || num <= 1) {
                if (num === 1) return str;
                return '';
            }
            var result = '',
                pattern = str;
            while (num > 0) {
                if (num & 1) result += pattern;
                num >>= 1;
                pattern += pattern;
            }
            return result;
        },
        unknown: function(filesize, duration) {
            var kbps = (Math.floor(filesize * 8 / duration / 1024) / 32 >> 0) * 32
            if ((kbps >= 288)) kbps = 320;
            else
            if ((kbps >= 224) && (kbps < 288)) kbps = 256;
            else
            if ((kbps >= 176) && (kbps < 224)) kbps = 192;
            else
            if ((kbps >= 144) && (kbps < 176)) kbps = 160;
            else
            if ((kbps >= 112) && (kbps < 144)) kbps = 128;
            else
            if ((kbps >= 80) && (kbps < 112)) kbps = 96;
            else
            if ((kbps >= 48) && (kbps < 80)) kbps = 64;
            else
            if ((kbps >= 20) && (kbps < 48)) kbps = 32;
            return '~' + kbps;
        },
        bytearray_to_string: function(byteArray) {
            var byte_string = '';
            for (var i = 0; i < byteArray.byteLength; i++) {
                byte_string += String.fromCharCode(byteArray[i]);
            }
            return byte_string;
        },
        is_vbr: function(byteArray) {
            var first_bits = vkdownloaderMusic.bitrate.bytearray_to_string(byteArray);
            var regex = /Xing|VBRI/gi;
            if (regex.test(first_bits)) {
                return true;
            }
            return false;
        },
        convert_bin_to_params: function(fmb, callback) {
            //AAAAAAAA AAABBCCD EEEEFFGH IIJJKLMM
            var mpeg_ver_array = {
                '00': 2,
                '01': 0,
                '10': 2,
                '11': 1
            }
            var layer_array = {
                '00': 0,
                '01': 3,
                '10': 2,
                '11': 1
            }
            var bitrate_map = {
                '0000': 0,
                '0001': 1,
                '0010': 2,
                '0011': 3,
                '0100': 4,
                '0101': 5,
                '0110': 6,
                '0111': 7,
                '1000': 8,
                '1001': 9,
                '1010': 10,
                '1011': 11,
                '1100': 12,
                '1101': 13,
                '1110': 14,
                '1111': 15
            }
            var bitrate_array = {
                '11': [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, 0],
                '12': [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384, 0],
                '13': [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0],
                '21': [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, 0],
                '22': [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384, 0],
                '23': [0, 8, 16, 24, 32, 64, 80, 56, 64, 128, 160, 112, 128, 256, 320, 0]
            }
            var mpeg_ver = mpeg_ver_array[fmb.substring(11, 13)];
            var layer = layer_array[fmb.substring(13, 15)];
            var ml = mpeg_ver + '' + layer;
            if (bitrate_array[ml] != undefined) {
                var btr = bitrate_array[ml][bitrate_map[fmb.substring(16, 20)]];
            } else {
                var btr = 'cbr';
            }
            if (btr == 0) {
                btr = 'cbr';
            }
            var params = {
                bitrate: btr,
            }
            callback(params);
        }
    },
    download: {
        track: function(e) {
            var track_id = e.getAttribute('data-track-id');
            if (typeof vkdownloaderMusic.tracks[track_id] != 'undefined' && vkdownloaderMusic.tracks[track_id].url) {
                vkdownloaderMusic.download.execute(track_id);
            } else {
                if (typeof vkdownloaderMusic.tracks[track_id] != 'undefined' && vkdownloaderMusic.tracks[track_id].info[2]) {
                    vkdownloaderMusic.get_link.end(vkdownloaderMusic.tracks[track_id].info[2], function(url) {
                        vkdownloaderMusic.tracks[track_id].url = url;
                        vkdownloaderMusic.download.execute(track_id);
                    });
                } else {
                    vkdownloaderMusic.get_link.pre(track_id, function(url) {
                        vkdownloaderMusic.tracks[track_id].url = url;
                        vkdownloaderMusic.download.execute(track_id);
                    });
                }
            }
        },
        playlist: function(e) {
            vkdownloaderTools.get_i18n('enterFolderName', function(m) {
                var playlist_id = e.getAttribute('data-playlist-id');
                var owner_id = e.getAttribute('data-owner-id');
                vkdownloaderMusic.service.request.playlist_info(owner_id, playlist_id, function(a, list) {
                    var prmt = prompt(m, a.title);
                    if (prmt) {
                        prmt = vkdownloaderMusic.service.cleanName(prmt);
                        var trck_list = [],
                            trck_list_comb = [];
                        for (var i = 0, j = 0; i < list.length; i++) {
                            if (i == 0) {
                                trck_list[j] = [];
                            }
                            if (i % vkdownloaderMusic.options.multi_request_limit == 0 && i != 0) {
                                j++;
                                trck_list[j] = [];
                            }
                            trck_list[j].push(list[i][1] + '_' + list[i][0]);
                        }
                        for (var i = 0; i < trck_list.length; i++) {
                            trck_list_comb.push(trck_list[i].join(','));
                        }
                        vkdownloaderMusic.queue.init(trck_list_comb, prmt);
                    }
                });
            });
        },
        execute: function(track_id, folder = false) {
            var track = vkdownloaderMusic.tracks[track_id];
            chrome.runtime.sendMessage(vkdownloaderTools.get_ext_id(), {
                act: 'download',
                params: {
                    url: track.url,
                    filename: track.filename,
                    folder: folder
                }
            }, function(c) {
                // vkdownloaderTools.get_options(function(o){
                // 	if (o.locale == 'ru' || o.locale == 'uk') {
                // 		if (c%25 == 0 && c!=0 && o.donate!=1) {
                // 			vkdownloaderTools.show_wkbox();
                // 		}
                // 	}
                // });
            });
        }
    },
    queue: {
        init: function(trck_list, folder) {
            vkdownloaderTools.delay(vkdownloaderMusic.options.queue_delay_ms, trck_list, function(trck_list) {
                vkdownloaderMusic.queue.prepare(trck_list, function(track_id) {
                        vkdownloaderMusic.download.execute(track_id, folder);
                    },
                    function(trck_list) {
                        trck_list.splice(0, 1);
                        vkdownloaderMusic.queue.init(trck_list, folder);
                    });
            });
        },
        manage_ids: function(list) {
            var trck_list = [],
                trck_list_comb = [];
            for (var i = 0, j = 0; i < list.length; i++) {
                if (i == 0) trck_list[j] = [];
                if (i % vkdownloaderMusic.options.multi_request_limit == 0 && i != 0) {
                    j++;
                    trck_list[j] = [];
                }
                trck_list[j].push(list[i]);
                vkdownloaderMusic.tracks[list[i]].btr = 'ZYX'
            }
            for (var i = 0; i < trck_list.length; i++) {
                trck_list_comb.push(trck_list[i].join(','));
            }
            return trck_list_comb;
        },
        prepare: function(trck_list, callback, iter) {
            if (trck_list.length > 0) {
                vkdownloaderMusic.service.request.ids_info(trck_list[0], function(data) {
                    for (key in data) {
                        var track_id = data[key][1] + '_' + data[key][0];
                        if (vkdownloaderMusic.tracks[track_id].url) {
                            callback(track_id);
                        } else {
                            vkdownloaderMusic.get_link.end(data[key][2], function(url) {
                                vkdownloaderMusic.tracks[track_id].url = url;
                                callback(track_id);
                            });
                        }
                    }
                    iter(trck_list);
                });
            }
        },
        btr: function(trck_list) {
            vkdownloaderTools.delay(vkdownloaderMusic.options.queue_delay_ms, trck_list, function(trck_list) {
                vkdownloaderMusic.queue.prepare(trck_list, function(track_id) {
                        vkdownloaderMusic.bitrate.get_bitrate(track_id, function(bitrate) {
                            vkdownloaderMusic.bitrate.update(track_id, bitrate);
                        });
                    },
                    function(trck_list) {
                        trck_list.splice(0, 1);
                        vkdownloaderMusic.queue.btr(trck_list);
                    });
            });
        }
    },
    makemyday: function(options) {
        vkdownloaderMusic.get_rows.single('audio_row', function(rows) {
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                if (row.getAttribute('data-isd') != '1' && row.classList.contains('audio_claimed') != true) {
                    var track = {
                        id: row.getAttribute('data-full-id'),
                        info: JSON.parse(row.getAttribute('data-audio')),
                        layer: row.getElementsByClassName('audio_row__info')[0]
                    }
                    track.filename = vkdownloaderMusic.service.correct_name(track.info, '.mp3');
                    vkdownloaderMusic.insert_link.single(track);
                    row.setAttribute('data-isd', '1');
                }
            }
        });
        vkdownloaderMusic.get_rows.playlist('page_layout', 'audio_page__audio_rows_list', function(rows) {
            if (typeof rows[0] != 'undefined' && rows[0].getAttribute('data-isdp') != '1' && rows[0].getAttribute('data-playlist-id')) {
                var pl_arr = rows[0].getAttribute('data-playlist-id').split('_');
                var playlist = {
                    owner_id: pl_arr[1],
                    playlist_id: pl_arr[2],
                }
                vkdownloaderMusic.insert_link.user_playlist(playlist);
                rows[0].setAttribute('data-isdp', '1');
            }
        });
        vkdownloaderMusic.get_rows.single('audio_pl_snippet', function(rows) {
            if (typeof rows[0] != 'undefined' && rows[0].getAttribute('data-isdpp') != '1' && rows[0].getAttribute('data-playlist-id')) {
                var pl_arr = rows[0].getAttribute('data-playlist-id').split('_');
                var playlist = {
                    owner_id: pl_arr[1],
                    playlist_id: pl_arr[2],
                }
                vkdownloaderMusic.insert_link.playlist(rows[0], playlist);
                rows[0].setAttribute('data-isdpp', '1');
            }
        });
        if (options.plugins.music.bitrate == 1) {
            chrome.runtime.sendMessage(vkdownloaderTools.get_ext_id(), {
                act: 'bitrate_list'
            }, function(blist) {
                vkdownloaderMusic.get_rows.single('audio_row', function(rows) {
                    for (var i = 0; i < rows.length; i++) {
                        var row = rows[i];
                        var fid = row.getAttribute('data-full-id');
                        if (typeof vkdownloaderMusic.tracks[fid] != 'undefined' && typeof vkdownloaderMusic.tracks[fid].btr == 'undefined') {
                            if (row.classList.contains('audio_hq')) {
                                vkdownloaderMusic.tracks[fid].btr = '320';
                                vkdownloaderMusic.bitrate.update(fid, '320');
                            } else {
                                if (blist != 'undefined' && blist[fid]) {
                                    vkdownloaderMusic.tracks[fid].btr = blist[fid];
                                    vkdownloaderMusic.bitrate.update(fid, blist[fid]);
                                } else {
                                    vkdownloaderMusic.tracks[fid].btr = 'XYZ';
                                }
                            }
                        }
                    }
                    for (fid in vkdownloaderMusic.tracks) {
                        if (vkdownloaderMusic.tracks[fid].btr == 'XYZ' && !vkdownloaderMusic.btrs.includes(fid)) {
                            vkdownloaderMusic.btrs.push(fid);
                        }
                    }
                    var nlist = [];
                    for (key in vkdownloaderMusic.btrs) {
                        var fid = vkdownloaderMusic.btrs[key];
                        if (!vkdownloaderMusic.btrs_inwork.includes(fid)) {
                            vkdownloaderMusic.btrs_inwork.push(fid);
                            nlist.push(fid);
                        }
                    }
                    if (nlist.length > 0) {
                        vkdownloaderMusic.queue.btr(vkdownloaderMusic.queue.manage_ids(nlist));
                    }
                });
            });
        }
    },
    service: {
        correct_name: function(info, ext) {
            var artist = vkdownloaderMusic.service.delete_tags(info[4]);
            var song = vkdownloaderMusic.service.delete_tags(info[3]);
            song = song.replace(/&amp;/gi, '&');
            var sresult = song.match(/(\&(.*?)\;)/gi);
            if (sresult != null) {
                song = song.replace(/(\&(.*?)\;)/gi, '');
            }
            artist = artist.replace(/&amp;/gi, '&');
            var aresult = artist.match(/(\&(.*?)\;)/gi);
            if (aresult != null) {
                artist = artist.replace(/(\&(.*?)\;)/gi, '');
            }
            var trimsong = artist.trim() + ' — ' + song.trim();
            trimsong = trimsong.replace(/[^A-Za-zÀ-ßà-ÿ¨¸0-9\_\-\—#\s\(\)\]\[\.]/ig, "");
            return trimsong + ext;
        },
        delete_tags: function(txt) {
            var rex = /(<([^>]+)>)/ig;
            return (txt.replace(rex, ""));
        },
        cleanName: function(name) {
            name = name.replace(/\s+/gi, ' ');
            name = name.replace(/[^A-Za-zÀ-ßà-ÿ¨¸0-9\-\_\s\(\)\]\[]/gi, '');
            return name.substring(0, 100)
        },
        show_tooltip: function(e) {
            showTooltip(e, {
                text: e.getAttribute('data-tooltip-label'),
                black: 1,
                shift: [8, 10, 10],
                forcetodown: true
            });
        },
        request: {
            ids_info: function(ids, callback) {
                var list = ids.split(',');
                var nlist = [],
                    dlist = [];
                for (var i = 0; i < list.length; i++) {
                    var track_id = list[i];
                    if (typeof vkdownloaderMusic.tracks[track_id] != 'undefined' && vkdownloaderMusic.tracks[track_id].info[2]) {
                        dlist.push(track_id);
                    } else {
                        nlist.push(track_id);
                    }
                }
                var ids = nlist.join(',');
                ajax.post("al_audio.php", {
                    act: 'reload_audio',
                    al: 1,
                    ids: ids
                }, {
                    onDone: function(data) {
                        for (key in dlist) {
                            var trck_id = dlist[key];
                            data.push(vkdownloaderMusic.tracks[trck_id].info);
                        }
                        for (key in data) {
                            var track_id = data[key][1] + '_' + data[key][0];
                            if (typeof vkdownloaderMusic.tracks[track_id] != 'undefined') {
                                vkdownloaderMusic.tracks[track_id].info = data[key];
                            } else {
                                var track = {
                                    id: track_id,
                                    info: data[key],
                                    filename: vkdownloaderMusic.service.correct_name(data[key], '.mp3')
                                }
                                vkdownloaderMusic.tracks[track_id] = track;
                            }
                        }
                        callback(data);
                    },
                    onFail: function() {
                        callback('fail');
                    }
                });
            },
            playlist_info: function(owner_id, playlist_id, callback) {
                ajax.post("al_audio.php", {
                    act: "load_section",
                    al: "1",
                    claim: "0",
                    is_loading_all: "1",
                    offset: "0",
                    owner_id: owner_id,
                    playlist_id: playlist_id,
                    type: "playlist"
                }, {
                    onDone: function(a) {
                        callback(a, a.list);
                    }
                });
            }
        }
    }
};
vkdownloaderMusic.init();