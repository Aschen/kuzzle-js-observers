const ObserveController = require('./lib/ObserveController');
const {BaseController} = require('kuzzle-sdk');

console.log(ObserveController.prototype.__proto__.constructor.name)

module.exports = ObserveController;
