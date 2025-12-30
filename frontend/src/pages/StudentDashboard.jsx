import { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FiFolder,
    FiClock,
    FiCheckCircle,
    FiAlertCircle,
    FiPlus,
    FiEye,
    FiEdit2,
    FiSend,
    FiTrash2,
    FiStar,
    FiAward,
    FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/common/Sidebar';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ProjectForm from '../components/student/ProjectForm';
import './Dashboard.css';

// Register ChartJS
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const StudentDashboard = () => {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [professorRankings, setProfessorRankings] = useState(() => {
        const saved = localStorage.getItem('professor_rankings');
        return saved ? JSON.parse(saved) : [];
    });
    const location = useLocation();

    // Determine current view from path
    const getActiveView = () => {
        const path = location.pathname;
        if (path.includes('/projects')) return 'projects';
        if (path.includes('/submissions')) return 'submissions';
        if (path.includes('/results')) return 'results';
        if (path.includes('/analytics')) return 'analytics';
        return 'dashboard';
    };

    const activeView = getActiveView();

    useEffect(() => {
        fetchDashboardData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            fetchDashboardData(true);
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    // Listen for professor ranking changes in localStorage
    useEffect(() => {
        const loadProfessorRankings = () => {
            const saved = localStorage.getItem('professor_rankings');
            setProfessorRankings(saved ? JSON.parse(saved) : []);
        };

        // Reload on window focus to catch changes from professor tab
        const handleFocus = () => loadProfessorRankings();
        window.addEventListener('focus', handleFocus);

        // Listen for storage changes (when professor updates rankings in another tab)
        const handleStorage = (e) => {
            if (e.key === 'professor_rankings') loadProfessorRankings();
        };
        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const fetchDashboardData = async (silent = false) => {
        if (!silent) setLoading(true);
        if (silent) setRefreshing(true);
        try {
            const response = await api.get('/students/dashboard');
            setDashboardData(response.data.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        fetchDashboardData(true);
        toast.success('Dashboard refreshed!');
    };

    const navigate = useNavigate();
    const handleViewProject = (project) => {
        navigate(`/student/projects/${project._id}`);
    };

    const handleEditProject = (project) => {
        setSelectedProject(project);
        setIsEditing(true);
        setShowProjectModal(true);
    };

    const handleNewProject = () => {
        setSelectedProject(null);
        setIsEditing(false);
        setShowProjectModal(true);
    };

    const handleProjectSuccess = () => {
        setShowProjectModal(false);
        setSelectedProject(null);
        setIsEditing(false);
        fetchDashboardData();
    };

    const handleSubmitProject = async (project) => {
        try {
            await api.post(`/students/projects/${project._id}/submit`, {
                notes: 'Submitted for review'
            });
            toast.success('Project submitted for review!');
            fetchDashboardData();
            setShowViewModal(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit project');
        }
    };

    const handleDeleteProject = async (project) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                await api.delete(`/students/projects/${project._id}`);
                toast.success('Project deleted');
                fetchDashboardData();
                setShowViewModal(false);
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to delete project');
            }
        }
    };

    // Get workflow status for a project
    const getWorkflowStatus = (project) => {
        const steps = [
            { key: 'draft', label: 'Draft', completed: true },
            { key: 'submitted', label: 'Submitted', completed: ['submitted', 'under_review', 'approved', 'rejected', 'completed'].includes(project.status) },
            { key: 'under_review', label: 'Under Review', completed: ['under_review', 'approved', 'rejected', 'completed'].includes(project.status) },
            { key: 'evaluated', label: 'Evaluated', completed: project.evaluation !== null },
            { key: 'approved', label: 'Approved', completed: ['approved', 'completed'].includes(project.status) }
        ];
        return steps;
    };

    const stats = dashboardData?.stats || {
        total: 0,
        draft: 0,
        submitted: 0,
        underReview: 0,
        approved: 0,
        rejected: 0,
        completed: 0
    };

    const statCards = [
        { label: 'Total Projects', value: stats.total, icon: FiFolder, color: 'student' },
        { label: 'Submitted', value: stats.submitted, icon: FiClock, color: 'blue' },
        { label: 'Approved', value: stats.approved, icon: FiCheckCircle, color: 'green' },
        { label: 'Under Review', value: stats.underReview, icon: FiAlertCircle, color: 'yellow' }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const allProjects = dashboardData?.recentProjects || [];

    // Filter projects based on active view
    const filteredProjects = () => {
        if (activeView === 'dashboard') return allProjects;
        if (activeView === 'projects') return allProjects;
        if (activeView === 'submissions') {
            return allProjects.filter(p => ['submitted', 'under_review', 'approved', 'rejected', 'completed'].includes(p.status));
        }
        if (activeView === 'results') {
            return allProjects.filter(p => p.evaluation !== null);
        }
        return allProjects;
    };

    const displayProjects = filteredProjects();

    const viewTitles = {
        dashboard: 'Your Projects',
        projects: 'All My Projects',
        submissions: 'My Submissions',
        results: '',
        analytics: 'Project Portfolio Analytics'
    };

    // Analytics Data Preparation
    const prepareAnalyticsData = () => {
        const statusCounts = {
            draft: 0,
            submitted: 0,
            under_review: 0,
            approved: 0,
            rejected: 0,
            completed: 0
        };

        allProjects.forEach(p => {
            if (statusCounts[p.status] !== undefined) {
                statusCounts[p.status]++;
            }
        });

        const statusChartData = {
            labels: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Completed'],
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: [
                    '#94a3b8', // draft
                    '#3b82f6', // submitted
                    '#eab308', // under_review
                    '#22c55e', // approved
                    '#ef4444', // rejected
                    '#8b5cf6', // completed
                ],
                borderWidth: 0
            }]
        };

        // Score analytics
        const evaluatedProjects = allProjects.filter(p => p.evaluation !== null);
        const scoreChartData = {
            labels: evaluatedProjects.map(p => p.title.substring(0, 15) + '...'),
            datasets: [{
                label: 'Project Scores',
                data: evaluatedProjects.map(p => p.evaluation.marks),
                backgroundColor: 'rgba(99, 102, 241, 0.5)',
                borderColor: '#6366f1',
                borderWidth: 2,
                borderRadius: 8
            }]
        };

        return { statusChartData, scoreChartData, evaluatedCount: evaluatedProjects.length };
    };

    const analytics = prepareAnalyticsData();

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: { size: 12 },
                    color: '#f8fafc',
                    generateLabels: function (chart) {
                        const data = chart.data;
                        if (data.labels.length && data.datasets.length) {
                            const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                            return data.labels.map((label, i) => {
                                const value = data.datasets[0].data[i];
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return {
                                    text: `${label}: ${value} (${percentage}%)`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    strokeStyle: data.datasets[0].backgroundColor[i],
                                    fontColor: '#f8fafc',
                                    hidden: false,
                                    index: i,
                                    pointStyle: 'circle'
                                };
                            });
                        }
                        return [];
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                titleColor: '#f8fafc',
                bodyColor: '#f8fafc',
                borderColor: 'rgba(148, 163, 184, 0.3)',
                borderWidth: 1,
                callbacks: {
                    label: function (context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        }
    };

    return (
        <div className="dashboard">
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            <main className={`dashboard-main ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
                {/* Header - Only show in Dashboard view */}
                {activeView === 'dashboard' && (
                    <motion.div
                        className="dashboard-header"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="dashboard-header-content">
                            <h1 className="dashboard-title">Welcome, Student</h1>
                            <p style={{ color: '#94a3b8', marginTop: '4px', fontSize: '0.95rem' }}>Track your projects and submissions</p>
                        </div>
                        <div className="dashboard-actions">
                            <Button
                                variant="secondary"
                                icon={<FiRefreshCw size={18} className={refreshing ? 'spin' : ''} />}
                                onClick={handleRefresh}
                                disabled={refreshing}
                            >
                                Refresh
                            </Button>
                            <Button
                                role="student"
                                icon={<FiPlus size={18} />}
                                onClick={handleNewProject}
                            >
                                New Project
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* Stats Cards - Only show in Dashboard view */}
                {activeView === 'dashboard' && (
                    <motion.div
                        className="stats-grid"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {statCards.map((stat, index) => (
                            <motion.div key={stat.label} variants={itemVariants}>
                                <Card className={`stat-card stat-card-${stat.color}`} animate={false}>
                                    <div className="stat-icon-wrapper">
                                        <stat.icon size={24} />
                                    </div>
                                    <div className="stat-content">
                                        <span className="stat-value">{stat.value}</span>
                                        <span className="stat-label">{stat.label}</span>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Projects Section - Each project with its own workflow */}
                <motion.div
                    className="dashboard-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="section-header">
                        <h2 className="section-title">{viewTitles[activeView]}</h2>
                    </div>

                    {loading ? (
                        <div className="loading-skeleton">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="skeleton skeleton-card" />
                            ))}
                        </div>
                    ) : activeView === 'analytics' ? (
                        <div className="analytics-view">
                            {/* Stats Buttons */}
                            <div className="analytics-stats-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '15px',
                                marginBottom: '25px'
                            }}>
                                <motion.div
                                    whileHover={{ scale: 1.03 }}
                                    style={{
                                        background: 'rgba(99, 102, 241, 0.15)',
                                        border: '2px solid rgba(99, 102, 241, 0.4)',
                                        borderRadius: '16px',
                                        padding: '20px',
                                        boxShadow: '0 5px 20px rgba(99, 102, 241, 0.2)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <FiFolder size={32} style={{ color: '#6366f1' }} />
                                        <span style={{ fontSize: '2.2rem', fontWeight: '800', color: '#fff' }}>
                                            {allProjects.length}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
                                        Total Projects
                                    </div>
                                </motion.div>

                                <motion.div
                                    whileHover={{ scale: 1.03 }}
                                    style={{
                                        background: 'rgba(16, 185, 129, 0.15)',
                                        border: '2px solid rgba(16, 185, 129, 0.4)',
                                        borderRadius: '16px',
                                        padding: '20px',
                                        boxShadow: '0 5px 20px rgba(16, 185, 129, 0.2)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <FiCheckCircle size={32} style={{ color: '#10b981' }} />
                                        <span style={{ fontSize: '2.2rem', fontWeight: '800', color: '#fff' }}>
                                            {allProjects.filter(p => ['completed', 'approved', 'submitted'].includes(p.status)).length}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
                                        Completed
                                    </div>
                                </motion.div>

                                <motion.div
                                    whileHover={{ scale: 1.03 }}
                                    style={{
                                        background: 'rgba(245, 158, 11, 0.15)',
                                        border: '2px solid rgba(245, 158, 11, 0.4)',
                                        borderRadius: '16px',
                                        padding: '20px',
                                        boxShadow: '0 5px 20px rgba(245, 158, 11, 0.2)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <FiClock size={32} style={{ color: '#f59e0b' }} />
                                        <span style={{ fontSize: '2.2rem', fontWeight: '800', color: '#fff' }}>
                                            {allProjects.filter(p => ['pending', 'draft'].includes(p.status)).length}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
                                        Pending
                                    </div>
                                </motion.div>

                                <motion.div
                                    whileHover={{ scale: 1.03 }}
                                    style={{
                                        background: 'rgba(59, 130, 246, 0.15)',
                                        border: '2px solid rgba(59, 130, 246, 0.4)',
                                        borderRadius: '16px',
                                        padding: '20px',
                                        boxShadow: '0 5px 20px rgba(59, 130, 246, 0.2)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <FiAlertCircle size={32} style={{ color: '#3b82f6' }} />
                                        <span style={{ fontSize: '2.2rem', fontWeight: '800', color: '#fff' }}>
                                            {allProjects.filter(p => p.status === 'under_review').length}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
                                        Under Review
                                    </div>
                                </motion.div>
                            </div>

                            <div className="analytics-grid">
                                <Card className="analytics-card chart-card">
                                    <h3>Project Status Distribution</h3>
                                    <div className="chart-container" style={{ height: '300px' }}>
                                        <Doughnut data={analytics.statusChartData} options={chartOptions} />
                                    </div>
                                </Card>

                                <Card className="analytics-card chart-card">
                                    <h3>Performance Overview</h3>
                                    {analytics.evaluatedCount > 0 ? (
                                        <div className="chart-container" style={{ height: '300px' }}>
                                            <Bar
                                                data={analytics.scoreChartData}
                                                options={{
                                                    ...chartOptions,
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            max: 100,
                                                            ticks: { color: '#94a3b8' },
                                                            grid: { color: 'rgba(148, 163, 184, 0.1)' }
                                                        },
                                                        x: {
                                                            ticks: { color: '#94a3b8' },
                                                            grid: { display: false }
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="empty-chart-state">
                                            <FiAward size={48} />
                                            <p>No graded projects yet to display performance data.</p>
                                        </div>
                                    )}
                                </Card>
                            </div>

                            <div className="analytics-summary-grid">
                                <Card className="summary-card">
                                    <h4>Average Score</h4>
                                    <div className="summary-value">
                                        {analytics.evaluatedCount > 0
                                            ? Math.round(allProjects.reduce((acc, p) => acc + (p.evaluation?.marks || 0), 0) / analytics.evaluatedCount)
                                            : '--'}
                                        <span className="unit">/100</span>
                                    </div>
                                </Card>
                                <Card className="summary-card">
                                    <h4>Submission Rate</h4>
                                    <div className="summary-value">
                                        {allProjects.length > 0
                                            ? Math.round(allProjects.filter(p => ['submitted', 'under_review', 'approved', 'completed'].includes(p.status)).length / allProjects.length * 100)
                                            : 0}
                                        <span className="unit">/100</span>
                                    </div>
                                </Card>
                                <Card className="summary-card">
                                    <h4>Completion Rate</h4>
                                    <div className="summary-value">
                                        {allProjects.length > 0
                                            ? Math.round(allProjects.filter(p => ['completed', 'approved', 'submitted'].includes(p.status)).length / allProjects.length * 100)
                                            : 0}
                                        <span className="unit">%</span>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    ) : activeView === 'results' ? (
                        <div className="rankings-list-view">
                            {/* Animated Winner Header */}
                            {(() => {
                                const evaluatedProjects = (displayProjects || [])
                                    .filter(p => p.evaluation?.marks)
                                    .map(p => ({
                                        _id: p._id,
                                        title: p.title,
                                        score: p.evaluation.marks,
                                        isAuto: true
                                    }));
                                const allRankings = [...professorRankings, ...evaluatedProjects];
                                const sorted = allRankings.sort((a, b) => (b.score || 0) - (a.score || 0));
                                const winner = sorted[0];

                                if (winner) {
                                    return (
                                        <motion.div
                                            className="winner-celebration-header"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileHover={{
                                                scale: 1.02,
                                                boxShadow: '0 35px 100px rgba(102, 126, 234, 0.7), 0 15px 50px rgba(245, 87, 108, 0.5)'
                                            }}
                                            transition={{ duration: 0.6, ease: "easeOut" }}
                                            style={{
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #ffd93d 100%)',
                                                borderRadius: '24px',
                                                padding: '20px 40px',
                                                marginBottom: '20px',
                                                textAlign: 'center',
                                                position: 'relative',
                                                overflow: 'visible',
                                                boxShadow: '0 25px 80px rgba(102, 126, 234, 0.5), 0 10px 40px rgba(245, 87, 108, 0.3)'
                                            }}
                                        >
                                            {/* Animated Sparkles */}
                                            <div style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                pointerEvents: 'none'
                                            }}>
                                                {[...Array(20)].map((_, i) => (
                                                    <motion.div
                                                        key={i}
                                                        animate={{
                                                            opacity: [0, 1, 0],
                                                            scale: [0, 1, 0]
                                                        }}
                                                        transition={{
                                                            duration: 2,
                                                            repeat: Infinity,
                                                            delay: i * 0.2
                                                        }}
                                                        style={{
                                                            position: 'absolute',
                                                            top: `${Math.random() * 100}%`,
                                                            left: `${Math.random() * 100}%`,
                                                            fontSize: '20px'
                                                        }}
                                                    >
                                                        ✨
                                                    </motion.div>
                                                ))}
                                            </div>

                                            {/* Floating Stars */}
                                            <div style={{ position: 'absolute', top: '10%', left: '5%', fontSize: '30px' }}>⭐</div>
                                            <div style={{ position: 'absolute', top: '15%', right: '8%', fontSize: '25px' }}>🌟</div>
                                            <div style={{ position: 'absolute', bottom: '15%', left: '10%', fontSize: '25px' }}>💫</div>
                                            <div style={{ position: 'absolute', bottom: '10%', right: '5%', fontSize: '30px' }}>⭐</div>

                                            {/* Trophy */}
                                            <motion.div
                                                animate={{
                                                    y: [0, -15, 0],
                                                    rotate: [0, -8, 8, 0],
                                                    scale: [1, 1.1, 1]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                                style={{
                                                    fontSize: '70px',
                                                    marginBottom: '8px',
                                                    filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))'
                                                }}
                                            >
                                                🏆
                                            </motion.div>

                                            <motion.h2
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 }}
                                                style={{
                                                    color: '#ffffff',
                                                    fontSize: '1.8rem',
                                                    fontWeight: '900',
                                                    marginBottom: '8px',
                                                    textShadow: '3px 3px 6px rgba(0,0,0,0.3), 0 0 30px rgba(255,255,255,0.5)',
                                                    letterSpacing: '2px'
                                                }}
                                            >
                                                � CONGRATULATIONS! �
                                            </motion.h2>

                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.5 }}
                                                style={{
                                                    display: 'inline-block',
                                                    background: 'linear-gradient(90deg, #ffd93d, #ff6b6b)',
                                                    padding: '5px 20px',
                                                    borderRadius: '30px',
                                                    marginBottom: '8px'
                                                }}
                                            >
                                                <span style={{
                                                    color: '#1a1a2e',
                                                    fontSize: '1.3rem',
                                                    fontWeight: '800'
                                                }}>
                                                    🥇 1st PLACE WINNER 🥇
                                                </span>
                                            </motion.div>

                                            <motion.h3
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.7 }}
                                                style={{
                                                    color: '#ffffff',
                                                    fontSize: '1.4rem',
                                                    fontWeight: '700',
                                                    marginBottom: '8px',
                                                    textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                                                }}
                                            >
                                                🎯 {winner.title}
                                            </motion.h3>

                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.9 }}
                                                style={{
                                                    display: 'inline-block',
                                                    background: 'linear-gradient(135deg, #1a1a2e, #2d2d44)',
                                                    padding: '12px 35px',
                                                    borderRadius: '40px',
                                                    border: '3px solid rgba(255,255,255,0.3)',
                                                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                                                }}
                                            >
                                                <span style={{
                                                    background: 'linear-gradient(90deg, #ffd93d, #ff6b6b, #c44cff)',
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent',
                                                    fontSize: '1.5rem',
                                                    fontWeight: '800'
                                                }}>
                                                    🌟 Score: {winner.score} 🌟
                                                </span>
                                            </motion.div>
                                        </motion.div>
                                    );
                                }
                                return null;
                            })()}

                            <div className="assigned-table-card">
                                <div className="table-container">
                                    <table className="table rankings-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '20%' }}>Rank</th>
                                                <th>Project Title</th>
                                                <th style={{ width: '15%' }}>Score</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                // Combine custom rankings with evaluated projects
                                                const evaluatedProjects = (displayProjects || [])
                                                    .filter(p => p.evaluation?.marks)
                                                    .map(p => ({
                                                        _id: p._id,
                                                        title: p.title,
                                                        score: p.evaluation.marks,
                                                        isAuto: true
                                                    }));

                                                const allRankings = [...professorRankings, ...evaluatedProjects];
                                                const sorted = allRankings.sort((a, b) => (b.score || 0) - (a.score || 0));

                                                if (sorted.length === 0) {
                                                    return (
                                                        <tr>
                                                            <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                                                No rankings available yet.
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                return sorted.map((project, index) => {
                                                    const rank = index + 1;
                                                    return (
                                                        <motion.tr
                                                            key={project._id}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: index * 0.05 }}
                                                            className={rank === 1 ? 'rank-first' : rank === 2 ? 'rank-second' : rank === 3 ? 'rank-third' : ''}
                                                        >
                                                            <td>
                                                                <div className={`rank-badge ${rank === 1 ? 'rank-gold' : rank === 2 ? 'rank-silver' : rank === 3 ? 'rank-bronze' : ''}`}>
                                                                    {rank === 1 ? '🏆' : rank === 2 ? '🥇' : rank === 3 ? '🥈' : ''} #{rank}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="project-list-title">{project.title}</span>
                                                                {project.isAuto && <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#6366f1' }}>(Auto)</span>}
                                                            </td>
                                                            <td>
                                                                <span className="score-badge">{project.score}</span>
                                                            </td>
                                                        </motion.tr>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : displayProjects.length > 0 ? (
                        <div className="projects-with-workflows">
                            {displayProjects.map((project, index) => (
                                <motion.div
                                    key={project._id}
                                    className="project-workflow-container"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.15 }}
                                >
                                    {/* Project Card */}
                                    <Card className="project-card" role="student" hover>
                                        <div className="project-card-content">
                                            <div className="project-info">
                                                <h3 className="project-title">{project.title}</h3>
                                                <p className="project-description">
                                                    {project.description?.substring(0, 150)}...
                                                </p>
                                                <div className="project-meta">
                                                    <StatusBadge status={project.status} />
                                                    {project.assignedProfessor && (
                                                        <span className="project-professor">
                                                            Prof. {project.assignedProfessor.name}
                                                        </span>
                                                    )}
                                                    {project.evaluation && (
                                                        <span className="project-score">
                                                            <FiStar size={14} />
                                                            {project.evaluation.marks}/100
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="project-actions">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    icon={<FiEye size={16} />}
                                                    onClick={() => handleViewProject(project)}
                                                >
                                                    View
                                                </Button>
                                                {project.status === 'draft' && (
                                                    <>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            icon={<FiEdit2 size={16} />}
                                                            onClick={() => handleEditProject(project)}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            role="student"
                                                            size="sm"
                                                            icon={<FiSend size={16} />}
                                                            onClick={() => handleSubmitProject(project)}
                                                        >
                                                            Submit
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Project Workflow Card - Only show in Dashboard view to keep other views focused */}
                                    {activeView === 'dashboard' && (
                                        <Card className="workflow-card">
                                            <div className="workflow-header">
                                                <span className="workflow-title">📊 {project.title} - Workflow</span>
                                                {project.evaluation && (
                                                    <span className="workflow-score">
                                                        <FiAward size={16} />
                                                        Score: {project.evaluation.marks}/100
                                                    </span>
                                                )}
                                            </div>
                                            <div className="timeline">
                                                {/* Green progress line */}
                                                <div
                                                    className="timeline-progress"
                                                    style={{
                                                        width: `${(getWorkflowStatus(project).filter(s => s.completed).length - 1) / (getWorkflowStatus(project).length - 1) * 100}%`
                                                    }}
                                                />
                                                {getWorkflowStatus(project).map((step, idx) => (
                                                    <div
                                                        key={step.key}
                                                        className={`timeline-step ${step.completed ? 'completed' : ''}`}
                                                    >
                                                        <div className="timeline-dot">
                                                            {step.completed && <FiCheckCircle size={14} />}
                                                        </div>
                                                        <span className="timeline-label">{step.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <FiFolder size={48} />
                            <h3>No projects yet</h3>
                            <p>Create your first project to get started</p>
                            <Button
                                role="student"
                                icon={<FiPlus size={18} />}
                                onClick={handleNewProject}
                            >
                                Create Project
                            </Button>
                        </div>
                    )}
                </motion.div>

                {/* Dashboard Analytics Summary - Only show on main dashboard at the bottom */}
                {activeView === 'dashboard' && allProjects.length > 0 && (
                    <motion.div
                        className="dashboard-section"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="section-header">
                            <h2 className="section-title">Portfolio Analytics</h2>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => navigate('/student/analytics')}
                            >
                                View Detailed Analytics
                            </Button>
                        </div>
                        <div className="analytics-grid">
                            <Card className="analytics-card chart-card">
                                <h3>Status Overview</h3>
                                <div className="chart-container" style={{ height: '250px' }}>
                                    <Doughnut data={analytics.statusChartData} options={chartOptions} />
                                </div>
                            </Card>
                            <div className="analytics-summary-grid" style={{ gridTemplateColumns: '1fr' }}>
                                <Card className="summary-card">
                                    <h4>Avg. Score</h4>
                                    <div className="summary-value" style={{ fontSize: '2rem' }}>
                                        {analytics.evaluatedCount > 0
                                            ? Math.round(allProjects.reduce((acc, p) => acc + (p.evaluation?.marks || 0), 0) / analytics.evaluatedCount)
                                            : '--'}
                                        <span className="unit">%</span>
                                    </div>
                                </Card>
                                <Card className="summary-card">
                                    <h4>Completion</h4>
                                    <div className="summary-value" style={{ fontSize: '2rem' }}>
                                        {allProjects.length > 0
                                            ? Math.round(stats.completed / allProjects.length * 100)
                                            : 0}
                                        <span className="unit">%</span>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </motion.div>
                )}
            </main>

            {/* Create/Edit Project Modal */}
            <Modal
                isOpen={showProjectModal}
                onClose={() => {
                    setShowProjectModal(false);
                    setSelectedProject(null);
                    setIsEditing(false);
                }}
                title={isEditing ? 'Edit Project' : 'Create New Project'}
                size="lg"
            >
                <ProjectForm
                    project={isEditing ? selectedProject : null}
                    onSuccess={handleProjectSuccess}
                    onCancel={() => {
                        setShowProjectModal(false);
                        setSelectedProject(null);
                        setIsEditing(false);
                    }}
                />
            </Modal>

            {/* View Project Modal */}
            <Modal
                isOpen={showViewModal}
                onClose={() => {
                    setShowViewModal(false);
                    setSelectedProject(null);
                }}
                title="Project Details"
                size="lg"
            >
                {selectedProject && (
                    <div className="project-details">
                        <div className="project-details-header">
                            <h2>{selectedProject.title}</h2>
                            <StatusBadge status={selectedProject.status} />
                        </div>

                        <div className="project-details-section">
                            <h4>Description</h4>
                            <p>{selectedProject.description}</p>
                        </div>

                        {selectedProject.teamMembers?.length > 0 && (
                            <div className="project-details-section">
                                <h4>Team Members</h4>
                                <div className="team-members-list">
                                    {selectedProject.teamMembers.map((member, idx) => (
                                        <div key={idx} className="team-member-item">
                                            <span className="member-name">{member.name}</span>
                                            <span className="member-email">{member.email}</span>
                                            <span className="member-roll">{member.rollNumber}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedProject.tags?.length > 0 && (
                            <div className="project-details-section">
                                <h4>Tags</h4>
                                <div className="tags-list">
                                    {selectedProject.tags.map((tag, idx) => (
                                        <span key={idx} className="tag">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedProject.assignedProfessor && (
                            <div className="project-details-section">
                                <h4>Assigned Professor</h4>
                                <p>Prof. {selectedProject.assignedProfessor.name}</p>
                            </div>
                        )}

                        {selectedProject.evaluation && (
                            <div className="project-details-section evaluation-section">
                                <h4>📊 Evaluation Results</h4>
                                <div className="evaluation-score-display">
                                    <div className="score-main">
                                        <FiAward size={32} />
                                        <span className="score-value">{selectedProject.evaluation.marks}</span>
                                        <span className="score-max">/100</span>
                                    </div>
                                    {selectedProject.evaluation.evaluator && (
                                        <p className="evaluated-by">
                                            Evaluated by Prof. {selectedProject.evaluation.evaluator.name}
                                        </p>
                                    )}
                                </div>

                                {selectedProject.evaluation.criteria && (
                                    <div className="criteria-breakdown">
                                        <h5>Score Breakdown</h5>
                                        {Object.entries(selectedProject.evaluation.criteria).map(([key, value]) => (
                                            <div key={key} className="criteria-row">
                                                <span className="criteria-name">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                                                <div className="criteria-bar">
                                                    <div
                                                        className="criteria-fill"
                                                        style={{ width: `${(value / 25) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="criteria-value">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {selectedProject.evaluation.feedback && (
                                    <div className="feedback-section">
                                        <h5>Professor Feedback</h5>
                                        <p className="feedback-text">{selectedProject.evaluation.feedback}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="project-details-actions">
                            {selectedProject.status === 'draft' && (
                                <>
                                    <Button
                                        variant="secondary"
                                        icon={<FiEdit2 size={16} />}
                                        onClick={() => {
                                            setShowViewModal(false);
                                            handleEditProject(selectedProject);
                                        }}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        role="student"
                                        icon={<FiSend size={16} />}
                                        onClick={() => handleSubmitProject(selectedProject)}
                                    >
                                        Submit for Review
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        icon={<FiTrash2 size={16} />}
                                        onClick={() => handleDeleteProject(selectedProject)}
                                        className="btn-danger"
                                    >
                                        Delete
                                    </Button>
                                </>
                            )}
                            <Button
                                variant="secondary"
                                onClick={() => setShowViewModal(false)}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default StudentDashboard;
