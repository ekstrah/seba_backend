/**
 * Calculates the new average rating when a review is added or updated
 * @param {Object} currentRating - Current rating object { average: number, count: number }
 * @param {number} newRating - The new rating value (1-5)
 * @param {number} oldRating - The old rating value (1-5) if updating, null if new review
 * @returns {Object} Updated rating object { average: number, count: number }
 */
export const calculateNewRating = (currentRating, newRating, oldRating = null) => {
    const { average, count } = currentRating;

    // If this is a new review
    if (oldRating === null) {
        const newAverage = ((average * count) + newRating) / (count + 1);
        return {
            average: Number(newAverage.toFixed(1)),
            count: count + 1
        };
    }

    // If this is an update to an existing review
    const newAverage = ((average * count) - oldRating + newRating) / count;
    return {
        average: Number(newAverage.toFixed(1)),
        count: count
    };
};

/**
 * Calculates the new average rating when a review is deleted
 * @param {Object} currentRating - Current rating object { average: number, count: number }
 * @param {number} deletedRating - The rating value being deleted
 * @returns {Object} Updated rating object { average: number, count: number }
 */
export const calculateRatingAfterDeletion = (currentRating, deletedRating) => {
    const { average, count } = currentRating;

    if (count <= 1) {
        return {
            average: 0,
            count: 0
        };
    }

    const newAverage = ((average * count) - deletedRating) / (count - 1);
    return {
        average: Number(newAverage.toFixed(1)),
        count: count - 1
    };
}; 