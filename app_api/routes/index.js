import express from 'express';
const router = express.Router();

import ctrlLocations from '../controllers/locations.js';
import ctrlReviews from '../controllers/reviews.js';

// locations
router
    .route('/locations')
    .get(ctrlLocations.locationsListByDistance)
    .post(ctrlLocations.locationsCreate);
router
    .route('/locations/:locationId')
    .get(ctrlLocations.locationsReadOne)
    .put(ctrlLocations.locationsUpdateOne)
    .delete(ctrlLocations.locationsDeleteOne);

// reviews
router
    .route('/locations/:locationId/reviews')
    .post(ctrlReviews.reviewsCreate);
router
    .route('/locations/:locationId/reviews/:reviewId')
    .get(ctrlReviews.reviewsReadOne)
    .put(ctrlReviews.reviewsUpdateOne)
    .delete(ctrlReviews.reviewsDeleteOne);

export default router;
