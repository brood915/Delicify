const mongoose = require('mongoose');
const slug = require('slugs');

const schema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: "please put a name"
    },
    slug: String,
    description: {
        type: String,
        trim: true
    },
    tags: [String],
    created: {
        type: Date,
        default: Date.now
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [{
            type: Number,
            required: "you must supply coordinates!"
        }],
        address: {
            type: String,
            required: "you must supply an address!"
        }

    },
    photo: String,
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply an author!'
    }
});

schema.pre('save', async function(next) {
    if (!this.isModified('name')) {
        next();
        return;
    }
    this.slug = slug(this.name);

    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
    const storeWithSlug = await this.constructor.find({
        slug: slugRegEx
    });

    if (storeWithSlug.length) {
        this.slug = `${this.slug}-${storeWithSlug.length + 1}`
    }

    next();
});

schema.statics.getTagsList = function() {
    return this.aggregate(
        [
            {$unwind: '$tags'},
            {$group: {_id: '$tags', count: {$sum:1}}},
            {$sort: {count:-1}}
        ]
    )
}

module.exports = mongoose.model('Store', schema);