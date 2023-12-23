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

const { Discord, ActionRowBuilder, ButtonBuilder, EmbedBuilder, StringSelectMenuBuilder, ButtonStyle } = require("discord.js");
const fs = require('fs');
const yaml = require("js-yaml")
const config = yaml.load(fs.readFileSync('./config.yml', 'utf8'))
const commands = yaml.load(fs.readFileSync('./commands.yml', 'utf8'))

exports.run = async (client, message, args) => {
if(!message.guild.channels.cache.get(config.TicketSettings.LogsChannelID)) return console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketSettings.LogsChannelID is not a valid channel!`)
if(!message.member.permissions.has("Administrator")) return message.reply(config.Locale.NoPermsMessage);
setTimeout(() => message.delete(), 1000);

if(config.TicketButton1.ButtonColor === "Blurple") config.TicketButton1.ButtonColor = ButtonStyle.Primary
if(config.TicketButton1.ButtonColor === "Gray") config.TicketButton1.ButtonColor = ButtonStyle.Secondary
if(config.TicketButton1.ButtonColor === "Green") config.TicketButton1.ButtonColor = ButtonStyle.Success
if(config.TicketButton1.ButtonColor === "Red") config.TicketButton1.ButtonColor = ButtonStyle.Danger

if(config.TicketButton2.ButtonColor === "Blurple") config.TicketButton2.ButtonColor = ButtonStyle.Primary
if(config.TicketButton2.ButtonColor === "Gray") config.TicketButton2.ButtonColor = ButtonStyle.Secondary
if(config.TicketButton2.ButtonColor === "Green") config.TicketButton2.ButtonColor = ButtonStyle.Success
if(config.TicketButton2.ButtonColor === "Red") config.TicketButton2.ButtonColor = ButtonStyle.Danger

if(config.TicketButton3.ButtonColor === "Blurple") config.TicketButton3.ButtonColor = ButtonStyle.Primary
if(config.TicketButton3.ButtonColor === "Gray") config.TicketButton3.ButtonColor = ButtonStyle.Secondary
if(config.TicketButton3.ButtonColor === "Green") config.TicketButton3.ButtonColor = ButtonStyle.Success
if(config.TicketButton3.ButtonColor === "Red") config.TicketButton3.ButtonColor = ButtonStyle.Danger

if(config.TicketButton4.ButtonColor === "Blurple") config.TicketButton4.ButtonColor = ButtonStyle.Primary
if(config.TicketButton4.ButtonColor === "Gray") config.TicketButton4.ButtonColor = ButtonStyle.Secondary
if(config.TicketButton4.ButtonColor === "Green") config.TicketButton4.ButtonColor = ButtonStyle.Success
if(config.TicketButton4.ButtonColor === "Red") config.TicketButton4.ButtonColor = ButtonStyle.Danger

if(config.TicketButton5.ButtonColor === "Blurple") config.TicketButton5.ButtonColor = ButtonStyle.Primary
if(config.TicketButton5.ButtonColor === "Gray") config.TicketButton5.ButtonColor = ButtonStyle.Secondary
if(config.TicketButton5.ButtonColor === "Green") config.TicketButton5.ButtonColor = ButtonStyle.Success
if(config.TicketButton5.ButtonColor === "Red") config.TicketButton5.ButtonColor = ButtonStyle.Danger

if(config.TicketButton6.ButtonColor === "Blurple") config.TicketButton6.ButtonColor = ButtonStyle.Primary
if(config.TicketButton6.ButtonColor === "Gray") config.TicketButton6.ButtonColor = ButtonStyle.Secondary
if(config.TicketButton6.ButtonColor === "Green") config.TicketButton6.ButtonColor = ButtonStyle.Success
if(config.TicketButton6.ButtonColor === "Red") config.TicketButton6.ButtonColor = ButtonStyle.Danger

if(config.TicketButton7.ButtonColor === "Blurple") config.TicketButton7.ButtonColor = ButtonStyle.Primary
if(config.TicketButton7.ButtonColor === "Gray") config.TicketButton7.ButtonColor = ButtonStyle.Secondary
if(config.TicketButton7.ButtonColor === "Green") config.TicketButton7.ButtonColor = ButtonStyle.Success
if(config.TicketButton7.ButtonColor === "Red") config.TicketButton7.ButtonColor = ButtonStyle.Danger

if(config.TicketButton8.ButtonColor === "Blurple") config.TicketButton8.ButtonColor = ButtonStyle.Primary
if(config.TicketButton8.ButtonColor === "Gray") config.TicketButton8.ButtonColor = ButtonStyle.Secondary
if(config.TicketButton8.ButtonColor === "Green") config.TicketButton8.ButtonColor = ButtonStyle.Success
if(config.TicketButton8.ButtonColor === "Red") config.TicketButton8.ButtonColor = ButtonStyle.Danger



const button1 = new ButtonBuilder()
button1.setCustomId('button1')
button1.setLabel(config.TicketButton1.TicketName)
button1.setStyle(config.TicketButton1.ButtonColor)
if(config.TicketButton1.ButtonEmoji) button1.setEmoji(config.TicketButton1.ButtonEmoji)

const button2 = new ButtonBuilder()
button2.setCustomId('button2')
button2.setLabel(config.TicketButton2.TicketName)
button2.setStyle(config.TicketButton2.ButtonColor)
if(config.TicketButton2.ButtonEmoji) button2.setEmoji(config.TicketButton2.ButtonEmoji)

const button3 = new ButtonBuilder()
button3.setCustomId('button3')
button3.setLabel(config.TicketButton3.TicketName)
button3.setStyle(config.TicketButton3.ButtonColor)
if(config.TicketButton3.ButtonEmoji) button3.setEmoji(config.TicketButton3.ButtonEmoji)

const button4 = new ButtonBuilder()
button4.setCustomId('button4')
button4.setLabel(config.TicketButton4.TicketName)
button4.setStyle(config.TicketButton4.ButtonColor)
if(config.TicketButton4.ButtonEmoji) button4.setEmoji(config.TicketButton4.ButtonEmoji)

const button5 = new ButtonBuilder()
button5.setCustomId('button5')
button5.setLabel(config.TicketButton5.TicketName)
button5.setStyle(config.TicketButton5.ButtonColor)
if(config.TicketButton5.ButtonEmoji) button5.setEmoji(config.TicketButton5.ButtonEmoji)


let row = ""
if(!config.TicketButton2.Enabled && !config.TicketButton3.Enabled && !config.TicketButton4.Enabled && !config.TicketButton5.Enabled) row = new ActionRowBuilder().addComponents(button1);
if(config.TicketButton2.Enabled && !config.TicketButton3.Enabled && !config.TicketButton4.Enabled && !config.TicketButton5.Enabled) row = new ActionRowBuilder().addComponents(button1, button2);
if(config.TicketButton2.Enabled && config.TicketButton3.Enabled && !config.TicketButton4.Enabled && !config.TicketButton5.Enabled) row = new ActionRowBuilder().addComponents(button1, button2, button3);
if(config.TicketButton2.Enabled && config.TicketButton3.Enabled && !config.TicketButton4.Enabled && config.TicketButton5.Enabled) row = new ActionRowBuilder().addComponents(button1, button2, button3, button5);
if(config.TicketButton2.Enabled && config.TicketButton3.Enabled && config.TicketButton4.Enabled && !config.TicketButton5.Enabled) row = new ActionRowBuilder().addComponents(button1, button2, button3, button4);
if(config.TicketButton2.Enabled && config.TicketButton3.Enabled && config.TicketButton4.Enabled && config.TicketButton5.Enabled) row = new ActionRowBuilder().addComponents(button1, button2, button3, button4, button5);
if(config.TicketButton2.Enabled && !config.TicketButton3.Enabled && config.TicketButton4.Enabled && config.TicketButton5.Enabled) row = new ActionRowBuilder().addComponents(button1, button2, button4, button5);
if(config.TicketButton2.Enabled && !config.TicketButton3.Enabled && !config.TicketButton4.Enabled && config.TicketButton5.Enabled) row = new ActionRowBuilder().addComponents(button1, button2, button5);
if(config.TicketButton2.Enabled && !config.TicketButton3.Enabled && config.TicketButton4.Enabled && !config.TicketButton5.Enabled) row = new ActionRowBuilder().addComponents(button1, button2, button4);
if(!config.TicketButton2.Enabled && config.TicketButton3.Enabled && config.TicketButton4.Enabled && config.TicketButton5.Enabled) row = new ActionRowBuilder().addComponents(button1, button3, button4, button5);
if(!config.TicketButton2.Enabled && config.TicketButton3.Enabled && config.TicketButton4.Enabled && !config.TicketButton5.Enabled) row = new ActionRowBuilder().addComponents(button1, button3, button4);
if(!config.TicketButton2.Enabled && !config.TicketButton3.Enabled && config.TicketButton4.Enabled && !config.TicketButton5.Enabled) row = new ActionRowBuilder().addComponents(button1, button4);
if(!config.TicketButton2.Enabled && !config.TicketButton3.Enabled && config.TicketButton4.Enabled && config.TicketButton5.Enabled) row = new ActionRowBuilder().addComponents(button1, button4, button5);


const ticketEmbed = new EmbedBuilder()
    .setTitle(config.TicketPanelSettings.PanelTitle)
    .setDescription(config.TicketPanelSettings.PanelMessage)
    if(config.TicketPanelSettings.EmbedColor) ticketEmbed.setColor(config.TicketPanelSettings.EmbedColor)
    if(!config.TicketPanelSettings.EmbedColor) ticketEmbed.setColor(config.EmbedColors)
    if(config.TicketPanelSettings.PanelImage) ticketEmbed.setImage(config.TicketPanelSettings.PanelImage)
    if(config.TicketPanelSettings.PanelThumbnail) ticketEmbed.setThumbnail(config.TicketPanelSettings.PanelThumbnail)
    if(config.TicketPanelSettings.FooterMsg) ticketEmbed.setFooter({ text: `${config.TicketPanelSettings.FooterMsg}` })
    if(config.TicketPanelSettings.FooterMsg && config.TicketPanelSettings.FooterIcon) ticketEmbed.setFooter({ text: `${config.TicketPanelSettings.FooterMsg}`, iconURL: `${config.TicketPanelSettings.FooterIcon}` })
    if(config.TicketPanelSettings.FooterTimestamp) ticketEmbed.setTimestamp()


    const options = [];
    options.push({
      label: config.TicketButton1.TicketName,
      value: "button1",
      description: config.TicketButton1.Description,
      emoji: config.TicketButton1.ButtonEmoji,
    });

    if(config.TicketButton2.Enabled) options.push({
      label: config.TicketButton2.TicketName,
      value: "button2", 
      description: config.TicketButton2.Description,
      emoji: config.TicketButton2.ButtonEmoji,
    });

    if(config.TicketButton3.Enabled) options.push({
      label: config.TicketButton3.TicketName,
      value: "button3",
      description: config.TicketButton3.Description,
      emoji: config.TicketButton3.ButtonEmoji,
    });

    if(config.TicketButton4.Enabled) options.push({
      label: config.TicketButton4.TicketName,
      value: "button4",
      description: config.TicketButton4.Description,
      emoji: config.TicketButton4.ButtonEmoji,
    });

    if(config.TicketButton5.Enabled) options.push({
      label: config.TicketButton5.TicketName,
      value: "button5",
      description: config.TicketButton5.Description,
      emoji: config.TicketButton5.ButtonEmoji,
    });

    if(config.TicketButton6.Enabled) options.push({
      label: config.TicketButton6.TicketName,
      value: "button6",
      description: config.TicketButton6.Description,
      emoji: config.TicketButton6.ButtonEmoji,
    });

    if(config.TicketButton7.Enabled) options.push({
      label: config.TicketButton7.TicketName,
      value: "button7",
      description: config.TicketButton7.Description,
      emoji: config.TicketButton7.ButtonEmoji,
    });
    
    if(config.TicketButton8.Enabled) options.push({
      label: config.TicketButton8.TicketName,
      value: "button8",
      description: config.TicketButton8.Description,
      emoji: config.TicketButton8.ButtonEmoji,
    });

    await options.map((item) => {
      if(!item.emoji) delete item.emoji
      if(!item.description) delete item.description
    });

    let sMenu = new StringSelectMenuBuilder()
    .setCustomId("categorySelect")
    .setPlaceholder(config.Locale.selectCategory)
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(options);

    let sRow = new ActionRowBuilder().addComponents(sMenu);
    if(config.TicketSettings.SelectMenu === false) message.channel.send({ embeds: [ticketEmbed], components: [row] });
    if(config.TicketSettings.SelectMenu) message.channel.send({ embeds: [ticketEmbed], components: [sRow] }).then(async function(msg) {

    client.ticketPanel.set(config.GuildID, options, 'selectMenuOptions');
    client.ticketPanel.set(config.GuildID, msg.id, 'msgID');
    })

}


module.exports.help = {
  name: 'panel',
  enabled: commands.Ticket.Panel.Enabled
}