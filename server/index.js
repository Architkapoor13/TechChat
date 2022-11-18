require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const harperSaveMessage = require('./services/harper-save-message');
const harperGetMessages = require('./services/harper-get-message');
app.use(cors()); // Add cors middleware

const server = http.createServer(app);

const io = new Server( server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
})

const CHAT_BOT = 'ChatBot'

let chatRoom = '';
let allUsers = [];
io.on('connection', (socket) => {
    console.log(`User connected ${socket.id}`)

    socket.on('join_room', (data) => {
        console.log("inside joining room event!")
        const {username, room} = data
        console.log("username:", username, "room:", room)
        socket.join(room)

        harperGetMessages(room)
        .then((last100Messages) => {
            console.log(last100Messages[0])
        })
        .catch((err) => console.log(err))
        
        let timeStamp = Date.now();
        console.log("room joined!", timeStamp)
        socket.to(room).emit('receive_message', {
            text: `${username} has joined the chat room`,
            username: CHAT_BOT,
            timeStamp
        })
        console.log("revievemessage event sent!")
        socket.emit('receive_message', {
            text: `Welcome ${username}`,
            username: CHAT_BOT,
            timeStamp
        })
        
        chatRoom = room;
        allUsers.push({id: socket.id, username, room})
        currentChatUsers = allUsers.filter((user) => user.room === chatRoom);
        socket.to(room).emit('chatroom_users', currentChatUsers.map(value=>value.username));
        socket.emit('chatroom_users', currentChatUsers.map(value=>value.username));
    })

    socket.on('send_message', (data) => {
        // socket.to(chatRoom).emit('receive_message', data);
        // socket.emit('receive_message', data);
        const {text, username, room, timeStamp} = data
        io.in(chatRoom).emit('send_message', data);
        harperSaveMessage(text, username, room, timeStamp)
        .then((response) => console.log(response))
        .catch((err)=>console.log(err))
    })
})

server.listen(4000, () => 'Server is running on port 4000');