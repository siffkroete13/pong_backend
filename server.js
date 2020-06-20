const PORT = 8888;
const webSocketsServerPort = PORT;
const http = require('http');
const app = require('./app');
const server = http.createServer(app);
const util = require('./utils/util');




/*
server.listen(PORT, () => {
    console.log(`Listening on ===> ${PORT}}`);
});
*/


// Web-Socket-Server ------------------------------------------------
// Das Tool das hier verwendet wird heisst: "WebSocket-Node"
// ws oder sock.js wäre auch möglich denke ich. 
// Und natürlich io-sockets wäre das Beste aber eventuel etwas langsamer, dafür mit fallback.


server.listen(webSocketsServerPort, () => {
    console.log(`Websocket listening on ===> ${webSocketsServerPort}}`);
});

// Spinning the http server and the websocket server. Kann man vielleicht verschiedene Ports benutzen?
// Weiss nicht
const webSocketServer = require('websocket').server;
const wsServer = new webSocketServer({
  httpServer: server
});


const connections = new Array();

const allowedOrigin = ['http://localhost:3000'];

function originIsAllowed(_origin) {
    return util.in_array(_origin, allowedOrigin);
}


wsServer.on('connect', (e) => {
    console.log('connect aufgerufen');
});


wsServer.on('request', (request) => {
    if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.')
        return;
    }
    var connection = request.accept(null, request.origin)
    connections.push(connection);
    connection.on('message', (message) => {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            connection.sendUTF(message.utf8Data);
        } else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes')
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', (reasonCode, description) => {
        const index = connections.indexOf(this)
        connections.splice(index, 1);
        console.log(' Peer ' + connection.remoteAddress + ' disconnected, description: ', description);
    })
});

// End Web-Socket-Server --------------------------------------------
