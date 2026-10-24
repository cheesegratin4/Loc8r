import request from 'request';

const apiOptions = {
    server: 'http://localhost:3000'
};
if(process.env.NODE_ENV === 'production'){
    apiOptions.server = 'https://loc8r-api-789i.onrender.com'
}

const requestOptions ={
    url: `${apiOptions.server}`,
    method: 'GET',
    json: {},
    qs: {
        offset: 20
    }
}
request(requestOptions,(err, response, body) => {
    if(err){
        console.log(err);
    } if(response.statusCode === 200){
        console.log(body);
    } else {
        console.log(response.statusCode);
    }
});

/* GET 'Home' page. */
const homelist = (req, res) => {
    const path = '/api/locations';
    const requestOptions = {
        url: `${apiOptions.server}${path}`,
        method: 'GET',
        json: {},
        qs: {
            lng: 127.26425631121843,
            lat: 37.00623006009819,
            maxDistance: 200000
        }
    };
    request(
        requestOptions,
        (err, response, body) => {
            let data = [];
            if (response.statusCode === 200 && body.length) {
                data = body.map((item) => {
                    item.distance = formatDistance(item.distance);
                    return item;
                });
            };
            renderHomepage(req, res, data);
        }
   );
};

const formatDistance = (distance) => {
    let thisDistance = 0;
    let unit = 'm';
    if (distance > 1000) {
        thisDistance = parseFloat(distance / 1000).toFixed(1);
        unit = 'km';
    } else {
        thisDistance = Math.floor(distance);
    }
    return thisDistance + unit;
};

const renderHomepage = (req, res, responseBody) => {
    let message = null;
    if (!(responseBody instanceof Array)) {
        message = "API lookup error";
        responseBody = [];
    } else {
        if (!responseBody.length) {
            message = "No places found nearby";
        }
    }
    res.render('locations-list', {
        title: 'Loc8r - find a place to work with wifi',
        pageHeader: {
            title: 'Loc8r',
            strapline: 'Find places to work with wifi near you!'
        },
        sidebar: "Looking for wifi and a seat? Loc8r helps you find places \
        to work when out and about. Perheps with coffee, cake or a pint? \
        Let Loc8r help you find the place you're looking for.",
        locations: responseBody,
        message
    });
};

/* GET 'Location info' page. */
const getLocationInfo = (req, res, callback) => {
    const path = `/api/locations/${req.params.locationId}`;
    const requestOptions = {
      url: `${apiOptions.server}${path}`,
      method: 'GET',
      json: {}
    };
    request(
        requestOptions,
        (err, {statusCode}, body) => {
            const data = body;
            if (statusCode === 200) {
                data.coords = {
                    lng: body.coords[0],
                    lat: body.coords[1]
                };
                callback(req, res, data);
            } else {
                showError(req, res, statusCode);
            }

        }
    )
};

const locationInfo = (req, res) => {
    getLocationInfo(req, res,
        (req, res, responseData) => renderDetailPage(req, res, responseData)
    );
};

const renderDetailPage = (req, res, location) => {
    res.render('location-info', {
        title: location.name,
        pageHeader: {
            title: location.name
        },
        sidebar: {
            context: 'is on Loc8r because it has accessible wifi and space \
                to sit down with your laptop and get some work done.',
            callToAction: 'If you\'ve been and you like it - or if you don\'t \
                - please leave a review to help other people just like you.'
        },
        location
    });
};

const showError = (req, res, status) => {
  let title = '';
  let content = '';
  if (status === 404) {
      title = '404, page not found';
      content = 'Oh, dear. looks like you can\'t find this page. Sorry.';
  } else {
      title = `${status}, something's gone wrong`;
      content = 'Something, Somewhere, has gone just a little bit wrong.';
  }
  res.status(status);
  res.render('generic-text', {
      title,
      content
  });
};

/* GET 'Add review' page. */
const addReview = (req, res) => {
    getLocationInfo(req, res,
        (req, res, reponseData) => renderReviewForm(req, res, reponseData)
    );
};

const renderReviewForm = function (req, res, {name}){
    res.render('location-review-form', {
        title: `Review ${name} on Loc8r`,
        pageHeader: { title: `Review ${name}` },
        error: req.query.err
    });
};

const doAddReview = (req, res) => {
    const locationId = req.params.locationId;
    const path = `/api/locations/${locationId}/reviews`
    const postdata = {
        author: req.body.name,
        rating: parseInt(req.body.rating, 10),
        reviewText: req.body.review
    };
    const requestOptions = {
        url: `${apiOptions.server}${path}`,
        method: 'POST',
        json: postdata
    };
    if (!postdata.author || !postdata.rating || !postdata.reviewText) {
        res.redirect(`/location/${locationId}/review?err=val`);
    } else {
        request(
            requestOptions,
            (err, {statusCode}, {name}) => {
                if (statusCode === 201) {
                    res.redirect(`/location/${locationId}`);
                } else if (statusCode === 400 && name && name === 'ValidationError') {
                    res.redirect(`/location/${locationId}/review?err=val`);
                } else {
                    showError(req, res, statusCode);
                }
            }
        );
    }
};

export {
    homelist,
    locationInfo,
    addReview,
    doAddReview
};
