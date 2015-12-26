/**
 * Created by paulo.simao on 26/12/2015.
 */
var client = require('../index')();
var ll = require('lillog');
client.connect('127.0.0.1', 61613, null, function () {
    client.send('/queue/a', 'teste123', null, function () {
        client.disconnect(function () {
            ll.log('Finalized');
        });
    });

});