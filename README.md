# Stimp Client
Simple STOMP Client intended to support STOMP 1.2

Important - please refer to Stimp Server - this client counterpart. (https://github.com/paulosimao/stimp-server)

Ok folks, now this is WIP, but if you´re seeking to an end to end STOMP 1.2 solution, you will get it!

For those who want to start fast:

##### Sender:

    var client = require('stimp-client')();
    client.connect('127.0.0.1', 61613, null, function () {
        for (var i = 0; i < 3000; i++) {
            client.send('/topic/a', 'TEST:' + i);
        }
    });


##### Receiver:

    var client = require('stimp-client')();
    client.connect('127.0.0.1', 61613, null, function () {
        client.subscribe('/topic/a', null, function () {
            client.on('message', function (body, msg) {
                console.log(body);
            });
        });
    });


##### Options:

  You can optionally set parameters to client:

     config: {
         autoack: true
     }
 - autoack:true|false - Tell client if ack should be sent automatically in response to messages received.In case false is set, you can reply to server informing a message was wrongly processed. In this case, message will be moved to deadletter queue in the server.

Please note this is working fine, but not ready for production yet - testing support is welcome.

##### TODO (in order of priority):
- Messages kept in server backend where there is no listener are not yet been forwarded to client
- Queues and Topics (Ok this is serverside, but be aware)behave the same way at this time (WIP - keep in mind)
- Transactions are not supported yet
- Client not validated against other servers such as AMQ or Rabbit
- There is pleny of space for performance improvement.
