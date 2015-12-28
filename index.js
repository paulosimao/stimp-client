/**
 * Created by paulo.simao on 23/12/2015.
 */
var net = require('net');
var stimpcommons = require('stimp-commons');
var events = require('events');
var ll = require('lillog');
module.exports = function () {

    var ret = {
        sock: null,
        uuid: stimpcommons.uuid(),
        parser: null,
        socksubscriptions: {},
        config: {
            autoack: true
        },
        msgbuffer: {},
        msgbufferlength: 0,
        eventemitter: new events.EventEmitter(),
        onconnected: function (msg) {
            ret.connected = true;
            ret.eventemitter.emit('connected', null, msg);
        },
        onreceipt: function (msg) {
            ret.removefrombuffer(msg);
        },
        onmessage: function (msg) {
            ret.eventemitter.emit('message', msg.body, msg);
            if (ret.config.autoack) {
                var ackmsg = stimpcommons.createmsg(stimpcommons.CMD_ACK);
                ackmsg.addheader('id', msg.headers['message-id']);
                ret.sock.write(ackmsg.torawmsg());
            }
        },
        init: function (sock) {
            ret.sock = sock;
            ret.parser = stimpcommons.createparser(sock);
            ret.parser.on(stimpcommons.CMD_CONNECTED, this.onconnected);
            ret.parser.on(stimpcommons.CMD_MESSAGE, this.onmessage);
            ret.parser.on(stimpcommons.CMD_RECEIPT, this.onreceipt);
        },
        removefrombuffer: function (msg) {
            if (ret.msgbuffer[msg.headers['receipt-id']]) {
                delete ret.msgbuffer['receipt-id'];
                ret.msgbufferlength--;
                ret.eventemitter.emit(msg.headers['receipt-id'], null, msg);
            } else {
                ret.eventemitter.emit('error', Error('Msg:' + JSON.stringify(msg) + 'not supposed to be in client buffer'), null);
            }
        },
        addtobuffer: function (msg) {
            ret.msgbuffer[msg.headers['receipt']] = msg;
            ret.msgbufferlength++;
        },

        connect: function (host, port, config, cb) {
            ret.config = config;
            if (!ret.config) ret.config = {};
            if (!ret.config.timeout)ret.config.timeout = 5000;

            ret.init(new net.Socket());
            ret.parser = stimpcommons.createparser(ret.sock);

            ret.sock.on('close', function (haderror) {
                if (haderror) {
                    ll.error('Socket closed w error');
                } else {
                    ll.error('Socket closed');
                }
            });
            ret.sock.on('error', function (err) {
                ll.error('Socket Error!!!');
                ll.error(err);
            });
            ret.sock.connect(port, host);

            var msg = stimpcommons.createmsg(stimpcommons.CMD_STOMP);
            msg.addheader('accept-version', '1.2');

            ret.eventemitter.once('connected', cb);
            ret.sock.write(msg.torawmsg());
            setTimeout(function () {
                if (!ret.connected) {
                    throw new Error('Timeout on connecting');
                }
            }, ret.config.timeout)
        },
        disconnect: function (cb) {
            if (ret.msgbuffer.length > 0) {
                throw new Error('There are msgs pending to process:' + JSON.stringify(ret.msgbuffer));
            } else {
                var msg = stimpcommons.createmsg(stimpcommons.CMD_DISCONNECT);
                ret.addtobuffer(msg);
                if (cb) {
                    ret.once(msg.headers.receipt, cb);
                }
                ret.sock.write(msg.torawmsg());
            }

        },
        subscribe: function (dest, options, cb) {
            var msg = stimpcommons.createmsg(stimpcommons.CMD_SUBSCRIBE);
            msg.addheader('destination', dest);
            ret.addtobuffer(msg);
            if (cb) {
                ret.eventemitter.once(msg.headers['receipt'], cb);
            }
            ret.sock.write(msg.torawmsg());
        },
        unsubscribe: function (dest, cb) {
            var msg = stimpcommons.createmsg(stimpcommons.CMD_SUBSCRIBE);
            msg.addheader('destination', dest);
            ret.addtobuffer(msg);
            if (cb) {
                ret.eventemitter.once(msg.headers['receipt'], cb);
            }
            ret.sock.write(msg.torawmsg());
        },
        on: function (event, listener) {
            ret.eventemitter.on(event, listener)
        },
        send: function (dest, body, options, cb) {
            var msg = stimpcommons.createmsg(stimpcommons.CMD_SEND);
            msg.addheader('destination', dest);
            if (options && options.contenttype) {
                msg.addheader('content-type', options.contenttype);
            } else {
                msg.addheader('content-type', 'text/plain');
            }
            msg.body = body;
            ret.addtobuffer(msg);
            msg.addheader('content-length', msg.body.length);
            //ll.debug(JSON.stringify(msg));

            if (cb) {
                ret.once(msg.headers['receipt'], cb);
            }


            ret.sock.write(msg.torawmsg());
        },
        sendack: function (msg, cb) {
            var ackmsg = stimpcommons.createmsg(stimpcommons.CMD_ACK);
            ackmsg.addheader('id', msg.headers['message-id']);
            ret.sock.write(ackmsg.torawmsg(),cb);
        },
        sendnack: function (msg, cb) {
            var nackmsg = stimpcommons.createmsg(stimpcommons.CMD_NACK);
            nackmsg.addheader('id', msg.headers['message-id']);
            ret.sock.write(nackmsg.torawmsg(), cb);
        },

        //TODO IMPLEMENT THESE METHODS
        starttx: function () {
        },
        committx: function () {
        },
        rollbacktx: function () {
        }
    };
    return ret;
};

