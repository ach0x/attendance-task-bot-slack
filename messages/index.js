const slack = require('slack');

const config = require('../config');

module.exports = {
	postMessage: (message, textMessage) => {
		slack.chat.postMessage({
			token: config.token,
			channel: message.channel,
			title: 'Title',
			text: textMessage,
			attachments: []
		}, (errSave, data) => {
			if (errSave) {
				console.log('err send', errSave);
			}
			return data;
		});
	},

	postErrorMessage: (message, error) => {
		slack.chat.postMessage({
			token: config.token,
			channel: message.channel,
			title: 'Title',
			text: error.message,
			attachments: []
		}, (errSave, data) => {
			if (errSave) {
				console.log('err error send', errSave);
			}
			return data;
		});
	},

	postChannelMessage: (message, updatedTime, user, text) => {
		slack.chat.postMessage({
			token: config.token,
			channel: config.postChannelId,
			title: 'Title',
			text: `${user.real_name} checked in at ${updatedTime} `,
			attachments: [
				{
					color: '#36a64f',
					author_name: `${user.real_name}`,
					title: text,
					text: `${message.text}`,
					ts: `${message.ts}`
				}
			] }, (errSave, data) => {
			if (errSave)					{
				console.log(errSave);
			}
		});
	}
};
