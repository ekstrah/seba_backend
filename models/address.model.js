import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    street: {
        type: String,
        required: true,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    zipCode: {
        type: String,
        required: true,
        trim: true
    },
    country: {
        type: String,
        required: true,
        trim: true,
        default: 'United States'
    },
    coordinates: {
        latitude: {
            type: Number,
            min: -90,
            max: 90
        },
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    addressType: {
        type: String,
        enum: ['home', 'work', 'farm', 'other'],
        default: 'home'
    },
    additionalInfo: {
        type: String,
        trim: true,
        maxlength: 200
    }
}, {
    timestamps: true
});

// Compound index for efficient querying
addressSchema.index({ street: 1, city: 1, state: 1, zipCode: 1 }, { unique: true });

// Method to format address as a string
addressSchema.methods.formatAddress = function() {
    return `${this.street}, ${this.city}, ${this.state} ${this.zipCode}`;
};

// Static method to validate coordinates
addressSchema.statics.validateCoordinates = function(latitude, longitude) {
    return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
};

// Pre-save middleware to ensure only one default address per user
addressSchema.pre('save', async function(next) {
    if (this.isDefault) {
        const Address = this.constructor;
        await Address.updateMany(
            { _id: { $ne: this._id }, isDefault: true },
            { isDefault: false }
        );
    }
    next();
});

export const Address = mongoose.model('Address', addressSchema);
