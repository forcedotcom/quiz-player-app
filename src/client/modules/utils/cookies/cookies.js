const COOKIE_DURATION = 3600000; // 1 hour

/**
 * Create a cookie for the given name, value, and expiration in days.
 * @param  {String}   cname  The name of the cookie to set.
 * @param  {String}   cvalue The value of the cookie to set.
 */
const setCookie = (cname, cvalue) => {
    const d = new Date();
    d.setTime(d.getTime() + COOKIE_DURATION);
    document.cookie = `${cname}=${escape(
        cvalue
    )}; expires=${d.toUTCString()}; path=/`;
};

/**
 * Gets a cookie with the given name
 * @param  {String} cname  The name of the cookie to retrieve.
 * @returns {String} cookie value or an empty string if cookie is not found
 */
const getCookie = cname => {
    const name = `${cname}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return unescape(c.substring(name.length, c.length));
        }
    }
    return '';
};

/**
 * Clears all cookies
 */
const clearAllCookies = () => {
    const cookies = document.cookie.split('; ');
    cookies.forEach(cookie => {
        const d = window.location.hostname.split('.');
        while (d.length > 0) {
            const cookieBase =
                encodeURIComponent(cookie.split(';')[0].split('=')[0]) +
                '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; domain=' +
                d.join('.') +
                ' ;path=';
            const p = window.location.pathname.split('/');
            document.cookie = cookieBase + '/';
            while (p.length > 0) {
                document.cookie = cookieBase + p.join('/');
                p.pop();
            }
            d.shift();
        }
    });
};

export { setCookie, getCookie, clearAllCookies };
