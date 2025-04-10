const socket = io();

socket.on("connect", () => {
    console.log("Connected to server:", socket.id);
});

let boxes = document.querySelectorAll(".box");
let newGameButton = document.querySelector("#newgame-button");
let messageContainer = document.querySelector(".message-container");
let message = document.querySelector("#message");
let game = document.querySelector(".game");
let first = document.querySelector("#first");

let playerSymbol = null;
let currentTurn = "X"; // X always starts
let count = 0;

messageContainer.classList.add("hide");
newGameButton.classList.add("hide");

const wins = [
    [0,1,2], [0,3,6], [0,4,8], [1,4,7],
    [2,5,8], [2,4,6], [3,4,5], [6,7,8]
];

const reset = () => {
    count = 0;
    currentTurn = "X";
    enableBoxes();
    messageContainer.classList.add("hide");
    newGameButton.classList.add("hide");
    newGameButton.disabled = false;
    game.classList.remove("hide");
    first.classList.remove("hide");
    updateTurnDisplay();
}

const updateTurnDisplay = () => {
    if (!playerSymbol) return;
    if (playerSymbol === currentTurn) {
        first.innerText = "🟢Your turn!";
    } else {
        first.innerText = "🔴Waiting for opponent...";
    }
}

boxes.forEach((box, index) => {
    box.addEventListener("click", () => {
        if (box.innerText || playerSymbol !== currentTurn) return;

        box.innerText = playerSymbol;
        box.innerText = playerSymbol;
        box.classList.add("placed");

    setTimeout(() => {
        box.classList.remove("placed");
    }, 200);

        box.disabled = true;
        count++;

        socket.emit("move", {
            index: index,
            value: playerSymbol,
            room: currentRoom
        });

        if (!checkWinner() && count === 9) {
            gameDraw();
        } else {
            // Only update local turn if no win yet
            currentTurn = currentTurn === "X" ? "O" : "X";
            updateTurnDisplay();
        }
    });
});

socket.on("move", (data) => {
    const box = boxes[data.index];
    if (!box.innerText) {
        box.innerText = data.value;
        box.disabled = true;
        count++;

        currentTurn = data.value === "X" ? "O" : "X";
        updateTurnDisplay();

        if (!checkWinner() && count === 9) {
            gameDraw();
        }
    }
});

const gameDraw = () => {
    message.innerText = "Game was a draw!";
    messageContainer.classList.remove("hide");
    disableBoxes();
    newGameButton.classList.remove("hide");
    game.classList.add("hide");
    first.classList.add("hide");
}

const disableBoxes = () => {
    for (let box of boxes) {
        box.disabled = true;
    }
}

const enableBoxes = () => {
    for (let box of boxes) {
        box.disabled = false;
        box.innerText = "";
    }
}

const showWinner = (winner) => {
    disableBoxes();
    message.innerText = `${winner} is the Winner!!`;
    pixelConfetti();
    messageContainer.classList.remove("hide");
    newGameButton.classList.remove("hide");
    game.classList.add("hide");
    first.classList.add("hide");
}

const checkWinner = () => {
    for (let pattern of wins) {
        let [a, b, c] = pattern;
        let p1 = boxes[a].innerText;
        let p2 = boxes[b].innerText;
        let p3 = boxes[c].innerText;

        if (p1 && p1 === p2 && p2 === p3) {
            showWinner(p1);
            return true;
        }
    }
    return false;
}

newGameButton.addEventListener("click", () => {
    if (currentRoom) {
        socket.emit("request-new-game", currentRoom);
        newGameButton.disabled = true; // prevent spamming
    }
});


function pixelConfetti() {
    confetti({
        particleCount: 120,
        angle: 90,
        spread: 120,
        startVelocity: 30,
        gravity: 0.5,
        decay: 0.9,
        scalar: 1.2,
        shapes: ['square'],
        colors: ['#ffcc00', '#00ffe1', '#ff00ff', '#44388a'],
        origin: { y: 0.6 },
    });
}

document.addEventListener("keydown", (e) => {
    if (e.key === "r") reset();
});

const joinRoomButton = document.getElementById("join-room");
const roomInput = document.getElementById("room-input");
let currentRoom = null;

joinRoomButton.addEventListener("click", () => {
    const room = roomInput.value.trim();
    if (room) {
        socket.emit("join-room", room);
        currentRoom = room;
        document.querySelector(".room-container").classList.add("hide");
        document.querySelector(".waiting-container").classList.remove("hide");
    }
});

socket.on("start-game", () => {
    document.querySelector(".waiting-container").classList.add("hide");
    document.querySelector(".game-container").classList.remove("hide");
    first.classList.remove("hide");
});

socket.on("player-assigned", (symbol) => {
    playerSymbol = symbol;
    console.log("Assigned symbol:", symbol);
    // updateTurnDisplay();
    first.innerText = `You are '${symbol}'`;
});

socket.on("start-new-game-countdown", () => {
    let timeLeft = 5;
    const beep = new Audio("/assets/beep.wav");
    const ding = new Audio("/assets/ding.wav");

    first.classList.remove("hide");
    first.innerText = `New game starting in ${timeLeft}...`;

    const countdown = setInterval(() => {
        timeLeft--;        

        if (timeLeft > 0) {
            beep.currentTime = 0;
            beep.play();
            first.innerText = `New game starting in ${timeLeft}...`;
        } else {
            ding.play(); // final "ding"
            clearInterval(countdown);
            reset();
        }
    }, 1000);
});
