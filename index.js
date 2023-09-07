const Sequelize = require('sequelize');
const fs = require('node:fs');
const {Client, Collection, Intents} = require('discord.js');
const {token} = require('./config.json');

const client = new Client({intents:[Intents.FLAGS.GUILDS,Intents.FLAGS.GUILD_MESSAGES,Intents.FLAGS.GUILD_MESSAGE_REACTIONS,Intents.FLAGS.GUILD_MEMBERS]});

client.commands = new Collection();

//database information
const sequelize = new Sequelize({
	dialect: 'sqlite',
	logging: false,
	storage: './database.sqlite',
});
const Tags = sequelize.define('tags', {
	uid: Sequelize.STRING,
	pid: Sequelize.INTEGER,
	score: Sequelize.STRING,
	desc: Sequelize.TEXT
})

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

client.once('ready', () => {
	Tags.sync();
	console.log('Ready');
});

client.on('interactionCreate', async interaction => {
	if(!interaction.isCommand()) return;
	const command = client.commands.get(interaction.commandName);
	if(!command) return;
	try{
		await command.execute(interaction, Tags);
	} catch(error){
		console.error(error);
		await interaction.reply({content:'There was an error with this command!',ephemeral:true});
	}
});

client.on('messageCreate', async message => {
	const regex = new RegExp('Wordle (\\d+) ([1-6]|X)\/6');
	if(message.author.id == message.guild.ownerId && message.content == '!wordleUpdate'){
		//admin trigger for updating database
		console.log('fetching all messages');
		const messages = await fetchAllMessages(message.channel);
		for(let i=0;i<messages.length;i++){
			if(regex.test(messages[i])){
				//valid wordle message
				console.log('found valid message');
				await insertWordleData(messages[i].content, messages[i].author.id);
				messages[i].react('✅');
			}
			else{
				//message not valid
				console.log(`message not valid: ${messages[i]}`);
			}
		}
		console.log('finished updating channel');
	}
	else if(regex.test(message.content)){
		//process wordle string into database
		insertWordleData(message.content, message.author.id);
		message.react('✅');
	}
	else{
		//do nothing if either isnt true
	}
});

async function insertWordleData(wordleData, userId){
	const splitMessage = wordleData.split(" ");
	const puzzleId = splitMessage[1];
	let score = splitMessage[2][0];
	
	const checktag = await Tags.findOne({where:{uid: userId, pid: puzzleId}});
	if(checktag){
		//tag already in system
		console.log(`puzzle ${puzzleId} for user ${userId} already recorded`);
	}
	else{
		try{
			const tag = await Tags.create({
				uid: userId,
				pid: puzzleId,
				score: score,
				desc: wordleData
			});
			console.log(`puzzle ${puzzleId} added for user ${userId}`);
		} catch(error){
			console.error(error);
		}
	}
}

async function fetchAllMessages(channelId) {
	const channel = client.channels.cache.get(channelId.id);
	let messages = [];

	// Create message pointer
	let message = await channel.messages
		.fetch({ limit: 1 })
		.then(messagePage => (messagePage.size === 1 ? messagePage.at(0) : null));

	while (message) {
		await channel.messages
		.fetch({ limit: 100, before: message.id })
		.then(messagePage => {
			messagePage.forEach(msg => messages.push(msg));

			// Update our message pointer to be last message in page of messages
			message = 0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null;
		});
	}
	return messages
}

client.login(token);

