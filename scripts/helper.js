function createMeet() {
    let inviteCode = self.crypto.randomUUID()
    let user = document.getElementById('user-name').value;
    window.location = `index.html?room=${inviteCode}&user=${user}` 
}

document.querySelector('#room-form').addEventListener('submit', function(event) {
    event.preventDefault();

    if (event.submitter.id === 'create-room') {
        createMeet();
    } else if (event.submitter.id === 'join-room') {
        joinRoom();
    }
});

function joinRoom() {
    let params = new URLSearchParams(window.location.search);
    let roomId = params.get('room');
    let user = document.getElementById('user-name').value;
    window.location = `index.html?room=${roomId}&user=${user}` 
}

window.onload = function() {
    let params = new URLSearchParams(window.location.search);
    let roomId = params.get('room');

    if (roomId) {
        document.getElementById('create-room').style.display = 'none';
        document.getElementById('join-room').style.display = 'block';
    }
}

const videoElement = document.getElementById('webcam-preview');

navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    videoElement.srcObject = stream;
  })
  .catch(err => {
    console.error('Error accessing webcam: ', err);
  });