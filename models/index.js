/* eslint-disable no-underscore-dangle */
const moment = require('moment');
const TimeMdl = require('../schemas/timesheet');
// const ChannelMsgMdl = require('../schemas/channelMessage');
const mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;

module.exports = {
	getTodayTimesheet: (userId) => {
		// console.log(userId);
		return new Promise((resolve, reject) => {
      // Get today and tommorow's date for query
      // Important: all moments are mutable!
      // tomorrow = today.add(1, 'days') does not work since it also mutates today.
      // Calling moment(today) solves that problem by implicitly cloning  today
			const today = moment().startOf('day');
			const tomorrow = moment(today).add(1, 'days');
      // Query database for getting today's timesheet of particular user
			const query = TimeMdl.findOne({
				id: userId,
				createdAt: {
					$gte: today.toDate(),
					$lt: tomorrow.toDate()
				}
			});
			query.exec((err, timesheet) => {
				if (err) reject(err);
				resolve(timesheet);
			});
		});
	},
	getSpecificTimesheet: (userId, start, end) => {
		return new Promise((resolve, reject) => {
			// const start = 1;
			// const end = 7;
      // Get today and tommorow's date for query
      // Important: all moments are mutable!
      // tomorrow = today.add(1, 'days') does not work since it also mutates today.
      // Calling moment(today) solves that problem by implicitly cloning  today
			const dateTo = moment().startOf('day').add(start, 'day');
			// const to = moment().add(1, 'days');
			const dateFrom = moment(dateTo).subtract(end, 'day');
      // Query database for getting today's timesheet of particular user
			const query = TimeMdl.find({
				id: userId,
				createdAt: {
					$gt: dateFrom.toDate(),
					$lt: dateTo.toDate()
				}
			});
			// console.log(query);
			query.exec((err, timesheet) => {
				if (err) console.log(err);
				// console.log('timesheet', timesheet);
				resolve(timesheet);
			});
		});
	},

	saveTimesheet: (user, time) => {
		return new Promise((resolve, reject) => {
			const timeSheet = {
				id: user.id,
				username: user.name,
				userRealname: user.real_name,
				inTime: time,
				outTime: null,
				tasks: null
			};
			const sheet = new TimeMdl(timeSheet);
			sheet.save((err, doc) => {
				if (err) reject(err);
				resolve(doc);
			});
		});
	},

	outUser: (oldSheet, time) => {
		return new Promise((resolve, reject) => {
			TimeMdl.findByIdAndUpdate(new ObjectId(oldSheet._id), { outTime: time }, (err, response) => {
				if (err) console.log(err);
				resolve(response);
			});
		});
	},

	saveTask: (sheet, task, tasksTs) => {
		return new Promise((resolve, reject) => {
			TimeMdl.findByIdAndUpdate(new ObjectId(sheet._id), { tasks: task, taskTs: tasksTs }, (err, response) => {
				if (err) console.log(err);
				resolve(response);
			});
		});
	},

	saveTaskDone: (sheet, task, tasksDoneTS) => {
		return new Promise((resolve, reject) => {
			TimeMdl.findByIdAndUpdate(new ObjectId(sheet._id), { taskDone: task, taskDoneTs: tasksDoneTS }, (err, response) => {
				if (err) console.log(err);
				resolve(response);
				// console.log(response, 'hii');
			});
		});
	},
	saveChannelMessageRecord: (sheet, ts, param) => {
		// console.log(param);
		if (param === 'msgTs') {
			return new Promise((resolve, reject) => {
				TimeMdl.findByIdAndUpdate(new ObjectId(sheet._id), { msgTs: ts }, (err, response) => {
					if (err) console.log(err);
					resolve(response);
				});
			});
		} else {
			return new Promise((resolve, reject) => {
				TimeMdl.findByIdAndUpdate(new ObjectId(sheet._id), { msgDoneTs: ts }, (err, response) => {
					if (err) console.log(err);
					resolve(response);
				});
			});
		}
	},

};
