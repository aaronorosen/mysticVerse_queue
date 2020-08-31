var express = require('express');
var WebSocket = require('ws')
var app = express();
var server = new WebSocket.Server({server : app.listen(3333)});


app.use(express.static('client'));

console.log('socket server is running on port 3333');

var users = [];
var queue_slots = []

// time in seconds
const maxTime =  1200;
const userList = [];
const activeUserList = [];
var socket_list = []
var queue_slots = 20;
var activeUsers = populate_active_users()

function populate_active_users() {
    var setup_queue = []
    for (var i = 0; i < queue_slots; i++) {
        setup_queue.push({
            videoUrl : 'placeholder1',
            user : null,
            name: null,
            pic: null,
            connection : null,
            time : null,
        })
    }
    return setup_queue
}


server.on('connection', (socket) => {
    socket.on('message', message => {
        var data = (JSON.parse(message))
        console.log(data)
        if (data.alive) {
            console.log("ALIVE")
            socket.last_heard = new Date()
            return
        }
        socket.last_heard = new Date()
        users.push({
            user: data.name,
            pic: data.pic,
            name: data.name,
            connection : socket
        })
        socket_list.push(socket)
    });
});

function get_queue_stats() {

    var active_users = []
    var queued_users = []
    for (var user of users) {
        queued_users.push({'name': user.name, 'pic': user.pic})
    }

    for(var i = 0; i < activeUsers.length; i++) {
        if(activeUsers[i].user != null) {
            active_users.push({'name': activeUsers[i].name,
                               'time_left': (maxTime * 1000) - (new Date() - activeUsers[i].time),
                               'pic': activeUsers[i].pic})
        }
    }
    return {"queued_users": queued_users,
            "active_users": active_users}
}


setInterval(function() {
    var stats = get_queue_stats()
    for (var sock of socket_list) {
        sock.send(
            JSON.stringify({"command": "queue_info",
                            "active_users": JSON.stringify(stats.active_users),
                            "queued_users": JSON.stringify(stats.queued_users) }))
    }
}, 2000)

setInterval(function() {
    var stats = get_queue_stats()

    console.log("Users in queue " + stats.queued_users.length +
                " active " + stats.active_users.length);
    for(var i = 0; i < activeUsers.length; i++) {
        // there is an active slot
        if(activeUsers[i].user === null) {
            if(users.length > 0) {
                // copy user into active_users
                activeUsers[i].user = users[0].user;
                activeUsers[i].name = users[0].name;
                activeUsers[i].pic = users[0].pic;
                activeUserList.push(userList[0]);
                activeUsers[i].connection = users[0].connection;

                // remove user
                users.shift();

                activeUsers[i].time = new Date();
                console.log("GO live")
                activeUsers[i].connection.send(
                    JSON.stringify({'command': 'go_live'}))
            }
        }
        if (checkTimeOut(activeUsers[i])) {
            activeUsers[i].user = null;
            console.log("GO expired")
            //activeUserList.shift();
            activeUsers[i].connection.send(
                JSON.stringify({"command": "expired"}))
            activeUsers[i].connection = null;
        }
    }

}, 1000)


function checkTimeOut (user) {
    if (user.connection === null) return false
    const currentTime = new Date()
    console.log(user.name + " active for - " + (currentTime - user.time))
    console.log(currentTime - user.connection.last_heard)

    if(currentTime - user.connection.last_heard >= 10000) {
        console.log("SOCKET IS NOT ALIVEEEE")
        return true
    }

    if(currentTime - user.time >= maxTime * 1000) {
        //console.log("Expired")
        return true;
    } else {
        //console.log("not Expired")
        return false;
    }
}
