/**
 * Created by heweiguang on 2018/3/26.
 */

(function(jQuery, window, undefined) {
    "use strict";

    jQuery.uaMatch = (ua) => {
        ua = ua.toLowerCase();

        const match = /(chrome)[ \/]([\w.]+)/.exec(ua) ||
            /(webkit)[ \/]([\w.]+)/.exec(ua) || //检测出 safari
            /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
            /(msie) ([\w.]+)/.exec(ua) ||
            ua.indexOf('compatible') < 0 && /(mozilla)(?:.*?rv:([\w.]+)|)/.exec(ua) || [];

        //["chrome/65.0.3325.162", "chrome", "65.0.3325.162"]

        const platform_match = /(ipad)/.exec(ua) ||
            /(iphone)/.exec(ua) ||
            /(android)/.exec(ua) || [];

        return {
            browser: match[1] || '',
            version: match[2] || 0,
            platform: platform_match[0] || ''
        }
    };

    const matched = jQuery.uaMatch(window.navigator.userAgent);
    const browser = {};

    if(matched.browser) {
        browser[matched.browser] = true;
        browser.version = matched.version;
    }

    if(matched.platform) {
        browser[matched.platform] = true;
    }

    //chrome 和 safari 都为 webkit
    if(browser.chrome) {
        browser.webkit = true;
    }else if(browser.webkit) {
        browser.safari = true;
    }

    jQuery.browser = browser;

})(jQuery, window);
