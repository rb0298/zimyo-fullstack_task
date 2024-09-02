const express = require("express");
// contains all the Route handler functions
const tourController = require("./../controllers/tourController");
const authController = require("./../controllers/authController");
//To create Router
const router = express.Router();

// '/' corrresponds to sub application or resource for which we are handling the route '/'='api/v1/tours'
router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours);
router.route("/tour-stats").get(tourController.getTourStats);
router.route("/montly-plan/:year").get(tourController.getMontlyPlan);
router
  .route("/")
  .get(authController.protect, tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo("admin"),
    tourController.createTour
  );

router
  .route("/:id")
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    tourController.deleteTour
  );

module.exports = router;
