/**
 * Created by paulo.simao on 26/12/2015.
 */
var client = require('../index')();
client.connect('127.0.0.1', 61613, null, function () {
    client.subscribe('/queue/a', null, function () {
        client.on('message', function (body, msg) {
            console.log(JSON.stringify(body));
        });
    });
});