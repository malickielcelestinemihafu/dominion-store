const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

const Item = require('./models/Item');
const Request = require('./models/Request');

const app = express();

const dbURI = 'mongodb+srv://malickielcelestine_db_user:aKHeb8Tq5RJP4RYl@cluster0.weuagxc.mongodb.net/digital-market?appName=Cluster0';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

mongoose.connect(dbURI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.error("MongoDB connection error:", err));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'secret-key-digital-market',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 15 }
}));

function checkAdminAuth(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.redirect('/admin/login');
}

// PUBLIC ROUTES WITH SEARCH FUNCTIONALITY
app.get('/', async (req, res) => {
    try {
        const searchQuery = req.query.search || '';
        let queryFilter = {};
        if (searchQuery) {
            queryFilter = { title: { $regex: searchQuery, $options: 'i' } };
        }
        const items = await Item.find(queryFilter).sort({ createdAt: -1 });
        res.render('index', { items, searchQuery });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

app.get('/item/:id', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).send("Item not found");
        res.render('item-detail', { item });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

app.post('/request/:id', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        await Request.create({
            itemId: item._id,
            itemTitle: item.title,
            buyerName: req.body.name,
            buyerEmail: req.body.email,
            message: req.body.message,
            quantity: req.body.quantity
        });
        res.send("<script>alert('Request sent successfully!'); window.location.href='/';</script>");
    } catch (err) {
        res.status(500).send("Error submitting request");
    }
});

// AUTH ROUTES
app.get('/admin/login', (req, res) => res.render('admin-login', { error: null }));

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        return res.redirect('/admin/items');
    }
    res.render('admin-login', { error: 'Invalid username or password.' });
});

app.get('/admin/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.redirect('/admin/login');
    });
});

// PROTECTED ADMIN ROUTES
app.get('/admin/items', checkAdminAuth, async (req, res) => {
    try {
        const items = await Item.find().sort({ createdAt: -1 });
        res.render('admin-items', { items });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

app.get('/admin/add', checkAdminAuth, (req, res) => res.render('admin-add'));

app.post('/admin/add', checkAdminAuth, async (req, res) => {
    try {
        await Item.create({
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
            imageUrl: req.body.imageUrl,
            specs: req.body.specs
        });
        res.redirect('/admin/items');
    } catch (err) {
        res.status(500).send("Error saving item");
    }
});

app.get('/admin/edit/:id', checkAdminAuth, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).send("Item not found");
        res.render('admin-edit', { item });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

app.post('/admin/edit/:id', checkAdminAuth, async (req, res) => {
    try {
        await Item.findByIdAndUpdate(req.params.id, {
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
            imageUrl: req.body.imageUrl,
            specs: req.body.specs
        });
        res.redirect('/admin/items');
    } catch (err) {
        res.status(500).send("Error updating item");
    }
});

app.post('/admin/delete/:id', checkAdminAuth, async (req, res) => {
    try {
        await Item.findByIdAndDelete(req.params.id);
        res.redirect('/admin/items');
    } catch (err) {
        res.status(500).send("Error deleting item");
    }
});

app.get('/admin/requests', checkAdminAuth, async (req, res) => {
    try {
        const requests = await Request.find().sort({ date: -1 });
        res.render('admin-requests', { requests });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
