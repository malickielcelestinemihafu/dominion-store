const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    specs: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
