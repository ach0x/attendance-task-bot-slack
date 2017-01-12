const slack = require('slack');
const config = require('./config');
const mongoose = require('mongoose');
const UserMdl = require('./schemas/user');
const TimeMdl = require('./schemas/timesheet');
const DB = require('./models');
const Message = require('./messages');
const moment = require('moment');
const _ = require('lodash');

const bot = slack.rtm.client();
const token = config.token;

const timeRegex = new RegExp('^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$');
// const inTimeRegex = new RegExp('^in ([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$');

mongoose.connect(config.mongoURL);

const users = [];

// do something with the rtm.start payload
bot.started((payload) => {
	const payloadUsers = payload.users;
	payloadUsers.forEach((user) => {
		if (!user.is_bot && user.name !== 'slackbot') {
			console.log(user);
			const dbUser = new UserMdl(user);
			users.push(dbUser);
			UserMdl.update({ id: user.id }, user, { upsert: true, setDefaultsOnInsert: true }, (err, result) => {
				console.log(user.real_name);
			});
		}
	});
});

/**
 *
 * Message Object
 * {
 * 	type: 'message',
 *  channel: 'C3G5DHZT6',
 *  user: 'U397MPB4M',
 *  text: 'in',
 *  ts: '1482401538.000011',
 *  team: 'T397BDMS8'
 * }
 */
bot.message((message) => {
	console.log('\n******************************\n', message, '\n******************************\n');
	const user = _.find(users, { id: message.user });
	if (message.type === 'message' && !message.subtype && !message.bot_id) {
		try {
			// User entry
			if (message.text.toLowerCase() === 'in' || message.text.toLowerCase().indexOf('in ') === 0) {
				console.log('----------------------- IN -------------------------\n');
				let time;
				DB.getTodayTimesheet(message.user)
				.then((timesheet) => {
					if (timesheet) {
						console.log('----------------------- ALREADY IN -------------------------\n');
						// Message.postMessage(message, )
						throw new Error('Already in');
					} else {
						console.log('----------------------- FIRST TIME IN -------------------------\n');
						if (message.text.toLowerCase() === 'in') {
							time = moment().format('HH:mm');
							console.log('----------------------- NO TIME -------------------------\n');
						} else {
							console.log('----------------------- WITH TIME -------------------------\n');
							const spaceIndex = message.text.indexOf(' ');
							if (message.text.substr(0, spaceIndex) === 'in') {
								time = message.text.substr(spaceIndex + 1);
								if (timeRegex.test(time)) {
									console.log('----------------------- VALID TIME -------------------------\n');
								} else {
									console.log('----------------------- INVALID TIME -------------------------\n');
									throw new Error('Please enter valid time in HH:MM format ...');
								}
							} else {
								throw new Error('Invalid time');
							}
						}
						DB.saveTimesheet(user, time)
						.then((data) => {
							console.log('----------------------- USER IS IN -------------------------\n');
							return true;
						})
						.catch((err) => {
							console.log(err);
							Message.postErrorMessage(message, err);
						});
					}
				}).then(() => {
					Message.postMessage(message, 'What are the tasks you are going to complete today?');
				}).catch((err) => {
					console.log(err);
					Message.postErrorMessage(message, err);
				});
			} else if (message.text.toLowerCase() === 'out' || message.text.toLowerCase().indexOf('out ') === 0) {
				console.log('----------------------- OUT -------------------------\n');
				let time;
				DB.getTodayTimesheet(message.user)
				.then((timesheet) => {
					if (!timesheet) {
						console.log('----------------------- NOT IN -------------------------\n');
						Message.postMessage(message, 'Not in');
					} else if (timesheet.outTime !== null) {
						console.log('----------------------- ALREADY OUT -------------------------\n');
						Message.postMessage(message, 'Already Out');
					} else {
						console.log('----------------------- FIRST TIME OUT -------------------------\n');
						if (message.text.toLowerCase() === 'out') {
							time = moment().format('HH:mm');
							console.log('----------------------- NO TIME -------------------------\n');
						} else {
							console.log('----------------------- WITH TIME -------------------------\n');
							const spaceIndex = message.text.indexOf(' ');
							time = message.text.substr(spaceIndex + 1);
							if (timeRegex.test(time)) {
								console.log('----------------------- VALID TIME -------------------------\n');
							} else {
								console.log('----------------------- INVALID TIME -------------------------\n');
								throw new Error('Please enter valid time in HH:MM format ...');
							}
						}
						DB.outUser(timesheet, time)
							.then((data) => {
								console.log('----------------------- USER IS OUT -------------------------\n');
								return true;
							}).then(() => {
								Message.postMessage(message, `You said you will completed these tasks by today: \n ${timesheet.tasks} \n Which of the above tasks you have completed today?`);
							})
							.catch((err) => {
								console.log(err);
								Message.postErrorMessage(message, err);
							});
					}
				});
			} else {
				DB.getTodayTimesheet(message.user)
				.then((timesheet) => {
					const task = message.text;
					if (timesheet) {
						if (!timesheet.outTime && !timesheet.tasks) {
							DB.saveTask(timesheet, task, message.ts)
									.then((updatedTime) => {
										// console.log(message, updatedTime, user);
										// console.log(updatedTime);
										Message.postChannelMessage(message, updatedTime.inTime, user, 'Today\'s Tasks');
										console.log('-----------------tasks added------------------\n');
									}).catch((err) => {
										console.log(err);
									});
						} else if (timesheet.outTime && !timesheet.taskDone) {
							DB.saveTaskDone(timesheet, task, message.ts)
								.then((updatedTime) => {
									Message.postChannelMessage(message, updatedTime.outTime, user, 'Completed Tasks');
									console.log('-----------------taskDone added------------------\n');
								}).catch((err) => {
									console.log(err);
								});
						} else {
							Message.postMessage(message, 'You have already added tasks\nYou can\'t add more tasks,You can still edit old ones!');
							console.log('--------------USER HAS ALREADY ADDED TASKS,CAN\'T ADD MORE-----------');
						}
					} else {
						Message.postMessage(message, 'User is not in');
						console.log('--------------USER IS NOT IN------------');
					}
				});
			}
		} catch (err) {
			console.log('error::::', err);
			Message.postErrorMessage(message, err);
		}
	} else if (message.subtype === 'message_changed') {
		if (message.previous_message.text.indexOf('in') === 0 || message.previous_message.text.indexOf('out') === 0) {
			console.log('-----------EDITED OTHER MESSAGE------------');
			return;
		}
		DB.getTodayTimesheet(message.message.user)
				.then((timesheet) => {
					if (message.previous_message.ts === timesheet.taskTs) {
						DB.saveTask(timesheet, message.message.text, message.ts)
						.then(() => {
							console.log('----------------TASK MESSAGE EDITED----------------\n');
						});
					} else if (message.previous_message.ts === timesheet.taskDoneTs) {
						DB.saveTaskDone(timesheet, message.message.text, message.ts)
						.then(() => {
							console.log('----------------TASK DONE MESSAGE EDITED----------------\n');
						});
					}
				});
	}
});
bot.listen({ token });
