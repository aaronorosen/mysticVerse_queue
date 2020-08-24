var express = require('express');
const path = require('path');


var WebSocket = require('ws')
var app = express();


app.use(express.static(path.join(__dirname, '../build')));
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

var server = new WebSocket.Server({server : app.listen(3333)});

// app.use(express.static('public'));

console.log('socket server is running on port 3333');

const users = [];
const maxTime =  60000;
const userList = [];
const activeUserList = [];
const activeUsers = [{videoUrl : "https://en.wikipedia.org/wiki/Leprus_intermedius",
                          user : null,
                          connection : null,
                          time : null},
                        {videoUrl : "https://en.wikipedia.org/wiki/Bishkek-1_railway_station",
                         user : null,
                         connection : null,
                         time : null},
                        {videoUrl : "https://en.wikipedia.org/wiki/Schefflera_pueckleri",
                         user : null,
                         connection : null,
                         time : null}];


server.on('connection', (socket) => {
    
    socket.on('message', message => {
      users.push({
                  user: message,
                  connection : socket
                })
      userList.push(message);
    });
    setInterval(() => {  
        console.log(userList);
                for(var i = 0; i < activeUsers.length; i++) {
                    if(activeUsers[i].user === null) {
                        if(users.length > 0) {
                        activeUsers[i].user = users[0].user;
                        activeUserList.push(userList[0]);
                        activeUsers[i].connection = users[0].connection;
                        users.shift();
                        userList.shift();
                        activeUsers[i].time = new Date();
                        activeUsers[i].connection.send('{"videoUrl":' + JSON.stringify(activeUsers[i].videoUrl) + '}');
                        }
                    } else if (checkTimeOut(activeUsers[i])) {
                        activeUsers[i].user = null;
                        activeUserList.shift();
                        activeUsers[i].connection.send("Times Up!")
                    }
                }
            
                socket.send('{ "users":' + JSON.stringify(userList) + ',"activeUsers":' + JSON.stringify(activeUserList) + '}');
             
                
            }, 1000)

            function checkTimeOut (user) {
                        const currentTime = new Date()
                        if(currentTime - user.time >= maxTime) {
                            return true;
                        } else {
                            return false;
                        }}
  });



