const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect("mongodb://localhost:27017/bookingSystem", {
  
});

const queueSchema = new mongoose.Schema({
    username: String,
    joinedAt: { type: Date, default: Date.now },
});
const Queue = mongoose.model("Queue", queueSchema);

app.use(express.json());
let isBooking = false;

app.post("/api/queue", async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ message: "Username is required" });
    }

    // If someone is already booking, show "wait" message
    if (isBooking) {
        // Emit "wait" message to the client
        io.emit("bookingWait", { message: "Someone is booking, please wait" });

    setTimeout(() => {
        isBooking = false;
    }, 2000);
}

    isBooking = true;

    const newQueueEntry = new Queue({ username });
    await newQueueEntry.save();

    const updatedQueue = await Queue.find().sort("joinedAt");
    io.emit("queueUpdate", updatedQueue);

    return res.status(201).json({ message: "User added to queue", queue: updatedQueue });
});

app.post('/api/dequeue', async (req, res) => {
    try {
        await Queue.findOneAndDelete({}, { sort: { joinedAt: 1 } });
        const updatedQueue = await Queue.find().sort("joinedAt");
        res.json({ message: "Processed the next fan", queue: updatedQueue });
        io.emit('queueUpdate', updatedQueue);
    } catch (error) {
        console.error('Error processing next fan:', error);
        res.status(500).json({ message: "Error processing the next fan" });
    }
});

app.get("/api/queue", async (req, res) => {
    const updatedQueue = await Queue.find().sort("joinedAt");
    res.json(updatedQueue);
});

io.on("connection", (socket) => {
    console.log("New user connected");

    (async () => {
        const updatedQueue = await Queue.find().sort("joinedAt");
        socket.emit("queueUpdate", updatedQueue);
    })();

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

(async () => {
    await Queue.deleteMany({});
    console.log("Queue cleared on server start");
})();

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

