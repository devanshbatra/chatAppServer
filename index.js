const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const cors = require("cors");
const {addUser, removeUser, getUser, getUsersInRoom} = require("./users.js");

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const io = socketio (server, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.get("/", (req, res)=>{
    res.send("server up and running");
});
app.use(cors());


io.on("connection", socket=>{
    console.log("we have a new connection");

    socket.on("user-joined", ({name, room}, callback)=>{
        const {error, user} = addUser({id: socket.id, name, room});
        if(error) return callback(error);

        socket.emit("message", {user: "admin", text: `Dear ${user.name}, Welcome to the room!!`});
        socket.broadcast.to(user.room).emit("message", {user: 'admin', text: `${user.name} has joined!`});
        const usersInRoom = getUsersInRoom(user.room);
        socket.emit("roomdata", usersInRoom);
        
        socket.join(user.room);
        
        callback();
    });
    
    socket.on("sendMessage", (message, callback)=>{
        const user = getUser(socket.id);
        io.to(user.room).emit("message", {user: user.name, text: message});
        const usersInRoom = getUsersInRoom(user.room);
        io.to(user.room).emit("roomdata", usersInRoom);
        callback();
    });

    socket.on("disconnection",()=>{
        console.log("user has left");
        const user = removeUser(socket.id);
        if(user){
            io.to(user.room).emit("message", {user: "admin", text: `${user.name} has left the room!`});
        }
    });
    socket.on("disconnect",()=>{
        console.log("user has left");
        const user = removeUser(socket.id);
        if(user){
            io.to(user.room).emit("message", {user: "admin", text: `${user.name} has left the room!`});
        }
    });
});

server.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));