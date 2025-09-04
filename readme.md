# Chat-App

A modern, privacy-focused real-time chat application built with **React**, **Node.js**, **Express**, **MongoDB**, and **Socket.IO**.  
This project includes a full-featured frontend and backend, supporting messaging, friend requests, privacy controls, infinite scrolling, media sharing, and more.

---

## 📹 Demo Video

_Coming soon! Add will be added here._

---

## 🚀 Features

- **Authentication**
  - Secure signup/login with email, password (hashed before storing) and JWT.
  - (Currently, I have kept this authentication section simple to explore easily)
- **Real-Time Messaging**
  - Send text, photos, and videos (with compression for bandwidth savings).
  - Typing indicators (can be hidden via privacy settings).
  - React to any message and change reaction.
  - Read receipts with detailed delivery/seen times (like WhatsApp).
  - Infinite scrolling for messages in conversations.
- **Privacy Controls**
  - Control who can message you: everyone, friends only, or no one.
  - Control who can send friend requests: everyone, friends of friends, or no one.
  - Hide/show last seen, typing indicator, read receipts, and active status.
  - Privacy settings are mutual (e.g., if you hide last seen, you can't see others' last seen).
- **Friend System**
  - Send, accept, decline, and cancel friend requests.
  - "People You May Know" suggestions (excluding current requests/friends).
  - Incoming/outgoing requests, friend list, and message requests.
  - Message requests: chat with non-friends, auto-accept if receiver replies.
- **UI/UX**
  - Responsive design with modern hamburger menu for mobile.
  - Multiple themes (light/dark/custom).
  - Loading skeletons and smooth transitions.
  - Confirmation modals for starting conversations with unknown.
- **Performance**
  - Infinite scroll for messages (pagination).
  - Media compression for uploads.
- **Other**
  - Filter and view recently active members.
  - Cancel outgoing friend requests (like Facebook).
  - See message delivery and read status in detail (on hover/double-tap).
  - Give reaction and change existing reaction on distinct message at real-time.
- **Upcoming Features / Currently Working with**
  - Google auth for easy sign up.
  - End to end encryption for messages and media.
  - Group chatting.
  - Instant voice message.
  - Voice and video call.
  - Secret conversations.
  - Performance improvements
- **Scalability & System Design Improvements (Planned)**
  - Horizontal scaling of backend servers using load balancers (e.g., Nginx, HAProxy).
  - Socket.IO scaling with Redis adapter for multi-instance real-time communication.
  - Database sharding and replication for MongoDB to handle large datasets and high availability.
  - Caching frequently accessed data (e.g., user profiles, conversations) with Redis or Memcached.
  - Message queue integration (e.g., RabbitMQ, Kafka) for handling notifications and background jobs.
  - CDN integration for serving media files and static assets globally.
  - Rate limiting and API gateway for security and traffic management.
  - Monitoring and alerting (Prometheus, Grafana, ELK stack) for real-time health and performance tracking.
  - Automated scaling and deployment with Docker, Kubernetes, and CI/CD pipelines.

---

## 🗂️ Project Structure

```
Chat-App/
│
├── backend/
│   ├── src/
│   │   ├── controllers/        # Route handlers (auth, chat, friends, messages)
│   │   ├── lib/                # Utilities (socket, cloudinary, db)
│   │   ├── middlewares/        # Express middlewares (auth, etc.)
│   │   ├── models/             # Mongoose schemas (user, message, conversation, friendRequest)
│   │   ├── routes/             # Express routes (auth, conversation, friend, message)
│   │   └── index.js            # App entry point
│   ├── .env                    # Backend environment variables
│   ├── package.json
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── components/         # React components (chat, friends, navbar, etc.)
│   │   ├── constants/          # Static constants
│   │   ├── lib/                # Axios, utilities
│   │   ├── pages/              # Page-level components (login, signup, profile, etc.)
│   │   ├── store/              # Zustand stores (auth, chat, friends, theme)
│   │   ├── index.css           # Global styles
│   │   ├── App.jsx             # Main app component
│   │   └── main.jsx            # React entry point
│   ├── public/                 # Static assets (avatars, icons)
│   ├── .env                    # Frontend environment variables
│   ├── package.json
│   └── README.md
│
├── readme.md                   # Project documentation (this file)
└── ...
```

---

## ⚡ Installation & Setup

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB (local or Atlas)
- [Optional] Cloudinary account for media uploads

### 1. Clone the repository

```bash
git clone https://github.com/cshosain/MERN-chat-app.git
cd Chat-App
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env   # Fill in MongoDB URI, JWT secret, Cloudinary keys, etc.
npm install
npm run dev            # Starts backend server with nodemon
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env   # Set VITE_BASE_URL to your backend URL (e.g., http://localhost:3003)
npm install
npm run dev            # Starts frontend on Vite (default: http://localhost:5173)
```

---

## 🔗 Environment Variables

### Backend (`backend/.env`)

```
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```
VITE_BASE_URL=http://localhost:3003
```

---

## 🛠️ API Overview

- **Auth:** `/api/auth/*`
- **Conversations:** `/api/conversations/*`
- **Messages:** `/api/messages/*`
- **Friends:** `/api/friends/*`

See backend `routes/` and `controllers/` for details.

---

## 🧩 Technologies Used

- **Frontend:** React, Zustand, Tailwind CSS, Vite, Socket.IO-client
- **Backend:** Node.js, Express, MongoDB, Mongoose, Socket.IO, Cloudinary
- **Other:** JWT, bcrypt, react-hot-toast, lucide-react (icons)

---

## 📝 Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push to the branch
5. Open a pull request

---

## 📄 License

MIT

---

## 🙏 Credits

- [Socket.IO](https://socket.io/)
- [Cloudinary](https://cloudinary.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

---

## 📬 Contact

For questions, suggestions, or bug reports, open an issue or contact [cshosain@gmail.com].

---

## 📹 Demo Video

\*The demo video link (coming soon! InShaAllah)
