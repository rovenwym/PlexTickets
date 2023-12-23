const { Discord, ActionRowBuilder, ButtonBuilder, EmbedBuilder, StringSelectMenuBuilder, Message, MessageAttachment, ModalBuilder, TextInputBuilder } = require("discord.js");
const fs = require('fs');
const yaml = require("js-yaml")
const config = yaml.load(fs.readFileSync('./config.yml', 'utf8'))
const utils = require("../utils.js");

module.exports = async (client, interaction) => {

if(config.TicketSettings.TicketCloseReason === false && interaction.customId !== "closeReason") await interaction.deferReply({ ephemeral: false });
if(config.TicketSettings.TicketCloseReason && interaction.customId === "closeReason") await interaction.editReply({ content: `${config.Locale.successReason}` })

        // Ticket close reason modal
        if(config.TicketSettings.TicketCloseReason && interaction.customId !== "closeReason" && interaction.customId !== "deleteTicket") {
            const modal = new ModalBuilder()
            .setCustomId('closeReason')
            .setTitle(config.Locale.ticketCloseReasonTitle);
          
          const reasonForClose = new TextInputBuilder()
            .setCustomId('reasonForClose')
            .setLabel(config.Locale.whyCloseTicket)
            .setStyle("Short");
          
          const row1 = new ActionRowBuilder().addComponents(reasonForClose);

          await modal.addComponents(row1);
          await interaction.showModal(modal);
          return;
          }

    async function CloseTicket() {
        let attachment = await utils.saveTranscript(interaction)

        let ticketAuthor = await client.users.cache.get(client.tickets.get(`${interaction.channel.id}`, "userID"))
        let closeUserID = await client.users.cache.get(client.tickets.get(`${interaction.channel.id}`, "closeUserID"))
        let claimUser = await client.users.cache.get(client.tickets.get(`${interaction.channel.id}`, "claimUser"))
        let totalMessages = await client.tickets.get(`${interaction.channel.id}`, "messages")
        let ticketCloseReason = await client.tickets.get(`${interaction.channel.id}`, "closeReason")
      
          const logEmbed = new EmbedBuilder()
          logEmbed.setColor("Red")
          logEmbed.setTitle(config.Locale.ticketCloseTitle)

          if(closeUserID) logEmbed.addFields([
            { name: `• ${config.Locale.logsClosedBy}`, value: `> <@!${closeUserID.id}>\n> ${closeUserID.tag}` },
          ])

          if(config.ArchiveTickets.Enabled) logEmbed.addFields([
            { name: `• ${config.Locale.logsDeletedBy}`, value: `> <@!${interaction.user.id}>\n> ${interaction.user.tag}` },
          ])

          logEmbed.addFields([
            { name: `• ${config.Locale.logsTicketAuthor}`, value: `> <@!${ticketAuthor.id}>\n> ${ticketAuthor.tag}` },
          ])


          if(claimUser && config.ClaimingSystem.Enabled) logEmbed.addFields([
            { name: `• ${config.Locale.ticketClaimedBy}`, value: `> <@!${claimUser.id}>\n> ${claimUser.tag}` },
          ])

          logEmbed.addFields([
            { name: `• ${config.Locale.logsTicket}`, value: `> #${interaction.channel.name}\n> ${client.tickets.get(`${interaction.channel.id}`, "ticketType")}` },
          ])

          if(config.TicketSettings.TicketCloseReason && ticketCloseReason) logEmbed.addFields([
            { name: `• ${config.Locale.reason}`, value: `> ${ticketCloseReason}` },
          ])
      
          logEmbed.setTimestamp()
          logEmbed.setThumbnail(interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
          logEmbed.setFooter({ text: `${config.Locale.totalMessagesLog} ${totalMessages}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })

          let logsChannel; 
          if(!config.ticketClose.ChannelID) logsChannel = interaction.guild.channels.cache.get(config.TicketSettings.LogsChannelID);
          if(config.ticketClose.ChannelID) logsChannel = interaction.guild.channels.cache.get(config.ticketClose.ChannelID);

          let closeLogMsgID;
          if(logsChannel && config.ticketClose.Enabled && totalMessages < config.TicketTranscriptSettings.MessagesRequirement) await logsChannel.send({ embeds: [logEmbed] }).then(async function(msg) { closeLogMsgID = msg.id })
          if(logsChannel && config.ticketClose.Enabled && totalMessages >= config.TicketTranscriptSettings.MessagesRequirement) await logsChannel.send({ embeds: [logEmbed], files: [attachment] }).then(async function(msg) { closeLogMsgID = msg.id })
  
          if(ticketAuthor) {
          let ticketCloseLocale = config.TicketUserCloseDM.CloseEmbedMsg.replace(/{guildName}/g, `${interaction.guild.name}`);
          let ticketCloseReviewLocale = config.TicketReviewSettings.CloseEmbedReviewMsg.replace(/{guildName}/g, `${interaction.guild.name}`);
          if(config.TicketUserCloseDM.Enabled !== false || config.TicketReviewSettings.Enabled !== false) try {
            // Rating System
            const starMenu = new ActionRowBuilder()
            .addComponents(
              new StringSelectMenuBuilder()
                .setCustomId('ratingSelect')
                .setPlaceholder(config.Locale.selectReview)
                .setMinValues(1)
                .setMaxValues(1)
                .addOptions([
                  {
                    label: '5 Star',
                    value: 'five_star',
                    emoji: '⭐',
                  },
                  {
                    label: '4 Star',
                    value: 'four_star',
                    emoji: '⭐',
                  },
                  {
                    label: '3 Star',
                    value: 'three_star',
                    emoji: '⭐',
                  },
                  {
                    label: '2 Star',
                    value: 'two_star',
                    emoji: '⭐',
                  },
                  {
                    label: '1 Star',
                    value: 'one_star',
                    emoji: '⭐',
                  },
                ]),
            );

            if(!claimUser) claimUser = config.Locale.notClaimedCloseDM

            const dmCloseEmbed = new EmbedBuilder()
            dmCloseEmbed.setTitle(config.Locale.ticketClosedCloseDM)
            dmCloseEmbed.setDescription(ticketCloseLocale)
            if(config.TicketUserCloseDM.Enabled && config.TicketUserCloseDM.TicketInformation) dmCloseEmbed.addFields([
              { name: `${config.Locale.ticketInformationCloseDM}`, value: `> ${config.Locale.categoryCloseDM} ${client.tickets.get(`${interaction.channel.id}`, "ticketType")}\n> ${config.Locale.claimedByCloseDM} ${claimUser}\n> ${config.Locale.totalMessagesLog} ${client.tickets.get(`${interaction.channel.id}`, "messages")}` },
            ])
            dmCloseEmbed.setColor(config.EmbedColors)

            const dmCloseReviewEmbed = new EmbedBuilder()
            dmCloseReviewEmbed.setTitle(config.Locale.ticketClosedCloseDM)
            dmCloseReviewEmbed.setDescription(ticketCloseReviewLocale)
            if(config.TicketUserCloseDM.Enabled && config.TicketUserCloseDM.TicketInformation) dmCloseReviewEmbed.addFields([
              { name: `${config.Locale.ticketInformationCloseDM}`, value: `> ${config.Locale.categoryCloseDM} ${client.tickets.get(`${interaction.channel.id}`, "ticketType")}\n> ${config.Locale.claimedByCloseDM} ${claimUser}\n> ${config.Locale.totalMessagesLog} ${client.tickets.get(`${interaction.channel.id}`, "messages")}` },
            ])
            dmCloseReviewEmbed.setColor(config.EmbedColors)

            let meetRequirement = true
            if(config.TicketReviewRequirements.Enabled) {
              if(client.tickets.get(`${interaction.channel.id}`, "messages") < config.TicketReviewRequirements.TotalMessages) meetRequirement = false
          }

          let reviewDMUserMsg;

          if(config.TicketReviewSettings.Enabled && meetRequirement && config.TicketUserCloseDM.Enabled && config.TicketUserCloseDM.SendTranscript) await ticketAuthor.send({ embeds: [dmCloseReviewEmbed], files: [attachment], components: [starMenu] }).then(async function(msg) { reviewDMUserMsg = msg.id })
          if(config.TicketReviewSettings.Enabled && meetRequirement && config.TicketUserCloseDM.Enabled && config.TicketUserCloseDM.SendTranscript === false) await ticketAuthor.send({ embeds: [dmCloseReviewEmbed], components: [starMenu] }).then(async function(msg) { reviewDMUserMsg = msg.id })
          if(config.TicketReviewSettings.Enabled && meetRequirement && config.TicketUserCloseDM.Enabled === false) await ticketAuthor.send({ embeds: [dmCloseReviewEmbed], components: [starMenu] }).then(async function(msg) { reviewDMUserMsg = msg.id })

          if(config.TicketReviewSettings.Enabled && meetRequirement === false && config.TicketUserCloseDM.Enabled && config.TicketUserCloseDM.SendTranscript) await ticketAuthor.send({ embeds: [dmCloseEmbed], files: [attachment] }).then(async function(msg) { reviewDMUserMsg = msg.id })
          if(config.TicketReviewSettings.Enabled && meetRequirement === false && config.TicketUserCloseDM.Enabled && config.TicketUserCloseDM.SendTranscript === false) await ticketAuthor.send({ embeds: [dmCloseEmbed] }).then(async function(msg) { reviewDMUserMsg = msg.id })
          //if(config.TicketReviewSettings.Enabled && meetRequirement === false && config.TicketUserCloseDM.Enabled === false) await ticketAuthor.send({ embeds: [dmCloseEmbed] }).then(async function(msg) { reviewDMUserMsg = msg.id })

          if(config.TicketReviewSettings.Enabled === false && config.TicketUserCloseDM.Enabled && config.TicketUserCloseDM.SendTranscript) await ticketAuthor.send({ embeds: [dmCloseEmbed], files: [attachment] })
          if(config.TicketReviewSettings.Enabled === false && config.TicketUserCloseDM.Enabled && config.TicketUserCloseDM.SendTranscript === false) await ticketAuthor.send({ embeds: [dmCloseEmbed] })

          if(config.TicketReviewSettings.Enabled) client.reviewsData.ensure(`${reviewDMUserMsg}`, {
            ticketCreatorID: ticketAuthor.id,
            guildID: interaction.guild.id,
            userID: ticketAuthor.id,
            tCloseLogMsgID: closeLogMsgID,
            reviewDMUserMsgID: reviewDMUserMsg,
            rating: 0,
            category: client.tickets.get(`${interaction.channel.id}`, "ticketType"),
            totalMessages: client.tickets.get(`${interaction.channel.id}`, "messages"),
        });

//
      }catch(e){
          console.log('\x1b[33m%s\x1b[0m', "[INFO] I tried to DM a user, but their DM's are locked.");
          //console.log(e)
          }
      }

      let dTime = config.TicketSettings.DeleteTime * 1000 
      let deleteTicketCountdown = config.Locale.deletingTicketMsg.replace(/{time}/g, `${config.TicketSettings.DeleteTime}`);
      const delEmbed = new EmbedBuilder()
          .setDescription(deleteTicketCountdown)
          .setColor("Red")

      const ticketDeleteButton = new ButtonBuilder()
      .setCustomId('closeTicket')
      .setLabel(config.Locale.CloseTicketButton)
      .setStyle(config.ButtonColors.closeTicket)
      .setEmoji(config.ButtonEmojis.closeTicket)
      .setDisabled(true)
      
      let row1 = new ActionRowBuilder().addComponents(ticketDeleteButton);

      await interaction.channel.messages.fetch(client.tickets.get(`${interaction.channel.id}`, "msgID")).then(msg => {
        msg.edit({ components: [row1] })
  })

    if(config.ArchiveTickets.Enabled === false) await interaction.followUp({ embeds: [delEmbed] })
    if(config.ArchiveTickets.Enabled === true && config.TicketSettings.TicketCloseReason === false) await interaction.followUp({ embeds: [delEmbed] })
    if(config.ArchiveTickets.Enabled === true && config.TicketSettings.TicketCloseReason === true) await interaction.reply({ embeds: [delEmbed] })

      setTimeout(async () => {
        await interaction.channel.delete().catch(e => {})
    }, dTime)

      let logMsg = `\n\n[${new Date().toLocaleString()}] [TICKET CLOSED] A ticket has been successfully closed`;
      fs.appendFile("./logs.txt", logMsg, (e) => { 
        if(e) console.log(e);
      });

    // Sync globalStats.openTickets
    let openNow = 0
    let openInDb = client.globalStats.get(`${interaction.guild.id}`, "openTickets")
    await interaction.guild.channels.cache.forEach(c => {
        if(client.tickets.has(c.id)) {
            openNow = openNow + 1
    }
})
if(openInDb !== openNow) {
    client.globalStats.set(interaction.guild.id, openNow, "openTickets");
}
//

}

      async function ArchiveTicket() {
        let tButton = client.tickets.get(`${interaction.channel.id}`, "button");
        let ticketAuthor = client.users.cache.get(client.tickets.get(`${interaction.channel.id}`, "userID"))

        const reOpenButton = new ButtonBuilder()
        .setCustomId('reOpen')
        .setLabel(config.Locale.reOpenButton)
        .setEmoji(config.ButtonEmojis.reOpenTicket)
        .setStyle(config.ButtonColors.reOpenTicket)

        const transcriptButton = new ButtonBuilder()
        .setCustomId('createTranscript')
        .setLabel(config.Locale.transcriptButton)
        .setEmoji(config.ButtonEmojis.createTranscript)
        .setStyle(config.ButtonColors.createTranscript)
    
        const deleteButton = new ButtonBuilder()
        .setCustomId('deleteTicket')
        .setLabel(config.Locale.deleteTicketButton)
        .setEmoji(config.ButtonEmojis.deleteTicket)
        .setStyle(config.ButtonColors.deleteTicket)

        let row = new ActionRowBuilder().addComponents(reOpenButton, transcriptButton, deleteButton);

        let ticketCloseReason = await client.tickets.get(`${interaction.channel.id}`, "closeReason")

        let ticketClosedLocale = config.Locale.ticketClosedBy.replace(/{user}/g, `<@!${interaction.user.id}>`).replace(/{user-tag}/g, `${interaction.user.tag}`);
        let ticketClosedReasonLocale = config.Locale.ticketClosedByReason.replace(/{user}/g, `<@!${interaction.user.id}>`).replace(/{user-tag}/g, `${interaction.user.tag}`).replace(/{reason}/g, `${ticketCloseReason}`);
        const embed = new EmbedBuilder()
        embed.setColor("Red") // %%__FILEHASH__%% // %%__TIMESTAMP__%%
        embed.setTitle(config.Locale.ticketClosedCloseDM)
        if(config.TicketSettings.TicketCloseReason === false) embed.setDescription(ticketClosedLocale)
        if(config.TicketSettings.TicketCloseReason && ticketCloseReason) embed.setDescription(ticketClosedReasonLocale)
        embed.setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ dynamic: true })}` })
        embed.setTimestamp()

        if(config.ArchiveTickets.ViewClosedTicket === false) await interaction.channel.permissionOverwrites.cache.filter(o => o.type === 1).map(o => o.delete())
        if(config.ArchiveTickets.ViewClosedTicket) await interaction.channel.permissionOverwrites.cache.filter(o => o.type === 1 && o.id !== client.user.id).map(o => o.edit({ SendMessages: false, ViewChannel: true }));

      let msgID;
      await interaction.followUp({ embeds: [embed], components: [row], ephemeral: false, fetchReply: true }).then(async function(msg) { msgID = msg.id })

      await client.tickets.set(interaction.channel.id, msgID, "archiveMsgID");
      if(config.ArchiveTickets.TicketOpenLimit === false) await client.tickets.set(interaction.channel.id, "Closed", "status");
      if(config.ArchiveTickets.RenameClosedTicket) await interaction.channel.setName(`closed-${ticketAuthor.username}`)


      if(tButton === "TicketButton1") {
        if(config.TicketButton1.ClosedCategoryID) await interaction.channel.setParent(config.TicketButton1.ClosedCategoryID, {lockPermissions: false})
        await config.TicketButton1.SupportRoles.forEach(sRoles => {
          role = interaction.guild.roles.cache.get(sRoles);
          if(role) {
              interaction.channel.permissionOverwrites.edit(role, {
                  SendMessages: false,
                  ViewChannel: true
              })
          }
    
      })

      } else if(tButton === "TicketButton2") {
        if(config.TicketButton2.ClosedCategoryID) await interaction.channel.setParent(config.TicketButton2.ClosedCategoryID, {lockPermissions: false})
        await config.TicketButton2.SupportRoles.forEach(sRoles => {
          role = interaction.guild.roles.cache.get(sRoles);
          if(role) {
              interaction.channel.permissionOverwrites.edit(role, {
                  SendMessages: false,
                  ViewChannel: true
              })
          }
      })

      } else if(tButton === "TicketButton3") {
        if(config.TicketButton3.ClosedCategoryID) await interaction.channel.setParent(config.TicketButton3.ClosedCategoryID, {lockPermissions: false})
        await config.TicketButton3.SupportRoles.forEach(sRoles => {
          role = interaction.guild.roles.cache.get(sRoles);
          if(role) {
              interaction.channel.permissionOverwrites.edit(role, {
                  SendMessages: false,
                  ViewChannel: true
              })
          }
      })

      } else if(tButton === "TicketButton4") {
        if(config.TicketButton4.ClosedCategoryID) await interaction.channel.setParent(config.TicketButton4.ClosedCategoryID, {lockPermissions: false})
        await config.TicketButton4.SupportRoles.forEach(sRoles => {
          role = interaction.guild.roles.cache.get(sRoles);
          if(role) {
              interaction.channel.permissionOverwrites.edit(role, {
                  SendMessages: false,
                  ViewChannel: true
              })
          }
      })

      } else if(tButton === "TicketButton5") {
        if(config.TicketButton5.ClosedCategoryID) await interaction.channel.setParent(config.TicketButton5.ClosedCategoryID, {lockPermissions: false})
        await config.TicketButton5.SupportRoles.forEach(sRoles => {
          role = interaction.guild.roles.cache.get(sRoles);
          if(role) {
              interaction.channel.permissionOverwrites.edit(role, {
                  SendMessages: false,
                  ViewChannel: true
              })
          }
      })
      }


      }

      // If ArchiveTickets is enabled
      if(config.ArchiveTickets.Enabled === true && interaction.customId === 'deleteTicket') {
        CloseTicket()

      } else if(config.ArchiveTickets.Enabled === true && interaction.customId !== 'deleteTicket') {
        ArchiveTicket()

      } else if(config.ArchiveTickets.Enabled === false) {
        CloseTicket()
      }


};