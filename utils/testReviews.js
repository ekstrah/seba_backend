import { Product } from '../models/product.model.js';
import { Farmer } from '../models/farmer.model.js';
import { Consumer } from '../models/consumer.model.js';
import Review from '../models/review.model.js';
import logger from './logger.js';
import { faker } from '@faker-js/faker';

// Helper to recalculate and update rating and reviews array for a product or farmer
async function recalculateRatingForEntity(entity, type) {
  let reviews;
  if (type === 'product') {
    reviews = await Review.find({ type: 'product', product: entity._id });
  } else {
    reviews = await Review.find({ type: 'farmer', farmer: entity._id });
  }
  const count = reviews.length;
  const average = count === 0 ? 0 : reviews.reduce((sum, r) => sum + r.rating, 0) / count;
  entity.rating = { average: Number(average.toFixed(1)), count };
  entity.reviews = reviews.map(r => r._id); // <-- This links the reviews
  await entity.save();
}

/**
 * Initializes at least 3 dummy reviews for every product and every farmer.
 * Uses random test consumers as reviewers.
 * Batch inserts reviews for efficiency, then manually recalculates ratings and links reviews.
 */
export const initializeTestReviews = async () => {
  let productReviewsAdded = 0;
  let farmerReviewsAdded = 0;
  try {
    // Early exit if any review exists
    const existingReview = await Review.findOne();
    if (existingReview) {
      logger.info('Test reviews already exist');
      return;
    }
    // Fetch all consumers (reviewers)
    const consumers = await Consumer.find().lean();
    if (consumers.length < 3) {
      logger.warn('Not enough consumers to generate reviews.');
      return;
    }

    // Fetch all products and farmers
    const products = await Product.find();
    const farmers = await Farmer.find();

    // Helper to pick 3 unique random consumers
    const pickReviewers = () => {
      const shuffled = consumers.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 3);
    };

    // --- Product Reviews ---
    const productReviewDocs = [];
    const productsToUpdate = [];
    for (const product of products) {
      const existingCount = await Review.countDocuments({ type: 'product', product: product._id });
      if (existingCount >= 3) continue;
      const reviewers = pickReviewers();
      for (const reviewer of reviewers) {
        productReviewDocs.push({
          type: 'product',
          product: product._id,
          reviewer: reviewer._id,
          rating: faker.number.int({ min: 3, max: 5 }),
          title: faker.lorem.words({ min: 2, max: 5 }),
          comment: faker.lorem.sentences({ min: 1, max: 3 }),
          isVerifiedPurchase: faker.datatype.boolean(),
        });
      }
      productsToUpdate.push(product);
    }
    if (productReviewDocs.length > 0) {
      await Review.insertMany(productReviewDocs);
      productReviewsAdded = productReviewDocs.length;
      // Manually recalculate ratings and link reviews for affected products
      for (const product of productsToUpdate) {
        await recalculateRatingForEntity(product, 'product');
      }
    }

    // --- Farmer Reviews ---
    const farmerReviewDocs = [];
    const farmersToUpdate = [];
    for (const farmer of farmers) {
      const existingCount = await Review.countDocuments({ type: 'farmer', farmer: farmer._id });
      if (existingCount >= 3) continue;
      const reviewers = pickReviewers();
      for (const reviewer of reviewers) {
        farmerReviewDocs.push({
          type: 'farmer',
          farmer: farmer._id,
          reviewer: reviewer._id,
          rating: faker.number.int({ min: 3, max: 5 }),
          title: faker.lorem.words({ min: 2, max: 5 }),
          comment: faker.lorem.sentences({ min: 1, max: 3 }),
          isVerifiedPurchase: faker.datatype.boolean(),
        });
      }
      farmersToUpdate.push(farmer);
    }
    if (farmerReviewDocs.length > 0) {
      await Review.insertMany(farmerReviewDocs);
      farmerReviewsAdded = farmerReviewDocs.length;
      // Manually recalculate ratings and link reviews for affected farmers
      for (const farmer of farmersToUpdate) {
        await recalculateRatingForEntity(farmer, 'farmer');
      }
    }

    if (productReviewsAdded === 0 && farmerReviewsAdded === 0) {
      logger.info('Test reviews already exist');
    } else {
      logger.info('Test reviews initialized successfully');
    }
  } catch (error) {
    logger.error('Error initializing dummy reviews:', error);
    throw error;
  }
}; 