const mongoose = require('mongoose');
const schema = require('mongoose').Schema;

const employeeSchema = new schema({
    name: {
        type: String,
    },
    about: {
        type: String
    },
    gender: {
        type: String
    },
    state: {
        type: String
    },
    dept: {
        type: mongoose.Schema.Types.ObjectId, // refrence to other document
        ref: 'departments'        
    },
    dateOfJoining: {
        type: Date, 
        default: Date.now // sys timestamp
    },
    empRank: {
        type: Number
    },
    dummyCounter: {
        type: Number
    }
});

const Employee = mongoose.model('employees', employeeSchema); // 1st param points to the Employees collection in the mongoDB

module.exports = Employee; // 'Employee' points to the entire collection in the DB