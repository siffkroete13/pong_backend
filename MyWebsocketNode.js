const MSG = require('./utils/actions');

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

const sendMessage = (msg, conn, msgType = 'utf8') => {
    try {
        if(msgType === 'utf8') {
            const json = JSON.stringify(msg);
            conn.connection.sendUTF(json);
        } else if(msgType === 'binary') {
            conn.connection.sendBytes(msg);
        } else {
            throw('Unbekannter Nachrichten-Typ! Sollte "utf8" oder "binary" sein!');
        }
    } catch(err) {
        console.error('Fehler beim Senden der Nachricht!, err: ', err,
         ', conn.username: ', conn.username);
    }
}


class MyWebsocketNode {

    constructor(httpServer) {
        this.httpServer = httpServer;
        this.wsServer = null;
        this.max_players = 2;
        this.connections = [];

        this.start = this.start.bind(this);
        this.handleRequest = this.handleRequest.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.handleClose = this.handleClose.bind(this);
    }

    getConnectionIndex(_connections, conn) {
        let connIdx = MSG.CONN_INDEX_ERR;
        for(let i = 0; i < _connections.length; ++i) {
            if(_connections[i].connection === conn) {
                connIdx = _connections[i].connectionIndex; // Sollte hier gleich sein wie i
                // CONN_INDEX_ERR=-1 heisst Fehler. Wenn i nicht gleich dem connectionIndex, stimmt etwas nicht
                // connectionIndex sollte immer gleich der Position (des connections Objekts) im connectios Array sein.
                if(connIdx !== i) connIdx = MSG.CONN_INDEX_ERR; 
                break;
            }
        }
        return connIdx;
    }

    getOtherConnectionIndex(_connections, conn) {
        let connIdx = MSG.CONN_INDEX_ERR;
        for(let i = 0; i < _connections.length; ++i) {
            if(_connections[i].connection !== conn) {
                connIdx = _connections[i].connectionIndex; // Sollte hier gleich sein wie i
                // CONN_INDEX_ERR=-1 heisst Fehler. Wenn i nicht gleich dem connectionIndex, stimmt etwas nicht
                // connectionIndex sollte immer gleich der Position (des connections Objekts) im connectios Array sein.
                if(connIdx !== i) connIdx = MSG.CONN_INDEX_ERR; 
                break;
            }
        }
        return connIdx;
    }

    getUserName(_connections, connIdx) {
        // console.log('_connections: ', _connections);
        if(_connections[connIdx]) return _connections[connIdx].username;
        else return '';
    }

    // Spinning the http server and the websocket server. Kann man vielleicht verschiedene Ports benutzen?
    start() {
        const _this = this;
        this.wsServer = new webSocketServer({
            httpServer: this.httpServer
        });

        // this.wsServer.on('connect', (conn) => {
        //     console.log('connect aufgerufen in MyWebsocketNode.js, conn: ', conn);
        // });
        
        this.wsServer.on('request', (request) => {
            console.log('on request');
            _this.handleRequest(request); 
        });
    }

    handleRequest(request) {
        const _this = this;
        if(!originIsAllowed(request.origin) // Ist origin nicht erlaubt?
        || this.connections.length >= this.max_players) { // Sind es zu viele Mitspieler?
            // Dann Verbindung ablehnen.
            request.reject();
            // console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
            return;
        }
        
        const connection = request.accept(null, request.origin);

        if(this.connections.length < this.max_players) {
                // In dieses Objekt kommen alle Daten des Users rein, so kann man die User unterscheiden
                const connObj = {connection: connection, connectionIndex: 0, username: ''};
                connObj.connectionIndex = this.connections.length;
                this.connections.push(connObj); 
                console.log('User Nr: '+connObj.connectionIndex+' ist verbunden.');
        } else {
            console.error('Zu viele Verbindungen, es sind nur maximal ' + this.max_players+' erlaubt!');
            console.error('Anzahl Verbindungen gespeichert: ' + this.connections.length);

        }
    
        connection.on('message', (message) => {
            console.log('on message');
            _this.handleMessage(message, connection);
        });

        connection.on('close', (reasonCode, description) => {
            _this.handleClose(connection, reasonCode, description);
        });
    }

