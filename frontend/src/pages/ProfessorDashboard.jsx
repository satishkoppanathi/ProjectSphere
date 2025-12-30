import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FiFolder,
    FiUsers,
    FiCheckCircle,
    FiClock,
    FiStar,
    FiMessageSquare,
    FiEye,
    FiAward,
    FiThumbsUp,
    FiThumbsDown,
    FiPieChart,
    FiBarChart2,
    FiTrendingUp,
    FiPlus
} from 'react-icons/fi';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    PointElement,
    LineElement,
    Filler
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/common/Sidebar';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import EvaluationForm from '../components/professor/EvaluationForm';
import './Dashboard.css';
import './DirectorDashboard.css';

// Register Chart.js components
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    PointElement,
    LineElement,
    Filler
);

const ProfessorDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showEvalModal, setShowEvalModal] = useState(false);
    const [showRankModal, setShowRankModal] = useState(false);
    const [rankForm, setRankForm] = useState({ rank: '', projectTitle: '', score: '' });
    const [professorRankings, setProfessorRankings] = useState(() => {
        const saved = localStorage.getItem('professor_rankings');
        return saved ? JSON.parse(saved) : [];
    });
    const [selectedProject, setSelectedProject] = useState(null);
    const [filter, setFilter] = useState('all');
    const location = useLocation();
    const [hodAssigned, setHodAssigned] = useState([]);
    const [backendAssigned, setBackendAssigned] = useState([]);

    const getActiveView = () => {
        const path = location.pathname;
        if (path.includes('/projects') && !path.includes('/:id')) return 'assigned';
        if (path.includes('/evaluate')) return 'evaluate';
        if (path.includes('/rankings')) return 'rankings';
        if (path.includes('/analytics')) return 'analytics';
        return 'dashboard';
    };

    const activeView = getActiveView();

    useEffect(() => {
        fetchDashboardData();
        fetchAssignedProjects();
        const loadHodAssignments = () => {
            const saved = localStorage.getItem('hod_newly_assigned');
            if (saved) {
                try {
                    const all = JSON.parse(saved);
                    // Show ALL projects from HOD assignments (no filtering)
                    setHodAssigned(all);
                } catch (e) {
                    setHodAssigned([]);
                }
            }
        };
        loadHodAssignments();

        // Also reload on focus to catch changes from HOD tab
        const handleFocus = () => {
            loadHodAssignments();
            fetchAssignedProjects();
        };
        window.addEventListener('focus', handleFocus);

        const handleStorage = (e) => {
            if (e.key === 'hod_newly_assigned') loadHodAssignments();
        };
        window.addEventListener('storage', handleStorage);
        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('focus', handleFocus);
        };
    }, [user?.name]);

    const fetchAssignedProjects = async () => {
        try {
            const response = await api.get('/professors/projects');
            if (response.data.success) {
                // Transform backend data to match the format used for display
                const projects = response.data.data.map((p, index) => ({
                    _id: p._id,
                    title: p.title,
                    team: p.team || `Team ${index + 1}`,
                    status: p.status,
                    description: p.description,
                    submittedBy: p.submittedBy,
                    isReal: true
                }));
                setBackendAssigned(projects);
            }
        } catch (error) {
            console.error('Failed to fetch assigned projects:', error);
        }
    };

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/professors/dashboard');
            setDashboardData(response.data.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEvaluate = (project) => {
        setSelectedProject(project);
        setShowEvalModal(true);
    };

    const handleViewProject = (project) => {
        navigate(`/professor/projects/${project._id}`);
    };

    const handleEvaluationComplete = () => {
        setShowEvalModal(false);
        setSelectedProject(null);
        toast.success('Evaluation submitted successfully!');
        fetchDashboardData();
    };



    const handleApprove = async (project) => {
        try {
            await api.put(`/professors/projects/${project._id}/status`, { status: 'approved' });
            toast.success('Project approved!');
            fetchDashboardData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve');
        }
    };

    const handleReject = async (project) => {
        try {
            await api.put(`/professors/projects/${project._id}/status`, { status: 'rejected' });
            toast.success('Project rejected');
            fetchDashboardData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject');
        }
    };

    const stats = dashboardData?.stats || {
        totalAssigned: 0,
        departmentProjects: 0,
        evaluated: 0,
        pending: 0,
        submitted: 0,
        underReview: 0,
        approved: 0
    };

    const statCards = [
        { label: 'Dept Projects', value: stats.departmentProjects, icon: FiFolder, color: 'professor' },
        { label: 'Evaluated', value: stats.evaluated, icon: FiCheckCircle, color: 'green' },
        { label: 'Pending', value: stats.pending, icon: FiClock, color: 'yellow' },
        { label: 'Approved', value: stats.approved, icon: FiAward, color: 'blue' }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const filteredProjects = dashboardData?.recentProjects?.filter(p => {
        if (filter === 'all') return true;
        if (filter === 'pending') return !p.hasEvaluated;
        if (filter === 'evaluated') return p.hasEvaluated;
        return p.status === filter;
    }) || [];

    const evaluationProjects = dashboardData?.recentProjects?.filter(p => !p.hasEvaluated) || [];

    // Construct the 10 assigned projects for the specific view
    const realTitles = [
        'ProjectSphere - University Project Management System',
        '# 🍔 BiteBuddy – MERN Food Delivery Platform',
        '🧠 AI SaaS Starter Kit',
        '🧠 Brain Tumor Segmentation using Machine Learning'
    ];

    const sampleProjectsData = [
        { team: 'Team 5', title: 'Advanced Robotics Control System' },
        { team: 'Team 6', title: 'Blockchain-based Supply Chain Tracking' },
        { team: 'Team 7', title: 'Smart Home Automation with IoT' },
        { team: 'Team 8', title: 'E-Learning Platform with Gamification' },
        { team: 'Team 9', title: 'Cybersecurity Threat Detection Tool' },
        { team: 'Team 10', title: 'Autonomous Drone Navigation System' }
    ];

    // Combine projects from backend (assignedProfessor) and HOD localStorage, deduplicate by ID or title
    const allAssignedProjects = useMemo(() => {
        // Map backend projects with team numbers
        const combined = backendAssigned.map((p, index) => ({
            ...p,
            team: `Team ${index + 1}`
        }));
        const existingIds = new Set(backendAssigned.map(p => p._id));
        const existingTitles = new Set(backendAssigned.map(p => p.title?.toLowerCase()));

        // Add ALL localStorage projects with continued team numbering (no limit)
        let teamCounter = combined.length + 1;
        hodAssigned.forEach(p => {
            // Only add if not already present (by ID or title)
            if (!existingIds.has(p._id) && !existingTitles.has(p.title?.toLowerCase())) {
                combined.push({
                    ...p,
                    team: `Team ${teamCounter++}`
                });
            }
        });

        return combined;
    }, [backendAssigned, hodAssigned]);

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
                            <h1 className="dashboard-title">Welcome, Professor</h1>
                            <p style={{ color: '#94a3b8', marginTop: '4px', fontSize: '0.95rem' }}>Manage and evaluate your assigned projects</p>
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

                <motion.div
                    className="dashboard-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="section-header">
                        <h2 className="section-title">
                            {activeView === 'assigned' ? 'All Assigned Projects' :
                                activeView === 'evaluate' ? 'Projects Needing Evaluation' :
                                    activeView === 'rankings' ? '' :
                                        activeView === 'analytics' ? '' :
                                            'Department Projects'}
                        </h2>
                        <div className="dashboard-actions">
                            {activeView === 'dashboard' && (
                                <div className="filter-buttons">
                                    {['all', 'pending', 'evaluated', 'submitted', 'approved'].map((f) => (
                                        <Button
                                            key={f}
                                            variant={filter === f ? 'primary' : 'secondary'}
                                            size="sm"
                                            onClick={() => setFilter(f)}
                                        >
                                            {f.charAt(0).toUpperCase() + f.slice(1)}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="projects-list">
                        {loading ? (
                            <div className="loading-skeleton">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="skeleton skeleton-card" />
                                ))}
                            </div>
                        ) : activeView === 'assigned' ? (
                            <div className="assigned-list-view">
                                <Card className="assigned-table-card">
                                    <div className="table-container">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Team</th>
                                                    <th>Project Title</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allAssignedProjects.map((project, index) => (
                                                    <motion.tr
                                                        key={project._id || `project-${index}`}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                    >
                                                        <td className="team-col">
                                                            <div className="team-id-badge">{project.team}</div>
                                                        </td>
                                                        <td className="title-col">
                                                            <span className="project-list-title">{project.title}</span>
                                                            {project.isReal && <span className="real-indicator">Live</span>}
                                                        </td>
                                                        <td className="status-col">
                                                            <StatusBadge status={project.status || 'submitted'} />
                                                        </td>
                                                        <td className="actions-col">
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                icon={<FiEye size={14} />}
                                                                onClick={() => {
                                                                    setSelectedProject(project);
                                                                    setShowEvalModal(true);
                                                                }}
                                                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                                            >
                                                                View
                                                            </Button>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </div>
                        ) : activeView === 'evaluate' ? (
                            <div className="evaluation-list-view">
                                {evaluationProjects.length > 0 ? (
                                    evaluationProjects.map((project, index) => (
                                        <motion.div
                                            key={project._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <Card className="project-card" role="professor" hover>
                                                <div className="project-card-content">
                                                    <div className="project-info">
                                                        <h3 className="project-title">{project.title}</h3>
                                                        <p className="project-description">
                                                            {project.description?.substring(0, 100)}...
                                                        </p>
                                                        <div className="project-meta">
                                                            <StatusBadge status={project.status} />
                                                            <span className="project-student">
                                                                <FiUsers size={14} />
                                                                {project.submittedBy?.name}
                                                            </span>
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
                                                        <Button
                                                            role="professor"
                                                            size="sm"
                                                            icon={<FiCheckCircle size={16} />}
                                                            onClick={() => handleEvaluate(project)}
                                                        >
                                                            Evaluate
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="empty-state">
                                        <FiCheckCircle size={48} />
                                        <h3>All caught up!</h3>
                                        <p>No projects are currently awaiting evaluation.</p>
                                    </div>
                                )}
                            </div>
                        ) : activeView === 'rankings' ? (
                            <div className="rankings-list-view">
                                <div className="section-header" style={{ marginBottom: '20px' }}>
                                    <h2 className="section-title">Project Rankings</h2>
                                    <Button
                                        role="professor"
                                        icon={<FiPlus size={18} />}
                                        onClick={() => setShowRankModal(true)}
                                    >
                                        Add Rank
                                    </Button>
                                </div>
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
                                                    // Get evaluated projects from dashboard data
                                                    const evaluatedProjects = (dashboardData?.recentProjects || [])
                                                        .filter(p => p.evaluation?.marks)
                                                        .map(p => ({
                                                            _id: p._id,
                                                            title: p.title,
                                                            score: p.evaluation.marks,
                                                            isAuto: true
                                                        }));

                                                    // Combine with custom rankings
                                                    const allRankings = [...professorRankings, ...evaluatedProjects];

                                                    // Sort by score descending
                                                    const sorted = allRankings.sort((a, b) => (b.score || 0) - (a.score || 0));

                                                    if (sorted.length === 0) {
                                                        return (
                                                            <tr>
                                                                <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                                                    No rankings yet. Evaluate projects or click "Add Rank" to add rankings.
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
                        ) : activeView === 'analytics' ? (
                            <div className="analytics-view">
                                {/* Analytics Header */}
                                <motion.div
                                    className="dashboard-header"
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div className="dashboard-header-content">
                                        <h1 className="dashboard-title">Project Analytics</h1>
                                    </div>
                                </motion.div>

                                {/* Analytics Stats Cards */}
                                <motion.div
                                    className="stats-grid"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    {(() => {
                                        // Use hodAssigned as primary source (matches assigned projects section)
                                        const allProjects = Array.isArray(hodAssigned) ? hodAssigned : [];

                                        const totalAssigned = allProjects.length;
                                        // Submitted means student has completed and submitted, so count as completed
                                        const completedCount = allProjects.filter(p =>
                                            p && (p.status === 'completed' ||
                                                p.status === 'approved' ||
                                                p.status === 'submitted')
                                        ).length;
                                        const inProgressCount = allProjects.filter(p =>
                                            p && (p.status === 'under_review' ||
                                                p.status === 'draft' ||
                                                p.status === 'pending')
                                        ).length;
                                        const completionRate = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

                                        return (
                                            <>
                                                <Card className="stat-card stat-card-professor" animate={false}>
                                                    <div className="stat-icon-wrapper"><FiFolder size={24} /></div>
                                                    <div className="stat-content">
                                                        <span className="stat-value">{totalAssigned}</span>
                                                        <span className="stat-label">Total Assigned</span>
                                                    </div>
                                                </Card>
                                                <Card className="stat-card stat-card-green" animate={false}>
                                                    <div className="stat-icon-wrapper"><FiCheckCircle size={24} /></div>
                                                    <div className="stat-content">
                                                        <span className="stat-value">{completedCount}</span>
                                                        <span className="stat-label">Completed</span>
                                                    </div>
                                                </Card>
                                                <Card className="stat-card stat-card-yellow" animate={false}>
                                                    <div className="stat-icon-wrapper"><FiClock size={24} /></div>
                                                    <div className="stat-content">
                                                        <span className="stat-value">{inProgressCount}</span>
                                                        <span className="stat-label">In Progress</span>
                                                    </div>
                                                </Card>
                                                <Card className="stat-card stat-card-blue" animate={false}>
                                                    <div className="stat-icon-wrapper"><FiTrendingUp size={24} /></div>
                                                    <div className="stat-content">
                                                        <span className="stat-value">{completionRate}/100</span>
                                                        <span className="stat-label">Completion Rate</span>
                                                    </div>
                                                </Card>
                                            </>
                                        );
                                    })()}
                                </motion.div>

                                {/* Charts Grid */}
                                <div className="charts-grid">
                                    <motion.div
                                        className="chart-container"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <div className="chart-header">
                                            <FiPieChart size={20} />
                                            <h3 className="chart-title">Project Status Distribution</h3>
                                        </div>
                                        <div className="chart-wrapper donut-chart">
                                            <Doughnut
                                                data={{
                                                    labels: ['Completed', 'In Progress', 'Under Review', 'Draft'],
                                                    datasets: [{
                                                        data: [
                                                            // Completed = submitted + approved + completed
                                                            (Array.isArray(hodAssigned) ? hodAssigned : []).filter(p =>
                                                                p && (p.status === 'submitted' || p.status === 'approved' || p.status === 'completed')
                                                            ).length,
                                                            // In Progress = pending
                                                            (Array.isArray(hodAssigned) ? hodAssigned : []).filter(p =>
                                                                p && p.status === 'pending'
                                                            ).length,
                                                            // Under Review
                                                            (Array.isArray(hodAssigned) ? hodAssigned : []).filter(p =>
                                                                p && p.status === 'under_review'
                                                            ).length,
                                                            // Draft
                                                            (Array.isArray(hodAssigned) ? hodAssigned : []).filter(p =>
                                                                p && p.status === 'draft'
                                                            ).length
                                                        ],
                                                        backgroundColor: [
                                                            '#10b981', // Completed - Green
                                                            '#f59e0b', // In Progress - Amber
                                                            '#6366f1', // Under Review - Indigo
                                                            '#94a3b8'  // Draft - Gray
                                                        ],
                                                        borderWidth: 0
                                                    }]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: {
                                                            position: 'bottom',
                                                            labels: {
                                                                color: '#f8fafc',
                                                                padding: 20,
                                                                font: { size: 12 },
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
                                                                                index: i
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
                                                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                                    const value = context.raw;
                                                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                                                    return `${context.label}: ${value} (${percentage}%)`;
                                                                }
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="chart-container"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <div className="chart-header">
                                            <FiBarChart2 size={20} />
                                            <h3 className="chart-title">Team-wise Progress</h3>
                                        </div>
                                        <div className="chart-wrapper">
                                            <Bar
                                                data={{
                                                    labels: hodAssigned.slice(0, 6).map(p => p.team),
                                                    datasets: [{
                                                        label: 'Progress (%)',
                                                        data: hodAssigned.slice(0, 6).map(p =>
                                                            p.status === 'completed' || p.status === 'approved' ? 100 :
                                                                p.status === 'submitted' ? 75 :
                                                                    p.status === 'under_review' ? 50 : 25
                                                        ),
                                                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                                                        borderRadius: 8
                                                    }]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: { legend: { display: false } },
                                                    scales: {
                                                        x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                                                        y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#94a3b8' }, max: 100 }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Student Progress Section */}
                                <motion.div
                                    className="dashboard-section"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <div className="section-header">
                                        <h2 className="section-title">Student Progress Overview</h2>
                                    </div>
                                    <div className="dept-grid">
                                        {hodAssigned.slice(0, 6).map((project, index) => (
                                            <motion.div
                                                key={project._id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.1 * index }}
                                            >
                                                <Card className="dept-card" hover>
                                                    <h4 className="dept-name">{project.team}</h4>
                                                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '12px' }}>{project.title.substring(0, 40)}...</p>
                                                    <div className="dept-progress">
                                                        <div className="progress-bar">
                                                            <div
                                                                className="progress-fill"
                                                                style={{
                                                                    width: `${project.status === 'completed' || project.status === 'approved' ? 100 :
                                                                        project.status === 'submitted' ? 75 :
                                                                            project.status === 'under_review' ? 50 : 25}%`,
                                                                    background: 'var(--gradient-professor)'
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="progress-text">
                                                            {project.status === 'completed' || project.status === 'approved' ? '100%' :
                                                                project.status === 'submitted' ? '75%' :
                                                                    project.status === 'under_review' ? '50%' : '25%'}
                                                        </span>
                                                    </div>
                                                    <StatusBadge status={project.status} />
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>
                        ) : filteredProjects.length > 0 ? (
                            filteredProjects.map((project, index) => (
                                <motion.div
                                    key={project._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className="project-card" role="professor" hover>
                                        <div className="project-card-content">
                                            <div className="project-info">
                                                <h3 className="project-title">{project.title}</h3>
                                                <p className="project-description">
                                                    {project.description?.substring(0, 100)}...
                                                </p>
                                                <div className="project-meta">
                                                    <StatusBadge status={project.status} />
                                                    <span className="project-student">
                                                        <FiUsers size={14} />
                                                        {project.submittedBy?.name}
                                                    </span>
                                                    {project.hasEvaluated && (
                                                        <span className="project-score">
                                                            <FiStar size={14} />
                                                            {project.evaluation?.marks}/100
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
                                                {!project.hasEvaluated ? (
                                                    <Button
                                                        role="professor"
                                                        size="sm"
                                                        icon={<FiMessageSquare size={16} />}
                                                        onClick={() => handleEvaluate(project)}
                                                    >
                                                        Evaluate
                                                    </Button>
                                                ) : (
                                                    <>
                                                        {project.status !== 'approved' && project.status !== 'rejected' && (
                                                            <>
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    icon={<FiThumbsUp size={16} />}
                                                                    onClick={() => handleApprove(project)}
                                                                    className="btn-success"
                                                                >
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    icon={<FiThumbsDown size={16} />}
                                                                    onClick={() => handleReject(project)}
                                                                    className="btn-danger"
                                                                >
                                                                    Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <FiFolder size={48} />
                                <h3>No projects found</h3>
                                <p>No projects match the current filter</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </main>

            {/* Evaluation Modal */}
            <Modal
                isOpen={showEvalModal}
                onClose={() => setShowEvalModal(false)}
                title={`Evaluate: ${selectedProject?.title || ''}`}
                size="lg"
            >
                {selectedProject && (
                    <EvaluationForm
                        project={selectedProject}
                        onSuccess={handleEvaluationComplete}
                        onCancel={() => setShowEvalModal(false)}
                    />
                )}
            </Modal>

            {/* Add Rank Modal */}
            <Modal
                isOpen={showRankModal}
                onClose={() => {
                    setShowRankModal(false);
                    setRankForm({ rank: '', projectTitle: '', score: '' });
                }}
                title="Add New Ranking"
                size="md"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!rankForm.rank || !rankForm.projectTitle || !rankForm.score) {
                            toast.error('Please fill in all fields');
                            return;
                        }
                        const newRank = {
                            _id: `rank-${Date.now()}`,
                            rank: parseInt(rankForm.rank),
                            title: rankForm.projectTitle,
                            score: parseInt(rankForm.score)
                        };
                        const updated = [...professorRankings, newRank];
                        setProfessorRankings(updated);
                        localStorage.setItem('professor_rankings', JSON.stringify(updated));
                        toast.success('Ranking added successfully!');
                        setShowRankModal(false);
                        setRankForm({ rank: '', projectTitle: '', score: '' });
                    }}
                    className="assignment-form"
                >
                    <div className="form-group">
                        <label className="form-label">Rank</label>
                        <input
                            type="number"
                            className="form-input"
                            placeholder="e.g. 1, 2, 3"
                            min="1"
                            value={rankForm.rank}
                            onChange={(e) => setRankForm({ ...rankForm, rank: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Project Title</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Smart City Management System"
                            value={rankForm.projectTitle}
                            onChange={(e) => setRankForm({ ...rankForm, projectTitle: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Score (0-100)</label>
                        <input
                            type="number"
                            className="form-input"
                            placeholder="e.g. 85"
                            min="0"
                            max="100"
                            value={rankForm.score}
                            onChange={(e) => setRankForm({ ...rankForm, score: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-actions">
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={() => {
                                setShowRankModal(false);
                                setRankForm({ rank: '', projectTitle: '', score: '' });
                            }}
                        >
                            Cancel
                        </Button>
                        <Button role="professor" type="submit">
                            Add Ranking
                        </Button>
                    </div>
                </form>
            </Modal>
        </div >
    );
};

export default ProfessorDashboard;
