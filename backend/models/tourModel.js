const mongoose = require('mongoose');
const validator = require('validator');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [40, 'A tour name must have less or equal than 40 characters'],
      minLength: [10, 'A tour name must have more or equal than 10 characters']
   
    },
    rating: {
      type: Number,
      default: 4.5
    },
    secretTours: {
      type: Boolean,
      default: false
    },
    slug: String,
    price: {
      type: Number,
      required: [true, 'A tour must have a type']
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy,medium,difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating should be greater or equal to 5'],
      max: [5, 'Rating should be less than or equal to 5']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          // this only points to the current doc on the new document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below the regular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(), //timestamp in milliseconds mongoose converts it to date
      select: false
    },
    startDates: [Date] // mongodbtry to parse the string that we pass as a date into real javascript date
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
// to add virtual fields such that it is not created in database
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});
// document middleware
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});


//query middleware
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTours: { $ne: true } });
  this.start = Date.now();
  next();
});
tourSchema.post(/^find/, function(docs, next) {
  console.log(Date.now() - this.start);
  next();
});

// aggregation middleware
tourSchema.pre('aggregate', function(next) {
  //current aggregation object
  this.pipeline().unshift({
    $match: {
      secretTours: { $ne: true }
    }
  });
  console.log(this);
  next();
});

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
