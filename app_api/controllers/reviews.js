import mongoose from 'mongoose';
import router from "../../app_server/routes/index.js";
const Loc = mongoose.model('Location');

// POST
const reviewsCreate = async (req, res) => {
    const locationId = req.params.locationId;
    if (!locationId) {
        return res.status(404).json({ "message": "Location not found" });
    }

    try {
        const location = await Loc.findById(locationId).select('reviews').exec();
        if (location) {
            await doAddReview(req, res, location);
        } else {
            return res.status(404).json({ "message": "Location not found" });
        }
    } catch (err) {
        return res.status(400).json(err);
    }
};

const doAddReview = async (req, res, location) => {
    if (!location) {
        return res.status(404).json({ "message": "Location not found" });
    }

    const { author, rating, reviewText } = req.body;
    location.reviews.push({ author, rating, reviewText });

    try {
        const updatedLocation = await location.save();
        await updateAverageRating(updatedLocation._id);
        const thisReview = updatedLocation.reviews.slice(-1).pop();
        return res.status(201).json(thisReview);
    } catch (err) {
        return res.status(400).json(err);
    }
};

const doSetAverageRating = async (location) => {
    if (location.reviews && location.reviews.length > 0) {
        const count = location.reviews.length;
        const total = location.reviews.reduce((acc, {rating}) => {
            return acc + rating;
        }, 0);

        location.rating = parseInt(total / count, 10);
        try {
            await location.save();
            console.log(`Average rating updated to ${location.rating}`);
        } catch (err) {
            console.log(err);
        }
    }
};

const updateAverageRating = async (locationId) => {
    try {
        const location = await Loc.findById(locationId).select('rating reviews').exec();
        if (location) {
            await doSetAverageRating(location);
        }
    } catch (err) {
        console.log(err);
    }
};

// GET
const reviewsReadOne = async (req, res) => {
    try {
        const location = await Loc
            .findById(req.params.locationId)
            .select('name reviews')
            .exec();
        if (!location) {
            return res
                .status(404)
                .json({ "message": "location not found" });
        }
        if (location.reviews && location.reviews.length > 0) {
            const review = location.reviews.id(req.params.reviewId);
            if (!review) {
                return res
                    .status(404)
                    .json({ "message": "review not found" });
            }
            const response = {
                    location: {
                        name: location.name,
                        id: req.params.locationId
                    },
                    review
                }
            return res
                .status(200)
                .json(response);
        } else {
            return res
                .status(404)
                .json({ "message": "No reviews found" });
        }
    } catch (err) {
        return res
            .status(400)
            .json(err);
    }
};

// PUT
const reviewsUpdateOne = async (req, res) => {
    if (!req.params.locationId || !req.params.reviewId) {
        return res.status(404).json({ "message": "Not found, locationId and reviewId are both required" });
    }

    try {
        const location = await Loc.findById(req.params.locationId).select('reviews').exec();
        if (!location) {
            return res.status(404).json({ "message": "Location not found" });
        }

        if (location.reviews && location.reviews.length > 0) {
            const thisReview = location.reviews.id(req.params.reviewId);
            if (!thisReview) {
                return res.status(404).json({ "message": "Review not found" });
            }

            thisReview.author = req.body.author;
            thisReview.rating = req.body.rating;
            thisReview.reviewText = req.body.reviewText;

            const updatedLocation = await location.save();
            await updateAverageRating(updatedLocation._id);
            return res.status(200).json(thisReview);
        } else {
            return res.status(404).json({ "message": "No review to update" });
        }
    } catch (err) {
        return res.status(400).json(err);
    }
};

// DELETE
const reviewsDeleteOne = async (req, res) => {
    const { locationId, reviewId } = req.params;
    if (!locationId || !reviewId) {
        return res
            .status(404)
            .json({ 'message': 'Not found, locationId and reviewId are both required' });
    }

    try {
        const location = await Loc
            .findById(locationId)
            .select('reviews')
            .exec();
        if (!location) {
            return res
                .status(404)
                .json({ 'message': 'Location not found' });
        }

        if (location.reviews && location.reviews.length > 0) {
            const review = location.reviews.id(reviewId);
            if (!review) {
                return res
                    .status(404)
                    .json({ 'message': 'Review not found' });
            }

            location.reviews.pull(reviewId);
            await location.save();
            await updateAverageRating(location._id);
            return res
                .status(204)
                .json()
        } else {
            return res
                .status(404)
                .json({ 'message': 'No Review to delete' });
        }
    } catch (err) {
        return res
            .status(400)
            .json({
                name: err.name,
                message: err.message
            });
    }
};

export default {
    reviewsCreate,
    reviewsReadOne,
    reviewsUpdateOne,
    reviewsDeleteOne
};