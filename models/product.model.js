// name, description, price, stock, imagePath, isAvailable, harvestDate, expiryDate, certType, farmingMethod, category

import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        description: {
            type: String,
            required: true,
        },
        price: {
            type: String,
            required: true,
        },
        stock: {
            type: Number,
            default: Date.now,
        },
        imagePath: {
            type: String,
            default: false,
        },
        isAvailable: {
            type: Boolean,
            default: false,
        },
        harvestDate: {
            type: Date,
            default: false,
        },
        expiryDate: {
            type: Date,
            default: false,
        },
        certType: {
            type: String,
            default: false,
        },
        farmingMethod: {
            type: String,
            default: false,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        reviews: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }],
        rating: {
            average: {
                type: Number,
                default: 0,
                min: 0,
                max: 5
            },
            count: {
                type: Number,
                default: 0
            }
        }
    },
    { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);