import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import StudentDashboard from './pages/StudentDashboard';
import ProjectDetails from './pages/ProjectDetails';
import ProfessorDashboard from './pages/ProfessorDashboard';
import HODDashboard from './pages/HODDashboard';
import HODAnalytics from './pages/HODAnalytics';
import DirectorDashboard from './pages/DirectorDashboard';
import './index.css';

// Protected Route Component - Fully open for guest mode
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading, isAuthenticated } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loader"></div>
                <p>Loading...</p>
            </div>
        );
    }

    // Allow guest access - bypass all checks if not authenticated
    if (!isAuthenticated) {
        return children;
    }

    // For authenticated users, check role
    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to={`/${user?.role}/dashboard`} replace />;
    }

    return children;
};

// App Component
function AppContent() {
    return (
        <>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />

                {/* Student Routes */}
                <Route
                    path="/student/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={['student']}>
                            <StudentDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/student/projects"
                    element={
                        <ProtectedRoute allowedRoles={['student']}>
                            <StudentDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/student/submissions"
                    element={
                        <ProtectedRoute allowedRoles={['student']}>
                            <StudentDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/student/results"
                    element={
                        <ProtectedRoute allowedRoles={['student']}>
                            <StudentDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/student/analytics"
                    element={
                        <ProtectedRoute allowedRoles={['student']}>
                            <StudentDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/student/projects/:id"
                    element={
                        <ProtectedRoute allowedRoles={['student']}>
                            <ProjectDetails />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/student/*"
                    element={
                        <ProtectedRoute allowedRoles={['student']}>
                            <StudentDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Professor Routes */}
                <Route
                    path="/professor/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={['professor']}>
                            <ProfessorDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/professor/projects/:id"
                    element={
                        <ProtectedRoute allowedRoles={['professor']}>
                            <ProjectDetails />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/professor/*"
                    element={
                        <ProtectedRoute allowedRoles={['professor']}>
                            <ProfessorDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* HOD Routes */}
                <Route
                    path="/hod/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={['hod']}>
                            <HODDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/hod/analytics"
                    element={
                        <ProtectedRoute allowedRoles={['hod']}>
                            <HODAnalytics />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/hod/*"
                    element={
                        <ProtectedRoute allowedRoles={['hod']}>
                            <HODDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Director Routes */}
                <Route
                    path="/director/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={['director']}>
                            <DirectorDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/director/*"
                    element={
                        <ProtectedRoute allowedRoles={['director']}>
                            <DirectorDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#1e293b',
                        color: '#f8fafc',
                        border: '1px solid rgba(148, 163, 184, 0.1)'
                    },
                    success: {
                        iconTheme: { primary: '#10b981', secondary: '#f8fafc' }
                    },
                    error: {
                        iconTheme: { primary: '#ef4444', secondary: '#f8fafc' }
                    }
                }}
            />
        </>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </Router>
    );
}

export default App;
