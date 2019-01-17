var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var productSchema = new Schema({
    title: { type: String, required: true },
    price: { type: String, required: true },
    inventory_count: { type: Number, required: true }
});

module.exports = mongoose.model('Product', productSchema);