const PORT = 8888;
const http = require('http');
const app = require('./app');
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`Listening on ===> ${PORT}}`);
});



// Web-Socket-Server ------------------------------------------------
// Das Tool das hier verwendet wird heisst: "WebSocket-Node"
// ws oder sock.js wäre auch möglich denke ich 
const webSocketsServerPort = PORT;
const webSocketServer = require('websocket').server;
const http = require('http');
// Spinning the http server and the websocket server.
const server = http.createServer();
server.listen(webSocketsServerPort);
const wsServer = new webSocketServer({
  httpServer: server
});

wsServer.on('request', function(request) {
    var userID = getUniqueID();
    console.log((new Date()) + ' Recieved a new connection from origin ' + request.origin + '.');
    // You can rewrite this part of the code to accept only the requests from allowed origin
    const connection = request.accept(null, request.origin);
    clients[userID] = connection;
    console.log('connected: ' + userID + ' in ' + Object.getOwnPropertyNames(clients));
    connection.on('message', function(message) {
      if (message.type === 'utf8') {
        const dataFromClient = JSON.parse(message.utf8Data);
        const json = { type: dataFromClient.type };
        if (dataFromClient.type === typesDef.USER_EVENT) {
          users[userID] = dataFromClient;
          userActivity.push(`${dataFromClient.username} joined to edit the document`);
          json.data = { users, userActivity };
        } else if (dataFromClient.type === typesDef.CONTENT_CHANGE) {
          editorContent = dataFromClient.content;
          json.data = { editorContent, userActivity };
        }
        sendMessage(JSON.stringify(json));
      }
    });
    // user disconnected
    connection.on('close', function(connection) {
      console.log((new Date()) + " Peer " + userID + " disconnected.");
      const json = { type: typesDef.USER_EVENT };
      userActivity.push(`${users[userID].username} left the document`);
      json.data = { users, userActivity };
      delete clients[userID];
      delete users[userID];
      sendMessage(JSON.stringify(json));
    });
});
// End Web-Socket-Server --------------------------------------------
