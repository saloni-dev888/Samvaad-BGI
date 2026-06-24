// frontend/js/app.js

const API_BASE = "http://localhost:5000/api"; 
// Later: change to your deployed backend URL (or just use relative paths if served together)

/**
 * Helper for making API requests
 */
async function apiRequest(endpoint, method = "GET", data) {
  try {
    const options = {
      method,
      headers: { "Content-Type": "application/json" }
    };
    if (data) options.body = JSON.stringify(data);

    const res = await fetch(`${API_BASE}${endpoint}`, options);

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } catch (err) {
    console.error("API error:", err);
    throw err;
  }
}

/* =====================
   MESSAGES API
===================== */

/**
 * Send an anonymous message
 * @param {string} recipient - recipient code (e.g. "WEC01")
 * @param {string} content - message text
 */
async function sendMessage(recipient, content) {
  return apiRequest("/messages", "POST", { recipient, content });
}

/**
 * Fetch all messages (for admin/faculty dashboard)
 */
async function getMessages() {
  return apiRequest("/messages", "GET");
}

/* =====================
   FEEDBACK API
===================== */

/**
 * Submit feedback
 * @param {number} rating - 1 to 5
 * @param {string} comment - optional feedback text
 */
async function submitFeedback(rating, comment = "") {
  return apiRequest("/feedback", "POST", { rating, comment });
}

/**
 * Fetch all feedback (for reports/analytics)
 */
async function getFeedback() {
  return apiRequest("/feedback", "GET");
}

/* =====================
   Example usage
   (You will call these from HTML pages)
===================== */

// For Anonymous_Message.html
async function handleMessageForm(e) {
  e.preventDefault();
  const recipient = document.getElementById("recipientId").value.trim();
  const content = document.getElementById("message").value.trim();
  const resultDiv = document.getElementById("result");

  resultDiv.textContent = "";

  if (!recipient || !content) {
    resultDiv.textContent = "Please fill all fields.";
    return;
  }

  try {
    const res = await sendMessage(recipient, content);
    resultDiv.textContent = "✅ Message sent!";
    e.target.reset();
  } catch (err) {
    resultDiv.textContent = `❌ ${err.message}`;
  }
}

// For Feedback.html
async function handleFeedbackForm(e) {
  e.preventDefault();
  const rating = parseInt(document.getElementById("rating").value, 10);
  const comment = document.getElementById("comment").value.trim();
  const resultDiv = document.getElementById("feedbackResult");

  resultDiv.textContent = "";

  try {
    await submitFeedback(rating, comment);
    resultDiv.textContent = "✅ Feedback submitted!";
    e.target.reset();
  } catch (err) {
    resultDiv.textContent = `❌ ${err.message}`;
  }
}
