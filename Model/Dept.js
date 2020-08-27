const mongoose = require('mongoose');
const schema = mongoose.Schema;

const deptSchema = new schema({
deptName: {
    type: String,
    validate:{
        validator: (name) => name.length > 2,
        message: 'Name should be longer than two characters'
    },
    required: [true,'Dept Name is required'] // send validation error message
},
deptRank: {
    type: Number,
}
});

module.exports = Dept = mongoose.model('departments', deptSchema);