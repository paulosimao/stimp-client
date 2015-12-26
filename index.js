/**
 * Created by paulo.simao on 23/12/2015.
 */
var net = require('net');
var stimpcommons = require('stimp-commons');
var events = require('events');
var ll = require('lillog');
module.exports = function () {
    var ret = new events.EventEmitter();
    //ret.parser = stimpcommons.createparser();
    ret.msgbuffer = {};
    ret.msgbuffer.length = 0;
    ret.removefrombuffer = function (msg) {
        if (ret.msgbuffer[msg.headers['receipt-id']]) {
            delete ret.msgbuffer['receipt-id'];
            ret.msgbuffer.length--;
            ret.emit(msg.headers['receipt-id'], null, msg);
        } else {
            ret.emit('error', Error('Msg:' + JSON.stringify(msg) + 'not supposed to be in client buffer'), null);
        }
    };
    ret.addtobuffer = function (msg) {
        ret.msgbuffer[msg.headers['receipt']] = msg;
        ret.msgbuffer.length++;
    };

    ret.config = {};

    ret.onmsg = function (msg) {
        ll.debug(JSON.stringify(msg));
        switch (msg.cmd) {
            case stimpcommons.CMD_CONNECT:
                throw new Error('Client should not get a ' + msg.cmd + ' Frame');
                break;
            case stimpcommons.CMD_CONNECTED:
                ret.connected = true;
                ret.emit('connected', null, msg);

                break;
            case stimpcommons.CMD_SEND:
                break;
            case stimpcommons.CMD_SUBSCRIBE:
                throw new Error('Client should not get a ' + msg.cmd + ' Frame');
                break;
            case stimpcommons.CMD_UNSUBSCRIBE:
                throw new Error('Client should not get a ' + msg.cmd + ' Frame');
                break;
            case stimpcommons.CMD_ACK:
                throw new Error('Client should not get a ' + msg.cmd + ' Frame');
                break;
            case stimpcommons.CMD_NACK:
                throw new Error('Client should not get a ' + msg.cmd + ' Frame');
                break;
            case stimpcommons.CMD_BEGIN:
                throw new Error('Client should not get a ' + msg.cmd + ' Frame');
                break;
            case stimpcommons.CMD_COMMIT:
                throw new Error('Client should not get a ' + msg.cmd + ' Frame');
                break;
            case stimpcommons.CMD_ABORT:
                throw new Error('Client should not get a ' + msg.cmd + ' Frame');
                break;
            case stimpcommons.CMD_DISCONNECT:
                throw new Error('Client should not get a ' + msg.cmd + ' Frame');
                break;
            case stimpcommons.CMD_MESSAGE:
                ret.emit('message', msg.body, msg);
                var ackmsg = stimpcommons.createmsg(stimpcommons.CMD_ACK);
                ackmsg.addheader('id', msg.headers.receipt);
                ret.socket.write(ackmsg.torawmsg());
                break;
            case stimpcommons.CMD_RECEIPT:
                ret.removefrombuffer(msg);
                break;
            case stimpcommons.CMD_ERROR:
                break;
            default:
                break;

        }
    };
    ret.connect = function (host, port, config, cb) {
        ret.config = config;
        if (!ret.config) ret.config = {};
        if (!ret.config.timeout)ret.config.timeout = 5000;

        ret.socket = new net.Socket();
        ret.parser = stimpcommons.createparser(ret.socket);
        ret.parser.on('msg', ret.onmsg);


        ret.socket.on('close', function (haderror) {
            if (haderror) {
                ll.error('Socket closed w error');
            } else {
                ll.error('Socket closed');
            }
        });
        ret.socket.on('error', function (err) {
            ll.error('Socket Error!!!');
            ll.error(err);
        });
        ret.socket.connect(port, host);
        var msg = stimpcommons.createmsg(stimpcommons.CMD_STOMP);
        msg.addheader('accept-version', '1.2');

        ret.once('connected', cb);
        ret.socket.write(msg.torawmsg());
        setTimeout(function () {
            if (!ret.connected) {
                throw new Error('Timeout on connecting');
            }
        }, ret.config.timeout)
    };
    ret.disconnect = function (cb) {
        if (ret.msgbuffer.length > 0) {
            throw new Error('There are msgs pending to process:' + JSON.stringify(ret.msgbuffer));
        } else {
            var msg = stimpcommons.createmsg(stimpcommons.CMD_DISCONNECT);
            ret.addtobuffer(msg);
            if (cb) {
                ret.once(msg.headers.receipt, cb);
            }
            this.socket.write(msg.torawmsg());
        }

    };
    ret.subscribe = function (dest, options, cb) {
        var msg = stimpcommons.createmsg(stimpcommons.CMD_SUBSCRIBE);
        msg.addheader('destination', dest);
        ret.addtobuffer(msg);
        if (cb) {
            ret.once(msg.headers['receipt'], cb);
        }
        ret.socket.write(msg.torawmsg());
    };
    ret.unsubscribe = function (dest, cb) {
        var msg = stimpcommons.createmsg(stimpcommons.CMD_SUBSCRIBE);
        msg.addheader('destination', dest);
        ret.addtobuffer(msg);
        if (cb) {
            ret.once(msg.headers['receipt'], cb);
        }
        ret.socket.write(msg.torawmsg());
    };
    ret.send = function (dest, body, options, cb) {
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
        ll.debug(JSON.stringify(msg));

        if (cb) {
            ret.once(msg.headers['receipt'], cb);
        }


        ret.socket.write(msg.torawmsg());
    };
    ret.starttx = function () {
    };
    ret.committx = function () {
    };
    ret.rollbacktx = function () {
    };


    return ret;
};

