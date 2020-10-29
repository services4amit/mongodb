const cluster = require('cluster');
const cpuCount = require('os').cpus().length;

console.log("cl", cluster.isMaster)
console.log("cl", require('os').cpus().length)

let count = 1;
if (cluster.isMaster) {
    console.log("inside master")
    for (let i = 1; i <= cpuCount; i++) {
        console.log("Cluster NO: ", count++)
        cluster.fork();
    }

    cluster.on('exit', () => {
        cluster.fork();
    })
} else {
    console.log("inside server", count++)
    require('./server')
}