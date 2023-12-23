/*
 _____  _             _______ _      _        _       
|  __ \| |           |__   __(_)    | |      | |      
| |__) | | _____  __    | |   _  ___| | _____| |_ ___ 
|  ___/| |/ _ \ \/ /    | |  | |/ __| |/ / _ \ __/ __|
| |    | |  __/>  <     | |  | | (__|   <  __/ |_\__ \
|_|    |_|\___/_/\_\    |_|  |_|\___|_|\_\___|\__|___/
                                        
Thank you for purchasing Plex Tickets!
If you find any issues, need support, or have a suggestion for the bot, please join our support server and create a ticket,
https://discord.gg/eRaeJdTsPY
*/

const Discord = require ("discord.js")
const fs = require('fs');
const yaml = require("js-yaml")
const config = yaml.load(fs.readFileSync('./config.yml', 'utf8'))
const commands = yaml.load(fs.readFileSync('./commands.yml', 'utf8'))
const fetch = require("node-fetch");

exports.run = async (client, message, args) => {
    let question = args.join(" ")
    if(!question) return message.reply('Please provide a question');
    let question2 = question.replace(/x/g, "*");

    const encodedInput = encodeURIComponent(question2);
    await fetch('http://api.mathjs.org/v4/?expr=' + encodedInput)
    .then(function(response) {
        return response.text()
    }).then(function (result) {

    const embed = new Discord.EmbedBuilder()
    .setColor(config.EmbedColors)
    .setTitle('Calculator')
    .addFields([
      { name: 'Question', value: `\`\`\`css\n${question2}\`\`\`` },
      { name: 'Answer', value: `\`\`\`css\n${result}\`\`\`` },
    ])
    .setFooter({ text: `Requested by: ${message.author.username}`, iconURL: `${message.author.displayAvatarURL({ dynamic: true })}` })
    .setTimestamp()
    message.reply({ embeds: [embed] })
})
}


module.exports.help = {
  name: 'calculate',
  enabled: commands.Utility.Calculate.Enabled
}
