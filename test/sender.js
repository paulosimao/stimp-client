/**
 * Created by paulo.simao on 26/12/2015.
 */
var client = require('../index')();
var async = require('async');
var ll = require('lillog');
client.connect('127.0.0.1', 61613, null, function () {

    async.times(5, function (n, next) {
        client.send('/topic/a', 'TESTE:' + n, null, function (err, data) {
            next(err, data);

        });
    }, function (err, res) {
        if (err) {
            return ll.error(err)
        }
        ll.debug(JSON.stringify(res));
        client.disconnect(function () {
            process.exit(0);
        });
    });
    for (var i = 0; i < 3000; i++) {

    }
});