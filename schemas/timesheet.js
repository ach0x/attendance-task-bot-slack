const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const timeSheetSchema = new Schema({
	id: { type: String, index: true },
	username: { type: String, index: true },
	inTime: { type: String },
	outTime: { type: String },
	tasks: String,
	taskTs: {type: String, default: null},
	taskDone: {type: String, default: null},
	taskDoneTs: {type: String, default: null},
	createdAt: { type: Date, default: Date.now, index: true },
});

const TimeMdl = mongoose.model('TimeSheet', timeSheetSchema);

module.exports = TimeMdl;
