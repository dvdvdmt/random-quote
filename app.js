// TODO: share quote in twitter
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
                jsonp: "jsonp",
                jsonpCallback: "myJsonMethod"
            }).done(onDone).fail(onFail);
        };

        var onFail = function (data) {
            console.log("Can't get quote:", data);
        };

        var onDone = function (data) {
            console.log(data)
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
        var sorryMsgEl = $('#sorry-msg');
        var setEng = $('#set-eng');
        var setAutoUpdate = $('#set-auto-update');


        var settings = $('#settings');
        $('#settings-btn').click(function () {
            settings.toggle(300);
        });


        function updateQuote(quote) {
            elAuthor.text(quote.quoteAuthor);
            elText.text(quote.quoteText);
            elSource.attr('href', quote.quoteLink);
        }

        function fetchNew() {
            getQuoteBtn.addClass('disabled');
            quoteEl.animateCss('fadeOutLeft', function () {
                quoteEl.removeClass('visible');
                getQuote();
            });
        }

        function getQuote() {
            api.getRandomQuote().done(function (quote) {
                updateQuote(quote);
                quoteEl.animateCss('fadeInRight');
                quoteEl.addClass('visible');
                getQuoteBtn.removeClass('disabled');
            }).fail(function () {
                sorryMsgEl.removeClass('invisible');
                sorryMsgEl.animateCss('fadeInUp');
                getQuoteBtn.one('click', function () {
                    sorryMsgEl.addClass('invisible');
                });
            }).always(function () {
                getQuoteBtn.one('click', fetchNew);
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