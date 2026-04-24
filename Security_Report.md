# GhostTalk Security Report: De-anonymisation & Threat Analysis

## Overview
GhostTalk employs strong End-to-End Encryption (E2E) via the WebCrypto API and robust authentication using bcrypt and TOTP. However, even with encrypted content, an attacker (or compromised server) might attempt to de-anonymise users or infer activity through metadata analysis, timing attacks, and message patterns. This report outlines these vectors and how they are addressed.

---

## 1. Metadata Exposure
**Vulnerability:**
While message contents are encrypted (`encryptedContent`), the database schemas (`Message` and `Conversation`) store explicit links between `sender` and `conversationId`. A compromised server or database dump reveals the entire social graph: who is talking to whom, and when.

**Exploitation:**
By querying `Conversation.find({ participants: targetUserId })`, an attacker maps out the user's contacts. Even if a user is set to 'Ghost' mode, their past interactions remain visible in the schema.

**Fix Implemented/Recommended:**
- **Short-term Fix:** Enforce a strict Data Retention Policy. Messages have a MongoDB TTL index that permanently purges deleted messages after 30 days.
- **Long-term Fix:** Implement "Sealed Sender" technology (similar to Signal). Instead of storing `sender` in plaintext, the client encrypts the sender's identity using the recipient's public key. The server only knows a message is being routed to the recipient, not who sent it.

---

## 2. Timing Attacks & Traffic Correlation
**Vulnerability:**
The `Socket.io` connection instantly routes messages from sender to receiver. A network observer or a malicious server admin monitoring timestamps (`createdAt`, `lastMessageAt`) can correlate traffic. If User A sends a 1KB packet and User B receives a 1KB packet 50ms later, it statistically links the two users.

**Exploitation:**
Monitoring the `/api/messages/:conversationId` endpoint and WebSocket frames. The `lastMessageAt` field in conversations leaks the exact timestamp of activity.

**Fix Implemented/Recommended:**
- **Jitter & Delays:** Introduce random artificial delays (jitter) in the socket message delivery pipeline (`io.emit`).
- **Constant Rate Traffic:** Clients can be configured to send dummy heartbeat messages at a constant rate. True messages replace a heartbeat, obscuring the timing of actual communication from network sniffers.

---

## 3. Message Length & Pattern Analysis
**Vulnerability:**
AES-GCM (used in standard WebCrypto E2E) does not hide the length of the plaintext. A 2-character message ("Hi") yields a noticeably smaller ciphertext than a 500-word paragraph. Pattern analysis can deduce conversational flow (e.g., rapid short texts vs. long paragraphs).

**Exploitation:**
Analyzing the `encryptedContent` string length in MongoDB.

**Fix Implemented/Recommended:**
- **Message Padding:** Before encrypting, the client should append random null-byte padding so that all messages are fixed lengths (e.g., 256 bytes, 1KB, 4KB). 

---

## 4. IP Tracking & Session Hijacking
**Vulnerability:**
If the server logs IPs, an attacker can map IP addresses to usernames, destroying anonymity. 

**Fix Implemented:**
- **No IP Logging:** The backend (`express-rate-limit`) only uses IP in-memory for rate-limiting. IPs are never written to the database or persistent logs.
- **Speakeasy 2FA:** Mitigates stolen JWTs if the attacker tries to log in from a new session.
