const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const nodemailer = require('nodemailer');

const Item = require('./models/Item');
const Request = require('./models/Request');

const app = express();

const dbURI = 'mongodb+srv://malickielcelestine_db_user:aKHeb8Tq5RJP4RYl@cluster0.weuagxc.mongodb.net/digital-market?appName=Cluster0';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'malickielcelestine@gmail.com',
        pass: 'YOUR_16_DIGIT_APP_PASSWORD'
    }
});

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

// PUBLIC ROUTES
app.get('/', async (req, res) => {
    try {
        const searchQuery = req.query.search || '';
        let queryFilter = {};
        if (searchQuery) {
            queryFilter = { title: { $regex: searchQuery,$options: 'i' } };
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
            buyerEmail: req.body.email || '',
            buyerPhone: req.body.phone || '',
            message: req.body.message,
            quantity: req.body.quantity
        });

        const mailOptions = {
            from: '"DOMINION Store" <malickielcelestine@gmail.com>',
            to: 'malickielcelestine@gmail.com',
            subject: `🔔 New Order Request: ${item.title}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                    <div style="max-width: 600px; background: #ffffff; padding: 20px; border-radius: 10px; margin: auto;">
                        <h2 style="color: #111; margin-top: 0;">New Order Request Received!</h2>
                        <hr style="border: 0; border-top: 1px solid #eee;" />
                        <p><strong>Item Requested:</strong> ${item.title}</p>
                        <p><strong>Quantity:</strong> ${req.body.quantity}</p>
                        <p><strong>Buyer Name:</strong> ${req.body.name}</p>
                        <p><strong>Email:</strong> ${req.body.email || 'N/A'}</p>
                        <p><strong>Phone / WhatsApp:</strong> ${req.body.phone || 'N/A'}</p>
                        <p><strong>Message / Notes:</strong> ${req.body.message || 'None'}</p>
                        <p><strong>Time:</strong> ${new Date().toLocaleString('en-GB')}</p>
                        <hr style="border: 0; border-top: 1px solid #eee;" />
                        <a href="http://localhost:3000/admin/requests" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #000; text-decoration: none; border-radius: 5px;">View in Admin Panel</a>
                    </div>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.error("Error sending email notification:", error);
        });

        res.send("<script>alert('Request sent successfully!'); window.location.href='/';</script>");
    } catch (err) {
        console.error("Request save error:", err);
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
        res.status(500).send("Error Saving Item");
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
        const requests = await Request.find().sort({ createdAt: -1 });
        res.render('admin-requests', { requests });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

app.post('/admin/requests/status/:id', checkAdminAuth, async (req, res) => {
    try {
        const { status } = req.body;
        await Request.findByIdAndUpdate(req.params.id, { status });
        res.redirect('/admin/requests');
    } catch (err) {
        res.status(500).send("Error updating request status");
    }
});

// REQUEST DELETE ROUTE
app.post('/admin/requests/delete/:id', checkAdminAuth, async (req, res) => {
    try {
        await Request.findByIdAndDelete(req.params.id);
        res.redirect('/admin/requests');
    } catch (err) {
        console.error("Delete request error:", err);
        res.status(500).send("Error deleting request");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on http://localhost:3000'));

// About Us Page Route
app.get('/about', (req, res) => {
    res.render('about');
});

