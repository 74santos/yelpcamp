const express = require ('express');
const router = express.Router();
const campgrounds = require('../controllers/campgrounds');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });


const {isLoggedIn, isAuthor, validateCampground }= require('../middleware');


router.route('/')
    .get( campgrounds.index )
    .post(isLoggedIn, upload.array('image') ,validateCampground, campgrounds.createCampground)



    // .post(upload.array('image'), (req,res) => {
    //     console.log('Body:', req.body);
    //     console.log('File:', req.files);
    //     res.send({
    //         body: req.body,
    //         file: req.files
    //     }
    //     );
    // })

router.get('/new', isLoggedIn, campgrounds.renderNewForm);
    
router.route('/:id')
    .get( campgrounds.showCampground )
    .put( isLoggedIn, isAuthor, upload.array('image') , validateCampground, campgrounds.updateCampground )
    .delete( isLoggedIn, isAuthor , campgrounds.deleteCampground )





router.get('/:id/edit', isLoggedIn, isAuthor, campgrounds.renderEditForm);




module.exports = router;