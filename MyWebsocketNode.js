// Web-Socket-Server ------------------------------------------------------------------------------------
// Das Tool das hier verwendet wird heisst: "WebSocket-Node"
// ws oder sock.js wäre auch möglich denke ich. 
// Und natürlich io-sockets wäre das Beste aber eventuel etwas langsamer, dafür mit fallback.
const webSocketServer = require('websocket').server;
const util = require('./utils/util');

const allowedOrigin = ['http://localhost:3000'];

function originIsAllowed(_origin) {
    return util.in_array(_origin, allowedOrigin);
}

const connections = [];
const user_names = ['',''];

class MyWebsocketNode {
    constructor(httpServer) {
        this.httpServer = httpServer;
        this.wsServer = null
    }

    // Spinning the http server and the websocket server. Kann man vielleicht verschiedene Ports benutzen?
    // Weiss nicht
    start() {
        this.wsServer = new webSocketServer({
            httpServer: this.httpServer
         });

         this.wsServer.on('connect', (e) => {
            console.log('connect aufgerufen');
        });
        
        this.wsServer.on('request', (request) => {
            if(!originIsAllowed(request.origin) // Ist origin nicht erlaubt?
            || connections.length >= 2) { // Sind es zu viele Mitspieler?
                // Dann Verbindung ablehnen.
                request.reject();
                console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.')
                return;
            } 
            
            const connection = request.accept(null, request.origin);
            // Index vom Spiler der diese Nachricht geschickt hat
            const user_index = connections.push(connection) - 1;
             // Index vom anderen Spieler
            const other_user_index = user_index === 0 ? 1 : 0; 
            
            console.log('Verbunden! Spieler index: ', user_index);
            console.log('Verbunden! Der andere Spieler hat index: ', other_user_index);
        
            connection.on('message', (message) => {
                if(message.type === 'utf8') {
                    const data = JSON.parse(message.utf8Data);
                    const user_name = data.payload.name;
                    console.log('message ===> user_index: '+user_index+', utf8 message: data: ', data,
                    'user_name: '+user_name);
        
                    if(!user_names[user_index]) user_names[user_index] = user_name;
                    console.log('message ===> my user_index: '+user_index+', user names: ', user_names);
                } else if (message.type === 'binary') {
                    console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
                    if(connections.length < 2) return; // Spiel kann erst beginnen wenn alle Spieler (hier 2) angemeldet sind
                    
                   
                    // Index vom einen Spieler an den anderen weiter leiten
                    connections[destIndex].sendBytes(message.binaryData);
                }
            });
        
            connection.on('close', (reasonCode, description) => {
                const index = connections.indexOf(this)
                connections.splice(index, 1);
                console.log(' Peer ' + connection.remoteAddress + ' disconnected, description: ', description);
            })
        });    
    }
}
// End Web-Socket-Server --------------------------------------------------------------------------------


module.exports = MyWebsocketNode;
