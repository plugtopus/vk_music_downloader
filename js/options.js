var VKDownloader = {
    get_options: function(callback) {
        chrome.runtime.sendMessage({
            act: 'get_options'
        }, function(options) {
            chrome.runtime.sendMessage({
                act: 'get_main_options'
            }, function(main_options) {
                options.main = main_options;
                callback(options);
            });
        });
    },
    save_options: function(options) {
        chrome.runtime.sendMessage({
            act: 'save_options',
            params: options
        });
    },
    makerepost: function() {
        chrome.runtime.sendMessage({
            act: 'make_repost'
        });
    },
    get_i18n: function() {
        var matches = document["querySelectorAll"]('[data-i18n]');
        for (var i = 0; i < matches.length; i++) {
            matches[i].innerHTML = chrome.i18n.getMessage(matches[i].getAttribute('data-i18n'));
        }

        var matches_values = document["querySelectorAll"]('input[data-i18nvalue]');
        for (var i = 0; i < matches_values.length; i++) {
            matches_values[i].value = chrome.i18n.getMessage(matches_values[i].getAttribute('data-i18nvalue'));
        }
    }
};

$(function() {
    VKDownloader.get_i18n();
    VKDownloader.get_options(function(options) {
        var locale = chrome.i18n.getUILanguage();

        if (options.status == 1) {
            $('#label_status').addClass('is-checked');
            $('#status').prop('checked', true);
        } else {
            $('#label_status').removeClass('is-checked');
            $('#status').prop('checked', false);
        }

        if (options.repost != 1) {
            $('#makerepost').removeClass('hidden');
        }

        if (options.plugins.adv.type_left == 1) {
            $('#label_adv_left').addClass('is-checked');
            $('#adv_left').prop('checked', true);
        } else {
            $('#label_adv_left').removeClass('is-checked');
            $('#adv_left').prop('checked', false);
        }

        if (options.plugins.music.bitrate == 1) {
            $('#label_show_bitrate').addClass('is-checked');
            $('#show_bitrate').prop('checked', true);
        } else {
            $('#label_show_bitrate').removeClass('is-checked');
            $('#show_bitrate').prop('checked', false);
        }

        if (options.plugins.adv.type_wall == 1) {
            $('#label_adv_comm').addClass('is-checked');
            $('#adv_comm').prop('checked', true);
        } else {
            $('#label_adv_comm').removeClass('is-checked');
            $('#adv_comm').prop('checked', false);
        }

        if (options.plugins.adv.type_feed == 1) {
            $('#label_adv_feed').addClass('is-checked');
            $('#adv_feed').prop('checked', true);
        } else {
            $('#label_adv_feed').removeClass('is-checked');
            $('#adv_feed').prop('checked', false);
        }

        if (options.plugins.adv.type_audio == 1) {
            $('#label_adv_audio').addClass('is-checked');
            $('#adv_audio').prop('checked', true);
        } else {
            $('#label_adv_audio').removeClass('is-checked');
            $('#adv_audio').prop('checked', false);
        }

        $('#wallet').val(options.main.wallet);
        $('#changelly_link').attr('href', $('#changelly_link').attr('href') + options.main.wallet_eth);
        $('#review').attr('href', options.main.review_url);
        $('#multicount').val(options.plugins.music.multidown);
        $('#multicount').removeClass('is-lowest-value');
        $('#multicount').addClass('is-upgraded');
        $('#multicount_val').text(options.plugins.music.multidown);
    });
});

$('#status').change(function() {
    VKDownloader.save_options({
        status: $(this).is(":checked") ? 1 : 0
    });
});
$('#adv_left').change(function() {
    VKDownloader.save_options({
        plugins: {
            adv: {
                type_left: $(this).is(":checked") ? 1 : 0
            }
        },
        rt: true
    });
});
$('#show_bitrate').change(function() {
    VKDownloader.save_options({
        plugins: {
            music: {
                bitrate: $(this).is(":checked") ? 1 : 0
            }
        },
        rt: true
    });
});
$('#adv_comm').change(function() {
    VKDownloader.save_options({
        plugins: {
            adv: {
                type_wall: $(this).is(":checked") ? 1 : 0
            }
        },
        rt: true
    });
});
$('#adv_feed').change(function() {
    VKDownloader.save_options({
        plugins: {
            adv: {
                type_feed: $(this).is(":checked") ? 1 : 0
            }
        },
        rt: true
    });
});
$('#adv_audio').change(function() {
    VKDownloader.save_options({
        plugins: {
            adv: {
                type_audio: $(this).is(":checked") ? 1 : 0
            }
        },
        rt: true
    });
});
$('#makerepost').click(function() {
    VKDownloader.makerepost();
    $('#makerepost').addClass('hidden');
    VKDownloader.save_options({
        repost: 1
    });
});
$('#multicount').change(function() {
    $('#multicount_val').text($(this).val());
    VKDownloader.save_options({
        plugins: {
            music: {
                multidown: $(this).val()
            }
        }
    });
});