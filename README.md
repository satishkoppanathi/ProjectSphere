#ProjectSphere - University Project Management System

A comprehensive MERN stack application for managing university academic projects with role-based dashboards.

![MERN Stack](https://img.shields.io/badge/Stack-MERN-green)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue)
![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-lightgreen)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-green)

## ✨ Features

### 🎓 Student Portal
- Submit academic projects with team members
- Track project status (Draft → Submitted → Under Review → Approved/Rejected → Completed)
- View assigned professor and feedback
- Access marks and evaluation results

### 👨‍🏫 Professor Portal
- View assigned student projects
- Evaluate projects with detailed criteria (Innovation, Implementation, Documentation, Presentation, Teamwork)
- Rank students based on performance
- Filter and sort projects

### 🏛️ HOD Portal
- Manage all department projects
- Assign projects to professors
- Full CRUD operations on projects
- Monitor department progress

### 🎯 Director Portal
- University-wide analytics dashboard
- Charts: Status distribution, Department-wise projects, Monthly trends
- Department performance overview
- Completion rate tracking

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
cd /home/satish/.gemini/antigravity/scratch/university-project-management
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Configure environment**


5. **Start MongoDB** (if local)
```bash
mongod
```

6. **Run the application**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

7. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/health

## 📁 Project Structure

```
university-project-management/
├── backend/
│   ├── config/          # Database configuration
│   ├── middleware/      # Auth & role middleware
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # React context (Auth)
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── App.jsx      # Main app with routing
│   └── package.json
└── README.md
```

## 🎨 Design Features

- **Glassmorphism UI** - Modern frosted glass effects
- **Role-based Color Themes**
  - Student: Indigo (#6366f1)
  - Professor: Emerald (#10b981)
  - HOD: Amber (#f59e0b)
  - Director: Rose (#ef4444)
- **Framer Motion Animations** - Smooth page transitions and micro-interactions
- **Responsive Design** - Works on desktop and mobile
- **Dark Theme** - Premium dark interface

## 🔐 API Endpoints

| Route | Method | Description | Role |
|-------|--------|-------------|------|
| `/api/auth/register` | POST | Register user | Public |
| `/api/auth/login` | POST | Login | Public |
| `/api/students/projects` | GET/POST | Student projects | Student |
| `/api/professors/evaluate/:id` | POST | Evaluate project | Professor |
| `/api/hod/assign` | POST | Assign professor | HOD |
| `/api/director/analytics` | GET | University stats | Director |

## 🧪 Demo Credentials

Register with any email or use these demo credentials:
- **Email**: student@demo.com / professor@demo.com / hod@demo.com / director@demo.com
- **Password**: 123456

## 📄 License

MIT License - Feel free to use this project for learning and portfolio purposes.

---

Built with ❤️ using MERN Stack
