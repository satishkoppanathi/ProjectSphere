import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FiFolder,
    FiUsers,
    FiCheckCircle,
    FiClock,
    FiTrendingUp,
    FiAward,
    FiBarChart2,
    FiPieChart
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/common/Sidebar';
import Card from '../components/common/Card';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

const HODAnalytics = () => {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState({
        totalProjects: 0,
        totalProfessors: 0,
        totalStudents: 0,
        projectsByStatus: {},
        projectsByDepartment: {},
        professorPerformance: [],
        monthlyProgress: []
    });

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const [dashRes, projRes, profRes] = await Promise.all([
                api.get('/hod/dashboard'),
                api.get('/hod/projects'),
                api.get('/hod/professors')
            ]);

            const projects = projRes.data.data || [];
            const professors = profRes.data.data || [];
            const stats = dashRes.data.data?.stats || {};

            // Get assigned projects from localStorage
            const savedAssignments = localStorage.getItem('hod_newly_assigned');
            const assignedProjects = savedAssignments ? JSON.parse(savedAssignments) : [];

            // Combine all projects (API projects + assigned projects)
            const allProjects = [...projects, ...assignedProjects];
            const totalAssignedProjects = assignedProjects.length;

            // Calculate project status distribution from all projects
            const statusCounts = {
                draft: 0,
                submitted: 0,
                'under-review': 0,
                approved: 0,
                completed: 0,
                rejected: 0
            };
            allProjects.forEach(p => {
                if (statusCounts.hasOwnProperty(p.status)) {
                    statusCounts[p.status]++;
                }
            });

            // Calculate department distribution from assigned projects
            const deptCounts = {
                CSE: 0, IT: 0, ECE: 0, EEE: 0, MECH: 0, CIVIL: 0, CHEMICAL: 0
            };
            allProjects.forEach(p => {
                const dept = p.department || 'CSE';
                if (dept === 'Computer Science' || dept === 'CSE') {
                    deptCounts.CSE++;
                } else if (dept === 'Information Technology' || dept === 'IT') {
                    deptCounts.IT++;
                } else if (dept === 'Electronics' || dept === 'ECE') {
                    deptCounts.ECE++;
                } else if (dept === 'Electrical' || dept === 'EEE') {
                    deptCounts.EEE++;
                } else if (dept === 'Mechanical' || dept === 'MECH') {
                    deptCounts.MECH++;
                } else if (dept === 'Civil' || dept === 'CIVIL') {
                    deptCounts.CIVIL++;
                } else if (dept === 'Chemical' || dept === 'CHEMICAL') {
                    deptCounts.CHEMICAL++;
                } else if (deptCounts.hasOwnProperty(dept)) {
                    deptCounts[dept]++;
                }
            });

            // Calculate professor performance (projects assigned and evaluated)
            const profPerformance = professors.map(prof => ({
                name: prof.name,
                assigned: projects.filter(p => p.assignedProfessor?._id === prof._id).length,
                evaluated: projects.filter(p => p.assignedProfessor?._id === prof._id && (p.status === 'approved' || p.status === 'completed')).length
            }));

            // Add CSE Professor from assigned projects
            const cseProfAssigned = assignedProjects.filter(p => p.professor === 'CSE Professor').length;
            if (cseProfAssigned > 0) {
                profPerformance.push({
                    name: 'CSE Professor',
                    assigned: cseProfAssigned,
                    evaluated: assignedProjects.filter(p => p.professor === 'CSE Professor' && (p.status === 'approved' || p.status === 'completed' || p.status === 'submitted')).length
                });
            }

            // Monthly progress simulation (based on project creation dates)
            const monthlyData = [
                { month: 'Jul', submitted: 3, completed: 1 },
                { month: 'Aug', submitted: 5, completed: 2 },
                { month: 'Sep', submitted: 8, completed: 4 },
                { month: 'Oct', submitted: 12, completed: 6 },
                { month: 'Nov', submitted: 15, completed: 10 },
                { month: 'Dec', submitted: allProjects.length, completed: statusCounts.completed + statusCounts.approved }
            ];

            setAnalytics({
                totalProjects: totalAssignedProjects, // Use assigned projects count
                totalProfessors: professors.length + (cseProfAssigned > 0 ? 1 : 0),
                totalStudents: stats.totalStudents || allProjects.length,
                projectsByStatus: statusCounts,
                projectsByDepartment: deptCounts,
                professorPerformance: profPerformance,
                monthlyProgress: monthlyData
            });
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { label: 'Total Projects', value: analytics.totalProjects, icon: FiFolder, color: '#6366f1' },
        { label: 'Total Professors', value: analytics.totalProfessors, icon: FiUsers, color: '#10b981' },
        { label: 'Total Students', value: analytics.totalStudents, icon: FiUsers, color: '#3b82f6' },
        { label: 'Completion Rate', value: `${analytics.totalProjects > 0 ? Math.round(((analytics.projectsByStatus.completed || 0) + (analytics.projectsByStatus.approved || 0)) / analytics.totalProjects * 100) : 0}%`, icon: FiTrendingUp, color: '#f59e0b' }
    ];

    // Chart configurations
    const statusChartData = {
        labels: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Completed', 'Rejected'],
        datasets: [{
            data: [
                analytics.projectsByStatus.draft || 0,
                analytics.projectsByStatus.submitted || 0,
                analytics.projectsByStatus['under-review'] || 0,
                analytics.projectsByStatus.approved || 0,
                analytics.projectsByStatus.completed || 0,
                analytics.projectsByStatus.rejected || 0
            ],
            backgroundColor: ['#64748b', '#3b82f6', '#f59e0b', '#10b981', '#6366f1', '#ef4444'],
            borderWidth: 0
        }]
    };

    const departmentChartData = {
        labels: ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEMICAL'],
        datasets: [{
            label: 'Projects',
            data: [
                analytics.projectsByDepartment.CSE || 0,
                analytics.projectsByDepartment.IT || 0,
                analytics.projectsByDepartment.ECE || 0,
                analytics.projectsByDepartment.EEE || 0,
                analytics.projectsByDepartment.MECH || 0,
                analytics.projectsByDepartment.CIVIL || 0,
                analytics.projectsByDepartment.CHEMICAL || 0
            ],
            backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'],
            borderRadius: 8
        }]
    };

    const progressChartData = {
        labels: analytics.monthlyProgress.map(m => m.month),
        datasets: [
            {
                label: 'Submitted',
                data: analytics.monthlyProgress.map(m => m.submitted),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Completed',
                data: analytics.monthlyProgress.map(m => m.completed),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const chartOptions = {
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
    };

    const barChartOptions = {
        ...chartOptions,
        scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
            y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#94a3b8' } }
        }
    };

    return (
        <div className="dashboard">
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            <main className={`dashboard-main ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
                <motion.div
                    className="dashboard-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="dashboard-header-content">
                        <h1 className="dashboard-title">Analytics Dashboard</h1>
                        <p style={{ color: '#94a3b8', marginTop: '4px' }}>Overview of projects, professors, and student progress</p>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <motion.div
                    className="stats-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    {statCards.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="stat-card" animate={false}>
                                <div className="stat-icon-wrapper" style={{ background: `${stat.color}20` }}>
                                    <stat.icon size={24} style={{ color: stat.color }} />
                                </div>
                                <div className="stat-content">
                                    <span className="stat-value">{stat.value}</span>
                                    <span className="stat-label">{stat.label}</span>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Charts Row 1 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '24px' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="chart-card">
                            <div className="chart-header">
                                <h3 style={{ color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <FiPieChart size={20} style={{ color: '#6366f1' }} />
                                    Project Status Distribution
                                </h3>
                            </div>
                            <div style={{ height: '300px', padding: '20px' }}>
                                {!loading && <Doughnut data={statusChartData} options={chartOptions} />}
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card className="chart-card">
                            <div className="chart-header">
                                <h3 style={{ color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <FiBarChart2 size={20} style={{ color: '#10b981' }} />
                                    Projects by Department
                                </h3>
                            </div>
                            <div style={{ height: '300px', padding: '20px' }}>
                                {!loading && <Bar data={departmentChartData} options={barChartOptions} />}
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* Charts Row 2 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    style={{ marginTop: '24px' }}
                >
                    <Card className="chart-card">
                        <div className="chart-header">
                            <h3 style={{ color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FiTrendingUp size={20} style={{ color: '#3b82f6' }} />
                                Monthly Project Progress
                            </h3>
                        </div>
                        <div style={{ height: '300px', padding: '20px' }}>
                            {!loading && <Line data={progressChartData} options={barChartOptions} />}
                        </div>
                    </Card>
                </motion.div>

                {/* Professor Performance Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    style={{ marginTop: '24px' }}
                >
                    <Card className="dashboard-section">
                        <div className="section-header">
                            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FiAward size={20} style={{ color: '#f59e0b' }} />
                                Professor Performance
                            </h2>
                        </div>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Professor</th>
                                        <th>Assigned Projects</th>
                                        <th>Evaluated</th>
                                        <th>Performance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.professorPerformance.length > 0 ? (
                                        analytics.professorPerformance.map((prof, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '50%',
                                                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 'bold',
                                                            fontSize: '0.9rem'
                                                        }}>
                                                            {prof.name?.charAt(0) || 'P'}
                                                        </div>
                                                        {prof.name}
                                                    </div>
                                                </td>
                                                <td>{prof.assigned}</td>
                                                <td>{prof.evaluated}</td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{
                                                            width: '100px',
                                                            height: '8px',
                                                            background: 'rgba(148, 163, 184, 0.2)',
                                                            borderRadius: '4px',
                                                            overflow: 'hidden'
                                                        }}>
                                                            <div style={{
                                                                width: `${prof.assigned > 0 ? (prof.evaluated / prof.assigned) * 100 : 0}%`,
                                                                height: '100%',
                                                                background: 'linear-gradient(90deg, #10b981, #059669)',
                                                                borderRadius: '4px'
                                                            }} />
                                                        </div>
                                                        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                                            {prof.assigned > 0 ? Math.round((prof.evaluated / prof.assigned) * 100) : 0}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center p-lg text-muted">No professor data available</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </motion.div>

                {/* Quick Stats Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}
                >
                    <Card style={{ padding: '20px', textAlign: 'center' }}>
                        <FiCheckCircle size={32} style={{ color: '#10b981', marginBottom: '10px' }} />
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f8fafc' }}>
                            {(analytics.projectsByStatus.approved || 0) + (analytics.projectsByStatus.completed || 0)}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Completed Projects</div>
                    </Card>
                    <Card style={{ padding: '20px', textAlign: 'center' }}>
                        <FiClock size={32} style={{ color: '#f59e0b', marginBottom: '10px' }} />
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f8fafc' }}>
                            {(analytics.projectsByStatus['under-review'] || 0) + (analytics.projectsByStatus.submitted || 0)}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Pending Review</div>
                    </Card>
                    <Card style={{ padding: '20px', textAlign: 'center' }}>
                        <FiFolder size={32} style={{ color: '#3b82f6', marginBottom: '10px' }} />
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f8fafc' }}>
                            {analytics.projectsByStatus.draft || 0}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Draft Projects</div>
                    </Card>
                    <Card style={{ padding: '20px', textAlign: 'center' }}>
                        <FiUsers size={32} style={{ color: '#6366f1', marginBottom: '10px' }} />
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f8fafc' }}>
                            {analytics.totalProfessors + analytics.totalStudents}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Total Users</div>
                    </Card>
                </motion.div>
            </main>
        </div>
    );
};

export default HODAnalytics;
