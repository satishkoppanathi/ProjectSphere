import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logActivity } from '../services/api';
import { motion } from 'framer-motion';
import {
    FiUsers,
    FiBookOpen,
    FiBriefcase,
    FiAward,
    FiArrowRight
} from 'react-icons/fi';
import Modal from '../components/common/Modal';
import LoginForm from '../components/common/LoginForm';
import Button from '../components/common/Button';
import './HomePage.css';

const roles = [
    {
        id: 'student',
        title: 'Student',
        description: 'Submit projects, track progress, and view feedback',
        icon: FiUsers,
        color: 'student',
        gradient: 'var(--gradient-student)',
        features: ['Submit Projects', 'Track Status', 'View Marks']
    },
    {
        id: 'professor',
        title: 'Professor',
        description: 'Evaluate student projects and provide guidance',
        icon: FiBookOpen,
        color: 'professor',
        gradient: 'var(--gradient-professor)',
        features: ['Review Projects', 'Give Feedback', 'Rank Students']
    },
    {
        id: 'hod',
        title: 'HOD',
        description: 'Manage department projects and assignments',
        icon: FiBriefcase,
        color: 'hod',
        gradient: 'var(--gradient-hod)',
        features: ['Assign Projects', 'Manage Faculty', 'Oversee Progress']
    },
    {
        id: 'director',
        title: 'Director',
        description: 'University-wide analytics and oversight',
        icon: FiAward,
        color: 'director',
        gradient: 'var(--gradient-director)',
        features: ['View Analytics', 'Monitor Departments', 'Generate Reports']
    }
];

