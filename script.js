import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    push,
    onValue
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

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

let currentRoom = "";

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

    const room =
        document.getElementById("roomCode")
        .value
        .trim()
        .toUpperCase();

    joinRoom(room);
};

function joinRoom(room){

    const name =
        document.getElementById("name")
        .value
        .trim();

    if(!name){
        alert("Enter name");
        return;
    }

    currentRoom = room;

    document.getElementById("roomDisplay")
        .innerText = "Room: " + room;

    push(
        ref(db, "rooms/" + room + "/players"),
        {
            name: name
        }
    );

    onValue(
        ref(db, "rooms/" + room + "/players"),
        snapshot => {

            const data = snapshot.val();

            let html = "";

            if(data){

                Object.values(data)
                .forEach(player => {

                    html += `
                        <div>${player.name}</div>
                    `;
                });
            }

            document.getElementById("players")
                .innerHTML = html;
        }
    );
}