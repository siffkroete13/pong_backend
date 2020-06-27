const PORT = 8888;
const webSocketsServerPort = PORT;
const http = require('http');
const app = require('./app');
// const server = http.createServer(app); 
// var io = require('socket.io')(http); // vielleicht sollte man vorcher das machen: var http = require('http').Server(app);
const server = http.createServer();
const MyWebSocketNode = require('./MyWebsocketNode');
/*
server.listen(PORT, () => {
    console.log(`Listening on ===> ${PORT}}`);
});
*/

server.listen(webSocketsServerPort, () => {
    console.log(`Websocket listening on ===> ${webSocketsServerPort}}`);
});

// Web-Socket-Server ------------------------------------------------------------------------------------
// Das Tool das hier verwendet wird heisst: "WebSocket-Node"
// ws oder sock.js wäre auch möglich denke ich. 
// Und natürlich io-sockets wäre das Beste aber eventuel etwas langsamer, dafür mit fallback.
const WebsocketNode = new MyWebSocketNode(server).start(); // Hiermit startet der Websocket-Server und hört auf messages
// End Web-Socket-Server --------------------------------------------------------------------------------




/*
// IO-Section###############################################################################
const MAX_PEERS_IN_ROOM = 2;
const NAMESPACE_OF_THIS_SOCKET = '/'; // Hier nehmen wir einfach den default-namespac
var peersInRoom = 0;
var room = '';
io.on('connection', function(socket) {
    socket.emit('setUser', peerUser);

    socket.on('chatMessage', function(data) {
        console.log("chat message: ", data);
        // Nachricht weiterleiten an alle in diesem Room ausser dem Sender (logisch)
        socket.to(room).emit('chatMessage', data);
    });

    socket.on('createOrJoinRoom', function(_room) {
        room = _room;
         // Anzahl Peers im Raum ermitteln
        if(io.nsps[NAMESPACE_OF_THIS_SOCKET].adapter.rooms[room]) {
            peersInRoom = io.nsps[NAMESPACE_OF_THIS_SOCKET].adapter.rooms[room].length;
        } else {
            peersInRoom = 0;
        }

        if(peersInRoom === MAX_PEERS_IN_ROOM) {
            socket.emit('message', 'Raum ist voll!' + parseInt(peersInRoom + 1), room);
            return;
        }
        
        if(peersInRoom === 0) {
            // Peer informieren, dass er den Room als erstes betreten bzw. erstellt hat
            socket.join(room);
            peersInRoom++;
            socket.emit('roomCreated', room);
            console.log('peersInRoom: ' + peersInRoom);
        } else if(peersInRoom === 1) {
            io.sockets.in(room).emit('join', room);
            socket.join(room);
            peersInRoom++;
            socket.emit('joined', room);
            console.log('peersInRoom: ' + peersInRoom);
        }
    });

    socket.on('message', function(msg) {
        console.log('socket.on(messsage) : ', msg);
    });

    socket.on('broadcast', function(data) {
        console.log('Broadcast-Nachricht von Server aufgefangen');
    });
});
// End IO-Section###########################################################################
*/
