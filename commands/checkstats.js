const { SlashCommandBuilder } = require('@discordjs/builders');
const { Formatters } = require('discord.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('checkstats')
		.setDescription('See a users stats!')
		.addUserOption(option =>
			option
				.setName('userid')
				.setDescription('The user to check (leave blank for yourself)')
				.setRequired(false)),
	async execute(interaction, Tags) {
		let uid = interaction.options.getUser('userid');
		if(uid == null){
			uid = interaction.user.id
		}
		else{
			uid = uid.id;
		}
		const tag = await Tags.findAll({where:{uid: uid}});
		
		if(tag){
			//if puzzles are found
			let scoreList = [0,0,0,0,0,0,0];
			for(let i=0;i<tag.length;i++){
				let scoreValue = parseInt(tag[i].score);
				if(isNaN(scoreValue)){
					scoreValue = 7;
				}
				scoreValue--;
				scoreList[scoreValue]++;
			}
			let scoreForAverage = scoreList[0]*1 + scoreList[1]*2 + scoreList[2]*3 + scoreList[3]*4 +scoreList[4]*5 + scoreList[5]*6 + scoreList[6]*7;
			let totalScore = scoreList[0]*6 + scoreList[1]*5 + scoreList[2]*4 + scoreList[3]*3 +scoreList[4]*2 + scoreList[5]*1;
			let averageScore = scoreForAverage / tag.length;
			averageScore = averageScore.toFixed(2);
			return interaction.reply({content:Formatters.codeBlock(`Results for Wordle Stats\n1:${scoreList[0]}\n2:${scoreList[1]}\n3:${scoreList[2]}\n4:${scoreList[3]}\n5:${scoreList[4]}\n6:${scoreList[5]}\nX:${scoreList[6]}\nTotal Puzzles: ${tag.length}\nTotal Score: ${totalScore}\nAverage Score: ${averageScore}`),ephemeral:true});
		}
		return interaction.reply({content:`Could not find any Wordle for that user!`,ephemeral:true});
	},
};