/**
 * Created by paulo.simao on 26/12/2015.
 */
var client = require('../index')();
var ll = require('lillog');
var maxmsgs = 200;
var idxmsg = 0;
client.connect('127.0.0.1', 61613, null, function () {
    for (var i = 0; i < 3000; i++) {
        client.send('/topic/a', 'TESTE:' + i);
    }
});