const mongoose = require('mongoose');
const schema = mongoose.Schema;

const stateSchema = new schema({
    state: {
        type: String
    },
    code: {
        type: String
    }
});

module.exports = State = mongoose.model('states', stateSchema);