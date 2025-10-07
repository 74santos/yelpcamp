const mongoose = require("mongoose");
const cities = require('./cities');
const { descriptors, places } = require('./seedHelpers');
const Campground = require("../models/campground");
const User = require('../models/user');
require('dotenv').config();

// Use the DB_URL from environment variables
const dbUrl = process.env.DB_URL  //|| "mongodb://127.0.0.1:27017/yelp-camp";



mongoose.connect(dbUrl)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.error("Error connecting to MongoDB:", err));

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB Atlas");
});

const sample = array => array[Math.floor(Math.random() * array.length)];  // const random = Math.floor(Math.random() * cities.length);




const seedDB = async () => {
  await Campground.deleteMany({});

  let user = await User.findOne({ username: 'Tim' });

  if (!user) {
    user = new User({ username: 'Tim', email: 'tim@example.com' });
    await User.register(user, 'password123'); // password123 is your login password
    console.log('Created user Tim for seeding.');
  } else {
    console.log('Seeding with existing user:', user.username);
  }

  for (let i = 0; i < 150; i++) {
    const price = Math.floor(Math.random() * 20) + 10;
    const randomCity = sample(cities);

    const camp = new Campground({
      author: user._id,
      title: `${sample(descriptors)} ${sample(places)}`,
      location: `${randomCity.city}, ${randomCity.state}`,
      geometry: {
        type: "Point",
        coordinates: [randomCity.longitude, randomCity.latitude]
      },
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      images: [{url: `https://picsum.photos/seed/camp${i}/800/600`, filename: `camp${i}`}],
      price
    });

    await camp.save();
  } 

  console.log("Database seeded with campgrounds!");
};


seedDB().then(() => {
  mongoose.connection.close();
});