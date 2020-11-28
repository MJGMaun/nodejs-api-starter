const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        trim: true,
        required: true,
    },
    email: {
        type: String,
        trim: true,
        required: true,
        lowercase: true,
        validate(value) {
            if (! validator.isEmail(value)) {
                throw new Error('Enter valid email!')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: [6, 'Password must be atleast 6 characters.'],
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password must not contain "password"')
            }
        }
    },
    tokens: [{ // array of token
        token: { // foreach token, should be
            type: String,
            required: true
        }
    }],
    roles: [{ // array of token
        role: { // foreach token, should be
            type: String,
            required: true
        }
    }]
})

userSchema.methods.toJSON = function () { //  hiding private data / deleting properties from object, when returning data
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject

}

userSchema.methods.generateAuthToken = async function() { // .methods → accessible on the instances, instance methods, (user).generateAuthToken()
    const user = this

    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, {expiresIn: '7 days'});
    user.tokens = user.tokens.concat({ token })
    await user.save() // await for the save

    return token

}

userSchema.statics.findByCredentials = async (email, password) => { // .statics → accessible on the model, model methods, (User).findByCredentials()
    const user = await User.findOne({ email })

    if (! user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (! isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

userSchema.pre('save', async function (next) { // using regular function because we will use 'this'
    const user = this

    if (user.isModified('password')) { // just checking if the password property exists
        user.password = await bcrypt.hash(user.password, 8);
    }

    // console.log('Middleware is running');
    next(); // call this to tell that we're done with the function
})


// compile schema to model
const User = mongoose.model('User', userSchema);

module.exports = User