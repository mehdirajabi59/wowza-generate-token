const crypto = require('crypto')
class WowzaGenerateToken {
    /**
     * SHA-256 algorithm
     */
    static SHA256 = 1;

    /**
     * SHA-384 algorithm
     */
    static SHA384 = 2;

    /**
     * SHA-512 algorithm
     */
    static SHA512 = 3;

    /**
     * Constant mapping to string values for JavaScript hash function
     * @var object
     */
    algorithms = {
        [WowzaGenerateToken.SHA256]: 'sha256',
        [WowzaGenerateToken.SHA384]: 'sha384',
        [WowzaGenerateToken.SHA512]: 'sha512',
    };

    /**
     * @var string|null client IP for validation in Wowza
     */
    clientIP = null;

    /**
     * @var string prefix for all query parameters
     */
    prefix;

    /**
     * @var string secret key
     */
    sharedSecret;

    /**
     *
     * @var string url
     */
    url;

    /**
     *
     * @var string path url
     */
    urlPath;

    /**
     *
     * @var int index of algorithm used to define hash method
     */
    hashMethod = WowzaGenerateToken.SHA256;

    /**
     *
     * @var object extra params used to generate token
     */
    params = {};

    /**
     *
     * @param {string} prefix Set prefix.
     * The prefix value can only have the following characters that are safe to use in URLs:
     * alphanumeric characters (a - z, A - Z, 0 - 9), percent sign (%), period (.), underscore (_),
     * tilde (~), and hyphen (-).
     * @param {string} sharedSecret Set shared secret key
     * @throws WowzaException
     */
    constructor(prefix, sharedSecret) {
        const patternPrefix = /^[\w\d%\._\-~]+$/;
        if (!patternPrefix.test(prefix)) {
            throw new Error(`Prefix [${prefix}] is invalid`);
        }
        this.prefix = prefix;

        const patternSecret = /^[\w\d]+$/;
        if (!patternSecret.test(sharedSecret)) {
            throw new Error(`Secret [${sharedSecret}] is invalid`);
        }
        this.sharedSecret = sharedSecret;
    }

    /**
     * Set client IP for using in hash
     *
     * @param {string} ip
     * @throws WowzaException
     */
    setClientIP(ip) {
        if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip)) {
            throw new Error(`User IP (${ip}) is invalid`);
        }
        this.clientIP = ip;
    }

    /**
     * @returns {null|string}
     */
    getClientIP() {
        return this.clientIP;
    }

    /**
     * Set client URL for using in hash
     *
     * @param {string} url
     * @throws WowzaException
     */
    setURL(url) {
        const urlInfo = new URL(url);
        if (!urlInfo.pathname) {
            throw new Error('Invalid URL supplied');
        }

        this.url = url;
        this.urlPath = urlInfo.pathname;
    }

    /**
     *
     * @returns {null|string}
     */
    getURL() {
        return this.url;
    }


    setHashMethod(hashMethod) {
        if (!this.algorithms[hashMethod]) {
            throw new Error(`Algorithm [${hashMethod}] not defined`);
        }
        this.hashMethod = hashMethod;
    }

    getHashMethod() {
        return this.hashMethod;
    }

    setExtraParams(params) {

        if (typeof params !== 'object') {
            throw new Error('$params must be an object');
        }

        if (this.prefix) {
            Object.entries(params).forEach(([key, val]) => {
                if (! key.includes(this.prefix)) {
                    params[this.prefix + key] = val
                    delete params[key]
                }
            })
        }

        this.params = params;
    }

    getParams() {
        return this.params;
    }

    getSharedSecret() {
        return this.sharedSecret;
    }

    getPrefix() {
        return this.prefix;
    }

    getHash() {
        if (!this.sharedSecret) {
            throw new Error('SharedSecret is not set');
        }
        const query = this._paramsToQueryString();

        let path = this.urlPath.replace(/^\//, '');

        const pathItems = path.split('/');

        if (pathItems.length < 2) {
            throw new Error('Application or stream is invalid');
        }

        path = '';

        for (let i = 0; i < pathItems.length; i++) {
            const pathItem = pathItems[i];
            if (/m3u8/.test(pathItem)) {
                break;
            }
            path += pathItem;
            if (i !== pathItems.length - 1) {
                path += '/';
            }
        }

        if (path.endsWith('/')) {
            path = path.slice(0, -1);
        }

        path += `?${query}`;
        console.log(path)
        const hash = crypto.createHash(this.algorithms[this.hashMethod]);
        hash.update(path);
        const hashedPath = hash.digest('binary');
        const base64Encoded = Buffer.from(hashedPath, 'binary').toString('base64');
        const token = base64Encoded.replace(/\+/g, '-').replace(/\//g, '_');

        return token;
    }

    getFullURL() {
        const queryString = Object.entries(this.params)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');

        const token = this.getHash();
        const urlWithParams = `${this.url}?${queryString}`;
        const fullURL = `${urlWithParams}&${this.prefix}hash=${token}`;

        return fullURL;
    }

    _paramsToQueryString() {
        let params = { ...this.params };
        if (this.clientIP !== null) {
            params[this.clientIP] = '';
        }

        params[this.sharedSecret] = '';
        const sortedKeys = Object.keys(params).sort();

        let query = '';
        for (let i = 0; i < sortedKeys.length; i++) {
            const key = sortedKeys[i];
            const value = params[key];
            query += `&${key}`;
            if (value && value !== '') {
                query += `=${value}`;
            }
        }
        return query.replace(/^&/, '');
    }
}

module.exports.WowzaSecureToken = WowzaGenerateToken
