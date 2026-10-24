import mongoose from 'mongoose';
import router from "../../app_server/routes/index.js";
const Loc = mongoose.model('Location');

// GET
const locationsReadOne = async (req, res) => {
    try {
        const location = await Loc.findById(req.params.locationId).exec();
        if (!location) {
            return res
                .status(404)
                .json({ "message": "Location not found" });
        }
        return res
            .status(200)
            .json(location);
    } catch (err) {
        return res
            .status(400)
            .json({ error: 'An error occurred' });
    }
};

/* then을 사용한 간접콜백
const locationsReadOne = (req, res) => {
    Loc
        .findById(req.params.locationId)
        .exec()
        .then(location => {
            res.status(200).json({
                location : location,
                "status" : "success",
                "학번" : "2024810083",
                "이름" : "임송찬"
            }); //학번 출력을 위한 것으로, 이후에 수정함
        })
        .catch(err => {
            res.status(500).json({ error: 'An error occurred' });
        });
};
*/

const locationsListByDistance = async (req, res) => {
    const lng = parseFloat(req.query.lng);
    const lat = parseFloat(req.query.lat);

    const maxDist = parseFloat(req.query.maxDistance);

    const near = {
        type: "Point",
        coordinates: [lng, lat]
    };
    const geoOptions = {
        distanceField: "distance.calculated",
        key: 'coords',
        spherical: true,
        maxDistance: 20000,
    };
    if (maxDist){geoOptions.maxDistance = maxDist;}

    if (!lng || !lat) {
        return res
            .status(404)
            .json({ "message": "lng and lat query parameters are required" });
    }
    try {
        const results = await Loc.aggregate([
            {
                $geoNear: {
                    near,
                    ...geoOptions
                }
            }
        ]);
        const locations = results.map(result => {
            return {
                _id: result._id,
                name: result.name,
                address: result.address,
                rating: result.rating,
                facilities: result.facilities,
                distance: `${result.distance.calculated.toFixed()}`
            }
        });
        res
            .status(200)
            .json(locations);
    } catch (err) {
        res
            .status(404)
            .json(err);
    }
};

// POST
const locationsCreate = async (req, res) => {
    try {
        const location = await Loc.create({
            name: req.body.name,
            address: req.body.address,
            facilities: req.body.facilities.split(","),
            coords: {
                type: "Point",
                coordinates: [
                    parseFloat(req.body.lng),
                    parseFloat(req.body.lat)
                ]
            },
            openingTimes: [
                {
                    days: req.body.days1,
                    opening: req.body.opening1,
                    closing: req.body.closing1,
                    closed: req.body.closed1
                },
                {
                    days: req.body.days2,
                    opening: req.body.opening2,
                    closing: req.body.closing2,
                    closed: req.body.closed2
                }
            ]
        });
        return res
            .status(201)
            .json(location);

    } catch (err) {
        if (err.name === "ValidationError" || err.name === "CastError") {
            return res
                .status(400)
                .json({ error: "스키마 검증 위반" });
        }
        return res
            .status(400)
            .json({
                name: err.name,
                message: err.message
            });
    }
};

// PUT
const locationsUpdateOne = async (req, res) => {
    if (!req.params.locationId) {
        return res
            .status(404)
            .json({
                "message": "Not found, locationId is required"
            });
    }
    try {
        const location = await Loc.findById(req.params.locationId).select('-reviews -rating').exec();

        if (!location) {
            return res
                .status(404)
                .json({
                    "message": "locationId not found"
                });
        }
        location.name = req.body.name;
        location.address = req.body.address;
        location.facilities = req.body.facilities.split(',');
        location.coords = [
            parseFloat(req.body.lng),
            parseFloat(req.body.lat)
        ];
        location.openingTimes = [{
            days: req.body.days1,
            opening: req.body.opening1,
            closing: req.body.closing1,
            closed: req.body.closed1,
        }, {
            days: req.body.days2,
            opening: req.body.opening2,
            closing: req.body.closing2,
            closed: req.body.closed2,
        }];
        const updatedLocation = await location.save();
        return res
            .status(200)
            .json(updatedLocation);
    } catch (err) {
        return res
            .status(400)
            .json(err);
    }
};

// DELETE
const locationsDeleteOne = async (req, res) => {
    const { locationId } = req.params;
    if (!locationId) {
        return res
            .status(404)
            .json({
                "message": "No Location"
            });
    }
    try {
        const location = await Loc.findByIdAndDelete(locationId).exec();
        if (!location) {
            return res
                .status(404)
                .json({
                    "message": "locationId not found"
                });
        }
        return res
            .status(204)
            .json(null);
    } catch (err) {
        return res
            .status(404)
            .json(err);
    }
};

export default {
    locationsListByDistance,
    locationsCreate,
    locationsReadOne,
    locationsUpdateOne,
    locationsDeleteOne
};
