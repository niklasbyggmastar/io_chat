var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var users_online = [];
var port = process.env.PORT || 8000;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
//------------------------------------------
class User {
  constructor(username, socket_id) {
    this.username = username;
    this.socket_id = socket_id;
  }
  getUsername(){
    return this.username;
  }
  setUsername(username){
    this.username = username;
  }
  setSocketID(socket_id){
    this.socket_id = socket_id;
  }
}
//------------------------------------------
io.on('connection', function(socket){
  var user = new User();
  socket.emit("get_all_users", users_online);

  socket.on('disconnect', function(){
    if (typeof user.username !== "undefined") {
      socket.broadcast.emit("message", "~~~~~~ "+ user.getUsername() + " disconnected ~~~~~~");
    }
    var index = users_online.indexOf(user);
    if (index > -1) {
      users_online.splice(index, 1);
    }
    if (typeof user.username !== "undefined") {
      io.emit("user_left", users_online, user);
    }
    console.log("online: " + users_online.length);
  });

  socket.on('message', function(msg){
    socket.broadcast.emit('message', user.getUsername() + ": " + msg);
  });

  socket.on('private_message', function(msg, socket_id){
    socket.to(socket_id).emit("private_message", user.getUsername() + ": " + msg);
  });

  socket.on("private_message_agreement", function(socket_id){
    socket.to(socket_id).emit("private_start", user.getUsername(), socket.id);
  });

  socket.on('private_message_request', function(username, socket_id){
    socket.to(socket_id).emit("private_message_request", user.getUsername(), socket.id);
  });

  socket.on("check_username", function(name){
    var username_taken = false;
    for (var i = 0; i < users_online.length; i++) {
      if (users_online[i].username == name){
        username_taken = true;
        socket.emit("username_taken");
      }
    }
    if(username_taken == false){
      socket.emit("username_ok");
    }
  });

  socket.on("login", function(name){
    socket.broadcast.emit("message", "~~~~~~ " + name + " connected ~~~~~~");
    user.setUsername(name);
    user.setSocketID(socket.id);
    users_online.push(user);
    console.log("online: " + users_online.length);
    io.emit("users_online", users_online);
  });

  socket.on("typing", function(){
    socket.broadcast.emit("typing", user.getUsername() + " is typing...");
  });

  socket.on("typing_private", function(socket_id){
    socket.to(socket_id).emit("typing", user.getUsername() + " is typing...", socket.id);
  });
});

http.listen(port, function(){
  console.log('listening on *:8000');
});
