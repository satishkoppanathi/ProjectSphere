import './Input.css';

const Input = ({
    label,
    type = 'text',
    name,
    value,
    onChange,
    placeholder,
    error,
    required = false,
    disabled = false,
    icon,
    className = '',
    ...props
}) => {
    return (
        <div className={`form-group ${className}`}>
            {label && (
                <label className="form-label" htmlFor={name}>
                    {label}
                    {required && <span className="required-mark">*</span>}
                </label>
            )}
            <div className="input-wrapper">
                {icon && <span className="input-icon">{icon}</span>}
                <input
                    type={type}
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    className={`form-input ${icon ? 'has-icon' : ''} ${error ? 'has-error' : ''}`}
                    {...props}
                />
            </div>
            {error && <span className="form-error">{error}</span>}
        </div>
    );
};

export const TextArea = ({
    label,
    name,
    value,
    onChange,
    placeholder,
    error,
    required = false,
    disabled = false,
    rows = 4,
    className = '',
    ...props
}) => {
    return (
        <div className={`form-group ${className}`}>
            {label && (
                <label className="form-label" htmlFor={name}>
                    {label}
                    {required && <span className="required-mark">*</span>}
                </label>
            )}
            <textarea
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                rows={rows}
                className={`form-input form-textarea ${error ? 'has-error' : ''}`}
                {...props}
            />
            {error && <span className="form-error">{error}</span>}
        </div>
    );
};

export const Select = ({
    label,
    name,
    value,
    onChange,
    options = [],
    placeholder = 'Select an option',
    error,
    required = false,
    disabled = false,
    className = '',
    ...props
}) => {
    return (
        <div className={`form-group ${className}`}>
            {label && (
                <label className="form-label" htmlFor={name}>
                    {label}
                    {required && <span className="required-mark">*</span>}
                </label>
            )}
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                disabled={disabled}
                className={`form-input form-select ${error ? 'has-error' : ''}`}
                {...props}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <span className="form-error">{error}</span>}
        </div>
    );
};

export default Input;
