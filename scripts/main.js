import {
  handleUserLeft,
  sendChatMessage,
  handleMessageFromPeer,
  handleUserJoined,
  createPeerConnection,
  createAnswer,
  addAnswer,
  createOffer,
} from "./P2P.js";

let APP_ID = "9eb8841f0c3a46e48808299ce0f92104";

let token = null;
let uid = String(Math.floor(Math.random() * 10000));

let client;
let channel;

let queryString = window.location.search;
let urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get("room");

let localStream;
let remoteStream;
let peerConnection;
let recognition;
let transcript = "";

const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};

let constraints = {
  video: {
    width: { min: 640, ideal: 1920, max: 1920 },
    height: { min: 480, ideal: 1080, max: 1080 },
  },
  audio: {
    echoCancellation: true,
  },
};
let leaveChannel = async () => {
  await channel.leave();
  await client.logout();
};

let toggleTranscription = async () => {
  if (recognition) {
    if (recognition.recognizing) {
      recognition.stop();
      recognition.recognizing = false;

      if (transcript) {
        let timestamp = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        console.log("Message is sent " + transcript);
        await channel.sendMessage({
          text: JSON.stringify({
            type: "chat",
            message: transcript,
            timestamp: timestamp,
          }),
        });
        let chatMessages = document.getElementById("chat-messages");
        let messageElement = document.createElement("p");
        messageElement.textContent = `${transcript}`;
        messageElement.textContent = `${transcript}  ${timestamp}`;
        messageElement.style.textAlign = "right";
        messageElement.style.color = "blue";
        chatMessages.appendChild(messageElement);
        transcript = "";
      }
    } else {
      recognition.start();
      document.getElementById("transcript-btn").style.backgroundColor =
        "rgb(255, 80, 80)";
      recognition.recognizing = true;
    }
  }
};

let toggleCamera = async () => {
  let videoTrack = localStream
    .getTracks()
    .find((track) => track.kind === "video");

  if (videoTrack.enabled) {
    videoTrack.enabled = false;
    document.getElementById("camera-btn").style.backgroundColor =
      "rgb(255, 80, 80)";
  } else {
    videoTrack.enabled = true;
    document.getElementById("camera-btn").style.backgroundColor =
      "rgb(179, 102, 249, .9)";
  }
};

let toggleMic = async () => {
  let audioTrack = localStream
    .getTracks()
    .find((track) => track.kind === "audio");

  if (audioTrack.enabled) {
    audioTrack.enabled = false;
    document.getElementById("mic-btn").style.backgroundColor =
      "rgb(255, 80, 80)";
  } else {
    audioTrack.enabled = true;
    document.getElementById("mic-btn").style.backgroundColor =
      "rgb(179, 102, 249, .9)";
  }
};

let init = async () => {
  client = await AgoraRTM.createInstance(APP_ID);
  await client.login({ uid, token });

  channel = client.createChannel(roomId);
  await channel.join();

  channel.on("MemberJoined", handleUserJoined);
  channel.on("MemberLeft", handleUserLeft);
  channel.on("ChannelMessage", handleMessageFromPeer);

  client.on("MessageFromPeer", handleMessageFromPeer);

  localStream = await navigator.mediaDevices.getUserMedia(constraints);

  let videoElement = document.getElementById("user-1");
  videoElement.srcObject = localStream;
  videoElement.muted = true;
  if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    recognition.interimResults = true;
    recognition.continuous = true;
    console.log("Speech recognition service created.");
    recognition.addEventListener("result", async (event) => {
      transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join("");
      console.log(transcript);
    });
  } else {
    console.log("Web Speech API is not supported in this browser.");
  }

  document
    .getElementById("transcript-btn")
    .addEventListener("click", toggleTranscription);
};

if (typeof window !== "undefined")
  window.addEventListener("beforeunload", leaveChannel);

document.getElementById("camera-btn").addEventListener("click", toggleCamera);
document.getElementById("mic-btn").addEventListener("click", toggleMic);
document.getElementById("chat-input").addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    sendChatMessage();
  }
});

document.getElementById("exit").addEventListener("click", function () {
  window.location.href = "https://seigei.onrender.com/Chat?exit=true";
});

init();
