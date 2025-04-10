const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-room", (room) => {
        const clientsInRoom = io.sockets.adapter.rooms.get(room);
        const numClients = clientsInRoom ? clientsInRoom.size : 0;

        socket.join(room);
        console.log(`Player joined room: ${room} (${numClients + 1} players)`);

        // Assign roles BEFORE adding the new socket
        if (numClients === 0) {
            socket.emit("player-assigned", "X");
        } else if (numClients === 1) {
            socket.emit("player-assigned", "O");
            io.to(room).emit("start-game");
        } else {
            socket.emit("room-full");
            return;
        }
    });

    socket.on("move", (data) => {
        socket.to(data.room).emit("move", data);
    });

    socket.on("request-new-game", (room) => {
        io.to(room).emit("start-new-game-countdown");
    });
        
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

http.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
