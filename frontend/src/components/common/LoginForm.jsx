import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiArrowRight, FiUserCheck } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import Input, { Select } from './Input';
import Button from './Button';
import './LoginForm.css';

const departments = [
    { value: 'Computer Science', label: 'Computer Science' },
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Mechanical', label: 'Mechanical' },
    { value: 'Civil', label: 'Civil' },
    { value: 'Electrical', label: 'Electrical' },
    { value: 'Information Technology', label: 'Information Technology' }
];

const LoginForm = ({ role, color, onSuccess, onClose }) => {
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        department: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleGuestSignIn = async () => {
        setLoading(true);
        setError('');

        // Guest credentials for each role
        const guestCredentials = {
            student: { email: 'guest.student@demo.com', password: 'guest123' },
            professor: { email: 'guest.professor@demo.com', password: 'guest123' },
            hod: { email: 'guest.hod@demo.com', password: 'guest123' },
            director: { email: 'guest.director@demo.com', password: 'guest123' }
        };

        const creds = guestCredentials[role];

        try {
            const result = await login(creds.email, creds.password, role);

            if (result.success) {
                onSuccess(result.user);
            } else {
                setError('Guest login failed. Please try again.');
            }
        } catch (err) {
            setError('Guest login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let result;
            if (isRegister) {
                // Build registration data, exclude department for director
                const registerData = {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role
                };

                // Only add department for non-director roles
                if (role !== 'director') {
                    registerData.department = formData.department;
                }

                result = await register(registerData);
            } else {
                result = await login(formData.email, formData.password, role);
            }

            if (result.success) {
                onSuccess(result.user);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.form
            className="login-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className={`login-header login-header-${color}`}>
                <div className="login-icon">
                    <FiUser size={24} />
                </div>
                <h4 className="login-title">
                    {isRegister ? 'Create Account' : 'Welcome Back'}
                </h4>
                <p className="login-subtitle">
                    {isRegister
                        ? `Register as a ${role}`
                        : `Sign in to your ${role} account`}
                </p>
            </div>

            {/* Guest Mode - Prominently at top */}
            <div className="guest-mode-section">
                <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className="guest-btn"
                    onClick={handleGuestSignIn}
                    icon={<FiUserCheck size={18} />}
                >
                    Guest Mode
                </Button>
                <span className="guest-mode-hint">Try without signing in</span>
            </div>

            <div className="login-divider">
                <span>or sign in with credentials</span>
            </div>

            {error && (
                <motion.div
                    className="login-error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                >
                    {error}
                </motion.div>
            )}

            <div className="login-fields">
                {isRegister && (
                    <Input
                        label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your name"
                        icon={<FiUser size={18} />}
                        required
                    />
                )}

                <Input
                    label="Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    icon={<FiMail size={18} />}
                    required
                />

                <Input
                    label="Password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    icon={<FiLock size={18} />}
                    required
                />

                {isRegister && role !== 'director' && (
                    <Select
                        label="Department"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        options={departments}
                        placeholder="Select department"
                        required
                    />
                )}
            </div>

            <div className="login-actions">
                <Button
                    type="submit"
                    role={color}
                    size="lg"
                    loading={loading}
                    className="login-btn"
                >
                    {isRegister ? 'Create Account' : 'Sign In'}
                    <FiArrowRight size={18} />
                </Button>
            </div>

            <div className="login-switch">
                <span className="login-switch-text">
                    {isRegister ? 'Already have an account?' : "Don't have an account?"}
                </span>
                <button
                    type="button"
                    className={`login-switch-btn login-switch-${color}`}
                    onClick={() => setIsRegister(!isRegister)}
                >
                    {isRegister ? 'Sign In' : 'Register'}
                </button>
            </div>

            {/* Demo Credentials */}
            {!isRegister && (
                <div className="login-demo">
                    <p className="login-demo-title">Demo Credentials:</p>
                    <p className="login-demo-cred">
                        Email: {role}@demo.com | Password: 123456
                    </p>
                </div>
            )}
        </motion.form>
    );
};

export default LoginForm;
