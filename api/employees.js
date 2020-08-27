const Employee = require('../Model/Employee');
const { ObjectID } = require('mongodb'); // ObjectId has creation timestamp stored , easy to retrieve the created date from here
const Dept = require('../Model/Dept');
var router = require('express').Router();
var redisClient = require('redis').createClient();


// @route GET /employees
// @desc Fetch all users
router.get('/', async (req, res) => {
    // lean returns pojos instead of docs, mongoose skips converting pojo to document internally
    // const employee = await Employee.find().lean();
    const employee = await Employee.find().lean().sort({ empRank: -1 }); // 1, -1 , asc, desc
    res.json(employee);
});


// ******* IMPLEMENTING REDIS CACHE FOR MONGODB QUERIES  *************************************//

// // @route GET /employees/:gender
// router.get('/:gender', async (req, res) => {
//     const employee = await Employee.find({gender: req.params.gender}).lean(); 
//     res.json(employee);
// });

// @route GET /employees/:gender
router.get('/:gender', async (req, res) => {
    var emp;
     redisClient.get(req.params.gender, async (err, reply) => { // the 'gender' query param is stored as key
        if (err){ return null}
        else if (reply) { 
            res.json(JSON.parse(reply));
        }
        else{
            const employee = await Employee.find({gender: req.params.gender}); 
            redisClient.set(req.params.gender, JSON.stringify(employee), () => { // the result is stored as value stringified
                callback(employee);
            }); 
            emp = employee;
            res.json(employee); 
        }
    });
    res.json(employee); 
});


// ***************************// ***************************// ***************************// 




// @route GET /employees/:id
// @desc Fetch an employee by id
router.get('empDetails/:id', async (req, res) => {
    //const employee = await Employee.findById(req.params.id);

    // Populate dept data along with employee using dept reference
    // findById()  similar to findOne() returns a single document
    const employee = await Employee.findById(req.params.id).populate('dept', ['deptName', 'deptRank']).lean();
    res.json(employee);
});

// @route GET /employees/:deptName
// @desc Fetch all employees belonging to a single department

//@toDO try to implement joins instead of two queries
router.get('/dept/:deptName', async (req, res) => {
    const dept = await Dept.findOne({ deptName: req.params.deptName }).lean().select('_id');
    console.log(dept._id.getTimestamp()); // get timestamp of when it is inserted
    const employee = await Employee.find({ dept: dept._id }).populate('dept', ['deptName']).lean();
    res.json(employee);
});



// @route GET /employees
// @desc Fetch names of all employees
router.get('/names/:id', async (req, res) => {

    // const employee = await Employee.findById(req.params.id).select('name').lean();

    // I want to skip '_id' in projection 
    const employee = await Employee.findById(req.params.id).select({ 'name': 1, "_id": 0 }).lean();
    res.json(employee);
});


// @route GET /employees
// @desc Fetch emplyees based on search, sort criteria
router.get('/:sortProperty/:offset/:limit', async (req, res) => {
    const result = Employee.find().sort({ [sortProperty]: 1 }).skip(offset).limit(limit);
    Promise.all([result, Employee.count()]).then((res) => {
        return {
            resultt: res[0],
            count: res[1],
            offset: offset,
            limit: limit
        };
    });
    // res.json(result);
});

// @route POST /employees
// @desc Save a new employee document
router.post('/', async (req, res) => {
    const employee = new Employee(req.body);
    await employee.save();
    res.json("Saved");
});

// @route PUT /employees/:id
// @desc update an employee details
router.put('/:id', async (req, res) => {
    // using findByandUpdate
    const { name, dept, dateOfJoining, empRank, about, gender, state } = req.body;
    const emp = await Employee.findByIdAndUpdate(req.params.id,
        { empRank: empRank, name: name, about: about, gender: gender, state: state, dateOfJoining: dateOfJoining, dept: ObjectID(dept), $inc: { dummyCounter: 1 } }); // increment a value each time

    // Employee.update({_id: req.params.id},{empRank: 0});
    /* 
    const emp = await Employee.findById(req.params.id);   //SET and SAVE
      emp.name = name;
     // emp.set('name', name);
      emp.dept = dept;
      emp.dateOfJoining = dateOfJoining;
      emp.empRank = empRank;
      await emp.save();   
      */
    res.json("Updated" + emp);
});


// @route DELETE /employees/:id
// @desc delete employee by id
router.delete('/:id', async (req, res) => {
    await Employee.findByIdAndDelete(req.params.id); //class based remove.. based on some criteria (say, name = 'a') - findOneAndRemove
    res.json("Deleted");
});

/*  ----------  Simulate indexes of MongoDb  --------- */

/*Text indexes for efficient key word searches
- text indexes are fater than regex
*/
router.get('/search/:text', async (req, res) => {

    /* using regex to text search , include options for case sensitivity */

  // const searchResult = await Employee.find({about: {$regex: req.params.text, $options:"$i"}});
    /* --------------    -------      ||   ||    ||   ---------------   -------------------*/

    /* using search option for already text indexed field
    /* >db.employees.createIndex({about: "text"});
    /* >db.employees.createIndex({about: "text", experience: "text"});  -> combining indexes for two fields 
            "Weights" can be added along with the feilds - giving more preference to a feild while searching ,score will also change
    /* A collection can have only one 'text' index / MongoError: text index required for $text query */

  //   const searchResult = await Employee.find({$text:{$search: req.params.text}});
    /* --------------    -------      ||   ||    ||   ---------------   -------------------*/

    /* Score is a number assigned based on the relevancy of a search result. higher the number , greater the relevancy */
    const searchResult = await Employee.find({ $text: { $search: req.params.text } }, { score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } });

    res.json(searchResult);
});

/*  ----------  Simulate Aggregation of MongoDb  --------- */

/* filter , group, return count, sort by count 
*/
router.get('/aggregate/:gender', async (req, res) => {

    const searchResult = await Employee.aggregate([{ $match: { gender: req.params.gender } }, { $group: { _id: { state: "$state" }, totalPersons: { $sum: 1 } } }, { $sort: { totalPersons: 1 } }]);
    // sum is incremented when every it finds another unique doc in the grp more like COUNT()
    // define new fields such as 'totalPersons' to store results

    const states = await Employee.distinct("state"); // returns distinct values in a feild in a collection

    res.json({ searchResult, states });
});

router.get('/aggregate_lookup/', async (req, res) => {
    const searchResult = await Employee.aggregate([{
        $lookup: {
            from: "states",
            localField: "state",  // equi-join applied on the field 'state'
            foreignField: "state",
            as: "employee_docs"
        }
    }]);
    res.json(searchResult);
});

module.exports = router;