/**
 * Created by ChenChao on 2017/2/16.
 */

var https = require('https');
var fs = require('fs');
var exec = require('child_process').exec;
var WebSocket = require('ws');
var express = require('express');
var config = require('./config');
var wsHandler = require('./wss');
var port = config.httpsPort;
var app = express();

app.get('/.well-known/pki-validation/fileauth.htm', function (req, res) {
    res.setHeader('content-type', 'text/plain');
    res.send(fs.readFileSync('./fileauth.htm'));
});

app.post('/push-wxSocketApp', function (req, res) {
    exec('sh ./restart.sh', function(err, stdOut, stdErr){
        res.setHeader('content-type', 'text/plain');
        var msg = 'Restart OK!';
        if(err) {
            msg = 'Restart error: ' + stdErr;
        }
        console.log({msg: msg, timeStamp: new Date()});
        res.send({msg: msg, timeStamp: new Date()});
    });
});

app.use(function (req, res) {
    res.send({ msg: "这是 shaman 的 socket 服务器！" , timeStamp: new Date()});
});

var options = {
    key: fs.readFileSync(config.key)
    , cert: fs.readFileSync(config.cert)
    //, passphrase: '1234'
};
var server = https.createServer(options, app).listen(port, function listening() {
    console.log('Listening on %d', server.address().port);
});
var wss = new WebSocket.Server( {
    server: server,
    verifyClient: function (info) {
        //console.log('收到来自 ' + info.origin + ' 的连接...');
        //todo 添加验证规则 1232132
        return true;
    }
} );

//定义消息广播
wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

wss.on('connection', function connection(socket) {
    wsHandler.init(WebSocket, wss, socket);
});