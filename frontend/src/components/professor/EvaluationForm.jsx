import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiStar } from 'react-icons/fi';
import api from '../../services/api';
import Input, { TextArea } from '../common/Input';
import Button from '../common/Button';
import './EvaluationForm.css';

const EvaluationForm = ({ project, onSuccess, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        marks: '',
        feedback: '',
        criteria: {
            innovation: 0,
            implementation: 0,
            documentation: 0,
            presentation: 0,
            teamwork: 0
        }
    });

    const criteriaLabels = {
        innovation: { label: 'Innovation', max: 20 },
        implementation: { label: 'Implementation', max: 25 },
        documentation: { label: 'Documentation', max: 15 },
        presentation: { label: 'Presentation', max: 20 },
        teamwork: { label: 'Teamwork', max: 20 }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleCriteriaChange = (criterion, value) => {
        const max = criteriaLabels[criterion].max;
        const numValue = Math.min(Math.max(0, parseInt(value) || 0), max);

        const newCriteria = { ...formData.criteria, [criterion]: numValue };
        const totalMarks = Object.values(newCriteria).reduce((a, b) => a + b, 0);

        setFormData({
            ...formData,
            criteria: newCriteria,
            marks: totalMarks.toString()
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post(`/professors/evaluate/${project._id}`, {
                marks: parseInt(formData.marks),
                feedback: formData.feedback,
                criteria: formData.criteria
            });
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit evaluation');
        } finally {
            setLoading(false);
        }
    };

    const totalMarks = Object.values(formData.criteria).reduce((a, b) => a + b, 0);

    return (
        <motion.form
            className="evaluation-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {error && <div className="form-error-box">{error}</div>}

            {/* Project Info */}
            <div className="eval-project-info">
                <h4>{project.title}</h4>
                <p>Submitted by: {project.submittedBy?.name}</p>
            </div>

            {/* Criteria Sliders */}
            <div className="criteria-section">
                <h4 className="criteria-title">Evaluation Criteria</h4>

                {Object.entries(criteriaLabels).map(([key, { label, max }]) => (
                    <div key={key} className="criteria-item">
                        <div className="criteria-header">
                            <span className="criteria-label">{label}</span>
                            <span className="criteria-score">
                                {formData.criteria[key]} / {max}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max={max}
                            value={formData.criteria[key]}
                            onChange={(e) => handleCriteriaChange(key, e.target.value)}
                            className="criteria-slider"
                        />
                    </div>
                ))}

                <div className="total-score">
                    <FiStar size={24} />
                    <span className="total-label">Total Score</span>
                    <span className="total-value">{totalMarks} / 100</span>
                </div>
            </div>

            <TextArea
                label="Feedback"
                name="feedback"
                value={formData.feedback}
                onChange={handleChange}
                placeholder="Provide detailed feedback for the student..."
                rows={4}
                required
            />

            <div className="form-actions">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" role="professor" loading={loading}>
                    Submit Evaluation
                </Button>
            </div>
        </motion.form>
    );
};

export default EvaluationForm;
