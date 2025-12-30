import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FiFolder,
    FiUsers,
    FiCheckCircle,
    FiTrendingUp,
    FiPieChart,
    FiBarChart2,
    FiDownload,
    FiFileText,
    FiCalendar,
    FiPrinter
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
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/common/Sidebar';
import Card from '../components/common/Card';
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

const DirectorDashboard = () => {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    const getActiveView = () => {
        const path = location.pathname;
        if (path.includes('/analytics')) return 'analytics';
        if (path.includes('/departments')) return 'departments';
        if (path.includes('/reports')) return 'reports';
        return 'dashboard';
    };

    const activeView = getActiveView();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [analyticsRes, deptsRes] = await Promise.all([
                api.get('/director/analytics'),
                api.get('/director/departments')
            ]);

            // Get assigned projects from localStorage for proper counts
            const savedAssignments = localStorage.getItem('hod_newly_assigned');
            const assignedProjects = savedAssignments ? JSON.parse(savedAssignments) : [];

            let analyticsData = analyticsRes.data.data || {};
            let deptsData = deptsRes.data.data || [];

            // Calculate proper status counts from assigned projects
            const statusCounts = {
                draft: 0,
                submitted: 0,
                under_review: 0,
                approved: 0,
                completed: 0,
                rejected: 0
            };

            assignedProjects.forEach(p => {
                if (statusCounts[p.status] !== undefined) {
                    statusCounts[p.status]++;
                } else if (p.status === 'submitted') {
                    statusCounts.submitted++;
                }
            });

            // Calculate department distribution from assigned projects
            const deptDistribution = {
                CSE: 0, IT: 0, ECE: 0, EEE: 0, MECH: 0, CIVIL: 0, CHEMICAL: 0
            };

            assignedProjects.forEach(p => {
                const dept = p.department || 'CSE';
                if (dept === 'Computer Science' || dept === 'CSE') deptDistribution.CSE++;
                else if (dept === 'Information Technology' || dept === 'IT') deptDistribution.IT++;
                else if (dept === 'Electronics' || dept === 'ECE') deptDistribution.ECE++;
                else if (dept === 'Electrical' || dept === 'EEE') deptDistribution.EEE++;
                else if (dept === 'Mechanical' || dept === 'MECH') deptDistribution.MECH++;
                else if (dept === 'Civil' || dept === 'CIVIL') deptDistribution.CIVIL++;
                else if (dept === 'Chemical' || dept === 'CHEMICAL') deptDistribution.CHEMICAL++;
            });

            // Calculate proper completion rate
            const totalProjects = assignedProjects.length || analyticsData?.overview?.totalProjects || 0;
            const completedProjects = (statusCounts.completed + statusCounts.approved) ||
                ((analyticsData?.statusBreakdown?.completed || 0) + (analyticsData?.statusBreakdown?.approved || 0));
            const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

            // Update analytics with proper data - include per-department completion rates
            // Calculate per-department completion rates
            const deptCompletionRates = {};
            Object.keys(deptDistribution).forEach(deptCode => {
                const deptProjects = assignedProjects.filter(p => {
                    const dept = p.department || 'CSE';
                    if (deptCode === 'CSE') return dept === 'Computer Science' || dept === 'CSE';
                    if (deptCode === 'IT') return dept === 'Information Technology' || dept === 'IT';
                    if (deptCode === 'ECE') return dept === 'Electronics' || dept === 'ECE';
                    if (deptCode === 'EEE') return dept === 'Electrical' || dept === 'EEE';
                    if (deptCode === 'MECH') return dept === 'Mechanical' || dept === 'MECH';
                    if (deptCode === 'CIVIL') return dept === 'Civil' || dept === 'CIVIL';
                    if (deptCode === 'CHEMICAL') return dept === 'Chemical' || dept === 'CHEMICAL';
                    return false;
                });
                const totalDeptProjects = deptProjects.length;
                const completedDeptProjects = deptProjects.filter(p =>
                    p.status === 'completed' || p.status === 'approved' || p.status === 'submitted'
                ).length;
                deptCompletionRates[deptCode] = totalDeptProjects > 0
                    ? Math.round((completedDeptProjects / totalDeptProjects) * 100)
                    : 0;
            });

            setAnalytics({
                ...analyticsData,
                overview: {
                    totalProjects: totalProjects,
                    totalStudents: assignedProjects.length || analyticsData?.overview?.totalStudents || 0,
                    totalProfessors: analyticsData?.overview?.totalProfessors || 1,
                    completionRate: completionRate
                },
                statusBreakdown: {
                    ...analyticsData?.statusBreakdown,
                    ...statusCounts,
                    completed: statusCounts.completed || analyticsData?.statusBreakdown?.completed || 0,
                    approved: statusCounts.approved || analyticsData?.statusBreakdown?.approved || 0
                },
                departmentDistribution: Object.keys(deptDistribution).map(key => ({
                    department: key,
                    count: deptDistribution[key],
                    completionRate: deptCompletionRates[key]
                })),
                monthlySubmissions: analyticsData?.monthlySubmissions || [
                    { month: 'Jul', count: 2 },
                    { month: 'Aug', count: 3 },
                    { month: 'Sep', count: 5 },
                    { month: 'Oct', count: 4 },
                    { month: 'Nov', count: 6 },
                    { month: 'Dec', count: assignedProjects.length }
                ]
            });

            // Use department data or create fallback with calculated completion rates
            if (deptsData.length === 0) {
                deptsData = [
                    { name: 'Computer Science', code: 'CSE', projects: deptDistribution.CSE, students: deptDistribution.CSE, professors: 2, completionRate: deptCompletionRates.CSE },
                    { name: 'Information Technology', code: 'IT', projects: deptDistribution.IT, students: deptDistribution.IT, professors: 1, completionRate: deptCompletionRates.IT },
                    { name: 'Electronics', code: 'ECE', projects: deptDistribution.ECE, students: deptDistribution.ECE, professors: 1, completionRate: deptCompletionRates.ECE },
                    { name: 'Electrical', code: 'EEE', projects: deptDistribution.EEE, students: deptDistribution.EEE, professors: 1, completionRate: deptCompletionRates.EEE },
                    { name: 'Mechanical', code: 'MECH', projects: deptDistribution.MECH, students: deptDistribution.MECH, professors: 1, completionRate: deptCompletionRates.MECH },
                    { name: 'Civil', code: 'CIVIL', projects: deptDistribution.CIVIL, students: deptDistribution.CIVIL, professors: 1, completionRate: deptCompletionRates.CIVIL },
                    { name: 'Chemical', code: 'CHEMICAL', projects: deptDistribution.CHEMICAL, students: deptDistribution.CHEMICAL, professors: 1, completionRate: deptCompletionRates.CHEMICAL }
                ];
            }
            setDepartments(deptsData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            // Set fallback data on error
            const savedAssignments = localStorage.getItem('hod_newly_assigned');
            const assignedProjects = savedAssignments ? JSON.parse(savedAssignments) : [];
            setAnalytics({
                overview: { totalProjects: assignedProjects.length, totalStudents: assignedProjects.length, totalProfessors: 1, completionRate: 0 },
                statusBreakdown: { completed: 0, approved: 0, under_review: 0, submitted: assignedProjects.length, draft: 0 },
                departmentDistribution: [
                    { department: 'CSE', count: assignedProjects.length },
                    { department: 'IT', count: 0 },
                    { department: 'ECE', count: 0 },
                    { department: 'EEE', count: 0 },
                    { department: 'MECH', count: 0 },
                    { department: 'CIVIL', count: 0 },
                    { department: 'CHEMICAL', count: 0 }
                ],
                monthlySubmissions: [
                    { month: 'Dec', count: assignedProjects.length }
                ]
            });
        } finally {
            setLoading(false);
        }
    };

    const overview = analytics?.overview || {
        totalProjects: 0,
        totalStudents: 0,
        totalProfessors: 0,
        completionRate: 0
    };

    const statCards = [
        { label: 'Total Projects', value: overview.totalProjects, icon: FiFolder, color: 'director' },
        { label: 'Students', value: overview.totalStudents, icon: FiUsers, color: 'blue' },
        { label: 'Professors', value: overview.totalProfessors, icon: FiUsers, color: 'green' },
        { label: 'Completion Rate', value: `${overview.completionRate}%`, icon: FiCheckCircle, color: 'yellow' }
    ];

    // Chart configurations
    const statusChartData = {
        labels: ['Completed', 'Approved', 'Under Review', 'Submitted', 'Draft'],
        datasets: [{
            data: [
                analytics?.statusBreakdown?.completed || 0,
                analytics?.statusBreakdown?.approved || 0,
                analytics?.statusBreakdown?.under_review || 0,
                analytics?.statusBreakdown?.submitted || 0,
                analytics?.statusBreakdown?.draft || 0
            ],
            backgroundColor: [
                '#8b5cf6',
                '#10b981',
                '#f59e0b',
                '#3b82f6',
                '#64748b'
            ],
            borderWidth: 0
        }]
    };

    const deptChartData = {
        labels: analytics?.departmentDistribution?.map(d => d.department) || ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEMICAL'],
        datasets: [{
            label: 'Projects',
            data: analytics?.departmentDistribution?.map(d => d.count) || [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: [
                'rgba(99, 102, 241, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(139, 92, 246, 0.8)',
                'rgba(236, 72, 153, 0.8)'
            ],
            borderRadius: 8
        }]
    };

    const monthlyChartData = {
        labels: analytics?.monthlySubmissions?.map(m => m.month) || [],
        datasets: [{
            label: 'Submissions',
            data: analytics?.monthlySubmissions?.map(m => m.count) || [],
            fill: true,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: '#ef4444',
            tension: 0.4
        }]
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

    const barOptions = {
        ...chartOptions,
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8' }
            },
            y: {
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
                ticks: { color: '#94a3b8' }
            }
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
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
                            <h1 className="dashboard-title">Welcome, Director</h1>
                            <p style={{ color: '#94a3b8', marginTop: '4px', fontSize: '0.95rem' }}>Monitor university-wide projects, departments & generate reports</p>
                        </div>
                    </motion.div>
                )}

                {/* Main Dashboard Content */}
                {activeView === 'dashboard' && (
                    <>
                        {/* Stats Cards */}
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

                        {/* Charts Grid */}
                        <div className="charts-grid">
                            <motion.div
                                className="chart-container"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="chart-header">
                                    <FiPieChart size={20} />
                                    <h3 className="chart-title">Project Status Distribution</h3>
                                </div>
                                <div className="chart-wrapper donut-chart">
                                    {!loading && <Doughnut data={statusChartData} options={chartOptions} />}
                                </div>
                            </motion.div>

                            <motion.div
                                className="chart-container"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <div className="chart-header">
                                    <FiBarChart2 size={20} />
                                    <h3 className="chart-title">Department-wise Projects</h3>
                                </div>
                                <div className="chart-wrapper">
                                    {!loading && <Bar data={deptChartData} options={barOptions} />}
                                </div>
                            </motion.div>

                            <motion.div
                                className="chart-container chart-wide"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <div className="chart-header">
                                    <FiTrendingUp size={20} />
                                    <h3 className="chart-title">Monthly Submissions Trend</h3>
                                </div>
                                <div className="chart-wrapper">
                                    {!loading && <Line data={monthlyChartData} options={barOptions} />}
                                </div>
                            </motion.div>
                        </div>

                        {/* Department Overview */}
                        <motion.div
                            className="dashboard-section"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <div className="section-header">
                                <h2 className="section-title">Department Overview</h2>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                                {[
                                    { code: 'CSE', name: 'Computer Science', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#6366f1', icon: '💻' },
                                    { code: 'IT', name: 'Information Technology', gradient: 'linear-gradient(135deg, #10b981, #059669)', color: '#10b981', icon: '🌐' },
                                    { code: 'ECE', name: 'Electronics & Comm', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#f59e0b', icon: '📡' },
                                    { code: 'EEE', name: 'Electrical & Electronics', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#ef4444', icon: '⚡' },
                                    { code: 'MECH', name: 'Mechanical', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#3b82f6', icon: '⚙️' },
                                    { code: 'CIVIL', name: 'Civil Engineering', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#8b5cf6', icon: '🏗️' },
                                    { code: 'CHEMICAL', name: 'Chemical Engineering', gradient: 'linear-gradient(135deg, #ec4899, #db2777)', color: '#ec4899', icon: '🧪' }
                                ].map((dept, index) => {
                                    const deptData = analytics?.departmentDistribution?.find(d => d.department === dept.code);
                                    const projects = deptData?.count || 0;
                                    const completionRate = deptData?.completionRate || 0;

                                    return (
                                        <motion.div
                                            key={dept.code}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileHover={{ scale: 1.05, y: -5, boxShadow: `0 15px 30px ${dept.color}30` }}
                                            transition={{ delay: 0.1 * index, type: 'spring', stiffness: 300 }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <Card style={{ padding: '20px', transition: 'all 0.3s ease' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                                    <div style={{
                                                        width: '45px',
                                                        height: '45px',
                                                        borderRadius: '12px',
                                                        background: dept.gradient,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '1.5rem'
                                                    }}>
                                                        {dept.icon}
                                                    </div>
                                                    <div>
                                                        <h4 style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: '600', marginBottom: '2px' }}>{dept.name}</h4>
                                                        <span style={{ color: dept.color, fontSize: '0.8rem', fontWeight: '500' }}>{dept.code}</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                                                    <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(148, 163, 184, 0.1)', borderRadius: '8px' }}>
                                                        <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#f8fafc' }}>{projects}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Projects</div>
                                                    </div>
                                                    <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(148, 163, 184, 0.1)', borderRadius: '8px' }}>
                                                        <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#f8fafc' }}>{projects}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Students</div>
                                                    </div>
                                                    <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(148, 163, 184, 0.1)', borderRadius: '8px' }}>
                                                        <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#f8fafc' }}>{index < 2 ? 2 : 1}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Faculty</div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Completion</span>
                                                        <span style={{ color: dept.color, fontWeight: '600', fontSize: '0.9rem' }}>{completionRate}%</span>
                                                    </div>
                                                    <div style={{
                                                        height: '10px',
                                                        background: 'rgba(148, 163, 184, 0.15)',
                                                        borderRadius: '5px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${completionRate}%` }}
                                                            transition={{ duration: 1, delay: 0.2 * index }}
                                                            style={{
                                                                height: '100%',
                                                                background: dept.gradient,
                                                                borderRadius: '5px',
                                                                boxShadow: `0 2px 8px ${dept.color}50`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}

                {/* Reports Section */}
                {activeView === 'reports' && (
                    <>
                        <motion.div
                            className="dashboard-header"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="dashboard-header-content">
                                <h1 className="dashboard-title">Reports & Analytics</h1>
                                <p style={{ color: '#94a3b8', marginTop: '4px', fontSize: '0.95rem' }}>Generate and download comprehensive reports</p>
                            </div>
                        </motion.div>

                        {/* Report Cards Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginTop: '24px' }}>
                            {/* Project Summary Report */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.03, y: -8, boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)' }}
                                transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                                style={{ cursor: 'pointer' }}
                            >
                                <Card style={{ padding: '24px', transition: 'all 0.3s ease' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <FiFileText size={24} style={{ color: '#fff' }} />
                                        </div>
                                        <div>
                                            <h3 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: '600' }}>Project Summary Report</h3>
                                            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Complete overview of all projects</p>
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(148, 163, 184, 0.1)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div>
                                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Total Projects</span>
                                                <p style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: '700' }}>{overview.totalProjects}</p>
                                            </div>
                                            <div>
                                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Completion Rate</span>
                                                <p style={{ color: '#10b981', fontSize: '1.2rem', fontWeight: '700' }}>{overview.completionRate}%</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => {
                                                const reportData = `PROJECT SUMMARY REPORT\n\nGenerated: ${new Date().toLocaleDateString()}\n\nTotal Projects: ${overview.totalProjects}\nTotal Students: ${overview.totalStudents}\nTotal Professors: ${overview.totalProfessors}\nCompletion Rate: ${overview.completionRate}%\n\nStatus Breakdown:\n- Completed: ${analytics?.statusBreakdown?.completed || 0}\n- Approved: ${analytics?.statusBreakdown?.approved || 0}\n- Under Review: ${analytics?.statusBreakdown?.under_review || 0}\n- Submitted: ${analytics?.statusBreakdown?.submitted || 0}\n- Draft: ${analytics?.statusBreakdown?.draft || 0}`;
                                                const blob = new Blob([reportData], { type: 'text/plain' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = 'project_summary_report.txt';
                                                a.click();
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '10px 16px',
                                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <FiDownload size={16} /> Download Report
                                        </button>
                                    </div>
                                </Card>
                            </motion.div>

                            {/* Department Performance Report */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.03, y: -8, boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3)' }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                                style={{ cursor: 'pointer' }}
                            >
                                <Card style={{ padding: '24px', transition: 'all 0.3s ease' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #10b981, #059669)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <FiBarChart2 size={24} style={{ color: '#fff' }} />
                                        </div>
                                        <div>
                                            <h3 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: '600' }}>Department Performance</h3>
                                            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Department-wise project analytics</p>
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(148, 163, 184, 0.1)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div>
                                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Departments</span>
                                                <p style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: '700' }}>{departments.length}</p>
                                            </div>
                                            <div>
                                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Avg Completion</span>
                                                <p style={{ color: '#10b981', fontSize: '1.2rem', fontWeight: '700' }}>
                                                    {departments.length > 0 ? Math.round(departments.reduce((a, d) => a + (d.completionRate || 0), 0) / departments.length) : 0}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => {
                                                let reportData = `DEPARTMENT PERFORMANCE REPORT\n\nGenerated: ${new Date().toLocaleDateString()}\n\n`;
                                                departments.forEach(dept => {
                                                    reportData += `${dept.name}\n  - Projects: ${dept.projects}\n  - Students: ${dept.students}\n  - Faculty: ${dept.professors}\n  - Completion Rate: ${dept.completionRate}%\n\n`;
                                                });
                                                const blob = new Blob([reportData], { type: 'text/plain' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = 'department_performance_report.txt';
                                                a.click();
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '10px 16px',
                                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <FiDownload size={16} /> Download Report
                                        </button>
                                    </div>
                                </Card>
                            </motion.div>

                            {/* Faculty Report */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.03, y: -8, boxShadow: '0 20px 40px rgba(245, 158, 11, 0.3)' }}
                                transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                                style={{ cursor: 'pointer' }}
                            >
                                <Card style={{ padding: '24px', transition: 'all 0.3s ease' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <FiUsers size={24} style={{ color: '#fff' }} />
                                        </div>
                                        <div>
                                            <h3 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: '600' }}>Faculty Report</h3>
                                            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Professor workload & performance</p>
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(148, 163, 184, 0.1)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div>
                                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Total Faculty</span>
                                                <p style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: '700' }}>{overview.totalProfessors}</p>
                                            </div>
                                            <div>
                                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Avg Projects/Faculty</span>
                                                <p style={{ color: '#f59e0b', fontSize: '1.2rem', fontWeight: '700' }}>
                                                    {overview.totalProfessors > 0 ? Math.round(overview.totalProjects / overview.totalProfessors) : 0}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => {
                                                const reportData = `FACULTY REPORT\n\nGenerated: ${new Date().toLocaleDateString()}\n\nTotal Faculty: ${overview.totalProfessors}\nTotal Projects Supervised: ${overview.totalProjects}\nAverage Projects per Faculty: ${overview.totalProfessors > 0 ? Math.round(overview.totalProjects / overview.totalProfessors) : 0}\n\nDepartment-wise Faculty Distribution:\n${departments.map(d => `- ${d.name}: ${d.professors} faculty members`).join('\n')}`;
                                                const blob = new Blob([reportData], { type: 'text/plain' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = 'faculty_report.txt';
                                                a.click();
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '10px 16px',
                                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <FiDownload size={16} /> Download Report
                                        </button>
                                    </div>
                                </Card>
                            </motion.div>

                            {/* Student Progress Report */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.03, y: -8, boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)' }}
                                transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
                                style={{ cursor: 'pointer' }}
                            >
                                <Card style={{ padding: '24px', transition: 'all 0.3s ease' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <FiTrendingUp size={24} style={{ color: '#fff' }} />
                                        </div>
                                        <div>
                                            <h3 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: '600' }}>Student Progress Report</h3>
                                            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Student submission & completion stats</p>
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(148, 163, 184, 0.1)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div>
                                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Total Students</span>
                                                <p style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: '700' }}>{overview.totalStudents}</p>
                                            </div>
                                            <div>
                                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Projects Submitted</span>
                                                <p style={{ color: '#3b82f6', fontSize: '1.2rem', fontWeight: '700' }}>
                                                    {(analytics?.statusBreakdown?.submitted || 0) + (analytics?.statusBreakdown?.under_review || 0) + (analytics?.statusBreakdown?.approved || 0) + (analytics?.statusBreakdown?.completed || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => {
                                                const reportData = `STUDENT PROGRESS REPORT\n\nGenerated: ${new Date().toLocaleDateString()}\n\nTotal Students: ${overview.totalStudents}\nTotal Projects: ${overview.totalProjects}\nProjects Submitted: ${(analytics?.statusBreakdown?.submitted || 0) + (analytics?.statusBreakdown?.under_review || 0) + (analytics?.statusBreakdown?.approved || 0) + (analytics?.statusBreakdown?.completed || 0)}\n\nSubmission Status:\n- Completed: ${analytics?.statusBreakdown?.completed || 0}\n- Approved: ${analytics?.statusBreakdown?.approved || 0}\n- Under Review: ${analytics?.statusBreakdown?.under_review || 0}\n- Submitted: ${analytics?.statusBreakdown?.submitted || 0}\n- Draft (Not Submitted): ${analytics?.statusBreakdown?.draft || 0}\n\nOverall Completion Rate: ${overview.completionRate}%`;
                                                const blob = new Blob([reportData], { type: 'text/plain' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = 'student_progress_report.txt';
                                                a.click();
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '10px 16px',
                                                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <FiDownload size={16} /> Download Report
                                        </button>
                                    </div>
                                </Card>
                            </motion.div>

                            {/* Monthly Trend Report */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.03, y: -8, boxShadow: '0 20px 40px rgba(236, 72, 153, 0.3)' }}
                                transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
                                style={{ cursor: 'pointer' }}
                            >
                                <Card style={{ padding: '24px', transition: 'all 0.3s ease' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #ec4899, #db2777)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <FiCalendar size={24} style={{ color: '#fff' }} />
                                        </div>
                                        <div>
                                            <h3 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: '600' }}>Monthly Trend Report</h3>
                                            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Monthly submission trends</p>
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(148, 163, 184, 0.1)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div>
                                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>This Month</span>
                                                <p style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: '700' }}>
                                                    {analytics?.monthlySubmissions?.[analytics?.monthlySubmissions?.length - 1]?.count || 0}
                                                </p>
                                            </div>
                                            <div>
                                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Last Month</span>
                                                <p style={{ color: '#ec4899', fontSize: '1.2rem', fontWeight: '700' }}>
                                                    {analytics?.monthlySubmissions?.[analytics?.monthlySubmissions?.length - 2]?.count || 0}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => {
                                                let reportData = `MONTHLY TREND REPORT\n\nGenerated: ${new Date().toLocaleDateString()}\n\nMonthly Submissions:\n`;
                                                (analytics?.monthlySubmissions || []).forEach(m => {
                                                    reportData += `- ${m.month}: ${m.count} submissions\n`;
                                                });
                                                const blob = new Blob([reportData], { type: 'text/plain' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = 'monthly_trend_report.txt';
                                                a.click();
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '10px 16px',
                                                background: 'linear-gradient(135deg, #ec4899, #db2777)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <FiDownload size={16} /> Download Report
                                        </button>
                                    </div>
                                </Card>
                            </motion.div>

                            {/* Complete Annual Report */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.03, y: -8, boxShadow: '0 20px 40px rgba(239, 68, 68, 0.3)' }}
                                transition={{ delay: 0.6, type: 'spring', stiffness: 300 }}
                                style={{ cursor: 'pointer' }}
                            >
                                <Card style={{ padding: '24px', transition: 'all 0.3s ease' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <FiPrinter size={24} style={{ color: '#fff' }} />
                                        </div>
                                        <div>
                                            <h3 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: '600' }}>Complete Annual Report</h3>
                                            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Comprehensive year-end report</p>
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(148, 163, 184, 0.1)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                            Generate a complete annual report including all projects, departments, faculty, and student statistics for the academic year.
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => {
                                                let reportData = `COMPLETE ANNUAL REPORT\n${'='.repeat(50)}\n\nGenerated: ${new Date().toLocaleDateString()}\nAcademic Year: ${new Date().getFullYear()}\n\n`;
                                                reportData += `EXECUTIVE SUMMARY\n${'-'.repeat(30)}\nTotal Projects: ${overview.totalProjects}\nTotal Students: ${overview.totalStudents}\nTotal Faculty: ${overview.totalProfessors}\nOverall Completion Rate: ${overview.completionRate}%\n\n`;
                                                reportData += `PROJECT STATUS BREAKDOWN\n${'-'.repeat(30)}\n- Completed: ${analytics?.statusBreakdown?.completed || 0}\n- Approved: ${analytics?.statusBreakdown?.approved || 0}\n- Under Review: ${analytics?.statusBreakdown?.under_review || 0}\n- Submitted: ${analytics?.statusBreakdown?.submitted || 0}\n- Draft: ${analytics?.statusBreakdown?.draft || 0}\n\n`;
                                                reportData += `DEPARTMENT PERFORMANCE\n${'-'.repeat(30)}\n`;
                                                departments.forEach(dept => {
                                                    reportData += `\n${dept.name}:\n  Projects: ${dept.projects}\n  Students: ${dept.students}\n  Faculty: ${dept.professors}\n  Completion Rate: ${dept.completionRate}%\n`;
                                                });
                                                reportData += `\nMONTHLY SUBMISSIONS\n${'-'.repeat(30)}\n`;
                                                (analytics?.monthlySubmissions || []).forEach(m => {
                                                    reportData += `${m.month}: ${m.count} submissions\n`;
                                                });
                                                reportData += `\n${'='.repeat(50)}\nEnd of Report`;
                                                const blob = new Blob([reportData], { type: 'text/plain' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = 'complete_annual_report.txt';
                                                a.click();
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '10px 16px',
                                                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <FiDownload size={16} /> Download Full Report
                                        </button>
                                    </div>
                                </Card>
                            </motion.div>
                        </div>
                    </>
                )}

                {/* Departments Section */}
                {activeView === 'departments' && (
                    <>
                        <motion.div
                            className="dashboard-header"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="dashboard-header-content">
                                <h1 className="dashboard-title">Department Management</h1>
                                <p style={{ color: '#94a3b8', marginTop: '4px', fontSize: '0.95rem' }}>Overview of all university departments</p>
                            </div>
                        </motion.div>

                        {/* Department Cards Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '24px' }}>
                            {[
                                { code: 'CSE', name: 'Computer Science & Engineering', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#6366f1', icon: '💻' },
                                { code: 'IT', name: 'Information Technology', gradient: 'linear-gradient(135deg, #10b981, #059669)', color: '#10b981', icon: '🌐' },
                                { code: 'ECE', name: 'Electronics & Communication', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#f59e0b', icon: '📡' },
                                { code: 'EEE', name: 'Electrical & Electronics', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#ef4444', icon: '⚡' },
                                { code: 'MECH', name: 'Mechanical Engineering', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#3b82f6', icon: '⚙️' },
                                { code: 'CIVIL', name: 'Civil Engineering', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#8b5cf6', icon: '🏗️' },
                                { code: 'CHEMICAL', name: 'Chemical Engineering', gradient: 'linear-gradient(135deg, #ec4899, #db2777)', color: '#ec4899', icon: '🧪' }
                            ].map((dept, index) => {
                                const deptData = analytics?.departmentDistribution?.find(d => d.department === dept.code);
                                const deptProjects = deptData?.count || 0;
                                // Use calculated completion rate from analytics, or calculate based on project count
                                const completionRate = deptData?.completionRate || (deptProjects > 0 ? 100 : 0);

                                return (
                                    <motion.div
                                        key={dept.code}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        whileHover={{
                                            scale: 1.03,
                                            y: -8,
                                            boxShadow: `0 20px 40px ${dept.color}30`
                                        }}
                                        transition={{ delay: index * 0.1, type: 'spring', stiffness: 300 }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <Card style={{ padding: '0', overflow: 'hidden', transition: 'all 0.3s ease' }}>
                                            <div style={{ background: dept.gradient, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <span style={{ fontSize: '2.5rem' }}>{dept.icon}</span>
                                                <div>
                                                    <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px' }}>{dept.name}</h3>
                                                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', color: '#fff' }}>{dept.code}</span>
                                                </div>
                                            </div>
                                            <div style={{ padding: '20px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f8fafc' }}>{deptProjects}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Projects</div>
                                                    </div>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f8fafc' }}>{deptProjects}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Students</div>
                                                    </div>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f8fafc' }}>{index < 2 ? 2 : 1}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Faculty</div>
                                                    </div>
                                                </div>
                                                <div style={{ background: 'rgba(148, 163, 184, 0.1)', borderRadius: '12px', padding: '16px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                        <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '500' }}>Completion Rate</span>
                                                        <span style={{ color: dept.color, fontWeight: '700', fontSize: '1rem' }}>{completionRate}%</span>
                                                    </div>
                                                    <div style={{
                                                        height: '12px',
                                                        background: 'rgba(148, 163, 184, 0.15)',
                                                        borderRadius: '6px',
                                                        overflow: 'hidden',
                                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                                                    }}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${completionRate}%` }}
                                                            transition={{ duration: 1, delay: index * 0.1 }}
                                                            style={{
                                                                height: '100%',
                                                                background: dept.gradient,
                                                                borderRadius: '6px',
                                                                boxShadow: `0 2px 8px ${dept.color}50`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Summary Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}
                        >
                            <motion.div whileHover={{ scale: 1.05, y: -5 }} style={{ cursor: 'pointer' }}>
                                <Card style={{ padding: '20px', textAlign: 'center', transition: 'all 0.3s ease' }}>
                                    <FiFolder size={32} style={{ color: '#6366f1', marginBottom: '10px' }} />
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f8fafc' }}>{overview.totalProjects}</div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Total Projects</div>
                                </Card>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05, y: -5 }} style={{ cursor: 'pointer' }}>
                                <Card style={{ padding: '20px', textAlign: 'center', transition: 'all 0.3s ease' }}>
                                    <FiUsers size={32} style={{ color: '#10b981', marginBottom: '10px' }} />
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f8fafc' }}>{overview.totalStudents}</div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Total Students</div>
                                </Card>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05, y: -5 }} style={{ cursor: 'pointer' }}>
                                <Card style={{ padding: '20px', textAlign: 'center', transition: 'all 0.3s ease' }}>
                                    <FiUsers size={32} style={{ color: '#f59e0b', marginBottom: '10px' }} />
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f8fafc' }}>{overview.totalProfessors}</div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Total Faculty</div>
                                </Card>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05, y: -5 }} style={{ cursor: 'pointer' }}>
                                <Card style={{ padding: '20px', textAlign: 'center', transition: 'all 0.3s ease' }}>
                                    <FiCheckCircle size={32} style={{ color: '#3b82f6', marginBottom: '10px' }} />
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f8fafc' }}>{overview.completionRate}%</div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Avg Completion</div>
                                </Card>
                            </motion.div>
                        </motion.div>
                    </>
                )}

                {/* Analytics Section */}
                {activeView === 'analytics' && (
                    <>
                        <motion.div
                            className="dashboard-header"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="dashboard-header-content">
                                <h1 className="dashboard-title">University Analytics</h1>
                                <p style={{ color: '#94a3b8', marginTop: '4px', fontSize: '0.95rem' }}>Comprehensive data analysis and insights</p>
                            </div>
                        </motion.div>

                        {/* Stats Overview */}
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

                        {/* Charts Grid */}
                        <div className="charts-grid" style={{ marginTop: '24px' }}>
                            <motion.div
                                className="chart-container"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="chart-header">
                                    <FiPieChart size={20} />
                                    <h3 className="chart-title">Project Status Distribution</h3>
                                </div>
                                <div className="chart-wrapper donut-chart">
                                    {!loading && <Doughnut data={statusChartData} options={chartOptions} />}
                                </div>
                            </motion.div>

                            <motion.div
                                className="chart-container"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <div className="chart-header">
                                    <FiBarChart2 size={20} />
                                    <h3 className="chart-title">Department-wise Projects</h3>
                                </div>
                                <div className="chart-wrapper">
                                    {!loading && <Bar data={deptChartData} options={barOptions} />}
                                </div>
                            </motion.div>

                            <motion.div
                                className="chart-container chart-wide"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <div className="chart-header">
                                    <FiTrendingUp size={20} />
                                    <h3 className="chart-title">Monthly Submissions Trend</h3>
                                </div>
                                <div className="chart-wrapper">
                                    {!loading && <Line data={monthlyChartData} options={barOptions} />}
                                </div>
                            </motion.div>
                        </div>

                        {/* Performance Metrics */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            style={{ marginTop: '24px' }}
                        >
                            <Card style={{ padding: '24px' }}>
                                <h3 style={{ color: '#f8fafc', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <FiTrendingUp size={20} style={{ color: '#6366f1' }} />
                                    Key Performance Indicators
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                    <div style={{ background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                                        <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>Projects per Department</div>
                                        <div style={{ color: '#f8fafc', fontSize: '1.8rem', fontWeight: 'bold' }}>
                                            {departments.length > 0 ? Math.round(overview.totalProjects / 7) : 0}
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                        <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>Projects per Faculty</div>
                                        <div style={{ color: '#f8fafc', fontSize: '1.8rem', fontWeight: 'bold' }}>
                                            {overview.totalProfessors > 0 ? Math.round(overview.totalProjects / overview.totalProfessors) : 0}
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                                        <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>Submitted Projects</div>
                                        <div style={{ color: '#f8fafc', fontSize: '1.8rem', fontWeight: 'bold' }}>
                                            {(analytics?.statusBreakdown?.submitted || 0) + (analytics?.statusBreakdown?.under_review || 0)}
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                        <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>Completed Projects</div>
                                        <div style={{ color: '#f8fafc', fontSize: '1.8rem', fontWeight: 'bold' }}>
                                            {(analytics?.statusBreakdown?.completed || 0) + (analytics?.statusBreakdown?.approved || 0)}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </>
                )}
            </main>
        </div>
    );
};

export default DirectorDashboard;
