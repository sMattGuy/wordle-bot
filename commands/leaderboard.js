const { SlashCommandBuilder } = require('@discordjs/builders');
const { Formatters } = require('discord.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('See the leaderboard!'),
	async execute(interaction, Tags) {
		await interaction.reply({content:`Please Wait...`,ephemeral:true});
		const tag = await Tags.findAll({attributes:['uid','score']});
		
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
	},
};

