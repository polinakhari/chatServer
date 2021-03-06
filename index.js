const express = require('express')
const socketio = require('socket.io')
const http = require('http')
const cors = require('cors')
const moment = require('moment')

const PORT = process.env.PORT || 5000

const router = require('./router')

const app = express();
const server = http.createServer(app)
const {addUser, removeUser, getUser, getUsersInRoom} = require("./users")
const io = socketio(server)

app.use(router);
app.use(cors())

io.on('connection', (socket) => {
    socket.on('join', ({name, room}, callback) => {
        const {error, user} = addUser({id:socket.id, name, room});
        
        if (error) callback(error);
        
        socket.join(user.room);        

        socket.emit('message', {user: "admin", text: `${user.name}, welcome to the room ${user.room}`, time: moment().format('HH:mm') })
        socket.broadcast.to(user.room).emit("message", {user : "admin", text: `${user.name} has joined!`, time: moment().format('HH:mm')})
          
        io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)})

        callback();
    })

    socket.on("sendMessage", (message, callback) => {        
        const user = getUser(socket.id)
        io.to(user.room).emit("message", {user: user.name, text: message, time: moment().format('HH:mm')})
        io.to(user.room).emit("roomData", {room: user.room,  users: getUsersInRoom(user.room)})
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if(user) {
            io.to(user.room).emit("message", {user: "admin", text: `${user.name} has left`, time: moment().format('HHH:mm')}, )
        }
    } )
})

server.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`))