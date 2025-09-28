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
        <>
            <div className="info-card">
                <h3 className="card-title">👤 Customer Information</h3>
                <div className="form-group">
                    <label className="form-label">Customer Name (Optional)</label>
                    <input
                        type="text"
                        className="form-input"
                        value={customerData.name || ''}
                        onChange={(e) => onCustomerDataChange({ ...customerData, name: e.target.value })}
                        placeholder="Enter customer name"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Phone Number (Optional)</label>
                    <input
                        type="tel"
                        className="form-input"
                        value={customerData.phone || ''}
                        onChange={(e) => onCustomerDataChange({ ...customerData, phone: e.target.value })}
                        placeholder="(207) 555-0123"
                    />
                </div>
            </div>

            <div className="info-card">
                <h3 className="card-title">🏦 Service Details</h3>
                <div className="form-group">
                    <label className="form-label">Transaction Type</label>
                    <select
                        className="form-select"
                        value={customerData.serviceType || 'simple'}
                        onChange={(e) => onCustomerDataChange({ ...customerData, serviceType: e.target.value as 'simple' | 'complex' })}
                    >
                        <option value="simple">Simple Transaction (Deposit/Withdrawal)</option>
                        <option value="complex">Account Opening</option>
                        <option value="complex">Loan Application</option>
                        <option value="simple">General Banking Inquiry</option>
                        <option value="complex">Complex Transaction</option>
                        <option value="complex">Dispute Resolution</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Customer Mood</label>
                    <select
                        className="form-select"
                        value={customerData.mood || 'calm'}
                        onChange={(e) => onCustomerDataChange({ ...customerData, mood: e.target.value as 'calm' | 'anxious' | 'urgent' })}
                    >
                        <option value="calm">Calm & Cooperative</option>
                        <option value="anxious">Frustrated</option>
                        <option value="anxious">Anxious/Nervous</option>
                        <option value="calm">Happy/Satisfied</option>
                        <option value="anxious">Confused</option>
                        <option value="urgent">Urgent/Time-sensitive</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Special Notes</label>
                    <textarea
                        className="form-textarea"
                        value={customerData.notes || ''}
                        onChange={(e) => onCustomerDataChange({ ...customerData, notes: e.target.value })}
                        placeholder="Any additional context or special requirements..."
                    />
                </div>
            </div>
        </>
    );
};

export default CustomerForm;