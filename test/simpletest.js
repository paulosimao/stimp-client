/**
 * Created by paulo.simao on 25/12/2015.
 */
var client = require('../index')();
client.connect('127.0.0.1', 61613, null, function () {
    console.log('Done');

    client.on('message', function (body, msg) {
        console.log('==========>' + JSON.stringify(msg));
        client.unsubscribe('/queue/a', function () {
            console.log('Unsubscribed queue');
        });
    })

    client.subscribe('/queue/a', null, function () {
        client.send('/queue/a', 'teste123', null, function () {
            console.log('Sent msg');
        });
    });


    //done();
});