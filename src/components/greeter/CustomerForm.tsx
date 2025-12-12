import React from 'react';
import type { Customer } from '../../types';

interface CustomerFormProps {
    customerData: Partial<Customer>;
    onCustomerDataChange: (data: Partial<Customer>) => void;
    onSubmit: (customer: Partial<Customer>) => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
    customerData,
    onCustomerDataChange,
    onSubmit,
}) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(customerData);
    };

    return (
        <div style={{
            backgroundColor: '#1a1a1a',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.4)',
            border: '1px solid #333333'
        }}>
            <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#ffffff'
            }}>
                Customer Information
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#cccccc',
                        marginBottom: '4px'
                    }}>
                        Name (Optional)
                    </label>
                    <input
                        type="text"
                        value={customerData.name || ''}
                        onChange={(e) => onCustomerDataChange({ ...customerData, name: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '10px 15px',
                            border: '1px solid #666666',
                            borderRadius: '8px',
                            fontSize: '15px',
                            backgroundColor: '#333333',
                            color: '#ffffff'
                        }}
                        placeholder="Customer name"
                    />
                </div>

                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#cccccc',
                        marginBottom: '4px'
                    }}>
                        Phone (Optional)
                    </label>
                    <input
                        type="tel"
                        value={customerData.phone || ''}
                        onChange={(e) => onCustomerDataChange({ ...customerData, phone: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '10px 15px',
                            border: '1px solid #666666',
                            borderRadius: '8px',
                            fontSize: '15px',
                            backgroundColor: '#333333',
                            color: '#ffffff'
                        }}
                        placeholder="(207) 555-0123"
                    />
                </div>

                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#cccccc',
                        marginBottom: '4px'
                    }}>
                        Service Type
                    </label>
                    <select
                        value={customerData.serviceType || 'simple'}
                        onChange={(e) => onCustomerDataChange({ ...customerData, serviceType: e.target.value as 'simple' | 'complex' })}
                        style={{
                            width: '100%',
                            padding: '10px 15px',
                            border: '1px solid #666666',
                            borderRadius: '8px',
                            fontSize: '15px',
                            backgroundColor: '#333333',
                            color: '#ffffff',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="simple">Simple Transaction (Deposit, Withdrawal)</option>
                        <option value="complex">Complex Service (Loans, New Account)</option>
                    </select>
                </div>

                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#cccccc',
                        marginBottom: '4px'
                    }}>
                        Customer Mood
                    </label>
                    <select
                        value={customerData.mood || 'calm'}
                        onChange={(e) => onCustomerDataChange({ ...customerData, mood: e.target.value as 'calm' | 'anxious' | 'urgent' })}
                        style={{
                            width: '100%',
                            padding: '10px 15px',
                            border: '1px solid #666666',
                            borderRadius: '8px',
                            fontSize: '15px',
                            backgroundColor: '#333333',
                            color: '#ffffff',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="calm">Calm</option>
                        <option value="anxious">Anxious</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>

                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#cccccc',
                        marginBottom: '4px'
                    }}>
                        Notes
                    </label>
                    <textarea
                        value={customerData.notes || ''}
                        onChange={(e) => onCustomerDataChange({ ...customerData, notes: e.target.value })}
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '10px 15px',
                            border: '1px solid #666666',
                            borderRadius: '8px',
                            fontSize: '15px',
                            backgroundColor: '#333333',
                            color: '#ffffff',
                            resize: 'vertical'
                        }}
                        placeholder="Any special notes or requests..."
                    />
                </div>

                <button
                    type="submit"
                    style={{
                        width: '100%',
                        backgroundColor: '#1e40af',
                        color: 'white',
                        padding: '12px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '16px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e40af'}
                >
                    Add to Queue
                </button>
            </form>
        </div>
    );
};

export default CustomerForm;