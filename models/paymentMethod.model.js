import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema({
    consumer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Consumer',
        required: true
    },
    type: {
        type: String,
        enum: ['credit_card', 'debit_card', 'bank_account'],
        required: true
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    // Payment processor information
    processor: {
        type: String,
        enum: ['stripe', 'paypal', 'square'],
        required: true
    },
    processorToken: {
        type: String,
        required: true,
        unique: true
    },
    // For display purposes only
    displayInfo: {
        lastFourDigits: {
            type: String,
            required: function() {
                return this.type === 'credit_card' || this.type === 'debit_card';
            },
            validate: {
                validator: function(v) {
                    return /^\d{4}$/.test(v);
                },
                message: 'Last four digits must be exactly 4 digits'
            }
        },
        cardType: {
            type: String,
            enum: ['visa', 'mastercard', 'amex', 'discover'],
            required: function() {
                return this.type === 'credit_card' || this.type === 'debit_card';
            }
        },
        expiryMonth: {
            type: Number,
            min: 1,
            max: 12,
            required: function() {
                return this.type === 'credit_card' || this.type === 'debit_card';
            }
        },
        expiryYear: {
            type: Number,
            required: function() {
                return this.type === 'credit_card' || this.type === 'debit_card';
            }
        }
    },
    // For bank accounts
    bankInfo: {
        accountType: {
            type: String,
            enum: ['checking', 'savings'],
            required: function() {
                return this.type === 'bank_account';
            }
        },
        lastFourDigits: {
            type: String,
            required: function() {
                return this.type === 'bank_account';
            },
            validate: {
                validator: function(v) {
                    return /^\d{4}$/.test(v);
                },
                message: 'Last four digits must be exactly 4 digits'
            }
        },
        bankName: {
            type: String,
            required: function() {
                return this.type === 'bank_account';
            }
        }
    },
    billingAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
paymentMethodSchema.index({ consumer: 1, isDefault: 1 });
paymentMethodSchema.index({ consumer: 1, isActive: 1 });
paymentMethodSchema.index({ processorToken: 1 }, { unique: true });

// Pre-save middleware to ensure only one default payment method per consumer
paymentMethodSchema.pre('save', async function(next) {
    if (this.isDefault) {
        const PaymentMethod = this.constructor;
        await PaymentMethod.updateMany(
            { 
                consumer: this.consumer,
                _id: { $ne: this._id },
                isDefault: true 
            },
            { isDefault: false }
        );
    }
    next();
});

// Helper method to validate expiry date
paymentMethodSchema.methods.isExpired = function() {
    if (this.type === 'credit_card' || this.type === 'debit_card') {
        const now = new Date();
        const expiryDate = new Date(this.displayInfo.expiryYear, this.displayInfo.expiryMonth - 1);
        return now > expiryDate;
    }
    return false;
};

export const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema); 