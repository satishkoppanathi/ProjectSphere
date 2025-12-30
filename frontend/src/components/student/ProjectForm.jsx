import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Input, { TextArea, Select } from '../common/Input';
import Button from '../common/Button';
import './ProjectForm.css';

const ProjectForm = ({ project, onSuccess, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: project?.title || '',
        description: project?.description || '',
        department: project?.department || 'Computer Science',
        teamMembers: project?.teamMembers || [{ name: '', email: '', rollNumber: '' }],
        githubLink: project?.githubLink || '',
        liveLink: project?.liveLink || '',
        documentationLink: project?.documentationLink || ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleTeamMemberChange = (index, field, value) => {
        const newTeamMembers = [...formData.teamMembers];
        newTeamMembers[index][field] = value;
        setFormData({ ...formData, teamMembers: newTeamMembers });
    };

    const handleMemberCountChange = (e) => {
        const count = parseInt(e.target.value) || 1;
        // Limit to a reasonable number, e.g., 10
        const validCount = Math.max(1, Math.min(10, count));

        const currentMembers = formData.teamMembers;
        let newMembers = [...currentMembers];

        if (validCount > currentMembers.length) {
            // Add new members
            const toAdd = validCount - currentMembers.length;
            for (let i = 0; i < toAdd; i++) {
                newMembers.push({ name: '', email: '', rollNumber: '' });
            }
        } else if (validCount < currentMembers.length) {
            // Remove members from the end
            newMembers = newMembers.slice(0, validCount);
        }

        setFormData({ ...formData, teamMembers: newMembers });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = {
                ...formData
            };

            if (project) {
                await api.put(`/students/projects/${project._id}`, data);
                toast.success('Project updated successfully!');
            } else {
                await api.post('/students/projects', data);
                toast.success('Project created successfully!');
            }

            onSuccess();
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to save project';
            // Check if it's an auth error
            if (err.response?.status === 401) {
                setError('You must be logged in to create a project. Please sign in first.');
                toast.error('Please log in to create a project');
            } else {
                setError(errorMsg);
                toast.error(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.form
            className="project-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {error && <div className="form-error-box">{error}</div>}

            <Input
                label="Project Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter project title"
                required
            />

            <Select
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                options={[
                    { value: 'Computer Science', label: 'Computer Science' },
                    { value: 'Electronics', label: 'Electronics' },
                    { value: 'Mechanical', label: 'Mechanical' },
                    { value: 'Civil', label: 'Civil' },
                    { value: 'Electrical', label: 'Electrical' },
                    { value: 'Information Technology', label: 'Information Technology' }
                ]}
                required
            />

            <TextArea
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your project in detail..."
                rows={4}
                required
                maxLength={3000}
            />

            <div className="form-section" style={{ marginTop: '1rem' }}>
                <div className="form-section-header">
                    <h3 style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#64748b', // Lighter than primary, slate-500 roughly
                        borderBottom: '1px solid #e2e8f0', // Lighter border
                        paddingBottom: '0.5rem',
                        width: '100%'
                    }}>Team Members Details</h3>
                </div>

                <Input
                    label="Number of Team Members"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.teamMembers.length}
                    onChange={handleMemberCountChange}
                    className="mb-md"
                />

                {formData.teamMembers.map((member, index) => (
                    <motion.div
                        key={index}
                        className="team-member-row"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <div style={{ width: '100%', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            Member {index + 1}
                        </div>
                        <Input
                            placeholder="Name"
                            value={member.name}
                            onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                        />
                        <Input
                            placeholder="Roll Number"
                            value={member.rollNumber}
                            onChange={(e) => handleTeamMemberChange(index, 'rollNumber', e.target.value)}
                        />
                        <Input
                            placeholder="Email"
                            type="email"
                            value={member.email}
                            onChange={(e) => handleTeamMemberChange(index, 'email', e.target.value)}
                        />
                    </motion.div>
                ))}
            </div>

            <Input
                label="Github Link of the Project"
                name="githubLink"
                value={formData.githubLink}
                onChange={handleChange}
                placeholder="https://github.com/username/repo"
            />

            <Input
                label="Live Link of the Project"
                name="liveLink"
                value={formData.liveLink}
                onChange={handleChange}
                placeholder="https://your-project-live.com"
            />

            <Input
                label="Drive Link of the Project Documentation"
                name="documentationLink"
                value={formData.documentationLink}
                onChange={handleChange}
                placeholder="https://docs.example.com"
            />

            <div className="form-actions">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" role="student" loading={loading}>
                    {project ? 'Update Project' : 'Create Project'}
                </Button>
            </div>
        </motion.form >
    );
};

export default ProjectForm;
