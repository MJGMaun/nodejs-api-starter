const express = require('express');
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth')

const router = new express.Router()

router.post('/users/login', async (req, res) => { // log in user
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token });
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/users', async (req, res) => { // create a user
    try {
        const user = new User(req.body)
        await user.save();
        res.status(200).send(user);
    } catch (e) {
        res.status(400).send(e);
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

// FOR ADMIN ONLY

router.get('/admin/users', isAdmin, async (req, res) => { // read all users (admin)
    try {
        const users = await User.find({})

        res.status(200).send(users)
    } catch (e) {
        res.status(500).send();
    }
})

router.patch('/admin/users/:id', isAdmin, async(req, res) => { // update a user (admin)
    const updates = Object.keys(req.body); // will return array of keys of the object in string
    const allowedUpdates = ['name',  'email', 'password'];
    const isValidUpdate = updates.every(update => allowedUpdates.includes(update))

    if (! isValidUpdate) res.status(400).send({ error: 'Invalid update!'})

    const _id = req.params.id;

    try {
        const user = await User.findById(_id);
        updates.forEach(update => user[update] = req.body[update])
        await user.save()

        if (! user) res.status(404).send()

        res.send(user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/admin/users/:id', isAdmin, async (req, res) => { // update a user (admin)
    const _id = req.params.id;

    try {
        const user = await User.findByIdAndDelete(_id)

        if (! user) res.status(404).send()

        res.send(user)
    } catch (e) {
        res.status(500).send()
    }
})

// FOR USERS ONLY
router.get('/users/profile', auth, async (req, res) => {
    res.send(req.user)
})

router.patch('/users/profile', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/users/profile', auth, async (req, res) => {
    const user = req.user
    try {
        await user.remove()
        sendGoodbyeEmail(user.email, user.name)
        res.send(user)
    } catch (e) {
        res.status(500).send()
    }
})



module.exports = router