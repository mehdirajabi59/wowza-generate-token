# wowza-secure-token
Javascript library to create secure token for Wowza server


**Install via npm** :

`npm i wowza-generate-token`


**Example** :

```const { WowzaGenerateToken } = require('wowza-generate-token')

const token = new WowzaGenerateToken('prefix', '123wqed');
token.setClientIP('192.168.1.1');
token.setURL('https://r1.test.com:443/vod_test/_definst_/mehdi/kiasalar/2/smil:hd_test.smil/playlist.m3u8');

token.setHashMethod(WowzaGenerateToken.SHA256);

const startTime = Math.floor(Date.now() / 1000);
const endTime = Math.floor(Date.now() / 1000) + (3 * 60 * 60); //3 hours

token.setExtraParams({ endtime: endTime, starttime: startTime, CustomParam1 : 'CustomValue' });

const secureToken = token.getHash();
const securedURL = token.getFullURL();
console.log(securedURL)
```
