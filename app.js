if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const sanitizeV5 = require("./utils/mongoSanitizeV5");
const helmet = require("helmet");
const userRoutes = require("./routes/users");
const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");
const dbUrl = process.env.DB_URL || "mongodb://127.0.0.1:27017/yelp-camp";

const morgan = require("morgan"); // for logging requests

// process.env.DB_URL  ||mongodb://localhost:27017/yelp-camp
mongoose.connect(dbUrl);
const app = express();
app.set("query parser", "extended");

// Use the 'dev' preset for concise output with status color-coding
app.use(morgan("dev"));

// Get the default connection
const db = mongoose.connection;
// Bind connection to error event (to get notification of connection errors)
db.on("error", console.error.bind(console, "MongoDB connection error:"));

db.once("open", () => {
  console.log("Connected to MongoDB");
});

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

app.use(sanitizeV5({ replaceWith: "_" })); // ✅ Secure sanitation

//
// SESSION CONFIGURATION
const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60, // time period in seconds
  crypto: {
    secret: process.env.SECRET || "thisshouldbeabettersecret!",
  },
});

store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e);
});

const sessionConfig = {
  store,
  name: "cookieMonster",
  secret: process.env.SECRET || "thisshouldbeabettersecret!",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure: true,  // for https
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));
app.use(flash());

// Set security-related headers
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        "https://api.mapbox.com",
        "https://events.mapbox.com",
        "https://*.tiles.mapbox.com",
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://stackpath.bootstrapcdn.com",
        "https://kit.fontawesome.com",
        "https://api.tiles.mapbox.com",
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com",
        "https://api.mapbox.com",
        "https://*.mapbox.com",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://stackpath.bootstrapcdn.com",
        "https://kit-free.fontawesome.com",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com",
        "https://api.mapbox.com",
        "https://api.tiles.mapbox.com",
        "https://fonts.googleapis.com",
      ],
      imgSrc: [
        "'self'",
        "blob:",
        "data:",
        "https://res.cloudinary.com/djvvewegg/",
        "https://images.pexels.com",
        "https://picsum.photos",
        "https://fastly.picsum.photos",
        "https://api.mapbox.com",
        "https://*.tiles.mapbox.com",
      ],
      fontSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://fonts.gstatic.com",
      ],
      workerSrc: ["'self'", "blob:"],
      objectSrc: [],
      mediaSrc: ["'self'"],
      upgradeInsecureRequests: null, // <-- prevent forcing HTTPS
    },
  })
);

app.use(passport.initialize()); // Initialize passport has to below session(sessionConfig)
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currentRoute = req.path;
  next();
});

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentRoute = req.path;
  next();
});

app.use("/", userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.get("/", (req, res) => {
  res.render("home");
  console.log("hello");
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  if (!err.message) err.message = "Oh boy, Something went wrong";
  res.status(statusCode).render("error", {
    statusCode,
    message: err.message,
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`YelpCamp server started on port ${port}`);
});

//app.all(/(.*)/, (req, res, next) => {
// res.send("404!!!");
// next(new ExpressError('Page Not Found', 404));
// });

// app.get('/test-error', (req, res) => {
//   throw new Error('This is a test error');
// });
