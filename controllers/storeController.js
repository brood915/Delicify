const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
			storage: multer.memoryStorage(),
			fileFilter(req,file,next) {
				const isPhoto = file.mimetype.startsWith("image/");
			
			if(isPhoto) {
				next(null, true);

			} else { next({message: "that filetype is not allowed"}, false)}
		}
	}

exports.homePage = (req,res) => {
    res.render("test");
};


exports.addStore = (req,res) => {
    res.render('editStore', { title: 'add store' });
}

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req,res,next) => {
    if(!req.file) {
        next();
        return;
    }
    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800,jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    next();
}

exports.createStore = async (req,res) => {
    req.body.author = req.user._id;
    const store = await (new Store(req.body)).save();
    req.flash('success', `Successfully created ${store.name}. Want to leave a review?`)
    res.redirect(`/store/${store.slug}`);
}

exports.getStores = async (req, res) => {
    const stores = await Store.find();
    res.render('stores', { title:'stores', stores});
}

const confirmOwner = (store, user) => {
    if(!store.author.equals(user._id)) {
        throw Error('You do not own this store!');
    }
};

exports.editStore = async (req, res) => {
       const store = await Store.findOne({_id: req.params.id});
       confirmOwner(store, req.user);
       res.render('editStore', {title: `Edit ${store.name}`, store})
}

exports.updateStore = async (req,res) => {
    req.body.location.type = "Point";
    const store = await Store.findOneAndUpdate({_id:req.params.id}, req.body, {
        new: true, // return the new store instead of old one
        runValidators: true}).exec();
        req.flash('success', `Successfully updated <strong>${store.name}</strong>.
        <a href="/stores/${store.slug}">View Store</a>`);
        res.redirect(`/stores/${store._id}/edit`)
}

exports.getStoreBySlug = async (req, res) => {
    const store = await Store.findOne({ slug:req.params.slug }).populate('author');
    if(!store) {
        next();
        return;
    }
    res.render('store', { store, title: store.name})
}

exports.getStoreByTag = async (req,res) => {
    const tag = req.params.tag;
    const tagQuery = tag || {$exists:true}
	const tagsPromise = Store.getTagsList();
    const storesPromise = Store.find({tags:tagQuery})
    const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
    res.render('tag', {tags, title: 'Tags', tag, stores})
}