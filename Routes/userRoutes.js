const express = require('express');
const router = express.Router();
const User = require('../Model/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const verifyToken = require('../MiddleWare/auth');

router.post('/', async (req, res) => {
    const { email, password } = req.body;
    const encPassword = await bcrypt.hash(password, 10);

    const user = new User({
        email: email,
        password: encPassword
    });
    User.findOne({ email: email }, function (err, user1) {
        if (err) {
            res.status(503).send({ message: "The server is down, Please try again later" });
        }
        else if (user1 === null) {
            user.save(err => {
                if (err) {
                    res.status(403).send({ error: err });
                }
                else {
                    const token = jwt.sign(
                        { id: user._id, email: email },
                        process.env.TOKEN_KEY
                    );
                    res.status(200).send({ message: "The data is stored successfully", token: token });
                }
            });
        }
        else {
            res.status(409).send({ message: "User Already exist" });
        }
    })
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    User.findOne({ email: email }, (err, foundUser) => {
        if (err) {
            res.status(503).send({ message: "The server is down, Please try again later" });
        }
        else if (foundUser === null) {
            res.status(404).send({ message: "There is no registered E-Mail with your entered E-Mail" });
        }
        else {
            bcrypt.compare(password, foundUser.password, (err, result) => {
                if (result) {
                    const token = jwt.sign(
                        { id: foundUser._id, email: email },
                        process.env.TOKEN_KEY
                    );
                    res.status(200).send({ message: "User found Successfully", token: token });
                }
                else {
                    res.status(401).send({ message: "Password is incorrect" });
                }
            });
        }
    });
});

router.post('/row', verifyToken, (req, res) => {
    const favMovie = req.body;
    const email = req.user.email;
    User.findOne({ email: email }, { favourites: 1 }, (err, foundUser) => {
        if (err) {
            res.status(503).send({ message: "The server is down, Please try again later" });
        }
        else {
            let found = 0;
            foundUser.favourites.map((item) => {
                if (item.id === favMovie.id) {
                    found = 1;
                }
            });
            if (found === 1) {
                res.status(223).send({ message: "The movie already exist in Favourites" });
            }
            else {
                User.updateOne({ email: email }, { $push: { favourites: favMovie } }, (err) => {
                    if (err) {
                        res.status(502).send({ message: "Error in deleting movie from favourites" });
                    }
                    else {
                        res.status(200).send({ message: "The movie has been added to favourites successfully" });
                    }
                });
            }
        }
    })
});

router.get('/favourites', verifyToken, (req, res) => {
    const email = req.user.email;
    User.findOne({ email: email }, { favourites: 1 }, (err, foundUser) => {
        if (err) {
            res.status(503).send({ message: "The server is down, Please try again later" });
        }
        else {
            if (foundUser === null) {
                res.status(204).send({ message: "The favourite Movie list is empty" });
            }
            else {
                res.status(200).send({ data: foundUser.favourites });
            }
        }
    });
});

router.post('/favourites', verifyToken, (req, res) => {
    const delFavMovie = req.body;
    const movieId = delFavMovie.id;
    const email = req.user.email;
    User.updateOne({ email: email }, { $pull: { favourites: { id: movieId } } }, (err) => {
        if (err) {
            res.status(503).send({ message: "The server is down, Please try again later" });
        }
        else {
            res.status(200).send({ message: "The movie has been removed successfully from favourites" });
        }
    })
});

router.post('/navbar', verifyToken, (req, res) => {
    const email = req.user.email;
    User.deleteOne({ email: email }, (err) => {
        if (err) {
            res.status(503).send({ message: "The server is down, Please try again later" });
        }
        else {
            res.status(200).send({ message: "The account is deleted successfully" });
        }
    })
})

module.exports = router;