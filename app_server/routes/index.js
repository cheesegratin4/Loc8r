import express from 'express';
const router = express.Router();

import * as ctrlLocations from '../controllers/locations.js';
const homelist = ctrlLocations.homelist;
const locationInfo = ctrlLocations.locationInfo;
const addReview = ctrlLocations.addReview;
const doAddReview = ctrlLocations.doAddReview;

import * as ctrlOthers from '../controllers/others.js';
const about = ctrlOthers.about;

/* Location page. */
router.get('/', homelist);
router.get('/location/:locationId', ctrlLocations.locationInfo);
router.get('/location/:locationId/review', addReview);

router.post('/location/:locationId/review', doAddReview);

/* Other page. */
router.get('/about', about);

export default router;
