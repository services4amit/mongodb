var express = require('express');
var app = express();
var mongoose = require('mongoose');

const dbUrl1 = 'mongodb://localhost:27017/test';

mongoose.connect(dbUrl1, { useNewUrlParser: true ,useFindAndModify: false, useUnifiedTopology: true });
var db = mongoose.connection;

mongoose.connection.on('connect', () => {
    console.log('MongoDb connected');
});

db.on('error', console.error.bind(console, 'MongoDb connection Error!'));

//Init middleware
app.use(express.json({ extended: false }));

const PORT = 3000;

app.get('/', (req, res) => {
    res.send('API running')
});

app.use('/api/employees', require('./api/employees'));
app.use('/api/dept', require('./api/dept'));

app.listen(PORT, () => {
    console.log(`Server started on PORT ${PORT}`);
})