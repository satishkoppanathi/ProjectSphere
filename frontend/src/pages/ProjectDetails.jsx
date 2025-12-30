import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCalendar, FiUser, FiMail, FiHash, FiAward, FiEdit2, FiTrash2, FiSend, FiGithub, FiLink } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api, { logActivity } from '../services/api';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import Card from '../components/common/Card';
import './ProjectDetails.css';

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [project, setProject] = useState(null);
    const [evaluationData, setEvaluationData] = useState(null);
    const [loading, setLoading] = useState(true);

    const isProfessor = window.location.pathname.includes('/professor');

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const endpoint = isProfessor ? `/professors/projects/${id}` : `/students/projects/${id}`;
                const response = await api.get(endpoint);

                if (isProfessor) {
                    setProject(response.data.data.project);
                    setEvaluationData(response.data.data.evaluation);
                } else {
                    setProject(response.data.data);
                }

                // Log activity
                if (response.data.data) {
                    logActivity('view_project', {
                        projectId: id,
                        role: isProfessor ? 'professor' : 'student'
                    });
                }
            } catch (error) {
                toast.error('Failed to load project details');
                navigate(isProfessor ? '/professor/dashboard' : '/student/dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [id, navigate, isProfessor]);

    const handleSubmitProject = async () => {
        try {
            await api.post(`/students/projects/${project._id}/submit`, {
                notes: 'Submitted for review'
            });
            toast.success('Project submitted for review!');
            // Refresh data
            const response = await api.get(`/students/projects/${id}`);
            setProject(response.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit project');
        }
    };

    const handleDeleteProject = async () => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                await api.delete(`/students/projects/${project._id}`);
                toast.success('Project deleted');
                navigate('/student/dashboard');
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to delete project');
            }
        }
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loader"></div>
            </div>
        );
    }

    if (!project) return null;

    return (
        <div className="project-details-page">
            <motion.div
                className="details-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Header Actions */}
                <div className="details-header-actions" style={{ marginBottom: '2rem' }}>
                    <motion.div
                        whileHover={{ scale: 1.02, x: -5 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            onClick={() => navigate(isProfessor ? '/professor/dashboard' : '/student/dashboard')}
                            icon={<FiArrowLeft />}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '0.8rem 1.5rem',
                                borderRadius: '12px',
                                fontWeight: '600',
                                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            Back to Dashboard
                        </Button>
                    </motion.div>
                </div>

                {/* Main Content Grid */}
                <div className="details-grid">
                    {/* Left Column - Main Info */}
                    <div className="details-main">
                        <Card className="details-title-card">
                            <div className="project-header">
                                <h1 className="project-title-large">{project.title}</h1>
                                <StatusBadge status={project.status} />
                            </div>

                            <div className="project-meta-row">
                                <div className="meta-item">
                                    <FiCalendar />
                                    <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="meta-item">
                                    <FiHash />
                                    <span>ID: {project._id.substring(project._id.length - 8)}</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="details-description-card">
                            <h3>Project Description</h3>
                            <div className="description-content">
                                {project.description}
                            </div>
                        </Card>

                        {/* Evaluation Section */}
                        {(project.evaluation || evaluationData) && (
                            <Card className="evaluation-card">
                                <div className="evaluation-header">
                                    <h3><FiAward /> Evaluation Results</h3>
                                    <div className="total-score">
                                        <span className="score">{evaluationData?.marks || project.evaluation?.marks}</span>
                                        <span className="max-score">/100</span>
                                    </div>
                                </div>

                                {(evaluationData?.criteria || project.evaluation?.criteria) && (
                                    <div className="criteria-grid">
                                        {Object.entries(evaluationData?.criteria || project.evaluation?.criteria).map(([key, value]) => (
                                            <div key={key} className="criteria-item">
                                                <div className="criteria-label">
                                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                                </div>
                                                <div className="criteria-progress">
                                                    <div
                                                        className="criteria-bar"
                                                        style={{ width: `${(value / 25) * 100}%` }}
                                                    />
                                                </div>
                                                <div className="criteria-value">{value}/25</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {(evaluationData?.feedback || project.evaluation?.feedback) && (
                                    <div className="feedback-box">
                                        <h4>Professor Feedback</h4>
                                        <p>{evaluationData?.feedback || project.evaluation?.feedback}</p>
                                    </div>
                                )}
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Sidebar Info */}
                    <div className="details-sidebar">
                        <Card className="action-card">
                            <h3>Actions</h3>
                            <div className="action-buttons">
                                {isProfessor ? (
                                    <>
                                        {/* Since Evaluation Modal remains on Dashboard, for now we can navigate 
                                            back with params or add a simplified evaluation here. 
                                            User asked for "view of professor as shown in student". 
                                            Let's show "Evaluate" button that takes them back to dashboard to evaluate for now,
                                            or just show the status update buttons. */}
                                        <Button
                                            className="full-width"
                                            variant="primary"
                                            onClick={() => navigate('/professor/dashboard')}
                                        >
                                            Evaluate on Dashboard
                                        </Button>
                                    </>
                                ) : (
                                    project.status === 'draft' && (
                                        <>
                                            <Button
                                                className="full-width"
                                                icon={<FiSend />}
                                                onClick={handleSubmitProject}
                                            >
                                                Submit for Review
                                            </Button>
                                            <Button
                                                className="full-width btn-danger"
                                                variant="secondary"
                                                icon={<FiTrash2 />}
                                                onClick={handleDeleteProject}
                                            >
                                                Delete Project
                                            </Button>
                                        </>
                                    )
                                )}
                                <Button
                                    className="full-width"
                                    variant="secondary"
                                    onClick={() => navigate(isProfessor ? '/professor/dashboard' : '/student/dashboard')}
                                >
                                    Close View
                                </Button>
                            </div>
                        </Card>

                        <Card className="team-card">
                            <h3>Team Members</h3>
                            <div className="team-list">
                                {project.teamMembers.map((member, idx) => (
                                    <div key={idx} className="team-member">
                                        <div className="member-avatar">
                                            <FiUser />
                                        </div>
                                        <div className="member-info">
                                            <span className="member-name">{member.name}</span>
                                            <span className="member-role">{member.rollNumber}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {project.assignedProfessor && (
                            <Card className="professor-card">
                                <h3>Assigned Professor</h3>
                                <div className="professor-info">
                                    <div className="professor-avatar">
                                        <FiUser />
                                    </div>
                                    <div className="prof-details">
                                        <span className="prof-name">Prof. {project.assignedProfessor.name}</span>
                                        <span className="prof-email">{project.assignedProfessor.email}</span>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {project.liveLink && (
                            <Card className="live-link-card">
                                <h3>Live Link of the Project</h3>
                                <div className="live-link-container" style={{ marginTop: '1rem' }}>
                                    <a
                                        href={project.liveLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="live-link"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: '#f59e0b',
                                            textDecoration: 'none',
                                            padding: '0.75rem',
                                            background: 'rgba(245, 158, 11, 0.1)',
                                            borderRadius: '8px',
                                            wordBreak: 'break-all'
                                        }}
                                    >
                                        <FiLink size={20} />
                                        <span>{project.liveLink}</span>
                                    </a>
                                </div>
                            </Card>
                        )}

                        {project.githubLink && (
                            <Card className="github-card">
                                <h3>Github Link of the Project</h3>
                                <div className="github-link-container" style={{ marginTop: '1rem' }}>
                                    <a
                                        href={project.githubLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="github-link"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: '#6366f1',
                                            textDecoration: 'none',
                                            padding: '0.75rem',
                                            background: 'rgba(99, 102, 241, 0.1)',
                                            borderRadius: '8px',
                                            wordBreak: 'break-all'
                                        }}
                                    >
                                        <FiGithub size={20} />
                                        <span>{project.githubLink}</span>
                                    </a>
                                </div>
                            </Card>
                        )}

                        {project.documentationLink && (
                            <Card className="doc-card">
                                <h3>Drive Link of the Project Documentation</h3>
                                <div className="doc-link-container" style={{ marginTop: '1rem' }}>
                                    <a
                                        href={project.documentationLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="doc-link"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: '#10b981',
                                            textDecoration: 'none',
                                            padding: '0.75rem',
                                            background: 'rgba(16, 185, 129, 0.1)',
                                            borderRadius: '8px',
                                            wordBreak: 'break-all'
                                        }}
                                    >
                                        <FiLink size={20} />
                                        <span>{project.documentationLink}</span>
                                    </a>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ProjectDetails;
