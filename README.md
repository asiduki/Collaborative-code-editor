#  🌐 **COLLABORATIVE CODE EDITOR – DEVNEST**

<p align="center">
  <img src="https://img.shields.io/badge/REACT-v18-blue?logo=react" />
  <img src="https://img.shields.io/badge/NODE.JS-v18-green?logo=node.js" />
  <img src="https://img.shields.io/badge/SOCKET.IO-Realtime-black?logo=socket.io" />
  <img src="https://img.shields.io/badge/MONGODB-Database-brightgreen?logo=mongodb" />
  <img src="https://img.shields.io/badge/JUDGE0-Code%20Execution-orange" />
  <img src="https://img.shields.io/badge/LICENSE-MIT-yellow" />
</p>

---
🚀 LIVE DEMO
<p align="center"> <a href="https://collaborative-code-editor-pearl.vercel.app/" target="_blank"> <img src="https://img.shields.io/badge/OPEN%20LIVE%20DEMO-Click%20Here-brightgreen?style=for-the-badge&logo=vercel" /> </a> </p>

## 🧠 **WHAT IS DEVNEST?**

**DEVNEST** is a **REAL-TIME COLLABORATIVE CODE EDITOR** that allows multiple users to write, edit, execute, and sync code inside shared rooms.
It is designed for **pair programming, classrooms, interviews, hackathons, and remote coding sessions** with a clean and modern UI.

---

## 🎨 **UI PREVIEW**

<p align="center">
  <img width="85%" alt="UI Screenshot 1" src="https://github.com/user-attachments/assets/69cd122b-793f-42d4-89cf-00c9c0d12060" />
</p>

<p align="center">
  <img width="85%" alt="UI Screenshot 2" src="https://github.com/user-attachments/assets/ccf47d97-863f-486c-bbf8-85585be3e967" />
</p>

---

### 🚀 **FEATURES**

###### 🔥 **REAL-TIME COLLABORATION**

* WebSocket-powered live sync
* Instant keystroke updates
* Auto-sync code, theme, and language
* Works like **Google Docs**, but for code

###### 🖥 **MULTI-LANGUAGE EDITOR**

* Built using **CodeMirror**
* Syntax highlighting for:
  **C, C++, Java, Python, JavaScript, Go, PHP** and more
* Light & Dark themes
* Smooth typing experience

###### ⚙️ **CODE EXECUTION (JUDGE0)**

* Compile & run code in multiple languages
* Shows output, errors & execution time
* Uses **Judge0 RapidAPI**

###### 📁 **ROOM DASHBOARD + SAVED SESSIONS**

* Save code using **Room ID**
* Dashboard shows all saved rooms
* Resume coding anytime
* Perfect for labs, classes & interview tasks

###### 🔐 **AUTHENTICATION SYSTEM**

* JWT + HTTP-only cookie security
* Login, Register, Logout
* Protected routes

---

### 🏛 **PROJECT ARCHITECTURE**

```
FRONTEND (REACT + CODEMIRROR + RECOIL)
              |
              |  WEBSOCKETS (SOCKET.IO)
              v
BACKEND (EXPRESS + SOCKET.IO)
              |
              |  REST APIs
              v
MONGODB (ROOMS + USERS)
              |
              |  CODE EXECUTION REQUEST
              v
JUDGE0 API
```

---

### 🛠 **TECH STACK**

### **FRONTEND**

* React (Vite)
* Tailwind CSS
* CodeMirror
* Recoil

### **BACKEND**

* Node.js
* Express.js
* Socket.io
* MongoDB + Mongoose
* JWT Authentication

### **APIs**

* Judge0 (via RapidAPI)

---

### 🚪 **HOW TO RUN THE PROJECT**

###### **1. CLONE REPOSITORY**

```bash
git clone https://github.com/asiduki/Collaborative-code-editor
cd Collaborative-code-editor
```

---

###### **2. INSTALL FRONTEND**

```bash
cd client
npm install
npm run dev
```

---

###### **3. INSTALL BACKEND**

```bash
cd server
npm install
npm start
```

---

### 📌 **ENVIRONMENT VARIABLES**

###### **CLIENT (.env)**

```
VITE_API_URL=http://localhost:5000
VITE_RAPID_API_URL=your_key
VITE_RAPID_API_KEY=your_key
VITE_RAPID_API_HOST=your_key

```

###### **SERVER (.env)**

```
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
```

---

### 🎯 **FUTURE ENHANCEMENTS**

* 🔊 In-editor chat
* 🧑‍🤝‍🧑 Live cursors with usernames
* 🕒 Code version history
* 🗑 Room delete/rename
* 🎥 Video calls & screen sharing
* 🤖 AI code assistant inside editor

---

### 🤝 **CONTRIBUTING**

Contributions are welcome!
Submit a pull request or open an issue.

---

### 📜 **LICENSE**

This project is released under the **MIT License**.

---

### ⭐ **SUPPORT**

If you like this project, kindly give it a **⭐ star on GitHub**:
👉 [https://github.com/asiduki/Collaborative-code-editor](https://github.com/asiduki/Collaborative-code-editor)

It really motivates me to build more features!


