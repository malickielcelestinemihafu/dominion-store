const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    itemTitle: String,
    buyerName: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    message: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Request', requestSchema);
