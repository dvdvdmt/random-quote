// TODO: add sharing in VK, Facebook, G+
// TODO: improve animation, make it shorter
// TODO: switching between dark and white themes


// Animate.css usage https://github.com/daneden/animate.css/#usage
$.prototype.animateCss = function (animation, callBack) {
    var endEvents = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
    var animationClass = 'animated ' + animation;
    this.addClass(animationClass).one(endEvents, function () {
        $(this).removeClass(animationClass);
        if (callBack) callBack();
    });
    return this;
};

function encodeData(data) {
    return Object.keys(data).map(function(key) {
        return [key, data[key]].map(encodeURIComponent).join("=");
    }).join("&");
}

$(function () {
    function ForismaticApi(quoteLanguage) {
        var baseUrl = 'http://api.forismatic.com/api/1.0/';
        var language = quoteLanguage || '';
        var format = 'jsonp';

        this.setLanguage = function (lang) {
            language = lang || '';
        };

        // returns jquery Promise with methods done, fail, always
        this.getRandomQuote = function () {
            return $.ajax({
                type: "POST",
                crossDomain: true,
                url: baseUrl,
                data: {method: "getQuote", format: format, lang: language},
                dataType: "jsonp",
                jsonp: "jsonp"
                //jsonpCallback: "myJsonMethod"
            }).done(onDone).fail(onFail);
        };

        var onFail = function (data) {
            console.log("Can't get quote:", data);
        };

        var onDone = function (data) {
            console.log(data);
        };

        this.setOnDone = function (f) {
            onDone = f;
        };

        this.setOnFail = function (f) {
            onFail = f;
        }
    }

    function App(api) {
        //var self = this;
        var quoteEl = $('#quote');
        var elAuthor = $('#quote-author');
        var elText = $('#quote-text');
        var elSource = $('#quote-source');
        var getQuoteBtn = $('#get-quote');
        var errorMsg = $('#error-msg');
        var setEng = $('#set-eng');
        var setAutoUpdate = $('#set-auto-update');


        var settings = $('#settings');
        $('#settings-btn').click(function () {
            settings.toggle(300);
        });

        var lastQuote;

        function updateQuote(quote) {
            lastQuote = quote;
            elAuthor.text(quote.quoteAuthor);
            elText.text(quote.quoteText);
            elSource.attr('href', quote.quoteLink);
        }

        function fetchNew() {
            if (getQuoteBtn.hasClass('disabled')) return;
            getQuoteBtn.addClass('disabled');
            quoteEl.animateCss('fadeOutLeft', function () {
                quoteEl.removeClass('visible');
                getQuote();
            });
        }

        function getQuote() {
            api.getRandomQuote().done(function (quote) {
                errorMsg.hide();
                updateQuote(quote);
                quoteEl.animateCss('fadeInRight');
                quoteEl.addClass('visible');
                getQuoteBtn.removeClass('disabled');
            }).fail(function () {
                errorMsg.show();
                errorMsg.animateCss('fadeInUp');
            });
        }

        setEng.change(function () {
            var lang = this.checked ? 'en' : '';
            api.setLanguage(lang);
            localStorage.setItem('lang', lang);
        });

        var intervalId;
        setAutoUpdate.change(function () {
            var minutes = this.options[this.selectedIndex].value;
            if (minutes) {
                var interval = minutes * 60000;
                clearInterval(intervalId);
                intervalId = setInterval(getQuote.bind(this), interval);
                localStorage.setItem('autoUpdate', JSON.stringify({optionId: this.selectedIndex, interval: interval}));
            } else {
                clearInterval(intervalId);
                localStorage.removeItem('autoUpdate');
            }
        });

        $('.share-button').click(function () {
            var share = $(this).data('share');
            var quote = lastQuote.quoteText;
            var author = lastQuote.quoteAuthor;
            var text = quote + '\n- ' + author;
            switch (share) {
                case 'twitter':
                    var params = encodeData({text:text});
                    openShareWindow('https://twitter.com/intent/tweet?'+params);
                    break;
            }
            return false;
        });

        function openShareWindow(link) {
            //$.preventDefault();
            var e = "scrollbars=yes,resizable=yes,toolbar=no,location=yes"
                , w = 550
                , h = 420
                , sH = window.screen.height
                , sW = window.screen.width
                , x = Math.round(sW / 2 - w / 2)
                , y = Math.round(sH / 2 - h / 2);

            window.open(link, null, e + ",width=" + w + ",height=" + h + ",left=" + x + ",top=" + y);
        }

        var lang = localStorage.getItem('lang');
        if (lang) {
            setEng.prop('checked', true);
            api.setLanguage(lang);
        }

        var autoUpdate = localStorage.getItem('autoUpdate');
        if (autoUpdate) {
            autoUpdate = JSON.parse(autoUpdate);
            intervalId = setInterval(getQuote.bind(this), autoUpdate.interval);
            setAutoUpdate.find('option:eq(' + autoUpdate.optionId + ')').prop('selected', true);
        }
        getQuoteBtn.click(fetchNew);
        getQuote();
    }


    var api = new ForismaticApi('');
    var app = new App(api);

    $('[data-toggle="tooltip"]').tooltip({delay: 100}).focus(function () {
        var tip = $(this);
        setTimeout(function () {
            tip.trigger('focusout');
        }, 1000);
    });

})
;