import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    get,
    onValue
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
    "Doctor",
    "School",
    "Mountain",
    "Ocean",
    "Monkey",
    "Robot",
    "Castle",
    "Diamond",
    "Library",
    "Airport",
    "Chocolate",
    "Dragon",
    "Guitar",
    "Backpack",
    "Satellite",
    "Whale",
    "Volcano",
    "Jungle",
    "Spider",
    "Rainbow",
    "Helmet",
    "Burger",
    "Clock",
    "Torch",
    "Planet",
    "Submarine",
    "Crown",
    "Bridge",
    "Bottle",
    "Keyboard",
    "Telescope",
    "Magnet",
    "Elephant",
    "Pirate",
    "Snowman",
    "Firetruck",
    "Microphone",
    "Pencil",
    "Cactus",
    "Umbrella"
];

let currentRoom = "";
let myName = "";
let isHost = false;

document.getElementById("joinBtn").onclick = joinRoom;

async function joinRoom(){

    const name =
        document.getElementById("name")
        .value
        .trim();

    const room =
        document.getElementById("roomCode")
        .value
        .trim()
        .toUpperCase();

    if(!name || !room){
        alert("Enter name and room code");
        return;
    }

    const roomRef = ref(db, "rooms/" + room);

    const roomSnap = await get(roomRef);

    if(!roomSnap.exists()){

        await set(roomRef,{
            host:name,
            started:false,
            players:{
                [name]:{
                    name:name
                }
            }
        });

        isHost = true;

    }else{

        const roomData = roomSnap.val();

        if(roomData.started){
            alert("Game already started");
            return;
        }

        if(roomData.players && roomData.players[name]){
            alert("Name already taken");
            return;
        }

        await set(
            ref(db,`rooms/${room}/players/${name}`),
            {
                name:name
            }
        );

        isHost = roomData.host === name;
    }

    myName = name;
    currentRoom = room;

    document.getElementById("roomDisplay")
        .innerText = "Room: " + room;

    watchRoom();
}

function watchRoom(){

    onValue(
        ref(db,"rooms/" + currentRoom),
        snapshot => {

            const room = snapshot.val();

            if(!room) return;

            let html = "";

            Object.values(room.players || {})
            .forEach(player => {

                html += `
                    <div class="player ${player.name === room.host ? 'host' : ''}">
                        ${player.name}
                        ${player.name === room.host ? ' 👑' : ''}
                    </div>
                `;
            });

            document.getElementById("players")
                .innerHTML = html;

            if(isHost && !room.started){

                document.getElementById("hostArea")
                    .innerHTML =
                    `<button id="startGame">Start Game</button>`;

                document.getElementById("startGame")
                    .onclick = startGame;

            }else if(!room.started){

                document.getElementById("hostArea")
                    .innerHTML =
                    `<p>Waiting for host...</p>`;
            }

            if(room.started){

                const role =
                    room.roles?.[myName];

                if(!role) return;

                if(role.impostor){

                    document.getElementById("gameArea")
                        .innerHTML = `
                        <div class="impostor">
                            YOU ARE THE IMPOSTOR
                        </div>
                    `;

                }else{

                    document.getElementById("gameArea")
                        .innerHTML = `
                        <h2>Your Word</h2>
                        <div class="word">
                            ${role.word}
                        </div>
                    `;
                }
            }
        }
    );
}

async function startGame(){

    const roomSnap = await get(
        ref(db,"rooms/" + currentRoom)
    );

    const room = roomSnap.val();

    const players =
        Object.keys(room.players);

    if(players.length < 3){
        alert("Need at least 3 players");
        return;
    }

    const word =
        WORDS[
            Math.floor(
                Math.random() * WORDS.length
            )
        ];

    const impostor =
        players[
            Math.floor(
                Math.random() * players.length
            )
        ];

    const roles = {};

    players.forEach(player => {

        roles[player] = {
            impostor: player === impostor,
            word: word
        };

    });

    await set(
        ref(db,"rooms/" + currentRoom + "/roles"),
        roles
    );

    await set(
        ref(db,"rooms/" + currentRoom + "/started"),
        true
    );
}
