import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    push,
    onValue,
    get
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyA76fPId1hCmbZrlPIKdTAi7cw_7610cMU",
    authDomain: "imposter-game-f3af6.firebaseapp.com",
    databaseURL: "https://imposter-game-f3af6-default-rtdb.firebaseio.com",
    projectId: "imposter-game-f3af6",
    storageBucket: "imposter-game-f3af6.firebasestorage.app",
    messagingSenderId: "354484660580",
    appId: "1:354484660580:web:3df90b3a0efaf616bf7271",
    measurementId: "G-YJ2TCTNK2Y"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const WORDS = [
    "Apple",
    "Tiger",
    "Pizza",
    "Rocket",
    "Laptop",
    "Camera",
    "Shark",
    "Train",
    "Football",
    "Banana",
    "Elephant",
    "Pencil",
    "Bottle",
    "Keyboard",
    "Mountain",
    "Ocean",
    "Bridge",
    "School",
    "Doctor",
    "Burger",
    "Helmet",
    "Library",
    "Monkey",
    "Diamond",
    "Airport",
    "Planet",
    "Robot",
    "Volcano",
    "Castle",
    "Chocolate",
    "Guitar",
    "Microphone",
    "Backpack",
    "Umbrella",
    "Clock",
    "Firetruck",
    "Dragon",
    "Submarine",
    "Snowman",
    "Pirate",
    "Satellite",
    "Cactus",
    "Jungle",
    "Telescope",
    "Magnet",
    "Rainbow",
    "Spider",
    "Whale",
    "Torch",
    "Crown"
];

let currentRoom = "";
let myName = "";
let myRoleShown = false;

function randomCode() {
    return Math.random()
        .toString(36)
        .substring(2, 7)
        .toUpperCase();
}

document.getElementById("createRoom").onclick = () => {

    const room = randomCode();

    currentRoom = room;

    set(ref(db, "rooms/" + room), {
        created: Date.now()
    });

    joinRoom(room);
};

document.getElementById("joinRoom").onclick = () => {

    const room = document
        .getElementById("roomCode")
        .value
        .trim()
        .toUpperCase();

    joinRoom(room);
};

function joinRoom(room){

    const name = document
        .getElementById("name")
        .value
        .trim();

    if(!name){
        alert("Enter your name");
        return;
    }

    myName = name;
    currentRoom = room;

    document.getElementById("roomDisplay")
        .innerText = "Room: " + room;

    push(
        ref(db, "rooms/" + room + "/players"),
        {
            name:name
        }
    );

    onValue(
        ref(db, "rooms/" + room + "/players"),
        snapshot => {

            const data = snapshot.val();

            let html = "";

            if(data){

                Object.values(data).forEach(player => {

                    html += `
                        <div class="player">
                            ${player.name}
                        </div>
                    `;
                });
            }

            document.getElementById("players")
                .innerHTML = html;
        }
    );

    watchGame();
}

document.getElementById("startGame").onclick = async () => {

    if(!currentRoom){
        alert("Join a room first");
        return;
    }

    const snapshot = await get(
        ref(db, "rooms/" + currentRoom + "/players")
    );

    const playersObj = snapshot.val();

    if(!playersObj){
        return;
    }

    const players = Object.values(playersObj);

    if(players.length < 3){
        alert("Need at least 3 players");
        return;
    }

    const word =
        WORDS[Math.floor(Math.random() * WORDS.length)];

    const impostorIndex =
        Math.floor(Math.random() * players.length);

    const roles = {};

    players.forEach((player,index)=>{

        roles[player.name] = {
            impostor:index === impostorIndex,
            word:word,
            ready:false
        };

    });

    await set(
        ref(db,"rooms/" + currentRoom + "/game"),
        {
            started:true,
            word:word,
            roles:roles
        }
    );
};

function watchGame(){

    onValue(
        ref(db,"rooms/" + currentRoom + "/game"),
        snapshot => {

            const game = snapshot.val();

            if(!game) return;
            if(!game.started) return;

            if(myRoleShown) return;

            const role = game.roles[myName];

            if(!role) return;

            myRoleShown = true;

            if(role.impostor){

                document.getElementById("gameArea")
                    .innerHTML = `
                    <h2 class="impostor">
                        YOU ARE THE IMPOSTOR
                    </h2>

                    <button id="readyBtn">
                        I KNOW MY ROLE
                    </button>
                `;

            }else{

                document.getElementById("gameArea")
                    .innerHTML = `
                    <h2>Your Word</h2>

                    <div class="word">
                        ${role.word}
                    </div>

                    <button id="readyBtn">
                        I KNOW MY ROLE
                    </button>
                `;
            }

            document
                .getElementById("readyBtn")
                .onclick = () => {

                    set(
                        ref(
                            db,
                            "rooms/" +
                            currentRoom +
                            "/game/roles/" +
                            myName +
                            "/ready"
                        ),
                        true
                    );

                    document.getElementById("gameArea")
                        .innerHTML = `
                        <h2>Waiting for others...</h2>
                    `;
                };
        }
    );

    onValue(
        ref(db,"rooms/" + currentRoom + "/game/roles"),
        snapshot => {

            const roles = snapshot.val();

            if(!roles) return;

            const allReady =
                Object.values(roles)
                .every(role => role.ready);

            if(allReady){

                document.getElementById("gameArea")
                    .innerHTML = `
                    <h1>DISCUSSION TIME</h1>
                    <p>Talk and find the impostor.</p>
                `;
            }
        }
    );
}
