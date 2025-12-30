import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FiFolder,
    FiUsers,
    FiUserPlus,
    FiEdit2,
    FiTrash2,
    FiPlus,
    FiSearch
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/common/Sidebar';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import Input, { Select } from '../components/common/Input';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FiEdit } from 'react-icons/fi';
import './Dashboard.css';

const HODDashboard = () => {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [projects, setProjects] = useState([]);
    const [professors, setProfessors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedProfessor, setSelectedProfessor] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showManualAssignModal, setShowManualAssignModal] = useState(false);
    const [isManualEditMode, setIsManualEditMode] = useState(false);
    const [editingManualProjectId, setEditingManualProjectId] = useState(null);
    const [manualAssignmentForm, setManualAssignmentForm] = useState({ teamNumber: '', teamName: '', professor: '', department: '' });
    const [newlyAssigned, setNewlyAssigned] = useState(() => {
        // Always initialize with 10 sample projects
        const titles = [
            'ProjectSphere - University Project Management System',
            '🍔 BiteBuddy – MERN Food Delivery Platform',
            '🧠 AI SaaS Starter Kit',
            '🧠 Brain Tumor Segmentation using Machine Learning',
            'Advanced Robotics Control System',
            'Blockchain-based Supply Chain Tracking',
            'Smart Home Automation with IoT',
            'E-Learning Platform with Gamification',
            'Cybersecurity Threat Detection Tool',
            'Autonomous Drone Navigation System'
        ];

        const defaultProjects = titles.map((title, i) => ({
            _id: `manual-${i + 1}`,
            team: `Team ${i + 1}`,
            title,
            professor: 'CSE Professor',
            department: 'Computer Science',
            status: i < 4 ? 'submitted' : 'draft',
            isReal: i < 4
        }));

        // Check if localStorage has data, merge with defaults
        const saved = localStorage.getItem('hod_newly_assigned');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // If localStorage has fewer than 10 projects, use defaults
                if (parsed.length >= 10) return parsed;
            } catch (e) {
                // Invalid JSON, use defaults
            }
        }

        // Store default projects in localStorage
        localStorage.setItem('hod_newly_assigned', JSON.stringify(defaultProjects));
        return defaultProjects;
    });
    const location = useLocation();
    const navigate = useNavigate();

    const getActiveView = () => {
        const path = location.pathname;
        if (path.includes('/projects')) return 'projects';
        if (path.includes('/assignments')) return 'assignments';
        if (path.includes('/faculty')) return 'faculty';
        return 'dashboard';
    };

    const activeView = getActiveView();

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        localStorage.setItem('hod_newly_assigned', JSON.stringify(newlyAssigned));
    }, [newlyAssigned]);

    const fetchData = async () => {
        try {
            const [dashRes, projRes, profRes] = await Promise.all([
                api.get('/hod/dashboard'),
                api.get('/hod/projects'),
                api.get('/hod/professors')
            ]);
            setDashboardData(dashRes.data.data);
            setProjects(projRes.data.data);
            setProfessors(profRes.data.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = (project) => {
        setSelectedProject(project);
        setSelectedProfessor(project.assignedProfessor?._id || '');
        setShowAssignModal(true);
    };

    const handleAssignSubmit = async () => {
        try {
            await api.post('/hod/assign', {
                projectId: selectedProject._id,
                professorId: selectedProfessor
            });
            setShowAssignModal(false);
            fetchData();
        } catch (error) {
            console.error('Failed to assign:', error);
        }
    };

    const handleManualAssignSubmit = (e) => {
        e.preventDefault();
        if (isManualEditMode) {
            setNewlyAssigned(prev => prev.map(p =>
                p._id === editingManualProjectId ? {
                    ...p,
                    team: manualAssignmentForm.teamNumber,
                    title: manualAssignmentForm.teamName,
                    professor: manualAssignmentForm.professor,
                    department: manualAssignmentForm.department
                } : p
            ));
            toast.success('Assignment updated');
        } else {
            const newProject = {
                _id: `manual-${Date.now()}`,
                team: manualAssignmentForm.teamNumber,
                title: manualAssignmentForm.teamName,
                professor: manualAssignmentForm.professor,
                department: manualAssignmentForm.department,
                status: 'draft'
            };
            setNewlyAssigned(prev => [...prev, newProject]);
            toast.success('Project assigned');
        }
        setShowManualAssignModal(false);
    };

    const handleOpenManualEdit = (project) => {
        setManualAssignmentForm({
            teamNumber: project.team,
            teamName: project.title,
            professor: project.professor,
            department: project.department
        });
        setEditingManualProjectId(project._id);
        setIsManualEditMode(true);
        setShowManualAssignModal(true);
    };

    const handleOpenManualAssign = () => {
        setManualAssignmentForm({ teamNumber: '', teamName: '', professor: 'CSE Professor', department: 'Computer Science' });
        setIsManualEditMode(false);
        setShowManualAssignModal(true);
    };

    const handleDeleteManual = (id) => {
        if (window.confirm('Remove this assignment?')) {
            setNewlyAssigned(prev => prev.filter(p => p._id !== id));
            toast.success('Assignment removed');
        }
    };

    const handleDelete = async (projectId) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                await api.delete(`/hod/projects/${projectId}`);
                fetchData();
            } catch (error) {
                console.error('Failed to delete:', error);
            }
        }
    };

    const stats = dashboardData?.stats || {
        totalProjects: 0,
        totalProfessors: 0,
        totalStudents: 0,
        unassigned: 0
    };

    const statCards = [
        { label: 'Total Projects', value: stats.totalProjects, icon: FiFolder, color: 'hod' },
        { label: 'Professors', value: stats.totalProfessors, icon: FiUsers, color: 'green' },
        { label: 'Students', value: stats.totalStudents, icon: FiUsers, color: 'blue' },
        { label: 'Unassigned', value: stats.unassigned, icon: FiUserPlus, color: 'yellow' }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const filteredProjects = projects.filter(p =>
        (p.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.submittedBy?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    // Combine actual backend-assigned projects with localStorage demo data
    const backendAssignedProjects = projects
        .filter(p => p.assignedProfessor) // Only projects with an assigned professor
        .map((p, index) => ({
            _id: p._id,
            team: `Team ${index + 1}`,  // Use team numbers
            title: p.title,
            professor: p.assignedProfessor?.name || 'Assigned',
            department: p.department,
            status: p.status,
            isReal: true
        }));

    // Merge backend assigned projects with localStorage, avoiding duplicates
    const allAssignedProjects = [...backendAssignedProjects];
    const existingTitles = new Set(backendAssignedProjects.map(p => p.title?.toLowerCase()));

    // Add localStorage projects with continued team numbering (no limit)
    let teamCounter = backendAssignedProjects.length + 1;
    newlyAssigned.forEach(p => {
        if (!existingTitles.has(p.title?.toLowerCase())) {
            allAssignedProjects.push({
                ...p,
                team: `Team ${teamCounter++}`
            });
        }
    });

    const filteredAssignments = allAssignedProjects.filter(p =>
        (p.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.team?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard">
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            <main className={`dashboard-main ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
                {/* Header - Show in Dashboard or Assignments view */}
                {(activeView === 'dashboard' || activeView === 'assignments') && (
                    <motion.div
                        className="dashboard-header"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="dashboard-header-content">
                            <h1 className="dashboard-title">
                                {activeView === 'assignments' ? 'Assign Projects' : 'Welcome, HOD'}
                            </h1>
                            {activeView === 'dashboard' && (
                                <p style={{ color: '#94a3b8', marginTop: '4px', fontSize: '0.95rem' }}>Manage your department projects and assignments</p>
                            )}
                        </div>
                        {activeView === 'assignments' && (
                            <Button role="hod" icon={<FiPlus size={18} />} onClick={handleOpenManualAssign}>
                                Assign New
                            </Button>
                        )}
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

                {activeView === 'assignments' ? (
                    <motion.div
                        className="dashboard-section"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="section-header">
                            <div className="search-box">
                                <FiSearch size={18} />
                                <input
                                    type="text"
                                    placeholder="Search projects..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                            </div>
                        </div>

                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Team</th>
                                        <th>Project Title</th>
                                        <th>Professor</th>
                                        <th>Status</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAssignments.length > 0 ? (
                                        filteredAssignments.map((project, index) => (
                                            <motion.tr
                                                key={project._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <td className="team-col">
                                                    <div className="team-id-badge">{project.team}</div>
                                                </td>
                                                <td className="title-col">
                                                    <span className="project-list-title">{project.title}</span>
                                                    {project.isReal && <span className="real-indicator" style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', fontSize: '0.7rem', fontWeight: 'bold' }}>LIVE</span>}
                                                </td>
                                                <td className="prof-col">
                                                    <div className="prof-badge" style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{project.professor}</div>
                                                </td>
                                                <td className="status-col">
                                                    <StatusBadge status={project.status} />
                                                </td>
                                                <td className="actions-col text-center">
                                                    <div className="table-actions centered">
                                                        <button
                                                            className="btn-icon-edit"
                                                            onClick={() => handleOpenManualEdit(project)}
                                                            title="Edit Assignment"
                                                            style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', marginRight: '10px' }}
                                                        >
                                                            <FiEdit size={18} />
                                                        </button>
                                                        <button
                                                            className="btn-icon-delete"
                                                            onClick={() => handleDeleteManual(project._id)}
                                                            title="Delete Assignment"
                                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                        >
                                                            <FiTrash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center p-lg text-muted">No assignments found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                ) : (
                    <>
                        {/* Department Sections */}
                        {[
                            { code: 'CSE', name: 'Computer Science & Engineering', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', aliases: ['Computer Science', 'CSE'] },
                            { code: 'IT', name: 'Information Technology', gradient: 'linear-gradient(135deg, #10b981, #059669)', aliases: ['Information Technology', 'IT'] },
                            { code: 'ECE', name: 'Electronics & Communication Engineering', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', aliases: ['Electronics', 'ECE', 'Electronics & Communication'] },
                            { code: 'EEE', name: 'Electrical & Electronics Engineering', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', aliases: ['Electrical', 'EEE', 'Electrical & Electronics'] },
                            { code: 'MECH', name: 'Mechanical Engineering', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', aliases: ['Mechanical', 'MECH', 'Mechanical Engineering'] },
                            { code: 'CIVIL', name: 'Civil Engineering', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', aliases: ['Civil', 'CIVIL', 'Civil Engineering'] },
                            { code: 'CHEMICAL', name: 'Chemical Engineering', gradient: 'linear-gradient(135deg, #ec4899, #db2777)', aliases: ['Chemical', 'CHEMICAL', 'Chemical Engineering'] }
                        ].map((dept, index) => {
                            const deptProjects = filteredProjects.filter(p =>
                                dept.aliases.includes(p.department) ||
                                (dept.code === 'CSE' && !p.department)
                            );

                            return (
                                <motion.div
                                    key={dept.code}
                                    className="dashboard-section"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + (index * 0.1) }}
                                    style={{ marginTop: index > 0 ? '30px' : '0' }}
                                >
                                    <div className="section-header">
                                        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ background: dept.gradient, padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>{dept.code}</span>
                                            {dept.name}
                                        </h2>
                                        {index === 0 && (
                                            <div className="search-box">
                                                <FiSearch size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="Search projects..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="search-input"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="table-container">
                                        <table className="table">
                                            <tbody>
                                                {loading ? (
                                                    <tr>
                                                        <td colSpan="5" className="text-center p-lg">Loading...</td>
                                                    </tr>
                                                ) : deptProjects.length > 0 ? (
                                                    deptProjects.map((project) => (
                                                        <motion.tr
                                                            key={project._id}
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                        >
                                                            <td>
                                                                <div className="project-cell">
                                                                    <span className="project-title-sm">{project.title}</span>
                                                                </div>
                                                            </td>
                                                            <td>{project.submittedBy?.name || '-'}</td>
                                                            <td>
                                                                {project.assignedProfessor?.name || (
                                                                    <span className="text-muted">Unassigned</span>
                                                                )}
                                                            </td>
                                                            <td><StatusBadge status={project.status} size="sm" /></td>
                                                            <td>
                                                                <div className="table-actions">
                                                                    <Button
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        icon={<FiUserPlus size={14} />}
                                                                        onClick={() => handleAssign(project)}
                                                                    >
                                                                        Assign
                                                                    </Button>
                                                                    <button
                                                                        className="icon-btn icon-btn-danger"
                                                                        onClick={() => handleDelete(project._id)}
                                                                    >
                                                                        <FiTrash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="text-center p-lg text-muted">
                                                            No {dept.code} projects found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </>
                )}
            </main>

            <Modal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                title="Assign Professor"
                size="md"
            >
                <div className="assign-form">
                    <p className="assign-project-name">
                        Project: <strong>{selectedProject?.title}</strong>
                    </p>
                    <Select
                        label="Select Professor"
                        name="professor"
                        value={selectedProfessor}
                        onChange={(e) => setSelectedProfessor(e.target.value)}
                        options={professors.map(p => ({ value: p._id, label: p.name }))}
                        placeholder="Choose a professor..."
                    />
                    <div className="form-actions">
                        <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
                            Cancel
                        </Button>
                        <Button role="hod" onClick={handleAssignSubmit}>
                            Assign Professor
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Manual Project Assignment Modal */}
            <Modal
                isOpen={showManualAssignModal}
                onClose={() => {
                    setShowManualAssignModal(false);
                    setIsManualEditMode(false);
                }}
                title={isManualEditMode ? "Edit Manual Assignment" : "Assign New Team Project"}
                size="md"
            >
                <form onSubmit={handleManualAssignSubmit} className="assignment-form">
                    <div className="form-group">
                        <label className="form-label" style={{ color: '#fff', marginBottom: '8px', display: 'block' }}>Team Number</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Team 11"
                            value={manualAssignmentForm.teamNumber}
                            onChange={(e) => setManualAssignmentForm({ ...manualAssignmentForm, teamNumber: e.target.value })}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                        />
                    </div>
                    <div className="form-group" style={{ marginTop: '20px' }}>
                        <label className="form-label" style={{ color: '#fff', marginBottom: '8px', display: 'block' }}>Project/Team Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Smart City Management"
                            value={manualAssignmentForm.teamName}
                            onChange={(e) => setManualAssignmentForm({ ...manualAssignmentForm, teamName: e.target.value })}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                        />
                    </div>
                    <div className="form-group" style={{ marginTop: '20px' }}>
                        <label className="form-label" style={{ color: '#fff', marginBottom: '8px', display: 'block' }}>Assign Professor</label>
                        <select
                            className="form-input"
                            value={manualAssignmentForm.professor}
                            onChange={(e) => setManualAssignmentForm({ ...manualAssignmentForm, professor: e.target.value })}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                        >
                            <option value="">Select a professor</option>
                            <option value="CSE Professor">CSE Professor</option>
                            {professors.map(p => (
                                <option key={p._id} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginTop: '20px' }}>
                        <label className="form-label" style={{ color: '#fff', marginBottom: '8px', display: 'block' }}>Department</label>
                        <select
                            className="form-input"
                            value={manualAssignmentForm.department}
                            onChange={(e) => setManualAssignmentForm({ ...manualAssignmentForm, department: e.target.value })}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                        >
                            <option value="">Select a department</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Information Technology">Information Technology</option>
                            <option value="Electronics">Electronics</option>
                        </select>
                    </div>
                    <div className="form-actions" style={{ marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={() => {
                                setShowManualAssignModal(false);
                                setIsManualEditMode(false);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            role="hod"
                            type="submit"
                        >
                            {isManualEditMode ? "Update" : "Assign"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default HODDashboard;
