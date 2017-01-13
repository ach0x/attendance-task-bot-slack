const slack = require('slack');
const DB = require('../models');
const config = require('../config');

module.exports = {
	postMessage: (message, textMessage, tasks = 'Tasks to complete') => {
		slack.chat.postMessage({
			token: config.token,
			channel: message.channel,
			title: 'Title',
			text: textMessage,
			attachments: [{
				color: '#36a64f',
				text: `${tasks}`,
				ts: `${message.ts}`
			}]
		}, (errSave, data) => {
			if (errSave) {
				console.log('err send', errSave);
			}
		});
	},
	// deleteMessage: (message) => {
	// 	slack.chat.delete({
	// 		token: config.token,
	// 		channel: message.channel,
	// 		ts: message.ts,
	// 	}, (errSave, data) => {
	// 		if (errSave) {
	// 			console.log('err send', errSave);
	// 		}
	// 		console.log('delete', data);
	// 	});
	// },

	postErrorMessage: (message, error) => {
		slack.chat.postMessage({
			token: config.token,
			channel: message.channel,
			title: 'Title',
			text: '',
			attachments: [{
				color: '#ff0000',
				text: `${error}`,
				ts: `${message.ts}`
			}]
		}, (errSave, data) => {
			if (errSave) {
				console.log('err error send', errSave);
			}
		});
	},

	postChannelMessage: (message, updatedTime, time, text, param) => {
		slack.chat.postMessage({
			token: config.token,
			channel: config.postChannelId,
			title: 'Title',
			text: `${updatedTime.userRealname} checked in at ${time} `,
			attachments: [
				{
					color: '#36a64f',
					author_name: `${updatedTime.userRealname}`,
					title: text,
					text: `${message.text}`,
					ts: `${message.ts}`
				}
			] }, (errSave, data) => {
			if (errSave) {
				console.log(errSave);
			}
			// console.log(data);
			DB.saveChannelMessageRecord(updatedTime, data.ts, param)
			.then((dataNew) => {
				// console.log(dataNew, 'hii');
				return true;
			});
		});
	},

	updateChannelMessage: (timesheet, oldTs, updatedTask, text) => {
		slack.chat.update({
			token: config.token,
			channel: config.postChannelId,
			ts: oldTs,
			title: 'Title',
			text: `${timesheet.userRealname} checked in at ${timesheet.inTime} `,
			attachments: [
				{
					color: '#36a64f',
					author_name: `${timesheet.userRealname}}`,
					title: text,
					text: `${updatedTask}`,
					ts: `${timesheet.msgTs}`
				}
			] }, (errSave, data) => {
			if (errSave) {
				console.log(errSave);
			}
			// return data;
		});
	}
};
