import React from 'react';
import type { Customer } from '../../types';

interface CustomerFormProps {
    customerData: Partial<Customer>;
    onCustomerDataChange: (data: Partial<Customer>) => void;
    onSubmit: (customer: Partial<Customer>) => void;
    currentLanguage: string;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
    customerData,
    onCustomerDataChange,
    onSubmit,
    currentLanguage
}) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(customerData);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Customer Information</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name (Optional)
                    </label>
                    <input
                        type="text"
                        value={customerData.name || ''}
                        onChange={(e) => onCustomerDataChange({ ...customerData, name: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-cport-blue focus:border-cport-blue"
                        placeholder="Customer name"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone (Optional)
                    </label>
                    <input
                        type="tel"
                        value={customerData.phone || ''}
                        onChange={(e) => onCustomerDataChange({ ...customerData, phone: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-cport-blue focus:border-cport-blue"
                        placeholder="(207) 555-0123"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Type
                    </label>
                    <select
                        value={customerData.serviceType || 'simple'}
                        onChange={(e) => onCustomerDataChange({ ...customerData, serviceType: e.target.value as 'simple' | 'complex' })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-cport-blue focus:border-cport-blue"
                    >
                        <option value="simple">Simple Transaction (Deposit, Withdrawal)</option>
                        <option value="complex">Complex Service (Loans, New Account)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer Mood
                    </label>
                    <select
                        value={customerData.mood || 'calm'}
                        onChange={(e) => onCustomerDataChange({ ...customerData, mood: e.target.value as 'calm' | 'anxious' | 'urgent' })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-cport-blue focus:border-cport-blue"
                    >
                        <option value="calm">Calm</option>
                        <option value="anxious">Anxious</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                    </label>
                    <textarea
                        value={customerData.notes || ''}
                        onChange={(e) => onCustomerDataChange({ ...customerData, notes: e.target.value })}
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-cport-blue focus:border-cport-blue"
                        placeholder="Any special notes or requests..."
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-cport-blue text-white py-2 rounded-md hover:bg-cport-light transition-colors"
                >
                    Add to Queue
                </button>
            </form>
        </div>
    );
};

export default CustomerForm;