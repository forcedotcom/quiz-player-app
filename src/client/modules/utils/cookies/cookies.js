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
const getCookie = (cname) => {
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
 * Clear cookie
 * @param {String} cname The name of the cookie to retrieve.
 */
const clearCookie = (cname) => {
    const pathBits = window.location.pathname.split('/');
    let pathCurrent = ' path=';
    document.cookie = cname + '=; expires=Thu, 01-Jan-1970 00:00:01 GMT;';
    pathBits.forEach((pathBit) => {
        pathCurrent += (pathCurrent.substr(-1) !== '/' ? '/' : '') + pathBit;
        document.cookie =
            cname +
            '=; expires=Thu, 01-Jan-1970 00:00:01 GMT;' +
            pathCurrent +
            ';';
    });
};

export { setCookie, getCookie, clearCookie };
