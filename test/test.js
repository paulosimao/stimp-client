/**
 * Created by paulo.simao on 23/12/2015.
 */

describe('Client Test', function () {
    this.timeout(99999999);
    it('Simple Test', function (done) {
        var client = require('../index')();
        client.connect('127.0.0.1', 61613, null, function () {
            console.log('Done');
            client.send('/queue/a', 'teste123');
            //done();
        });


    });


});
