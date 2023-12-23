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

const { Discord, ActionRowBuilder, ButtonBuilder, EmbedBuilder, MessageSelectMenu, Message, MessageAttachment } = require("discord.js");
const fs = require('fs');
const yaml = require("js-yaml")
const config = yaml.load(fs.readFileSync('./config.yml', 'utf8'))
const commands = yaml.load(fs.readFileSync('./commands.yml', 'utf8'))

exports.run = async (client, message, args) => {
    if(config.SuggestionSettings.Enabled === false) return;
    message.delete()

    let suggestc = client.channels.cache.get(config.SuggestionSettings.ChannelID)
    if(!suggestc) return message.channel.send({ content: `Suggestion channel has not been setup! Please fix this in the bot's config!` })
    let avatarurl = message.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });

    let suggestion = args.join(" ")
    let invalidusage = new EmbedBuilder()
    .setColor("Red")
    .setDescription('Too few arguments given\n\nUsage:\n``suggest <suggestion>``')
    if(!suggestion) return message.channel.send({ embeds: [invalidusage] })
    
    if(config.SuggestionUpvote.ButtonColor === "Blurple") config.SuggestionUpvote.ButtonColor = "Primary"
    if(config.SuggestionUpvote.ButtonColor === "Gray") config.SuggestionUpvote.ButtonColor = "Secondary"
    if(config.SuggestionUpvote.ButtonColor === "Green") config.SuggestionUpvote.ButtonColor = "Success"
    if(config.SuggestionUpvote.ButtonColor === "Red") config.SuggestionUpvote.ButtonColor = "Danger"

    if(config.SuggestionDownvote.ButtonColor === "Blurple") config.SuggestionDownvote.ButtonColor = "Primary"
    if(config.SuggestionDownvote.ButtonColor === "Gray") config.SuggestionDownvote.ButtonColor = "Secondary"
    if(config.SuggestionDownvote.ButtonColor === "Green") config.SuggestionDownvote.ButtonColor = "Success"
    if(config.SuggestionDownvote.ButtonColor === "Red") config.SuggestionDownvote.ButtonColor = "Danger"

    if(config.SuggestionResetvote.ButtonColor === "Blurple") config.SuggestionResetvote.ButtonColor = "Primary"
    if(config.SuggestionResetvote.ButtonColor === "Gray") config.SuggestionResetvote.ButtonColor = "Secondary"
    if(config.SuggestionResetvote.ButtonColor === "Green") config.SuggestionResetvote.ButtonColor = "Success"
    if(config.SuggestionResetvote.ButtonColor === "Red") config.SuggestionResetvote.ButtonColor = "Danger"

    if(config.SuggestionAccept.ButtonColor === "Blurple") config.SuggestionAccept.ButtonColor = "Primary"
    if(config.SuggestionAccept.ButtonColor === "Gray") config.SuggestionAccept.ButtonColor = "Secondary"
    if(config.SuggestionAccept.ButtonColor === "Green") config.SuggestionAccept.ButtonColor = "Success"
    if(config.SuggestionAccept.ButtonColor === "Red") config.SuggestionAccept.ButtonColor = "Danger"

    if(config.SuggestionDeny.ButtonColor === "Blurple") config.SuggestionDeny.ButtonColor = "Primary"
    if(config.SuggestionDeny.ButtonColor === "Gray") config.SuggestionDeny.ButtonColor = "Secondary"
    if(config.SuggestionDeny.ButtonColor === "Green") config.SuggestionDeny.ButtonColor = "Success"
    if(config.SuggestionDeny.ButtonColor === "Red") config.SuggestionDeny.ButtonColor = "Danger"

    const upvoteButton = new ButtonBuilder()
    .setCustomId('upvote')
    .setLabel(config.SuggestionUpvote.ButtonName)
    .setStyle(config.SuggestionUpvote.ButtonColor)
    .setEmoji(config.SuggestionUpvote.ButtonEmoji)

    const downvoteButton = new ButtonBuilder()
    .setCustomId('downvote')
    .setLabel(config.SuggestionDownvote.ButtonName)
    .setStyle(config.SuggestionDownvote.ButtonColor)
    .setEmoji(config.SuggestionDownvote.ButtonEmoji)

  
    const resetvoteButton = new ButtonBuilder()
    .setCustomId('resetvote')
    .setLabel(config.SuggestionResetvote.ButtonName)
    .setStyle(config.SuggestionResetvote.ButtonColor)
    .setEmoji(config.SuggestionResetvote.ButtonEmoji)

    const acceptButton = new ButtonBuilder()
    .setCustomId('accept')
    .setLabel(config.SuggestionAccept.ButtonName)
    .setStyle(config.SuggestionAccept.ButtonColor)
    .setEmoji(config.SuggestionAccept.ButtonEmoji)

    const denyButton = new ButtonBuilder()
    .setCustomId('deny')
    .setLabel(config.SuggestionDeny.ButtonName)
    .setStyle(config.SuggestionDeny.ButtonColor)
    .setEmoji(config.SuggestionDeny.ButtonEmoji)

    
    let row = ""
    if(config.SuggestionSettings.EnableAcceptDenySystem) row = new ActionRowBuilder().addComponents(upvoteButton, downvoteButton, resetvoteButton, acceptButton, denyButton);
    if(config.SuggestionSettings.EnableAcceptDenySystem === false) row = new ActionRowBuilder().addComponents(upvoteButton, downvoteButton, resetvoteButton);

    let embed = new EmbedBuilder()
    embed.setColor(config.SuggestionStatusesEmbedColors.Pending)
    embed.setAuthor({ name: `${config.Locale.newSuggestionTitle} (#${client.globalStats.get(`${message.guild.id}`, "totalSuggestions")})` })
    embed.addFields([
      { name: `• ${config.Locale.suggestionTitle}`, value: `> \`\`\`${suggestion}\`\`\`` },
    ]);

    if(config.SuggestionSettings.EnableAcceptDenySystem) embed.addFields([
      { name: `• ${config.Locale.suggestionInformation}`, value: `> **${config.Locale.suggestionFrom}** <@!${message.author.id}>\n> **${config.Locale.suggestionUpvotes}** 0\n> **${config.Locale.suggestionDownvotes}** 0\n> **${config.Locale.suggestionStatus}** ${config.SuggestionStatuses.Pending}` },
    ]);

    if(config.SuggestionSettings.EnableAcceptDenySystem === false) embed.addFields([
      { name: `• ${config.Locale.suggestionInformation}`, value: `> **${config.Locale.suggestionFrom}** <@!${message.author.id}>\n> **${config.Locale.suggestionUpvotes}** 0\n> **${config.Locale.suggestionDownvotes}** 0` },
    ]);
    embed.setThumbnail(avatarurl)
    embed.setFooter({ text: `${message.author.tag}`, iconURL: `${message.author.displayAvatarURL({ dynamic: true })}` })
    embed.setTimestamp()

    if (suggestc) suggestc.send({ embeds: [embed], components: [row] }).then(async function(msg) {

    await client.suggestions.ensure(`${msg.id}`, {
      userID: message.author.id,
      msgID: msg.id,
      suggestion: suggestion,
      upVotes: 0,
      downVotes: 0,
      status: "Pending"
    });

    client.globalStats.inc(message.guild.id, "totalSuggestions");

  })

    message.channel.send(config.Locale.suggestionSubmit).then(msg => setTimeout(() => msg.delete(), 4000));

}


module.exports.help = {
  name: 'suggest',
  enabled: commands.General.Suggest.Enabled
}
