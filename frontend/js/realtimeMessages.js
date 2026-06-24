// Connect socket
const socket = io("http://localhost:5000");
const currentUserEmail = sessionStorage.getItem("userEmail");

if (currentUserEmail) {
  socket.emit("join", currentUserEmail);
  console.log(`🟢 Joined room for ${currentUserEmail}`);
}

// --- Helper to insert message dynamically ---
function renderMessage(listId, message) {
  const list = document.getElementById(listId);
  if (!list) return;
  
  const li = document.createElement("li");
  li.className = "message-item";
  const sender = message.anonymous ? "Anonymous" : message.senderEmail;
  
  li.innerHTML = `
    <div class="msg-header">
      <strong>${message.recipientEmail ? "To: " + message.recipientEmail : sender}</strong>
      <span class="status ${message.status}">${message.status.toUpperCase()}</span>
    </div>
    <div class="msg-body">${message.content}</div>
    <div class="msg-time">${new Date(message.createdAt).toLocaleString()}</div>
  `;
  list.prepend(li);
}

// --- Socket event handlers ---
socket.on("newMessage", (msg) => {
  console.log("📤 New message sent:", msg);
  renderMessage("sentList", msg);
});

socket.on("messageApproved", (msg) => {
  console.log("✅ Message approved:", msg);
  renderMessage("inboxList", msg);
});

socket.on("messageRejected", (msg) => {
  console.log("❌ Message rejected:", msg);
  alert("Your message was rejected by moderation.");
});

// Optional: toast notifications
function showToast(text) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = text;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
