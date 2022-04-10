const { SlashCommandBuilder } = require('@discordjs/builders');
const { Formatters } = require('discord.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('See the leaderboard!')
		.addStringOption(option => 
			option
				.setName('type')
				.setDescription('The type of leaderboard to see')
				.setRequired(true)
				.addChoice('Score', 'score')
				.addChoice('Average', 'average')
				.addChoice('Puzzles', 'puzzle'))
		.addStringOption(option =>
			option
				.setName('puzzleid')
				.setDescription('The puzzle ID')
				.setRequired(false)),
	async execute(interaction, Tags) {
		await interaction.reply({content:`Please Wait...`,ephemeral:true});
		const boardType = interaction.options.getString('type');
		const puzzleID = interaction.options.getString('puzzleid');
		
		let tag;
		if(puzzleID != null){
			tag = await Tags.findAll({attributes:['uid','score'], where:{pid:puzzleID}});
		}
		else{
			tag = await Tags.findAll({attributes:['uid','score']});
		}
		
		if(boardType == 'score')
			ScoreLeaderboard();
		else if(boardType == 'average')
			AverageLeaderboard();
		else if(boardType == 'puzzle')
			PuzzleLeaderboard();
		else
			interaction.editReply({content:'Something went wrong',ephemeral:true})
			
		
		async function ScoreLeaderboard(){
			const leaderboardMap = new Map();
			if(tag){
				//if puzzles are found
				for(let i=0;i<tag.length;i++){
					let scoreValue = 0;
					scoreValue = parseInt(tag[i].score);
					if(isNaN(scoreValue)){
						scoreValue = 7;
					}
					scoreValue = 7 - scoreValue;
					let newTotal = leaderboardMap.get(tag[i].uid) + scoreValue;
					if(isNaN(newTotal)){
						newTotal = scoreValue;
					}
					leaderboardMap.set(tag[i].uid,newTotal);
				}
				const sortedBoard = new Map([...leaderboardMap.entries()].sort((a,b)=>b[1]-a[1]));
				let leaderboardMessage = '';
				let position = 1;
				for(let [key, value] of sortedBoard){
					try{
						const username = await interaction.guild.members.fetch(key).then(userf => {return userf.displayName});
						leaderboardMessage += `(${position}). ${username}: Total Score: ${value}\n`;
						position++;
					} catch(error){
						//user not in server
					}
				}
				interaction.editReply({content:Formatters.codeBlock(`${leaderboardMessage}`),ephemeral:true});
			}
		}
		
		async function AverageLeaderboard(){
			const leaderboardMap = new Map();
			const leaderboardCounter = new Map();
			if(tag){
				//if puzzles are found
				for(let i=0;i<tag.length;i++){
					let scoreValue = 0;
					scoreValue = parseInt(tag[i].score);
					if(isNaN(scoreValue)){
						scoreValue = 7;
					}
					let newTotal = leaderboardMap.get(tag[i].uid) + scoreValue;
					if(isNaN(newTotal)){
						newTotal = scoreValue;
					}
					leaderboardMap.set(tag[i].uid,newTotal);
					let avgCounter = leaderboardCounter.get(tag[i].uid) + 1;
					if(isNaN(avgCounter)){
						avgCounter = 1;
					}
					leaderboardCounter.set(tag[i].uid, avgCounter);
				}
				for(let [key, value] of leaderboardMap){
					let scoreCount = leaderboardCounter.get(key);
					let average = value / scoreCount
					average = average.toFixed(2);
					leaderboardMap.set(key,average);
				}
				const sortedBoard = new Map([...leaderboardMap.entries()].sort((a,b)=>a[1]-b[1]));
				let leaderboardMessage = '';
				let position = 1;
				for(let [key, value] of sortedBoard){
					try{
						const username = await interaction.guild.members.fetch(key).then(userf => {return userf.displayName});
						leaderboardMessage += `(${position}). ${username}: Average: ${value}\n`;
						position++;
					} catch(error){
						//user not in server
					}
				}
				interaction.editReply({content:Formatters.codeBlock(`${leaderboardMessage}`),ephemeral:true});
			}
		}
		
		async function PuzzleLeaderboard(){
			const leaderboardMap = new Map();
			if(tag){
				//if puzzles are found
				for(let i=0;i<tag.length;i++){
					let newTotal = leaderboardMap.get(tag[i].uid) + 1;
					if(isNaN(newTotal)){
						newTotal = 1;
					}
					leaderboardMap.set(tag[i].uid,newTotal);
				}
				const sortedBoard = new Map([...leaderboardMap.entries()].sort((a,b)=>b[1]-a[1]));
				let leaderboardMessage = '';
				let position = 1;
				for(let [key, value] of sortedBoard){
					try{
						const username = await interaction.guild.members.fetch(key).then(userf => {return userf.displayName});
						leaderboardMessage += `(${position}). ${username}: Total Puzzles: ${value}\n`;
						position++;
					} catch(error){
						//user not in server
					}
				}
				interaction.editReply({content:Formatters.codeBlock(`${leaderboardMessage}`),ephemeral:true});
			}
		}
	},
};