const HomePage = () => {
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState(null);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { type: 'bot', text: 'Hi! 👋 I\'m ProjectSphere Assistant. How can I help you today?' }
    ]);

    const faqResponses = {
        'what is projectsphere': 'ProjectSphere is a comprehensive university project management platform that helps students submit projects, professors evaluate and provide feedback, HODs manage assignments, and directors oversee analytics.',
        'how to submit project': 'To submit a project: 1) Log in as a Student 2) Go to your dashboard 3) Click "New Project" 4) Fill in details (title, description, team members) 5) Upload files and add links 6) Click Submit!',
        'how to login': 'Click on any role card (Student, Professor, HOD, or Director) on the homepage. Enter your credentials in the login form. Demo credentials are available for testing.',
        'what roles are available': 'There are 4 roles: Student (submit projects), Professor (evaluate projects), HOD (manage department & assign projects), and Director (view university-wide analytics).',
        'how evaluation works': 'Professors review submitted projects, provide marks and feedback. Students can view their scores on their dashboard. HODs can track overall department progress.',
        'is it free': 'Yes! ProjectSphere is completely free for educational institutions to use.',
        'contact support': 'You can reach us at support@projectsphere.edu or call +91 123 456 7890. We\'re available 24/7!',
        'features': 'Key features include: Project submission, Real-time tracking, Professor evaluations, Department analytics, Role-based dashboards, and 10,000+ user capacity.',
    };

    const handleChatSend = (message) => {
        const userMsg = message.toLowerCase().trim();
        setChatMessages(prev => [...prev, { type: 'user', text: message }]);

        setTimeout(() => {
            let response = 'I\'m not sure about that. Try asking about: "What is ProjectSphere?", "How to submit project?", "How to login?", "What roles are available?", or "Contact support".';

            for (const [key, value] of Object.entries(faqResponses)) {
                if (userMsg.includes(key.split(' ')[0]) || userMsg.includes(key.split(' ')[1] || '')) {
                    response = value;
                    break;
                }
            }

            setChatMessages(prev => [...prev, { type: 'bot', text: response }]);
        }, 500);
    };

    useEffect(() => {
        logActivity('view_homepage');
    }, []);

    const handleRoleClick = (role) => {
        setSelectedRole(role);
        setIsLoginOpen(true);
    };

    const handleLoginSuccess = (user) => {
        setIsLoginOpen(false);
        navigate(`/${user.role}/dashboard`);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
        }
    };

    const cardVariants = {
        hidden: {
            opacity: 0,
            y: 40,
            scale: 0.95
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: 'spring',
                stiffness: 100,
                damping: 15
            }
        }
    };

    return (
        <div className="home-page">
            {/* Animated background */}
            <div className="home-bg">
                <div className="home-bg-gradient"></div>
                <div className="home-bg-grid"></div>
                <motion.div
                    className="home-bg-orb orb-1"
                    animate={{
                        x: [0, 50, 0],
                        y: [0, -30, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />
                <motion.div
                    className="home-bg-orb orb-2"
                    animate={{
                        x: [0, -40, 0],
                        y: [0, 40, 0],
                        scale: [1, 1.15, 1]
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />
                <motion.div
                    className="home-bg-orb orb-3"
                    animate={{
                        x: [0, 30, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />
            </div>

            {/* Navigation Header */}
            <nav className="home-nav">
                <div className="nav-brand">
                    <div className="nav-logo">
                        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="20" cy="20" r="18" stroke="url(#logoGradient)" strokeWidth="2" fill="none" />
                            <circle cx="20" cy="12" r="3" fill="url(#logoGradient)" />
                            <circle cx="12" cy="24" r="3" fill="url(#logoGradient)" />
                            <circle cx="28" cy="24" r="3" fill="url(#logoGradient)" />
                            <line x1="20" y1="15" x2="14" y2="22" stroke="url(#logoGradient)" strokeWidth="1.5" />
                            <line x1="20" y1="15" x2="26" y2="22" stroke="url(#logoGradient)" strokeWidth="1.5" />
                            <line x1="15" y1="24" x2="25" y2="24" stroke="url(#logoGradient)" strokeWidth="1.5" />
                            <defs>
                                <linearGradient id="logoGradient" x1="0" y1="0" x2="40" y2="40">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="50%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="#f59e0b" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <span className="nav-brand-text">ProjectSphere</span>
                </div>

                {/* Hamburger Menu */}
                <div className="nav-menu-container">
                    <button
                        className={`hamburger-btn ${isMenuOpen ? 'active' : ''}`}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>

                    {isMenuOpen && (
                        <div className="nav-dropdown">
                            <a href="#about" onClick={() => setIsMenuOpen(false)}>About</a>
                            <a href="#roles" onClick={() => setIsMenuOpen(false)}>Portals</a>
                            <a href="#faq" onClick={() => setIsMenuOpen(false)}>FAQ</a>
                            <a href="#contact" onClick={() => setIsMenuOpen(false)}>Contact</a>
                        </div>
                    )}
                </div>
            </nav>

            <div className="home-content">
                {/* Hero Section */}
                <motion.header
                    className="home-hero"
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <motion.div
                        className="hero-badge"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <span className="hero-badge-dot"></span>
                        University Project Management
                    </motion.div>
                    <h1 className="hero-title">
                        <span className="hero-title-line">Manage Academic</span>
                        <span className="hero-title-gradient">Projects with Ease</span>
                    </h1>
                    <p className="hero-subtitle">
                        A comprehensive platform for students, professors, and administrators
                        to collaborate on university projects seamlessly.
                    </p>

                </motion.header>

                {/* About Project Section */}
                <motion.section
                    className="about-project-section"
                    id="about"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="about-project-container">
                        <div className="about-project-header">
                            <span className="about-tag">About The Platform</span>
                            <h2 className="about-title">
                                Streamlining Academic Project Management
                            </h2>
                        </div>

                        <p className="about-description">
                            <strong>ProjectSphere</strong> is a comprehensive university project management system designed to
                            bridge the gap between students, professors, and administration. Our platform enables seamless
                            project submissions, transparent evaluations, and real-time progress tracking—all in one place.
                        </p>

                        <div className="about-features-grid">
                            <div className="about-feature-item">
                                <div className="about-feature-icon">🚀</div>
                                <h4>Easy Submissions</h4>
                                <p>Students can submit projects with files, GitHub links, and live demos in just a few clicks.</p>
                            </div>
                            <div className="about-feature-item">
                                <div className="about-feature-icon">⭐</div>
                                <h4>Fair Evaluations</h4>
                                <p>Professors can evaluate, rank, and provide detailed feedback on submitted projects.</p>
                            </div>
                            <div className="about-feature-item">
                                <div className="about-feature-icon">📊</div>
                                <h4>Real-time Analytics</h4>
                                <p>Track progress, view statistics, and monitor department-wide performance with interactive charts.</p>
                            </div>
                            <div className="about-feature-item">
                                <div className="about-feature-icon">🔒</div>
                                <h4>Role-based Access</h4>
                                <p>Secure authentication with distinct portals for Students, Professors, HODs, and Directors.</p>
                            </div>
                        </div>

                        <div className="about-highlights">
                            <div className="highlight-item">
                                <span className="highlight-number">10K+</span>
                                <span className="highlight-label">Users Capacity</span>
                            </div>
                            <div className="highlight-item">
                                <span className="highlight-number">4</span>
                                <span className="highlight-label">User Roles</span>
                            </div>
                            <div className="highlight-item">
                                <span className="highlight-number">100%</span>
                                <span className="highlight-label">Transparent</span>
                            </div>
                            <div className="highlight-item">
                                <span className="highlight-number">24/7</span>
                                <span className="highlight-label">Accessible</span>
                            </div>
                            <div className="highlight-item">
                                <span className="highlight-number">Live</span>
                                <span className="highlight-label">Tracking</span>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Role Cards */}
                <motion.div
                    className="role-cards"
                    id="roles"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {roles.map((role, index) => (
                        <motion.div
                            key={role.id}
                            className={`role-card role-card-${role.color}`}
                            variants={cardVariants}
                            whileHover={{
                                y: -8,
                                transition: { duration: 0.2 }
                            }}
                            onClick={() => handleRoleClick(role)}
                        >
                            {/* Card glow effect */}
                            <div className="role-card-glow"></div>

                            {/* Card content */}
                            <div className="role-card-header">
                                <motion.div
                                    className="role-icon-wrapper"
                                    whileHover={{ rotate: [0, -10, 10, 0] }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="role-icon" style={{ background: role.gradient }}>
                                        <role.icon size={28} />
                                    </div>
                                </motion.div>
                                <div className="role-number">0{index + 1}</div>
                            </div>

                            <h3 className="role-title">{role.title}</h3>
                            <p className="role-description">{role.description}</p>

                            <ul className="role-features">
                                {role.features.map((feature, i) => (
                                    <li key={i} className="role-feature">
                                        <span className="role-feature-dot" style={{ background: role.gradient }}></span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <motion.div
                                className="role-cta"
                                whileHover={{ x: 5 }}
                            >
                                <span>Enter Portal</span>
                                <FiArrowRight size={18} />
                            </motion.div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* FAQ Section */}
                <motion.section
                    className="faq-section"
                    id="faq"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <h2 className="faq-title">Frequently Asked Questions</h2>
                    <p className="faq-subtitle">Everything you need to know about ProjectSphere</p>

                    <div className="faq-grid">
                        <div className="faq-item">
                            <h4 className="faq-question">📚 What is ProjectSphere?</h4>
                            <p className="faq-answer">
                                ProjectSphere is a comprehensive university project management platform that helps students submit projects,
                                professors evaluate and provide feedback, HODs manage department assignments, and directors oversee university-wide analytics.
                            </p>
                        </div>

                        <div className="faq-item">
                            <h4 className="faq-question">👨‍🎓 How do students submit projects?</h4>
                            <p className="faq-answer">
                                Students can log in to their portal, create a new project with title, description, and team members,
                                upload files, add GitHub/live links, and submit for review. They can track status and view feedback in real-time.
                            </p>
                        </div>

                        <div className="faq-item">
                            <h4 className="faq-question">👨‍🏫 How do professors evaluate projects?</h4>
                            <p className="faq-answer">
                                Professors can view all submitted projects in their department, evaluate them with marks and detailed feedback,
                                approve or reject submissions, and maintain a ranking of projects based on their evaluations.
                            </p>
                        </div>

                        <div className="faq-item">
                            <h4 className="faq-question">🎯 What can HODs do on this platform?</h4>
                            <p className="faq-answer">
                                HODs can manage department projects, assign projects to specific professors for evaluation,
                                track overall department progress, and view analytics about project submissions and outcomes.
                            </p>
                        </div>

                        <div className="faq-item">
                            <h4 className="faq-question">📊 What analytics are available?</h4>
                            <p className="faq-answer">
                                The platform provides comprehensive analytics including project status distribution,
                                department-wise progress, submission trends, evaluation metrics, and completion rates with visual charts.
                            </p>
                        </div>

                        <div className="faq-item">
                            <h4 className="faq-question">🔐 Is the platform secure?</h4>
                            <p className="faq-answer">
                                Yes! We use JWT authentication, role-based access control, and secure data encryption.
                                Each user can only access features and data relevant to their role in the university.
                            </p>
                        </div>
                    </div>
                </motion.section>

                {/* Footer */}
                <motion.footer
                    className="home-footer"
                    id="contact"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <div className="footer-content">
                        <div className="footer-section footer-about">
                            <h3 className="footer-title">ProjectSphere</h3>
                            <p className="footer-description">
                                A comprehensive university project management platform designed to streamline
                                academic project workflows for students, professors, and administrators.
                            </p>
                        </div>

                        <div className="footer-section">
                            <h4 className="footer-heading">Quick Links</h4>
                            <ul className="footer-links">
                                <li><a href="#student">Student Portal</a></li>
                                <li><a href="#professor">Professor Portal</a></li>
                                <li><a href="#hod">HOD Portal</a></li>
                                <li><a href="#director">Director Portal</a></li>
                            </ul>
                        </div>

                        <div className="footer-section">
                            <h4 className="footer-heading">Resources</h4>
                            <ul className="footer-links">
                                <li><a href="#docs">Documentation</a></li>
                                <li><a href="#help">Help Center</a></li>
                                <li><a href="#faq">FAQs</a></li>
                                <li><a href="#support">Support</a></li>
                            </ul>
                        </div>

                        <div className="footer-section">
                            <h4 className="footer-heading">Contact</h4>
                            <ul className="footer-contact">
                                <li>📧 support@projectsphere.edu</li>
                                <li>📞 +91 123 456 7890</li>
                                <li>📍 University Campus, India</li>
                            </ul>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <p>© 2026 ProjectSphere - University Project Management System. All rights reserved.</p>
                        <div className="footer-social">
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link" title="Twitter">𝕏</a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link" title="LinkedIn">in</a>
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-link" title="GitHub">⌨</a>
                        </div>
                    </div>
                </motion.footer>
            </div>

            {/* Login Modal */}
            <Modal
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
                title={`${selectedRole?.title || ''} Login`}
                size="md"
            >
                {selectedRole && (
                    <LoginForm
                        role={selectedRole.id}
                        color={selectedRole.color}
                        onSuccess={handleLoginSuccess}
                        onClose={() => setIsLoginOpen(false)}
                    />
                )}
            </Modal>

            {/* Chatbot Assistant */}
            <div className="chatbot-container">
                {isChatOpen && (
                    <div className="chatbot-window">
                        <div className="chatbot-header">
                            <div className="chatbot-header-info">
                                <span className="chatbot-avatar">🤖</span>
                                <div>
                                    <h4>ProjectSphere Assistant</h4>
                                    <span className="chatbot-status">Online</span>
                                </div>
                            </div>
                            <button className="chatbot-close" onClick={() => setIsChatOpen(false)}>✕</button>
                        </div>
                        <div className="chatbot-messages">
                            {chatMessages.map((msg, index) => (
                                <div key={index} className={`chat-message ${msg.type}`}>
                                    {msg.text}
                                </div>
                            ))}
                        </div>
                        <form className="chatbot-input" onSubmit={(e) => {
                            e.preventDefault();
                            const input = e.target.elements.message;
                            if (input.value.trim()) {
                                handleChatSend(input.value);
                                input.value = '';
                            }
                        }}>
                            <input type="text" name="message" placeholder="Ask me anything..." autoComplete="off" />
                            <button type="submit">➤</button>
                        </form>
                    </div>
                )}
                <button
                    className={`chatbot-trigger ${isChatOpen ? 'active' : ''}`}
                    onClick={() => setIsChatOpen(!isChatOpen)}
                >
                    {!isChatOpen && <span className="chatbot-tooltip">Ask Chatbot 💬</span>}
                    {isChatOpen ? '✕' : '🤖'}
                </button>
            </div>
        </div>
    );
};

export default HomePage;
