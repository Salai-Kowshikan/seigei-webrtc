let handleUserLeft = (MemberId) => {
  document.getElementById("user-2").style.display = "none";
  document.getElementById("user-1").classList.remove("smallFrame");
};

let sendChatMessage = async () => {
  let input = document.getElementById("chat-input");
  let message = input.value;
  input.value = "";

  if (message) {
    console.log("Message is sent " + message);
    let timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    let chatMessages = document.getElementById("chat-messages");
    let messageElement = document.createElement("p");
    messageElement.textContent = `${message}`;
    messageElement.textContent = `${message}  ${timestamp}`;
    messageElement.style.textAlign = "right";
    messageElement.style.color = "blue";
    chatMessages.appendChild(messageElement);
    await channel.sendMessage({
      text: JSON.stringify({
        type: "chat",
        message: message,
        timestamp: timestamp,
      }),
    });
  }
};

let handleMessageFromPeer = async (message, MemberId) => {
  console.log("Received message: " + message.text);
  message = JSON.parse(message.text);

  if (message.type === "offer") {
    createAnswer(MemberId, message.offer);
  }

  if (message.type === "answer") {
    addAnswer(message.answer);
  }

  if (message.type === "candidate") {
    if (peerConnection) {
      peerConnection.addIceCandidate(message.candidate);
    }
  }

  if (message.type === "chat") {
    console.log("Chat msg received");
    let chatMessages = document.getElementById("chat-messages");
    let messageElement = document.createElement("p");
    messageElement.textContent = `${message.message}`;
    messageElement.textContent = `${message.timestamp} ${message.message}`;
    messageElement.style.textAlign = "left";
    chatMessages.appendChild(messageElement);
  }
};
let handleUserJoined = async (MemberId) => {
  console.log("A new user joined the channel:", MemberId);

  createOffer(MemberId);
};

let createPeerConnection = async (MemberId) => {
  peerConnection = new RTCPeerConnection(servers);

  remoteStream = new MediaStream();
  document.getElementById("user-2").srcObject = remoteStream;
  document.getElementById("user-2").style.display = "block";

  document.getElementById("user-1").classList.add("smallFrame");

  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    document.getElementById("user-1").srcObject = localStream;
  }

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      client.sendMessageToPeer(
        {
          text: JSON.stringify({
            type: "candidate",
            candidate: event.candidate,
          }),
        },
        MemberId
      );
    }
  };
};
let createOffer = async (MemberId) => {
  await createPeerConnection(MemberId);

  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  client.sendMessageToPeer(
    { text: JSON.stringify({ type: "offer", offer: offer }) },
    MemberId
  );
};

let createAnswer = async (MemberId, offer) => {
  await createPeerConnection(MemberId);

  await peerConnection.setRemoteDescription(offer);

  let answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  client.sendMessageToPeer(
    { text: JSON.stringify({ type: "answer", answer: answer }) },
    MemberId
  );
};

let addAnswer = async (answer) => {
  if (!peerConnection.currentRemoteDescription) {
    peerConnection.setRemoteDescription(answer);
  }
};

export {
  handleUserLeft,
  sendChatMessage,
  handleMessageFromPeer,
  handleUserJoined,
  createPeerConnection,
  createAnswer,
  addAnswer,
  createOffer,
};
