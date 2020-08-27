const Dept = require('../Model/Dept');
const Employee = require('../Model/Employee');
const { ObjectID } = require('mongodb');
var router = require('express').Router();


// @route GET /dept
// @desc Fetch all users
router.get('/', async (req, res) => {
    // lean returns pojos instead of docs, mongoose skips converting pojo to document internally
    // const employee = await Employee.find().lean();
    const dept = await Dept.find().lean().sort({ deptRank: -1 }); // 1, -1 , asc, desc
    res.json(dept);
});


// @route GET /dept/pagination
// @desc Fetch limited users
router.get('/pagination', async (req, res) => {
    // lean returns pojos instead of docs, mongoose skips converting pojo to document internally
    // const employee = await Employee.find().lean();
    const dept = await Dept.find().skip(1).limit(7); // 1, -1 , asc, desc
    res.json(dept);
});

// @route GET /dept/maxRank
// @desc Fetch the highest rank
router.get('/maxRank', (req, res) => {
    // sort by desc of ranks and fetch the top record by limiting to 1 and get the deptRank alone
    const max = Dept.find().sort({ deptRank: -1 }).limit(1).then(depts => depts[0].deptRank);
    const min = Dept.find().sort({ deptRank: 1 }).limit(1).then(depts => depts[0].deptRank);
    return Promise.all([max, min]).then((result) => {
        res.json({ min: result[0], max: result[1] });
    })
});

// @route POST /dept
// @desc Save a new department document
router.post('/', async (req, res) => {
    const dept = new Dept(req.body);

    try {
        const dept = await dept.save();
    } catch (err) {
        console.log(err.message);
        return res.json({ msg: err.message });
    }
    res.json("Dept Saved");
});


// @route POST /dept/saveBulk
// @desc Save a new department document
router.post('/saveBulk', async (req, res) => {
    try {
        await Dept.insertMany(req.body); // bulk insert
    } catch (err) {
        console.log(err.message);
        return res.json({ msg: err.message });
    }
    res.json("Dept Saved");
});


// @route DELETE /dept/deleteDept/:id
// @desc Save a new department document
router.delete('/:deptId', async (req, res) => {
    const session = await Dept.startSession();
    session.startTransaction();
    try {
        const opts = { session }; //  mongodb.ClientSession  is passed into options parameter
        await Employee.deleteMany({ dept: ObjectID(req.params.deptId) }, opts);
        await Employee.deleteOne({ _id: ObjectID(req.params.deptId) }, opts);
        await session.commitTransaction();
        session.endSession();
        res.json("Dept deleted");
    } catch (err) {
        // If an error occurred, abort the whole transaction and
        // undo any changes that might have happened
        await session.abortTransaction();
        /* 
        ERROR!!
message:'Transaction numbers are only allowed on a replica set member or mongos'
name:'MongoError'

Solution:
mongod --port "PORT" --dbpath "YOUR_DB_DATA_PATH" --replSet "REPLICA_SET_INSTANCE_NAME"
mongod --port 27017 --dbpath "D:\set up\mongodb\data" --replSet rs0

*/
        session.endSession();
        console.log(err.message);
        return res.json({ msg: err.message });
    }
});

module.exports = router;