    handleMessage(message, currentConnection) {
        const connectionIndex = this.getConnectionIndex(this.connections, currentConnection);
        console.log('in handleMessage: connectionIndex: ' + connectionIndex);
        if(connectionIndex === -1) {
            console.log('Der this.connections index stimmt nicht in connection.on("message"...)');
            return;
        }
        const otherConnectionIndex = this.getOtherConnectionIndex(this.connections, currentConnection);
        console.log('in handleMessage: connectionIndex: ' + connectionIndex);
        if(otherConnectionIndex === -1) {
            console.log('Der this.connections index stimmt nicht in connection.on("message"...)');
            return;
        }
        
        if(this.connections.length < 2) {
            console.log('Das Spiel kann erst anfangen, wenn beide Spieler verbunden sind.');
            return; // Spiel kann erst beginnen wenn alle Spieler (hier 2) angemeldet sind
        }

        if(message.type === 'utf8') {
            console.log('Nachricht ist vom Typ utf8');
            this.handleUtf8Message(message, currentConnection);
        } else if (message.type === 'binary') {
            console.log('Nachricht ist vom Typ binary');
            this.handleBinaryMessage(message, currentConnection);
        }
    }

    handleUtf8Message(message, currentConnection) {
        const connectionIndex = this.getConnectionIndex(this.connections, currentConnection);
        const otherConnectionIndex = this.getOtherConnectionIndex(this.connections, currentConnection);
        const msg = JSON.parse(message.utf8Data);
        const from = msg.payload.from; // Absender
        const to = this.getUserName(this.connections, otherConnectionIndex); // Empfänger
        console.log('from: ' + from + ', to: ' + to ,
        ', connectionIndex: ' + connectionIndex, 'otherIndex: ' + otherConnectionIndex);

         // Wenn noch kein Name, Name zuweisen
         if(!this.connections[connectionIndex].username) this.connections[connectionIndex].username = from;

        switch(msg.type) {
            // Spiel-Kontroll-Nachricht erhalten vom Client
            case MSG.SEND_GAME_CONTROL_MSG: // Send heisst hier vom Client bekommen, aus Client-Sicht ist es Send
                 // Denn Typ der Nachricht umkehren und an den anderen User senden
                 msg.type = MSG.RECEIVE_GAME_CONTROL_MSG;
                 msg.payload.to = from; // Absender 
                 msg.payload.from = to;     // und empfänger tauschen
                 // Nachricht an den anderen Spieler weiter leiten
                console.log('Nachricht bevor sie verschickt wird: ', msg);
                this.sendBroadcastMessage(msg, currentConnection, 'utf8');
            break;
            case MSG.SEND_CHAT_MSG:
                // Denn Typ der Nachricht umkehren und an den anderen User senden
                msg.type = MSG.RECEIVE_CHAT_MSG;
                msg.payload.to = from; // Absender 
                msg.payload.from = to;     // und empfänger tauschen
                // Nachricht an den anderen Spieler weiter leiten
                console.log('Nachricht bevor sie verschickt wird: ', msg);
                this.sendBroadcastMessage(msg, currentConnection, 'utf8');
            break;
            default:
                console.error('Unbekannte Nachricht in MyWebsocketNode::handleMessage(), msg: ', msg);
        }
    }

    handleBinaryMessage(message, currentConnection) {
        const msg = message.binaryData;
        console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
        // Index vom einen Spieler an den anderen weiter leiten
       this.sendBroadcastMessage(msg, currentConnection, 'binary');
    }

    sendBroadcastMessage(message, currentConnection, messageType) {
        const otherConnectionIndex = this.getOtherConnectionIndex(this.connections, currentConnection);
        sendMessage(message, this.connections[otherConnectionIndex], messageType);
    }
        
    handleClose(currentConnection, reasonCode, description) {
        const index = this.getConnectionIndex(this.connections, currentConnection);
        console.log('handleClose(), index von currentConnection: ' + index);
        if(index === MSG.CONN_INDEX_ERR) {
            console.log('Der this.connections index stimmt nicht in connection.on("close"...)');
        } else {
            this.connections.splice(index, 1); // Element entfernen an Position index. 1 steht für Anz. Elem. enfernen
        }
        console.log(' Peer ' + currentConnection.remoteAddress + ' disconnected, description: ' + description,
            'reasonCode: ' + reasonCode);

        setTimeout(this.start, 400); // Versuchen wieder zu verbinden
    }
}
// End Web-Socket-Server --------------------------------------------------------------------------------


module.exports = MyWebsocketNode;
