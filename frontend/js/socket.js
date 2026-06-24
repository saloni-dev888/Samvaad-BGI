const socket = io("http://localhost:5000");

// Get current logged-in user's email (set this after login)
const currentUserEmail = sessionStorage.getItem("userEmail");

if (currentUserEmail) {
  socket.emit("join", currentUserEmail);
  console.log(`🟢 Joined socket room for ${currentUserEmail}`);
} else {
  console.warn("⚠️ No currentUserEmail found — socket room not joined.");
}


// After login
socket.emit("join", currentUserEmail);

// Show new messages instantly
socket.on("newMessage", (msg) => {
  if (msg.senderEmail === currentUserEmail) {
    addToSentList(msg);
  }
});

// When n8n approves
socket.on("messageApproved", (msg) => {
  if (msg.recipientEmail === currentUserEmail) {
    addToInbox(msg);
    showToast(`📨 New message from ${msg.senderEmail}`);
  }
});

// When rejected
socket.on("messageRejected", (msg) => {
  if (msg.senderEmail === currentUserEmail) {
    showToast(`🚫 Your message was rejected: ${msg.reason}`);
  }
});

function showToast(message) {
  alert(message);
}
