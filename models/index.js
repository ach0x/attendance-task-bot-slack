/* eslint-disable no-underscore-dangle */
const moment = require('moment');
const TimeMdl = require('../schemas/timesheet');
const mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;

module.exports = {
	getTodayTimesheet: (userId) => {
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

	saveTimesheet: (user, time) => {
		return new Promise((resolve, reject) => {
			const timeSheet = {
				id: user.id,
				username: user.name,
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
			});
		});
	}
};
