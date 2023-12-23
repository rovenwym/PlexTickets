const { Discord, ActionRowBuilder, ButtonBuilder, EmbedBuilder, InteractionType, Message, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder } = require("discord.js");
const fs = require('fs');
const yaml = require("js-yaml")
const config = yaml.load(fs.readFileSync('./config.yml', 'utf8'))
const utils = require("../utils.js");
const fetch = require("node-fetch");
let Cooldown = new Map();

module.exports = async (client, interaction) => {
    if(interaction.isChatInputCommand()) return;

    let sMenu;
    if(config.TicketSettings.SelectMenu === false) sMenu = interaction.customId
    if(!interaction.values) sMenu = interaction.customId
    if(config.TicketSettings.SelectMenu && interaction.values) sMenu = interaction.values[0]

    // Reset select menu selection
    if(config.TicketSettings.SelectMenu && interaction.customId === "categorySelect") {
        try {
        await interaction.channel.messages.fetch(client.ticketPanel.get(config.GuildID, 'msgID')).then(async msg => {
           if(!msg) return console.log('\x1b[31m%s\x1b[0m', `[WARNING] Panel message not found! Please re-send the panel using the command.`)
   
           let sMenu = new StringSelectMenuBuilder()
           .setCustomId("categorySelect")
           .setPlaceholder(config.Locale.selectCategory)
           .setMinValues(1)
           .setMaxValues(1)
           .addOptions(client.ticketPanel.get(config.GuildID, 'selectMenuOptions'));
           let sRow = new ActionRowBuilder().addComponents(sMenu);
           await msg.edit({ components: [sRow] })
       })
    } catch (error) {
        if (error) return console.log('\x1b[31m%s\x1b[0m', `[WARNING] Panel message not found! Please re-send the panel using the command.`)
    }
   }
       //

    //Button 1
    if (sMenu === 'button1') {

        await interaction.deferReply({ ephemeral: true });

        let cooldownEmbedLocale = config.Locale.cooldownEmbedMsg.replace(/{time}/g, `${utils.duration(config.TicketSettings.TicketCooldown * 1000 - (Date.now() - Cooldown.get(interaction.user.id)))}`);
        let cooldownEmbed = new EmbedBuilder()
        .setTitle(config.Locale.cooldownEmbedMsgTitle)
        .setColor("Red")
        .setDescription(cooldownEmbedLocale)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
        if(Cooldown.has(interaction.user.id)) return interaction.editReply({ embeds: [cooldownEmbed], ephemeral: true })

        let logMsg = `\n\n[${new Date().toLocaleString()}] [TICKET CREATION] Button: TicketButton1, User: ${interaction.user.tag}`;
        fs.appendFile("./logs.txt", logMsg, (e) => { 
          if(e) console.log(e);
        });

        let userBlacklisted = new EmbedBuilder()
        .setTitle(config.Locale.userBlacklistedTitle)
        .setColor("Red")
        .setDescription(config.Locale.userBlacklistedMsg)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
        if(client.blacklistedUsers.has(`${interaction.user.id}`) && client.blacklistedUsers.get(`${interaction.user.id}`, "blacklisted") === true) return interaction.editReply({ embeds: [userBlacklisted], ephemeral: true })

        let blRole = false
        let ticketRoleBlacklisted = new EmbedBuilder()
        .setTitle(config.Locale.RoleBlacklistedTitle)
        .setColor("Red")
        .setDescription(config.Locale.RoleBlacklistedMsg)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();

        for(let i = 0; i < config.TicketSettings.BlacklistedRoles.length; i++) {
            if(interaction.member.roles.cache.has(config.TicketSettings.BlacklistedRoles[i])) blRole = true;
          }
        if(blRole === true) return interaction.editReply({ embeds: [ticketRoleBlacklisted], ephemeral: true })

        if(!interaction.guild.channels.cache.get(config.TicketButton1.TicketCategoryID)) return console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton1.TicketCategoryID is not a valid category!`)

        let max = config.TicketSettings.MaxTickets
        let tNow = 0

        let maxTickets = config.Locale.AlreadyOpenMsg.replace(/{max}/g, `${max}`);
        let ticketAlreadyOpened = new EmbedBuilder()
        .setTitle(config.Locale.AlreadyOpenTitle)
        .setColor("Red")
        .setDescription(maxTickets)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();

        await interaction.guild.channels.cache.forEach(c => {
            if(client.tickets.has(c.id)) {
            let ticketData = client.tickets.get(`${c.id}`, "userID")
            if(ticketData && ticketData === interaction.user.id && client.tickets.get(c.id, 'status') !== "Closed") {
            tNow = tNow + 1
            }
        }
        });

        if(tNow >= max) return interaction.editReply({ embeds: [ticketAlreadyOpened], ephemeral: true }).then(msg => {
            tNow = 0
        }).catch(e => {});

    let tChannelName = config.TicketButton1.ChannelName.replace(/{username}/g, `${interaction.user.username}`).replace(/{total-tickets}/g, `${client.globalStats.get(`${interaction.guild.id}`, "totalTickets")}`).replace(/{user-tag}/g, `${interaction.user.tag}`).replace(/{user-id}/g, `${interaction.user.id}`)

let permissionOverwriteArray = [{
        id: interaction.member.id,
        allow: ['SendMessages', 'ViewChannel', 'AttachFiles', 'EmbedLinks', 'ReadMessageHistory']
    },
    {
        id: interaction.guild.id,
        deny: ['SendMessages', 'ViewChannel']
    },
    {
        id: client.user.id,
        allow: ['SendMessages', 'ViewChannel']
    },
]

await config.TicketButton1.SupportRoles.forEach(roleid => {
    role = interaction.guild.roles.cache.get(roleid);
    if(!role) return console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton1.SupportRoles is not a valid role!`)
    let tempArray = {
        id: role.id,
        allow: ['SendMessages', 'ViewChannel', 'AttachFiles', 'EmbedLinks', 'ReadMessageHistory']
    }
    permissionOverwriteArray.push(tempArray);
})

        const channel = await interaction.guild.channels.create({
            name: tChannelName,
            type: 0,
            parent: config.TicketButton1.TicketCategoryID,
            topic: config.TicketSettings.ChannelTopic.replace(/{username}/g, `<@!${interaction.user.id}>`).replace(/{user-tag}/g, `${interaction.user.tag}`).replace(/{category}/g, `${config.TicketButton1.TicketName}`),
            permissionOverwrites: permissionOverwriteArray
        });

        const ticketDeleteButton = new ButtonBuilder()
        .setCustomId('closeTicket')
        .setLabel(config.Locale.CloseTicketButton)
        .setStyle(config.ButtonColors.closeTicket)
        .setEmoji(config.ButtonEmojis.closeTicket)

        const ticketClaimButton = new ButtonBuilder()
        .setCustomId('ticketclaim')
        .setLabel(config.Locale.claimTicketButton)
        .setEmoji(config.ButtonEmojis.ticketClaim)
        .setStyle(config.ButtonColors.ticketClaim)

        let row1 = ""
        if(config.ClaimingSystem.Enabled) row1 = new ActionRowBuilder().addComponents(ticketDeleteButton, ticketClaimButton);
        if(config.ClaimingSystem.Enabled === false) row1 = new ActionRowBuilder().addComponents(ticketDeleteButton);

        let NewTicketMsg = config.TicketButton1.TicketMessage.replace(/{user}/g, `<@!${interaction.user.id}>`);
        let NewTicketMsgTitle = config.TicketButton1.TicketMessageTitle.replace(/{category}/g, `${config.TicketButton1.TicketName}`);
        var userIcon = interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });
        const deleteEmbed = new EmbedBuilder()
            if(config.TicketOpenEmbed.UserIconAuthor) deleteEmbed.setAuthor({ name: `${NewTicketMsgTitle}`, iconURL: `${userIcon}` })
            if(config.TicketOpenEmbed.UserIconAuthor === false) deleteEmbed.setAuthor({ name: `${NewTicketMsgTitle}` })
            if(!config.TicketOpenEmbed.EmbedColor) deleteEmbed.setColor(config.EmbedColors)
            if(config.TicketOpenEmbed.EmbedColor) deleteEmbed.setColor(config.TicketOpenEmbed.EmbedColor)
            if(config.TicketOpenEmbed.UserIconThumbnail) deleteEmbed.setThumbnail(userIcon)
            deleteEmbed.setDescription(`${NewTicketMsg}`)
            if(config.ClaimingSystem.Enabled) deleteEmbed.addFields([
                { name: `${config.Locale.ticketClaimedBy}`, value: `> ${config.Locale.ticketNotClaimed}` },
              ])
            if(config.TicketOpenEmbed.FooterMsg) deleteEmbed.setFooter({ text: `${config.TicketOpenEmbed.FooterMsg}` })
            if(config.TicketOpenEmbed.FooterMsg && config.TicketOpenEmbed.FooterIcon) deleteEmbed.setFooter({ text: `${config.TicketOpenEmbed.FooterMsg}`, iconURL: `${config.TicketOpenEmbed.FooterIcon}` })
            if(config.TicketOpenEmbed.Timestamp) deleteEmbed.setTimestamp()

        channel.send({ embeds: [deleteEmbed], components: [row1], fetchReply: true }).then(async (m2) => {
            let ticketOpened = new EmbedBuilder()
            .setTitle(config.Locale.ticketCreatedTitle)
            .setColor("Green")
            .setDescription(`${config.Locale.ticketCreatedMsg} <#${channel.id}>`)
            .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
            .setTimestamp();

            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setStyle('Link')
                        .setURL(`${m2.url}`) 
                        .setLabel(config.Locale.logsTicket)
                        .setEmoji(config.ButtonEmojis.ticketCreated))
            interaction.editReply({ embeds: [ticketOpened], components: [row2], ephemeral: true })
            if(config.TicketSettings.MentionAuthor) channel.send({ content: `<@!${interaction.user.id}>` }).then(msg => setTimeout(() => msg.delete().catch(e => {}), 500));

            if(config.TicketButton1.MentionSupportRoles) {
                let supp = config.TicketButton1.SupportRoles.map((r) => {
                  let findSupport = interaction.guild.roles.cache.get(r)
                  
                  if(findSupport) return findSupport;
                });
                
                channel.send(supp.join(" ")).then((msg) => setTimeout(() => msg.delete().catch(e => {}), 500));
              }

              await client.tickets.ensure(`${channel.id}`, {
                userID: interaction.user.id,
                ticketType: config.TicketButton1.TicketName,
                button: "TicketButton1",
                msgID: m2.id,
                claimed: false,
                claimUser: "",
                messages: 0,
                lastMessageSent: Date.now(),
                status: "Open",
                closeUserID: ""
              });

              await m2.pin()

    // Set cooldown when user create ticket
    let ticketCooldown = config.TicketSettings.TicketCooldown * 1000
    if(config.TicketSettings.TicketCooldown > 0) Cooldown.set(interaction.user.id, Date.now())
    if(config.TicketSettings.TicketCooldown > 0) setTimeout(() => Cooldown.delete(interaction.user.id), ticketCooldown)
    //

              client.emit('ticketCreate', interaction);

        })

    }


    //Button 2
    if (sMenu === 'button2') {
        await interaction.deferReply({ ephemeral: true });

        let cooldownEmbedLocale = config.Locale.cooldownEmbedMsg.replace(/{time}/g, `${utils.duration(config.TicketSettings.TicketCooldown * 1000 - (Date.now() - Cooldown.get(interaction.user.id)))}`);
        let cooldownEmbed = new EmbedBuilder()
        .setTitle(config.Locale.cooldownEmbedMsgTitle)
        .setColor("Red")
        .setDescription(cooldownEmbedLocale)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
        if(Cooldown.has(interaction.user.id)) return interaction.editReply({ embeds: [cooldownEmbed], ephemeral: true })

        let logMsg = `\n\n[${new Date().toLocaleString()}] [TICKET CREATION] Button: TicketButton2, User: ${interaction.user.tag}`;
        fs.appendFile("./logs.txt", logMsg, (e) => { 
          if(e) console.log(e);
        });

        let userBlacklisted = new EmbedBuilder()
        .setTitle(config.Locale.userBlacklistedTitle)
        .setColor("Red")
        .setDescription(config.Locale.userBlacklistedMsg)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
        if(client.blacklistedUsers.has(`${interaction.user.id}`) && client.blacklistedUsers.get(`${interaction.user.id}`, "blacklisted") === true) return interaction.editReply({ embeds: [userBlacklisted], ephemeral: true })

        let blRole = false
        let ticketRoleBlacklisted = new EmbedBuilder()
        .setTitle(config.Locale.RoleBlacklistedTitle)
        .setColor("Red")
        .setDescription(config.Locale.RoleBlacklistedMsg)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();

        for(let i = 0; i < config.TicketSettings.BlacklistedRoles.length; i++) {
            if(interaction.member.roles.cache.has(config.TicketSettings.BlacklistedRoles[i])) blRole = true;
          }
        if(blRole === true) return interaction.editReply({ embeds: [ticketRoleBlacklisted], ephemeral: true })

        if(config.TicketButton2.Enabled && !interaction.guild.channels.cache.get(config.TicketButton2.TicketCategoryID)) return console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton2.TicketCategoryID is not a valid category!`)

        let max = config.TicketSettings.MaxTickets
        let tNow = 0

        let maxTickets = config.Locale.AlreadyOpenMsg.replace(/{max}/g, `${max}`);
        let ticketAlreadyOpened = new EmbedBuilder()
        .setTitle(config.Locale.AlreadyOpenTitle)
        .setColor("Red")
        .setDescription(maxTickets)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();

        await interaction.guild.channels.cache.forEach(c => {
            if(client.tickets.has(c.id)) {
            let ticketData = client.tickets.get(`${c.id}`, "userID")
            if(ticketData && ticketData === interaction.user.id && client.tickets.get(c.id, 'status') !== "Closed") {
            tNow = tNow + 1
            }
        }
        });

        if(tNow >= max) return interaction.editReply({ embeds: [ticketAlreadyOpened], ephemeral: true }).then(msg => {
            tNow = 0
        }).catch(e => {});

        let tChannelName = config.TicketButton2.ChannelName.replace(/{username}/g, `${interaction.user.username}`).replace(/{total-tickets}/g, `${client.globalStats.get(`${interaction.guild.id}`, "totalTickets")}`).replace(/{user-tag}/g, `${interaction.user.tag}`).replace(/{user-id}/g, `${interaction.user.id}`)
 
        let permissionOverwriteArray = [{
            id: interaction.member.id,
            allow: ['SendMessages', 'ViewChannel', 'AttachFiles', 'EmbedLinks', 'ReadMessageHistory']
        },
        {
            id: interaction.guild.id,
            deny: ['SendMessages', 'ViewChannel']
        },
        {
            id: client.user.id,
            allow: ['SendMessages', 'ViewChannel']
        },
    ]
    
    await config.TicketButton2.SupportRoles.forEach(roleid => {
        role = interaction.guild.roles.cache.get(roleid);
        if(!role) return console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton2.SupportRoles is not a valid role!`)
        let tempArray = {
            id: role.id,
            allow: ['SendMessages', 'ViewChannel', 'AttachFiles', 'EmbedLinks', 'ReadMessageHistory']
        }
        permissionOverwriteArray.push(tempArray);
    })
    
            const channel = await interaction.guild.channels.create({
                name: tChannelName,
                type: 0,
                parent: config.TicketButton2.TicketCategoryID,
                topic: config.TicketSettings.ChannelTopic.replace(/{username}/g, `<@!${interaction.user.id}>`).replace(/{user-tag}/g, `${interaction.user.tag}`).replace(/{category}/g, `${config.TicketButton2.TicketName}`),
                permissionOverwrites: permissionOverwriteArray
            });

        const ticketDeleteButton = new ButtonBuilder()
        .setCustomId('closeTicket')
        .setLabel(config.Locale.CloseTicketButton)
        .setStyle(config.ButtonColors.closeTicket)
        .setEmoji(config.ButtonEmojis.closeTicket)

        const ticketClaimButton = new ButtonBuilder()
        .setCustomId('ticketclaim')
        .setLabel(config.Locale.claimTicketButton)
        .setEmoji(config.ButtonEmojis.ticketClaim)
        .setStyle(config.ButtonColors.ticketClaim)

        let row1 = ""
        if(config.ClaimingSystem.Enabled) row1 = new ActionRowBuilder().addComponents(ticketDeleteButton, ticketClaimButton);
        if(config.ClaimingSystem.Enabled === false) row1 = new ActionRowBuilder().addComponents(ticketDeleteButton);

        let NewTicketMsg = config.TicketButton2.TicketMessage.replace(/{user}/g, `<@!${interaction.user.id}>`);
        let NewTicketMsgTitle = config.TicketButton2.TicketMessageTitle.replace(/{category}/g, `${config.TicketButton2.TicketName}`);
        var userIcon = interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });
        const deleteEmbed = new EmbedBuilder()
            if(config.TicketOpenEmbed.UserIconAuthor) deleteEmbed.setAuthor({ name: `${NewTicketMsgTitle}`, iconURL: `${userIcon}` })
            if(config.TicketOpenEmbed.UserIconAuthor === false) deleteEmbed.setAuthor({ name: `${NewTicketMsgTitle}` })
            if(!config.TicketOpenEmbed.EmbedColor) deleteEmbed.setColor(config.EmbedColors)
            if(config.TicketOpenEmbed.EmbedColor) deleteEmbed.setColor(config.TicketOpenEmbed.EmbedColor)
            if(config.TicketOpenEmbed.UserIconThumbnail) deleteEmbed.setThumbnail(userIcon)
            deleteEmbed.setDescription(`${NewTicketMsg}`)
            if(config.ClaimingSystem.Enabled) deleteEmbed.addFields([
                { name: `${config.Locale.ticketClaimedBy}`, value: `> ${config.Locale.ticketNotClaimed}` },
              ])
            if(config.TicketOpenEmbed.FooterMsg) deleteEmbed.setFooter({ text: `${config.TicketOpenEmbed.FooterMsg}` })
            if(config.TicketOpenEmbed.FooterMsg && config.TicketOpenEmbed.FooterIcon) deleteEmbed.setFooter({ text: `${config.TicketOpenEmbed.FooterMsg}`, iconURL: `${config.TicketOpenEmbed.FooterIcon}` })
            if(config.TicketOpenEmbed.Timestamp) deleteEmbed.setTimestamp()

            channel.send({ embeds: [deleteEmbed], components: [row1], fetchReply: true }).then(async (m2) => {
                let ticketOpened = new EmbedBuilder()
                .setTitle(config.Locale.ticketCreatedTitle)
                .setColor("Green")
                .setDescription(`${config.Locale.ticketCreatedMsg} <#${channel.id}>`)
                .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
                .setTimestamp();
                const row2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle('Link')
                            .setURL(`${m2.url}`) 
                            .setLabel(config.Locale.logsTicket)
                            .setEmoji(config.ButtonEmojis.ticketCreated))
                interaction.editReply({ embeds: [ticketOpened], components: [row2], ephemeral: true })
                if(config.TicketSettings.MentionAuthor) channel.send({ content: `<@!${interaction.user.id}>` }).then(msg => setTimeout(() => msg.delete().catch(e => {}), 500));
                if(config.TicketButton2.MentionSupportRoles) {
                    let supp = config.TicketButton2.SupportRoles.map((r) => {
                      let findSupport = interaction.guild.roles.cache.get(r)
                      
                      if(findSupport) return findSupport;
                    });
                    
                    channel.send(supp.join(" ")).then((msg) => setTimeout(() => msg.delete().catch(e => {}), 500));
                  }

                await client.tickets.ensure(`${channel.id}`, {
                    userID: interaction.user.id,
                    ticketType: config.TicketButton2.TicketName,
                    button: "TicketButton2",
                    msgID: m2.id,
                    claimed: false,
                    claimUser: "",
                    messages: 0,
                    lastMessageSent: Date.now(),
                    status: "Open",
                    closeUserID: ""
                  });

                  await m2.pin()

    // Set cooldown when user create ticket
    let ticketCooldown = config.TicketSettings.TicketCooldown * 1000
    if(config.TicketSettings.TicketCooldown > 0) Cooldown.set(interaction.user.id, Date.now())
    if(config.TicketSettings.TicketCooldown > 0) setTimeout(() => Cooldown.delete(interaction.user.id), ticketCooldown)
    //

                  client.emit('ticketCreate', interaction);

            })

    }

    //Button 3
    if (sMenu === 'button3') {
        await interaction.deferReply({ ephemeral: true });

        let cooldownEmbedLocale = config.Locale.cooldownEmbedMsg.replace(/{time}/g, `${utils.duration(config.TicketSettings.TicketCooldown * 1000 - (Date.now() - Cooldown.get(interaction.user.id)))}`);
        let cooldownEmbed = new EmbedBuilder()
        .setTitle(config.Locale.cooldownEmbedMsgTitle)
        .setColor("Red")
        .setDescription(cooldownEmbedLocale)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
        if(Cooldown.has(interaction.user.id)) return interaction.editReply({ embeds: [cooldownEmbed], ephemeral: true })

        let logMsg = `\n\n[${new Date().toLocaleString()}] [TICKET CREATION] Button: TicketButton3, User: ${interaction.user.tag}`;
        fs.appendFile("./logs.txt", logMsg, (e) => { 
          if(e) console.log(e);
        });

        let userBlacklisted = new EmbedBuilder()
        .setTitle(config.Locale.userBlacklistedTitle)
        .setColor("Red")
        .setDescription(config.Locale.userBlacklistedMsg)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
        if(client.blacklistedUsers.has(`${interaction.user.id}`) && client.blacklistedUsers.get(`${interaction.user.id}`, "blacklisted") === true) return interaction.editReply({ embeds: [userBlacklisted], ephemeral: true })

        let blRole = false
        let ticketRoleBlacklisted = new EmbedBuilder()
        .setTitle(config.Locale.RoleBlacklistedTitle)
        .setColor("Red")
        .setDescription(config.Locale.RoleBlacklistedMsg)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();

        for(let i = 0; i < config.TicketSettings.BlacklistedRoles.length; i++) {
            if(interaction.member.roles.cache.has(config.TicketSettings.BlacklistedRoles[i])) blRole = true;
          }
        if(blRole === true) return interaction.editReply({ embeds: [ticketRoleBlacklisted], ephemeral: true })

        if(config.TicketButton3.Enabled && !interaction.guild.channels.cache.get(config.TicketButton3.TicketCategoryID)) return console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton3.TicketCategoryID is not a valid category!`)

        let max = config.TicketSettings.MaxTickets
        let tNow = 0

        let maxTickets = config.Locale.AlreadyOpenMsg.replace(/{max}/g, `${max}`);
        let ticketAlreadyOpened = new EmbedBuilder()
        .setTitle(config.Locale.AlreadyOpenTitle)
        .setColor("Red")
        .setDescription(maxTickets)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();

        await interaction.guild.channels.cache.forEach(c => {
            if(client.tickets.has(c.id)) {
            let ticketData = client.tickets.get(`${c.id}`, "userID")
            if(ticketData && ticketData === interaction.user.id && client.tickets.get(c.id, 'status') !== "Closed") {
            tNow = tNow + 1
            }
        }
        });

        if(tNow >= max) return interaction.editReply({ embeds: [ticketAlreadyOpened], ephemeral: true }).then(msg => {
            tNow = 0
        }).catch(e => {});


        let tChannelName = config.TicketButton3.ChannelName.replace(/{username}/g, `${interaction.user.username}`).replace(/{total-tickets}/g, `${client.globalStats.get(`${interaction.guild.id}`, "totalTickets")}`).replace(/{user-tag}/g, `${interaction.user.tag}`).replace(/{user-id}/g, `${interaction.user.id}`)
 
        let permissionOverwriteArray = [{
            id: interaction.member.id,
            allow: ['SendMessages', 'ViewChannel', 'AttachFiles', 'EmbedLinks', 'ReadMessageHistory']
        },
        {
            id: interaction.guild.id,
            deny: ['SendMessages', 'ViewChannel']
        },
        {
            id: client.user.id,
            allow: ['SendMessages', 'ViewChannel']
        },
    ]
    
    await config.TicketButton3.SupportRoles.forEach(roleid => {
        role = interaction.guild.roles.cache.get(roleid);
        if(!role) return console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton3.SupportRoles is not a valid role!`)
        let tempArray = {
            id: role.id,
            allow: ['SendMessages', 'ViewChannel', 'AttachFiles', 'EmbedLinks', 'ReadMessageHistory']
        }
        permissionOverwriteArray.push(tempArray);
    })
    
            const channel = await interaction.guild.channels.create({
                name: tChannelName,
                type: 0,
                parent: config.TicketButton3.TicketCategoryID,
                topic: config.TicketSettings.ChannelTopic.replace(/{username}/g, `<@!${interaction.user.id}>`).replace(/{user-tag}/g, `${interaction.user.tag}`).replace(/{category}/g, `${config.TicketButton3.TicketName}`),
                permissionOverwrites: permissionOverwriteArray
            });

        const ticketDeleteButton = new ButtonBuilder()
        .setCustomId('closeTicket')
        .setLabel(config.Locale.CloseTicketButton)
        .setStyle(config.ButtonColors.closeTicket)
        .setEmoji(config.ButtonEmojis.closeTicket)

        const ticketClaimButton = new ButtonBuilder()
        .setCustomId('ticketclaim')
        .setLabel(config.Locale.claimTicketButton)
        .setEmoji(config.ButtonEmojis.ticketClaim)
        .setStyle(config.ButtonColors.ticketClaim)

        let row1 = ""
        if(config.ClaimingSystem.Enabled) row1 = new ActionRowBuilder().addComponents(ticketDeleteButton, ticketClaimButton);
        if(config.ClaimingSystem.Enabled === false) row1 = new ActionRowBuilder().addComponents(ticketDeleteButton);

        let NewTicketMsg = config.TicketButton3.TicketMessage.replace(/{user}/g, `<@!${interaction.user.id}>`);
        let NewTicketMsgTitle = config.TicketButton3.TicketMessageTitle.replace(/{category}/g, `${config.TicketButton3.TicketName}`);
        var userIcon = interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });
        const deleteEmbed = new EmbedBuilder()
            if(config.TicketOpenEmbed.UserIconAuthor) deleteEmbed.setAuthor({ name: `${NewTicketMsgTitle}`, iconURL: `${userIcon}` })
            if(config.TicketOpenEmbed.UserIconAuthor === false) deleteEmbed.setAuthor({ name: `${NewTicketMsgTitle}` })
            if(!config.TicketOpenEmbed.EmbedColor) deleteEmbed.setColor(config.EmbedColors)
            if(config.TicketOpenEmbed.EmbedColor) deleteEmbed.setColor(config.TicketOpenEmbed.EmbedColor)
            if(config.TicketOpenEmbed.UserIconThumbnail) deleteEmbed.setThumbnail(userIcon)
            deleteEmbed.setDescription(`${NewTicketMsg}`)
            if(config.ClaimingSystem.Enabled) deleteEmbed.addFields([
                { name: `${config.Locale.ticketClaimedBy}`, value: `> ${config.Locale.ticketNotClaimed}` },
              ])
            if(config.TicketOpenEmbed.FooterMsg) deleteEmbed.setFooter({ text: `${config.TicketOpenEmbed.FooterMsg}` })
            if(config.TicketOpenEmbed.FooterMsg && config.TicketOpenEmbed.FooterIcon) deleteEmbed.setFooter({ text: `${config.TicketOpenEmbed.FooterMsg}`, iconURL: `${config.TicketOpenEmbed.FooterIcon}` })
            if(config.TicketOpenEmbed.Timestamp) deleteEmbed.setTimestamp()

            channel.send({ embeds: [deleteEmbed], components: [row1], fetchReply: true }).then(async (m2) => {
                let ticketOpened = new EmbedBuilder()
                .setTitle(config.Locale.ticketCreatedTitle)
                .setColor("Green")
                .setDescription(`${config.Locale.ticketCreatedMsg} <#${channel.id}>`)
                .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
                .setTimestamp();
                const row2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle('Link')
                            .setURL(`${m2.url}`) 
                            .setLabel(config.Locale.logsTicket)
                            .setEmoji(config.ButtonEmojis.ticketCreated))
                interaction.editReply({ embeds: [ticketOpened], components: [row2], ephemeral: true })
                if(config.TicketSettings.MentionAuthor) channel.send({ content: `<@!${interaction.user.id}>` }).then(msg => setTimeout(() => msg.delete().catch(e => {}), 500));
                if(config.TicketButton3.MentionSupportRoles) {
                    let supp = config.TicketButton3.SupportRoles.map((r) => {
                      let findSupport = interaction.guild.roles.cache.get(r)
                      
                      if(findSupport) return findSupport;
                    });
                    
                    channel.send(supp.join(" ")).then((msg) => setTimeout(() => msg.delete().catch(e => {}), 500));
                  }

                await client.tickets.ensure(`${channel.id}`, {
                    userID: interaction.user.id,
                    ticketType: config.TicketButton3.TicketName,
                    button: "TicketButton3",
                    msgID: m2.id,
                    claimed: false,
                    claimUser: "",
                    messages: 0,
                    lastMessageSent: Date.now(),
                    status: "Open",
                    closeUserID: ""
                  });

                  await m2.pin()

    // Set cooldown when user create ticket
    let ticketCooldown = config.TicketSettings.TicketCooldown * 1000
    if(config.TicketSettings.TicketCooldown > 0) Cooldown.set(interaction.user.id, Date.now())
    if(config.TicketSettings.TicketCooldown > 0) setTimeout(() => Cooldown.delete(interaction.user.id), ticketCooldown)
    //

                  client.emit('ticketCreate', interaction);

            })
    }

    //Button 4
    if (sMenu === 'button4') {
        await interaction.deferReply({ ephemeral: true });

        let cooldownEmbedLocale = config.Locale.cooldownEmbedMsg.replace(/{time}/g, `${utils.duration(config.TicketSettings.TicketCooldown * 1000 - (Date.now() - Cooldown.get(interaction.user.id)))}`);
        let cooldownEmbed = new EmbedBuilder()
        .setTitle(config.Locale.cooldownEmbedMsgTitle)
        .setColor("Red")
        .setDescription(cooldownEmbedLocale)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
        if(Cooldown.has(interaction.user.id)) return interaction.editReply({ embeds: [cooldownEmbed], ephemeral: true })

        let logMsg = `\n\n[${new Date().toLocaleString()}] [TICKET CREATION] Button: TicketButton4, User: ${interaction.user.tag}`;
        fs.appendFile("./logs.txt", logMsg, (e) => { 
          if(e) console.log(e);
        });

        let userBlacklisted = new EmbedBuilder()
        .setTitle(config.Locale.userBlacklistedTitle)
        .setColor("Red")
        .setDescription(config.Locale.userBlacklistedMsg)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
        if(client.blacklistedUsers.has(`${interaction.user.id}`) && client.blacklistedUsers.get(`${interaction.user.id}`, "blacklisted") === true) return interaction.editReply({ embeds: [userBlacklisted], ephemeral: true })

        let blRole = false
        let ticketRoleBlacklisted = new EmbedBuilder()
        .setTitle(config.Locale.RoleBlacklistedTitle)
        .setColor("Red")
        .setDescription(config.Locale.RoleBlacklistedMsg)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();

        for(let i = 0; i < config.TicketSettings.BlacklistedRoles.length; i++) {
            if(interaction.member.roles.cache.has(config.TicketSettings.BlacklistedRoles[i])) blRole = true;
          }
        if(blRole === true) return interaction.editReply({ embeds: [ticketRoleBlacklisted], ephemeral: true })

        if(config.TicketButton4.Enabled && !interaction.guild.channels.cache.get(config.TicketButton4.TicketCategoryID)) return console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton4.TicketCategoryID is not a valid category!`)

        let max = config.TicketSettings.MaxTickets
        let tNow = 0

        let maxTickets = config.Locale.AlreadyOpenMsg.replace(/{max}/g, `${max}`);
        let ticketAlreadyOpened = new EmbedBuilder()
        .setTitle(config.Locale.AlreadyOpenTitle)
        .setColor("Red")
        .setDescription(maxTickets)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();

        await interaction.guild.channels.cache.forEach(c => {
            if(client.tickets.has(c.id)) {
            let ticketData = client.tickets.get(`${c.id}`, "userID")
            if(ticketData && ticketData === interaction.user.id && client.tickets.get(c.id, 'status') !== "Closed") {
            tNow = tNow + 1
            }
        }
        });

        if(tNow >= max) return interaction.editReply({ embeds: [ticketAlreadyOpened], ephemeral: true }).then(msg => {
            tNow = 0
        }).catch(e => {});


        let tChannelName = config.TicketButton4.ChannelName.replace(/{username}/g, `${interaction.user.username}`).replace(/{total-tickets}/g, `${client.globalStats.get(`${interaction.guild.id}`, "totalTickets")}`).replace(/{user-tag}/g, `${interaction.user.tag}`).replace(/{user-id}/g, `${interaction.user.id}`)
 
        let permissionOverwriteArray = [{
            id: interaction.member.id,
            allow: ['SendMessages', 'ViewChannel', 'AttachFiles', 'EmbedLinks', 'ReadMessageHistory']
        },
        {
            id: interaction.guild.id,
            deny: ['SendMessages', 'ViewChannel']
        },
        {
            id: client.user.id,
            allow: ['SendMessages', 'ViewChannel']
        },
    ]
    
    await config.TicketButton4.SupportRoles.forEach(roleid => {
        role = interaction.guild.roles.cache.get(roleid);
        if(!role) return console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton4.SupportRoles is not a valid role!`)
        let tempArray = {
            id: role.id,
            allow: ['SendMessages', 'ViewChannel', 'AttachFiles', 'EmbedLinks', 'ReadMessageHistory']
        }
        permissionOverwriteArray.push(tempArray);
    })
    
            const channel = await interaction.guild.channels.create({
                name: tChannelName,
                type: 0,
                parent: config.TicketButton4.TicketCategoryID,
                topic: config.TicketSettings.ChannelTopic.replace(/{username}/g, `<@!${interaction.user.id}>`).replace(/{user-tag}/g, `${interaction.user.tag}`).replace(/{category}/g, `${config.TicketButton4.TicketName}`),
                permissionOverwrites: permissionOverwriteArray
            });

        const ticketDeleteButton = new ButtonBuilder()
        .setCustomId('closeTicket')
        .setLabel(config.Locale.CloseTicketButton)
        .setStyle(config.ButtonColors.closeTicket)
        .setEmoji(config.ButtonEmojis.closeTicket)

        const ticketClaimButton = new ButtonBuilder()
        .setCustomId('ticketclaim')
        .setLabel(config.Locale.claimTicketButton)
        .setEmoji(config.ButtonEmojis.ticketClaim)
        .setStyle(config.ButtonColors.ticketClaim)

        let row1 = ""
        if(config.ClaimingSystem.Enabled) row1 = new ActionRowBuilder().addComponents(ticketDeleteButton, ticketClaimButton);
        if(config.ClaimingSystem.Enabled === false) row1 = new ActionRowBuilder().addComponents(ticketDeleteButton);

        let NewTicketMsg = config.TicketButton4.TicketMessage.replace(/{user}/g, `<@!${interaction.user.id}>`);
        let NewTicketMsgTitle = config.TicketButton4.TicketMessageTitle.replace(/{category}/g, `${config.TicketButton4.TicketName}`);
        var userIcon = interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });
        const deleteEmbed = new EmbedBuilder()
            if(config.TicketOpenEmbed.UserIconAuthor) deleteEmbed.setAuthor({ name: `${NewTicketMsgTitle}`, iconURL: `${userIcon}` })
            if(config.TicketOpenEmbed.UserIconAuthor === false) deleteEmbed.setAuthor({ name: `${NewTicketMsgTitle}` })
            if(!config.TicketOpenEmbed.EmbedColor) deleteEmbed.setColor(config.EmbedColors)
            if(config.TicketOpenEmbed.EmbedColor) deleteEmbed.setColor(config.TicketOpenEmbed.EmbedColor)
            if(config.TicketOpenEmbed.UserIconThumbnail) deleteEmbed.setThumbnail(userIcon)
            deleteEmbed.setDescription(`${NewTicketMsg}`)
            if(config.ClaimingSystem.Enabled) deleteEmbed.addFields([
                { name: `${config.Locale.ticketClaimedBy}`, value: `> ${config.Locale.ticketNotClaimed}` },
              ])
            if(config.TicketOpenEmbed.FooterMsg) deleteEmbed.setFooter({ text: `${config.TicketOpenEmbed.FooterMsg}` })
            if(config.TicketOpenEmbed.FooterMsg && config.TicketOpenEmbed.FooterIcon) deleteEmbed.setFooter({ text: `${config.TicketOpenEmbed.FooterMsg}`, iconURL: `${config.TicketOpenEmbed.FooterIcon}` })
            if(config.TicketOpenEmbed.Timestamp) deleteEmbed.setTimestamp()

            channel.send({ embeds: [deleteEmbed], components: [row1], fetchReply: true }).then(async (m2) => {
                let ticketOpened = new EmbedBuilder()
                .setTitle(config.Locale.ticketCreatedTitle)
                .setColor("Green")
                .setDescription(`${config.Locale.ticketCreatedMsg} <#${channel.id}>`)
                .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
                .setTimestamp();
                const row2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle('Link')
                            .setURL(`${m2.url}`) 
                            .setLabel(config.Locale.logsTicket)
                            .setEmoji(config.ButtonEmojis.ticketCreated))
                interaction.editReply({ embeds: [ticketOpened], components: [row2], ephemeral: true })
                if(config.TicketSettings.MentionAuthor) channel.send({ content: `<@!${interaction.user.id}>` }).then(msg => setTimeout(() => msg.delete().catch(e => {}), 500));
                if(config.TicketButton4.MentionSupportRoles) {
                    let supp = config.TicketButton4.SupportRoles.map((r) => {
                      let findSupport = interaction.guild.roles.cache.get(r)
                      
                      if(findSupport) return findSupport;
                    });
                    
                    channel.send(supp.join(" ")).then((msg) => setTimeout(() => msg.delete().catch(e => {}), 500));
                  }

                await client.tickets.ensure(`${channel.id}`, {
                    userID: interaction.user.id,
                    ticketType: config.TicketButton4.TicketName,
                    button: "TicketButton4",
                    msgID: m2.id,
                    claimed: false,
                    claimUser: "",
                    messages: 0,
                    lastMessageSent: Date.now(),
                    status: "Open",
                    closeUserID: ""
                  });

                  await m2.pin()

    // Set cooldown when user create ticket
    let ticketCooldown = config.TicketSettings.TicketCooldown * 1000
    if(config.TicketSettings.TicketCooldown > 0) Cooldown.set(interaction.user.id, Date.now())
    if(config.TicketSettings.TicketCooldown > 0) setTimeout(() => Cooldown.delete(interaction.user.id), ticketCooldown)
    //

                  client.emit('ticketCreate', interaction);

            })
    }

    //Button 5
    if (sMenu === 'button5') {
        await interaction.deferReply({ ephemeral: true });

        let cooldownEmbedLocale = config.Locale.cooldownEmbedMsg.replace(/{time}/g, `${utils.duration(config.TicketSettings.TicketCooldown * 1000 - (Date.now() - Cooldown.get(interaction.user.id)))}`);
        let cooldownEmbed = new EmbedBuilder()
        .setTitle(config.Locale.cooldownEmbedMsgTitle)
        .setColor("Red")
        .setDescription(cooldownEmbedLocale)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
        if(Cooldown.has(interaction.user.id)) return interaction.editReply({ embeds: [cooldownEmbed], ephemeral: true }) 

        let logMsg = `\n\n[${new Date().toLocaleString()}] [TICKET CREATION] Button: TicketButton5, User: ${interaction.user.tag}`;
        fs.appendFile("./logs.txt", logMsg, (e) => { 
          if(e) console.log(e);
        });

        let userBlacklisted = new EmbedBuilder()
        .setTitle(config.Locale.userBlacklistedTitle)
        .setColor("Red")
        .setDescription(config.Locale.userBlacklistedMsg)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
        if(client.blacklistedUsers.has(`${interaction.user.id}`) && client.blacklistedUsers.get(`${interaction.user.id}`, "blacklisted") === true) return interaction.editReply({ embeds: [userBlacklisted], ephemeral: true })

        let blRole = false
        let ticketRoleBlacklisted = new EmbedBuilder()
        .setTitle(config.Locale.RoleBlacklistedTitle)
        .setColor("Red")
        .setDescription(config.Locale.RoleBlacklistedMsg)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
        
        for(let i = 0; i < config.TicketSettings.BlacklistedRoles.length; i++) {
            if(interaction.member.roles.cache.has(config.TicketSettings.BlacklistedRoles[i])) blRole = true;
          }
        if(blRole === true) return interaction.editReply({ embeds: [ticketRoleBlacklisted], ephemeral: true })

        if(config.TicketButton5.Enabled && !interaction.guild.channels.cache.get(config.TicketButton5.TicketCategoryID)) return console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton5.TicketCategoryID is not a valid category!`)

        let max = config.TicketSettings.MaxTickets
        let tNow = 0

        let maxTickets = config.Locale.AlreadyOpenMsg.replace(/{max}/g, `${max}`);
        let ticketAlreadyOpened = new EmbedBuilder()
        .setTitle(config.Locale.AlreadyOpenTitle)
        .setColor("Red")
        .setDescription(maxTickets)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
        
        await interaction.guild.channels.cache.forEach(c => {
            if(client.tickets.has(c.id)) {
            let ticketData = client.tickets.get(`${c.id}`, "userID")
            if(ticketData && ticketData === interaction.user.id && client.tickets.get(c.id, 'status') !== "Closed") {
            tNow = tNow + 1
            }
        }
        });

        if(tNow >= max) return interaction.editReply({ embeds: [ticketAlreadyOpened], ephemeral: true }).then(msg => {
            tNow = 0
        }).catch(e => {});

        
        let tChannelName = config.TicketButton5.ChannelName.replace(/{username}/g, `${interaction.user.username}`).replace(/{total-tickets}/g, `${client.globalStats.get(`${interaction.guild.id}`, "totalTickets")}`).replace(/{user-tag}/g, `${interaction.user.tag}`).replace(/{user-id}/g, `${interaction.user.id}`)
 
        let permissionOverwriteArray = [{
            id: interaction.member.id,
            allow: ['SendMessages', 'ViewChannel', 'AttachFiles', 'EmbedLinks', 'ReadMessageHistory']
        },
        {
            id: interaction.guild.id,
            deny: ['SendMessages', 'ViewChannel']
        },
        {
            id: client.user.id,
            allow: ['SendMessages', 'ViewChannel']
        },
    ]
    
    await config.TicketButton5.SupportRoles.forEach(roleid => {
        role = interaction.guild.roles.cache.get(roleid);
        if(!role) return console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton5.SupportRoles is not a valid role!`)
        let tempArray = {
            id: role.id,
            allow: ['SendMessages', 'ViewChannel', 'AttachFiles', 'EmbedLinks', 'ReadMessageHistory']
        }
        permissionOverwriteArray.push(tempArray);
    })
    
            const channel = await interaction.guild.channels.create({
                name: tChannelName,
                type: 0,
                parent: config.TicketButton5.TicketCategoryID,
                topic: config.TicketSettings.ChannelTopic.replace(/{username}/g, `<@!${interaction.user.id}>`).replace(/{user-tag}/g, `${interaction.user.tag}`).replace(/{category}/g, `${config.TicketButton5.TicketName}`),
                permissionOverwrites: permissionOverwriteArray
            });

        const ticketDeleteButton = new ButtonBuilder()
        .setCustomId('closeTicket')
        .setLabel(config.Locale.CloseTicketButton)
        .setStyle(config.ButtonColors.closeTicket)
        .setEmoji(config.ButtonEmojis.closeTicket)

        const ticketClaimButton = new ButtonBuilder()
        .setCustomId('ticketclaim')
        .setLabel(config.Locale.claimTicketButton)
        .setEmoji(config.ButtonEmojis.ticketClaim)
        .setStyle(config.ButtonColors.ticketClaim)

        let row1 = ""
        if(config.ClaimingSystem.Enabled) row1 = new ActionRowBuilder().addComponents(ticketDeleteButton, ticketClaimButton);
        if(config.ClaimingSystem.Enabled === false) row1 = new ActionRowBuilder().addComponents(ticketDeleteButton);

        let NewTicketMsg = config.TicketButton5.TicketMessage.replace(/{user}/g, `<@!${interaction.user.id}>`);
        let NewTicketMsgTitle = config.TicketButton5.TicketMessageTitle.replace(/{category}/g, `${config.TicketButton5.TicketName}`);
        var userIcon = interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });
        const deleteEmbed = new EmbedBuilder()
            if(config.TicketOpenEmbed.UserIconAuthor) deleteEmbed.setAuthor({ name: `${NewTicketMsgTitle}`, iconURL: `${userIcon}` })
            if(config.TicketOpenEmbed.UserIconAuthor === false) deleteEmbed.setAuthor({ name: `${NewTicketMsgTitle}` })
            if(!config.TicketOpenEmbed.EmbedColor) deleteEmbed.setColor(config.EmbedColors)
            if(config.TicketOpenEmbed.EmbedColor) deleteEmbed.setColor(config.TicketOpenEmbed.EmbedColor)
            if(config.TicketOpenEmbed.UserIconThumbnail) deleteEmbed.setThumbnail(userIcon)
            deleteEmbed.setDescription(`${NewTicketMsg}`)
            if(config.ClaimingSystem.Enabled) deleteEmbed.addFields([
                { name: `${config.Locale.ticketClaimedBy}`, value: `> ${config.Locale.ticketNotClaimed}` },
              ])
            if(config.TicketOpenEmbed.FooterMsg) deleteEmbed.setFooter({ text: `${config.TicketOpenEmbed.FooterMsg}` })
            if(config.TicketOpenEmbed.FooterMsg && config.TicketOpenEmbed.FooterIcon) deleteEmbed.setFooter({ text: `${config.TicketOpenEmbed.FooterMsg}`, iconURL: `${config.TicketOpenEmbed.FooterIcon}` })
            if(config.TicketOpenEmbed.Timestamp) deleteEmbed.setTimestamp()

            channel.send({ embeds: [deleteEmbed], components: [row1], fetchReply: true }).then(async (m2) => {
                let ticketOpened = new EmbedBuilder()
                .setTitle(config.Locale.ticketCreatedTitle)
                .setColor("Green")
                .setDescription(`${config.Locale.ticketCreatedMsg} <#${channel.id}>`)
                .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
                .setTimestamp();
                const row2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle('Link')
                            .setURL(`${m2.url}`) 
                            .setLabel(config.Locale.logsTicket)
                            .setEmoji(config.ButtonEmojis.ticketCreated))
                interaction.editReply({ embeds: [ticketOpened], components: [row2], ephemeral: true })
                if(config.TicketSettings.MentionAuthor) channel.send({ content: `<@!${interaction.user.id}>` }).then(msg => setTimeout(() => msg.delete().catch(e => {}), 500));
                if(config.TicketButton5.MentionSupportRoles) {
                    let supp = config.TicketButton5.SupportRoles.map((r) => {
                      let findSupport = interaction.guild.roles.cache.get(r)
                      
                      if(findSupport) return findSupport;
                    });
                    
                    channel.send(supp.join(" ")).then((msg) => setTimeout(() => msg.delete().catch(e => {}), 500));
                  }


                await client.tickets.ensure(`${channel.id}`, {
                    userID: interaction.user.id,
                    ticketType: config.TicketButton5.TicketName,
                    button: "TicketButton5",
                    msgID: m2.id,
                    claimed: false,
                    claimUser: "",
                    messages: 0,
                    lastMessageSent: Date.now(),
                    status: "Open",
                    closeUserID: ""
                  });

                  await m2.pin()

                  client.emit('ticketCreate', interaction);

    // Set cooldown when user create ticket
    let ticketCooldown = config.TicketSettings.TicketCooldown * 1000
    if(config.TicketSettings.TicketCooldown > 0) Cooldown.set(interaction.user.id, Date.now())
    if(config.TicketSettings.TicketCooldown > 0) setTimeout(() => Cooldown.delete(interaction.user.id), ticketCooldown)
    //

    })
}


    //Button 6
    if (sMenu === 'button6') {
        await interaction.deferReply({ ephemeral: true });

        let cooldownEmbedLocale = config.Locale.cooldownEmbedMsg.replace(/{time}/g, `${utils.duration(config.TicketSettings.TicketCooldown * 1000 - (Date.now() - Cooldown.get(interaction.user.id)))}`);
        let cooldownEmbed = new EmbedBuilder()
        .setTitle(config.Locale.cooldownEmbedMsgTitle)
        .setColor("Red")
        .setDescription(cooldownEmbedLocale)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
        if(Cooldown.has(interaction.user.id)) return interaction.editReply({ embeds: [cooldownEmbed], ephemeral: true }) 

        let logMsg = `\n\n[${new Date().toLocaleString()}] [TICKET CREATION] Button: TicketButton6, User: ${interaction.user.tag}`;
        fs.appendFile("./logs.txt", logMsg, (e) => { 
          if(e) console.log(e);
        });

        let userBlacklisted = new EmbedBuilder()
        .setTitle(config.Locale.userBlacklistedTitle)
        .setColor("Red")
        .setDescription(config.Locale.userBlacklistedMsg)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
        if(client.blacklistedUsers.has(`${interaction.user.id}`) && client.blacklistedUsers.get(`${interaction.user.id}`, "blacklisted") === true) return interaction.editReply({ embeds: [userBlacklisted], ephemeral: true })

        let blRole = false
        let ticketRoleBlacklisted = new EmbedBuilder()
        .setTitle(config.Locale.RoleBlacklistedTitle)
        .setColor("Red")
        .setDescription(config.Locale.RoleBlacklistedMsg)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
        
        for(let i = 0; i < config.TicketSettings.BlacklistedRoles.length; i++) {
            if(interaction.member.roles.cache.has(config.TicketSettings.BlacklistedRoles[i])) blRole = true;
          }
        if(blRole === true) return interaction.editReply({ embeds: [ticketRoleBlacklisted], ephemeral: true })

        if(config.TicketButton6.Enabled && !interaction.guild.channels.cache.get(config.TicketButton6.TicketCategoryID)) return console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton6.TicketCategoryID is not a valid category!`)

        let max = config.TicketSettings.MaxTickets
        let tNow = 0

        let maxTickets = config.Locale.AlreadyOpenMsg.replace(/{max}/g, `${max}`);
        let ticketAlreadyOpened = new EmbedBuilder()
        .setTitle(config.Locale.AlreadyOpenTitle)
        .setColor("Red")
        .setDescription(maxTickets)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
        
        await interaction.guild.channels.cache.forEach(c => {
            if(client.tickets.has(c.id)) {
            let ticketData = client.tickets.get(`${c.id}`, "userID")
            if(ticketData && ticketData === interaction.user.id && client.tickets.get(c.id, 'status') !== "Closed") {
            tNow = tNow + 1
            }
        }
        });

        if(tNow >= max) return interaction.editReply({ embeds: [ticketAlreadyOpened], ephemeral: true }).then(msg => {
            tNow = 0
        }).catch(e => {});

        
        let tChannelName = config.TicketButton6.ChannelName.replace(/{username}/g, `${interaction.user.username}`).replace(/{total-tickets}/g, `${client.globalStats.get(`${interaction.guild.id}`, "totalTickets")}`).replace(/{user-tag}/g, `${interaction.user.tag}`).replace(/{user-id}/g, `${interaction.user.id}`)
 
        let permissionOverwriteArray = [{
            id: interaction.member.id,
            allow: ['SendMessages', 'ViewChannel', 'AttachFiles', 'EmbedLinks', 'ReadMessageHistory']
        },
        {
            id: interaction.guild.id,
            deny: ['SendMessages', 'ViewChannel']
        },
        {
            id: client.user.id,
            allow: ['SendMessages', 'ViewChannel']
        },
    ]
    
    await config.TicketButton6.SupportRoles.forEach(roleid => {
        role = interaction.guild.roles.cache.get(roleid);
        if(!role) return console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton6.SupportRoles is not a valid role!`)
        let tempArray = {
            id: role.id,
            allow: ['SendMessages', 'ViewChannel', 'AttachFiles', 'EmbedLinks', 'ReadMessageHistory']
        }
        permissionOverwriteArray.push(tempArray);
    })
    
            const channel = await interaction.guild.channels.create({
                name: tChannelName,
                type: 0,
                parent: config.TicketButton6.TicketCategoryID,
                topic: config.TicketSettings.ChannelTopic.replace(/{username}/g, `<@!${interaction.user.id}>`).replace(/{user-tag}/g, `${interaction.user.tag}`).replace(/{category}/g, `${config.TicketButton6.TicketName}`),
                permissionOverwrites: permissionOverwriteArray
            });

        const ticketDeleteButton = new ButtonBuilder()
        .setCustomId('closeTicket')
        .setLabel(config.Locale.CloseTicketButton)
        .setStyle(config.ButtonColors.closeTicket)
        .setEmoji(config.ButtonEmojis.closeTicket)

        const ticketClaimButton = new ButtonBuilder()
        .setCustomId('ticketclaim')
        .setLabel(config.Locale.claimTicketButton)
        .setEmoji(config.ButtonEmojis.ticketClaim)
        .setStyle(config.ButtonColors.ticketClaim)

        let row1 = ""
        if(config.ClaimingSystem.Enabled) row1 = new ActionRowBuilder().addComponents(ticketDeleteButton, ticketClaimButton);
        if(config.ClaimingSystem.Enabled === false) row1 = new ActionRowBuilder().addComponents(ticketDeleteButton);

        let NewTicketMsg = config.TicketButton6.TicketMessage.replace(/{user}/g, `<@!${interaction.user.id}>`);
        let NewTicketMsgTitle = config.TicketButton6.TicketMessageTitle.replace(/{category}/g, `${config.TicketButton6.TicketName}`);
        var userIcon = interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });
        const deleteEmbed = new EmbedBuilder()
            if(config.TicketOpenEmbed.UserIconAuthor) deleteEmbed.setAuthor({ name: `${NewTicketMsgTitle}`, iconURL: `${userIcon}` })
            if(config.TicketOpenEmbed.UserIconAuthor === false) deleteEmbed.setAuthor({ name: `${NewTicketMsgTitle}` })
            if(!config.TicketOpenEmbed.EmbedColor) deleteEmbed.setColor(config.EmbedColors)
            if(config.TicketOpenEmbed.EmbedColor) deleteEmbed.setColor(config.TicketOpenEmbed.EmbedColor)
            if(config.TicketOpenEmbed.UserIconThumbnail) deleteEmbed.setThumbnail(userIcon)
            deleteEmbed.setDescription(`${NewTicketMsg}`)
            if(config.ClaimingSystem.Enabled) deleteEmbed.addFields([
                { name: `${config.Locale.ticketClaimedBy}`, value: `> ${config.Locale.ticketNotClaimed}` },
              ])
            if(config.TicketOpenEmbed.FooterMsg) deleteEmbed.setFooter({ text: `${config.TicketOpenEmbed.FooterMsg}` })
            if(config.TicketOpenEmbed.FooterMsg && config.TicketOpenEmbed.FooterIcon) deleteEmbed.setFooter({ text: `${config.TicketOpenEmbed.FooterMsg}`, iconURL: `${config.TicketOpenEmbed.FooterIcon}` })
            if(config.TicketOpenEmbed.Timestamp) deleteEmbed.setTimestamp()

            channel.send({ embeds: [deleteEmbed], components: [row1], fetchReply: true }).then(async (m2) => {
                let ticketOpened = new EmbedBuilder()
                .setTitle(config.Locale.ticketCreatedTitle)
                .setColor("Green")
                .setDescription(`${config.Locale.ticketCreatedMsg} <#${channel.id}>`)
                .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
                .setTimestamp();
                const row2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle('Link')
                            .setURL(`${m2.url}`) 
                            .setLabel(config.Locale.logsTicket)
                            .setEmoji(config.ButtonEmojis.ticketCreated))
                interaction.editReply({ embeds: [ticketOpened], components: [row2], ephemeral: true })
                if(config.TicketSettings.MentionAuthor) channel.send({ content: `<@!${interaction.user.id}>` }).then(msg => setTimeout(() => msg.delete().catch(e => {}), 500));
                if(config.TicketButton6.MentionSupportRoles) {
                    let supp = config.TicketButton6.SupportRoles.map((r) => {
                      let findSupport = interaction.guild.roles.cache.get(r)
                      
                      if(findSupport) return findSupport;
                    });
                    
                    channel.send(supp.join(" ")).then((msg) => setTimeout(() => msg.delete().catch(e => {}), 500));
                  }


                await client.tickets.ensure(`${channel.id}`, {
                    userID: interaction.user.id,
                    ticketType: config.TicketButton6.TicketName,
                    button: "TicketButton6",
                    msgID: m2.id,
                    claimed: false,
                    claimUser: "",
                    messages: 0,
                    lastMessageSent: Date.now(),
                    status: "Open",
                    closeUserID: ""
                  });

                  await m2.pin()

                  client.emit('ticketCreate', interaction);

    // Set cooldown when user create ticket
    let ticketCooldown = config.TicketSettings.TicketCooldown * 1000
    if(config.TicketSettings.TicketCooldown > 0) Cooldown.set(interaction.user.id, Date.now())
    if(config.TicketSettings.TicketCooldown > 0) setTimeout(() => Cooldown.delete(interaction.user.id), ticketCooldown)
    //

    })
}


    //Button 7
    if (sMenu === 'button7') {
        await interaction.deferReply({ ephemeral: true });

        let cooldownEmbedLocale = config.Locale.cooldownEmbedMsg.replace(/{time}/g, `${utils.duration(config.TicketSettings.TicketCooldown * 1000 - (Date.now() - Cooldown.get(interaction.user.id)))}`);
        let cooldownEmbed = new EmbedBuilder()
        .setTitle(config.Locale.cooldownEmbedMsgTitle)
        .setColor("Red")
        .setDescription(cooldownEmbedLocale)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
        if(Cooldown.has(interaction.user.id)) return interaction.editReply({ embeds: [cooldownEmbed], ephemeral: true }) 

        let logMsg = `\n\n[${new Date().toLocaleString()}] [TICKET CREATION] Button: TicketButton7, User: ${interaction.user.tag}`;
        fs.appendFile("./logs.txt", logMsg, (e) => { 
          if(e) console.log(e);
        });

        let userBlacklisted = new EmbedBuilder()
        .setTitle(config.Locale.userBlacklistedTitle)
        .setColor("Red")
        .setDescription(config.Locale.userBlacklistedMsg)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
        if(client.blacklistedUsers.has(`${interaction.user.id}`) && client.blacklistedUsers.get(`${interaction.user.id}`, "blacklisted") === true) return interaction.editReply({ embeds: [userBlacklisted], ephemeral: true })

        let blRole = false
        let ticketRoleBlacklisted = new EmbedBuilder()
        .setTitle(config.Locale.RoleBlacklistedTitle)
        .setColor("Red")
        .setDescription(config.Locale.RoleBlacklistedMsg)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
        
        for(let i = 0; i < config.TicketSettings.BlacklistedRoles.length; i++) {
            if(interaction.member.roles.cache.has(config.TicketSettings.BlacklistedRoles[i])) blRole = true;
          }
        if(blRole === true) return interaction.editReply({ embeds: [ticketRoleBlacklisted], ephemeral: true })

        if(config.TicketButton7.Enabled && !interaction.guild.channels.cache.get(config.TicketButton7.TicketCategoryID)) return console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton7.TicketCategoryID is not a valid category!`)

        let max = config.TicketSettings.MaxTickets
        let tNow = 0

        let maxTickets = config.Locale.AlreadyOpenMsg.replace(/{max}/g, `${max}`);
        let ticketAlreadyOpened = new EmbedBuilder()
        .setTitle(config.Locale.AlreadyOpenTitle)
        .setColor("Red")
        .setDescription(maxTickets)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
        
        await interaction.guild.channels.cache.forEach(c => {
            if(client.tickets.has(c.id)) {
            let ticketData = client.tickets.get(`${c.id}`, "userID")
            if(ticketData && ticketData === interaction.user.id && client.tickets.get(c.id, 'status') !== "Closed") {
            tNow = tNow + 1
            }
        }
        });

        if(tNow >= max) return interaction.editReply({ embeds: [ticketAlreadyOpened], ephemeral: true }).then(msg => {
            tNow = 0
        }).catch(e => {});

        
        let tChannelName = config.TicketButton7.ChannelName.replace(/{username}/g, `${interaction.user.username}`).replace(/{total-tickets}/g, `${client.globalStats.get(`${interaction.guild.id}`, "totalTickets")}`).replace(/{user-tag}/g, `${interaction.user.tag}`).replace(/{user-id}/g, `${interaction.user.id}`)
 
        let permissionOverwriteArray = [{
            id: interaction.member.id,
            allow: ['SendMessages', 'ViewChannel', 'AttachFiles', 'EmbedLinks', 'ReadMessageHistory']
        },
        {
            id: interaction.guild.id,
            deny: ['SendMessages', 'ViewChannel']
        },
        {
            id: client.user.id,
            allow: ['SendMessages', 'ViewChannel']
        },
    ]
    
    await config.TicketButton7.SupportRoles.forEach(roleid => {
        role = interaction.guild.roles.cache.get(roleid);
        if(!role) return console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton7.SupportRoles is not a valid role!`)
        let tempArray = {
            id: role.id,
            allow: ['SendMessages', 'ViewChannel', 'AttachFiles', 'EmbedLinks', 'ReadMessageHistory']
        }
        permissionOverwriteArray.push(tempArray);
    })
    
            const channel = await interaction.guild.channels.create({
                name: tChannelName,
                type: 0,
                parent: config.TicketButton7.TicketCategoryID,
                topic: config.TicketSettings.ChannelTopic.replace(/{username}/g, `<@!${interaction.user.id}>`).replace(/{user-tag}/g, `${interaction.user.tag}`).replace(/{category}/g, `${config.TicketButton7.TicketName}`),
                permissionOverwrites: permissionOverwriteArray
            });

        const ticketDeleteButton = new ButtonBuilder()
        .setCustomId('closeTicket')
        .setLabel(config.Locale.CloseTicketButton)
        .setStyle(config.ButtonColors.closeTicket)
        .setEmoji(config.ButtonEmojis.closeTicket)

        const ticketClaimButton = new ButtonBuilder()
        .setCustomId('ticketclaim')
        .setLabel(config.Locale.claimTicketButton)
        .setEmoji(config.ButtonEmojis.ticketClaim)
        .setStyle(config.ButtonColors.ticketClaim)

        let row1 = ""
        if(config.ClaimingSystem.Enabled) row1 = new ActionRowBuilder().addComponents(ticketDeleteButton, ticketClaimButton);
        if(config.ClaimingSystem.Enabled === false) row1 = new ActionRowBuilder().addComponents(ticketDeleteButton);

        let NewTicketMsg = config.TicketButton7.TicketMessage.replace(/{user}/g, `<@!${interaction.user.id}>`);
        let NewTicketMsgTitle = config.TicketButton7.TicketMessageTitle.replace(/{category}/g, `${config.TicketButton7.TicketName}`);
        var userIcon = interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });
        const deleteEmbed = new EmbedBuilder()
            if(config.TicketOpenEmbed.UserIconAuthor) deleteEmbed.setAuthor({ name: `${NewTicketMsgTitle}`, iconURL: `${userIcon}` })
            if(config.TicketOpenEmbed.UserIconAuthor === false) deleteEmbed.setAuthor({ name: `${NewTicketMsgTitle}` })
            if(!config.TicketOpenEmbed.EmbedColor) deleteEmbed.setColor(config.EmbedColors)
            if(config.TicketOpenEmbed.EmbedColor) deleteEmbed.setColor(config.TicketOpenEmbed.EmbedColor)
            if(config.TicketOpenEmbed.UserIconThumbnail) deleteEmbed.setThumbnail(userIcon)
            deleteEmbed.setDescription(`${NewTicketMsg}`)
            if(config.ClaimingSystem.Enabled) deleteEmbed.addFields([
                { name: `${config.Locale.ticketClaimedBy}`, value: `> ${config.Locale.ticketNotClaimed}` },
              ])
            if(config.TicketOpenEmbed.FooterMsg) deleteEmbed.setFooter({ text: `${config.TicketOpenEmbed.FooterMsg}` })
            if(config.TicketOpenEmbed.FooterMsg && config.TicketOpenEmbed.FooterIcon) deleteEmbed.setFooter({ text: `${config.TicketOpenEmbed.FooterMsg}`, iconURL: `${config.TicketOpenEmbed.FooterIcon}` })
            if(config.TicketOpenEmbed.Timestamp) deleteEmbed.setTimestamp()

            channel.send({ embeds: [deleteEmbed], components: [row1], fetchReply: true }).then(async (m2) => {
                let ticketOpened = new EmbedBuilder()
                .setTitle(config.Locale.ticketCreatedTitle)
                .setColor("Green")
                .setDescription(`${config.Locale.ticketCreatedMsg} <#${channel.id}>`)
                .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
                .setTimestamp();
                const row2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle('Link')
                            .setURL(`${m2.url}`) 
                            .setLabel(config.Locale.logsTicket)
                            .setEmoji(config.ButtonEmojis.ticketCreated))
                interaction.editReply({ embeds: [ticketOpened], components: [row2], ephemeral: true })
                if(config.TicketSettings.MentionAuthor) channel.send({ content: `<@!${interaction.user.id}>` }).then(msg => setTimeout(() => msg.delete().catch(e => {}), 500));
                if(config.TicketButton7.MentionSupportRoles) {
                    let supp = config.TicketButton7.SupportRoles.map((r) => {
                      let findSupport = interaction.guild.roles.cache.get(r)
                      
                      if(findSupport) return findSupport;
                    });
                    
                    channel.send(supp.join(" ")).then((msg) => setTimeout(() => msg.delete().catch(e => {}), 500));
                  }


                await client.tickets.ensure(`${channel.id}`, {
                    userID: interaction.user.id,
                    ticketType: config.TicketButton7.TicketName,
                    button: "TicketButton7",
                    msgID: m2.id,
                    claimed: false,
                    claimUser: "",
                    messages: 0,
                    lastMessageSent: Date.now(),
                    status: "Open",
                    closeUserID: ""
                  });

                  await m2.pin()

                  client.emit('ticketCreate', interaction);

    // Set cooldown when user create ticket
    let ticketCooldown = config.TicketSettings.TicketCooldown * 1000
    if(config.TicketSettings.TicketCooldown > 0) Cooldown.set(interaction.user.id, Date.now())
    if(config.TicketSettings.TicketCooldown > 0) setTimeout(() => Cooldown.delete(interaction.user.id), ticketCooldown)
    //

    })
}


    //Button 8
    if (sMenu === 'button8') {
        await interaction.deferReply({ ephemeral: true });

        let cooldownEmbedLocale = config.Locale.cooldownEmbedMsg.replace(/{time}/g, `${utils.duration(config.TicketSettings.TicketCooldown * 1000 - (Date.now() - Cooldown.get(interaction.user.id)))}`);
        let cooldownEmbed = new EmbedBuilder()
        .setTitle(config.Locale.cooldownEmbedMsgTitle)
        .setColor("Red")
        .setDescription(cooldownEmbedLocale)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
        if(Cooldown.has(interaction.user.id)) return interaction.editReply({ embeds: [cooldownEmbed], ephemeral: true }) 

        let logMsg = `\n\n[${new Date().toLocaleString()}] [TICKET CREATION] Button: TicketButton8, User: ${interaction.user.tag}`;
        fs.appendFile("./logs.txt", logMsg, (e) => { 
          if(e) console.log(e);
        });

        let userBlacklisted = new EmbedBuilder()
        .setTitle(config.Locale.userBlacklistedTitle)
        .setColor("Red")
        .setDescription(config.Locale.userBlacklistedMsg)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
        if(client.blacklistedUsers.has(`${interaction.user.id}`) && client.blacklistedUsers.get(`${interaction.user.id}`, "blacklisted") === true) return interaction.editReply({ embeds: [userBlacklisted], ephemeral: true })

        let blRole = false
        let ticketRoleBlacklisted = new EmbedBuilder()
        .setTitle(config.Locale.RoleBlacklistedTitle)
        .setColor("Red")
        .setDescription(config.Locale.RoleBlacklistedMsg)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
        
        for(let i = 0; i < config.TicketSettings.BlacklistedRoles.length; i++) {
            if(interaction.member.roles.cache.has(config.TicketSettings.BlacklistedRoles[i])) blRole = true;
          }
        if(blRole === true) return interaction.editReply({ embeds: [ticketRoleBlacklisted], ephemeral: true })

        if(config.TicketButton8.Enabled && !interaction.guild.channels.cache.get(config.TicketButton8.TicketCategoryID)) return console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton8.TicketCategoryID is not a valid category!`)

        let max = config.TicketSettings.MaxTickets
        let tNow = 0

        let maxTickets = config.Locale.AlreadyOpenMsg.replace(/{max}/g, `${max}`);
        let ticketAlreadyOpened = new EmbedBuilder()
        .setTitle(config.Locale.AlreadyOpenTitle)
        .setColor("Red")
        .setDescription(maxTickets)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
        
        await interaction.guild.channels.cache.forEach(c => {
            if(client.tickets.has(c.id)) {
            let ticketData = client.tickets.get(`${c.id}`, "userID")
            if(ticketData && ticketData === interaction.user.id && client.tickets.get(c.id, 'status') !== "Closed") {
            tNow = tNow + 1
            }
        }
        });

        if(tNow >= max) return interaction.editReply({ embeds: [ticketAlreadyOpened], ephemeral: true }).then(msg => {
            tNow = 0
        }).catch(e => {});

        
        let tChannelName = config.TicketButton8.ChannelName.replace(/{username}/g, `${interaction.user.username}`).replace(/{total-tickets}/g, `${client.globalStats.get(`${interaction.guild.id}`, "totalTickets")}`).replace(/{user-tag}/g, `${interaction.user.tag}`).replace(/{user-id}/g, `${interaction.user.id}`)
 
        let permissionOverwriteArray = [{
            id: interaction.member.id,
            allow: ['SendMessages', 'ViewChannel', 'AttachFiles', 'EmbedLinks', 'ReadMessageHistory']
        },
        {
            id: interaction.guild.id,
            deny: ['SendMessages', 'ViewChannel']
        },
        {
            id: client.user.id,
            allow: ['SendMessages', 'ViewChannel']
        },
    ]
    
    await config.TicketButton8.SupportRoles.forEach(roleid => {
        role = interaction.guild.roles.cache.get(roleid);
        if(!role) return console.log('\x1b[31m%s\x1b[0m', `[WARNING] TicketButton8.SupportRoles is not a valid role!`)
        let tempArray = {
            id: role.id,
            allow: ['SendMessages', 'ViewChannel', 'AttachFiles', 'EmbedLinks', 'ReadMessageHistory']
        }
        permissionOverwriteArray.push(tempArray);
    })
    
            const channel = await interaction.guild.channels.create({
                name: tChannelName,
                type: 0,
                parent: config.TicketButton8.TicketCategoryID,
                topic: config.TicketSettings.ChannelTopic.replace(/{username}/g, `<@!${interaction.user.id}>`).replace(/{user-tag}/g, `${interaction.user.tag}`).replace(/{category}/g, `${config.TicketButton8.TicketName}`),
                permissionOverwrites: permissionOverwriteArray
            });

        const ticketDeleteButton = new ButtonBuilder()
        .setCustomId('closeTicket')
        .setLabel(config.Locale.CloseTicketButton)
        .setStyle(config.ButtonColors.closeTicket)
        .setEmoji(config.ButtonEmojis.closeTicket)

        const ticketClaimButton = new ButtonBuilder()
        .setCustomId('ticketclaim')
        .setLabel(config.Locale.claimTicketButton)
        .setEmoji(config.ButtonEmojis.ticketClaim)
        .setStyle(config.ButtonColors.ticketClaim)

        let row1 = ""
        if(config.ClaimingSystem.Enabled) row1 = new ActionRowBuilder().addComponents(ticketDeleteButton, ticketClaimButton);
        if(config.ClaimingSystem.Enabled === false) row1 = new ActionRowBuilder().addComponents(ticketDeleteButton);

        let NewTicketMsg = config.TicketButton8.TicketMessage.replace(/{user}/g, `<@!${interaction.user.id}>`);
        let NewTicketMsgTitle = config.TicketButton8.TicketMessageTitle.replace(/{category}/g, `${config.TicketButton8.TicketName}`);
        var userIcon = interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });
        const deleteEmbed = new EmbedBuilder()
            if(config.TicketOpenEmbed.UserIconAuthor) deleteEmbed.setAuthor({ name: `${NewTicketMsgTitle}`, iconURL: `${userIcon}` })
            if(config.TicketOpenEmbed.UserIconAuthor === false) deleteEmbed.setAuthor({ name: `${NewTicketMsgTitle}` })
            if(!config.TicketOpenEmbed.EmbedColor) deleteEmbed.setColor(config.EmbedColors)
            if(config.TicketOpenEmbed.EmbedColor) deleteEmbed.setColor(config.TicketOpenEmbed.EmbedColor)
            if(config.TicketOpenEmbed.UserIconThumbnail) deleteEmbed.setThumbnail(userIcon)
            deleteEmbed.setDescription(`${NewTicketMsg}`)
            if(config.ClaimingSystem.Enabled) deleteEmbed.addFields([
                { name: `${config.Locale.ticketClaimedBy}`, value: `> ${config.Locale.ticketNotClaimed}` },
              ])
            if(config.TicketOpenEmbed.FooterMsg) deleteEmbed.setFooter({ text: `${config.TicketOpenEmbed.FooterMsg}` })
            if(config.TicketOpenEmbed.FooterMsg && config.TicketOpenEmbed.FooterIcon) deleteEmbed.setFooter({ text: `${config.TicketOpenEmbed.FooterMsg}`, iconURL: `${config.TicketOpenEmbed.FooterIcon}` })
            if(config.TicketOpenEmbed.Timestamp) deleteEmbed.setTimestamp()

            channel.send({ embeds: [deleteEmbed], components: [row1], fetchReply: true }).then(async (m2) => {
                let ticketOpened = new EmbedBuilder()
                .setTitle(config.Locale.ticketCreatedTitle)
                .setColor("Green")
                .setDescription(`${config.Locale.ticketCreatedMsg} <#${channel.id}>`)
                .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
                .setTimestamp();
                const row2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle('Link')
                            .setURL(`${m2.url}`) 
                            .setLabel(config.Locale.logsTicket)
                            .setEmoji(config.ButtonEmojis.ticketCreated))
                interaction.editReply({ embeds: [ticketOpened], components: [row2], ephemeral: true })
                if(config.TicketSettings.MentionAuthor) channel.send({ content: `<@!${interaction.user.id}>` }).then(msg => setTimeout(() => msg.delete().catch(e => {}), 500));
                if(config.TicketButton8.MentionSupportRoles) {
                    let supp = config.TicketButton8.SupportRoles.map((r) => {
                      let findSupport = interaction.guild.roles.cache.get(r)
                      
                      if(findSupport) return findSupport;
                    });
                    
                    channel.send(supp.join(" ")).then((msg) => setTimeout(() => msg.delete().catch(e => {}), 500));
                  }


                await client.tickets.ensure(`${channel.id}`, {
                    userID: interaction.user.id,
                    ticketType: config.TicketButton8.TicketName,
                    button: "TicketButton8",
                    msgID: m2.id,
                    claimed: false,
                    claimUser: "",
                    messages: 0,
                    lastMessageSent: Date.now(),
                    status: "Open",
                    closeUserID: "",
                  });

                  await m2.pin()

                  client.emit('ticketCreate', interaction);

    // Set cooldown when user create ticket
    let ticketCooldown = config.TicketSettings.TicketCooldown * 1000
    if(config.TicketSettings.TicketCooldown > 0) Cooldown.set(interaction.user.id, Date.now())
    if(config.TicketSettings.TicketCooldown > 0) setTimeout(() => Cooldown.delete(interaction.user.id), ticketCooldown)
    //

    })
}


    //Ticket Close Button
    if (interaction.customId === 'closeTicket') {

        let supportRole = false
        let tButton = client.tickets.get(`${interaction.channel.id}`, "button");
        if(tButton === "TicketButton1") {
          for(let i = 0; i < config.TicketButton1.SupportRoles.length; i++) {
              if(interaction.member.roles.cache.has(config.TicketButton1.SupportRoles[i])) supportRole = true;
          }
      } else if(tButton === "TicketButton2") {
          for(let i = 0; i < config.TicketButton2.SupportRoles.length; i++) {
              if(interaction.member.roles.cache.has(config.TicketButton2.SupportRoles[i])) supportRole = true;
            }
      } else if(tButton === "TicketButton3") {
          for(let i = 0; i < config.TicketButton3.SupportRoles.length; i++) {
              if(interaction.member.roles.cache.has(config.TicketButton3.SupportRoles[i])) supportRole = true;
            }
      } else if(tButton === "TicketButton4") {
          for(let i = 0; i < config.TicketButton4.SupportRoles.length; i++) {
              if(interaction.member.roles.cache.has(config.TicketButton4.SupportRoles[i])) supportRole = true;
            }
      } else if(tButton === "TicketButton5") {
          for(let i = 0; i < config.TicketButton5.SupportRoles.length; i++) {
              if(interaction.member.roles.cache.has(config.TicketButton5.SupportRoles[i])) supportRole = true;
            }
      } else if(tButton === "TicketButton6") {
          for(let i = 0; i < config.TicketButton6.SupportRoles.length; i++) {
              if(interaction.member.roles.cache.has(config.TicketButton6.SupportRoles[i])) supportRole = true;
            }
      } else if(tButton === "TicketButton7") {
          for(let i = 0; i < config.TicketButton7.SupportRoles.length; i++) {
              if(interaction.member.roles.cache.has(config.TicketButton7.SupportRoles[i])) supportRole = true;
            }
      } else if(tButton === "TicketButton8") {
          for(let i = 0; i < config.TicketButton8.SupportRoles.length; i++) {
              if(interaction.member.roles.cache.has(config.TicketButton8.SupportRoles[i])) supportRole = true;
            }
      }
        if(config.TicketSettings.RestrictTicketClose && supportRole === false) return interaction.reply({ content: config.Locale.restrictTicketClose, ephemeral: true })

        await client.tickets.set(interaction.channel.id, interaction.user.id, "closeUserID");
        await client.emit('ticketClose', interaction);
    }



    if(interaction.customId === 'ticketclaim') {
        await interaction.deferReply({ ephemeral: true });

        let logMsg = `\n\n[${new Date().toLocaleString()}] [TICKET CLAIM] User: ${interaction.user.tag}`;
        fs.appendFile("./logs.txt", logMsg, (e) => { 
          if(e) console.log(e);
        });

        
        if(config.ClaimingSystem.Enabled === false) return interaction.editReply({ content: "Ticket claiming is disabled in the config!", ephemeral: true })
        let supportRole = false
        let tButton = client.tickets.get(`${interaction.channel.id}`, "button");

    if(tButton === "TicketButton1") {
        for(let i = 0; i < config.TicketButton1.SupportRoles.length; i++) {
            if(interaction.member.roles.cache.has(config.TicketButton1.SupportRoles[i])) supportRole = true;
        }
    } else if(tButton === "TicketButton2") {
        for(let i = 0; i < config.TicketButton2.SupportRoles.length; i++) {
            if(interaction.member.roles.cache.has(config.TicketButton2.SupportRoles[i])) supportRole = true;
          }
    } else if(tButton === "TicketButton3") {
        for(let i = 0; i < config.TicketButton3.SupportRoles.length; i++) {
            if(interaction.member.roles.cache.has(config.TicketButton3.SupportRoles[i])) supportRole = true;
          }
    } else if(tButton === "TicketButton4") {
        for(let i = 0; i < config.TicketButton4.SupportRoles.length; i++) {
            if(interaction.member.roles.cache.has(config.TicketButton4.SupportRoles[i])) supportRole = true;
          }
    } else if(tButton === "TicketButton5") {
        for(let i = 0; i < config.TicketButton5.SupportRoles.length; i++) {
            if(interaction.member.roles.cache.has(config.TicketButton5.SupportRoles[i])) supportRole = true;
          }
      } else if(tButton === "TicketButton6") {
          for(let i = 0; i < config.TicketButton6.SupportRoles.length; i++) {
              if(interaction.member.roles.cache.has(config.TicketButton6.SupportRoles[i])) supportRole = true;
            }
      } else if(tButton === "TicketButton7") {
          for(let i = 0; i < config.TicketButton7.SupportRoles.length; i++) {
              if(interaction.member.roles.cache.has(config.TicketButton7.SupportRoles[i])) supportRole = true;
            }
      } else if(tButton === "TicketButton8") {
          for(let i = 0; i < config.TicketButton8.SupportRoles.length; i++) {
              if(interaction.member.roles.cache.has(config.TicketButton8.SupportRoles[i])) supportRole = true;
            }
    }

    if(config.ClaimingSystem.Enabled && supportRole === false) return interaction.editReply({ content: config.Locale.restrictTicketClaim, ephemeral: true })

    
    let embedClaimVar = config.Locale.ticketClaimed.replace(/{user}/g, `<@!${interaction.user.id}>`);
    const embed = new EmbedBuilder()
    .setTitle(config.Locale.ticketClaimedTitle)
    .setColor("Green")
    .setDescription(embedClaimVar)
    .setTimestamp()
    .setFooter({ text: `${config.Locale.ticketClaimedBy} ${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ dynamic: true })}` })
    interaction.editReply({ content: config.Locale.claimTicketMsg, ephemeral: false})   
    interaction.channel.send({ embeds: [embed], ephemeral: false })
    interaction.channel.messages.fetch(client.tickets.get(`${interaction.channel.id}`, "msgID")).then(async msg => {

        const embed = msg.embeds[0]
        embed.fields[0] = { name: `${config.Locale.ticketClaimedBy}`, value: `> <@!${interaction.user.id}> (${interaction.user.tag})` }

        const ticketDeleteButton = new ButtonBuilder()
        .setCustomId('closeTicket')
        .setLabel(config.Locale.CloseTicketButton)
        .setStyle('Danger')
        .setEmoji(config.ButtonEmojis.closeTicket)

        const ticketClaimButton = new ButtonBuilder()
        .setCustomId('ticketclaim')
        .setLabel(config.Locale.claimTicketButton)
        .setEmoji(config.ButtonEmojis.ticketClaim)
        .setStyle('Secondary')  
        .setDisabled(true)

        const ticketUnClaimButton = new ButtonBuilder()
        .setCustomId('ticketunclaim')
        .setLabel(config.Locale.unclaimTicketButton)
        .setStyle(config.ButtonColors.ticketUnclaim)

        let row2 = new ActionRowBuilder().addComponents(ticketDeleteButton, ticketClaimButton, ticketUnClaimButton);

        
        msg.edit({ embeds: [embed], components: [row2] })
        client.emit('ticketClaim', interaction);

        if(tButton === "TicketButton1") {
            await config.TicketButton1.SupportRoles.forEach(sRoles => {
                role = interaction.guild.roles.cache.get(sRoles);
                if(role) {
                    interaction.channel.permissionOverwrites.edit(role, {
                        SendMessages: config.ClaimingSystem.UserPerms.SendMessages,
                        ViewChannel: config.ClaimingSystem.UserPerms.ViewChannel
                    })
                }
            })
        } else if(tButton === "TicketButton2") {
        await config.TicketButton2.SupportRoles.forEach(sRoles => {
            role = interaction.guild.roles.cache.get(sRoles);
            if(role) {
                interaction.channel.permissionOverwrites.edit(role, {
                    SendMessages: config.ClaimingSystem.UserPerms.SendMessages,
                    ViewChannel: config.ClaimingSystem.UserPerms.ViewChannel
                })
            }
        })
        } else if(tButton === "TicketButton3") {
            await config.TicketButton3.SupportRoles.forEach(sRoles => {
                role = interaction.guild.roles.cache.get(sRoles);
                if(role) {
                    interaction.channel.permissionOverwrites.edit(role, {
                        SendMessages: config.ClaimingSystem.UserPerms.SendMessages,
                        ViewChannel: config.ClaimingSystem.UserPerms.ViewChannel
                    })
                }
            })
        } else if(tButton === "TicketButton4") {
            await config.TicketButton4.SupportRoles.forEach(sRoles => {
                role = interaction.guild.roles.cache.get(sRoles);
                if(role) {
                    interaction.channel.permissionOverwrites.edit(role, {
                        SendMessages: config.ClaimingSystem.UserPerms.SendMessages,
                        ViewChannel: config.ClaimingSystem.UserPerms.ViewChannel
                    })
                }
            })
        } else if(tButton === "TicketButton5") {
            await config.TicketButton5.SupportRoles.forEach(sRoles => {
                role = interaction.guild.roles.cache.get(sRoles);
                if(role) {
                    interaction.channel.permissionOverwrites.edit(role, {
                        SendMessages: config.ClaimingSystem.UserPerms.SendMessages,
                        ViewChannel: config.ClaimingSystem.UserPerms.ViewChannel
                    })
                }
            })
        } else if(tButton === "TicketButton6") {
            await config.TicketButton6.SupportRoles.forEach(sRoles => {
                role = interaction.guild.roles.cache.get(sRoles);
                if(role) {
                    interaction.channel.permissionOverwrites.edit(role, {
                        SendMessages: config.ClaimingSystem.UserPerms.SendMessages,
                        ViewChannel: config.ClaimingSystem.UserPerms.ViewChannel
                    })
                }
            })
        } else if(tButton === "TicketButton7") {
            await config.TicketButton7.SupportRoles.forEach(sRoles => {
                role = interaction.guild.roles.cache.get(sRoles);
                if(role) {
                    interaction.channel.permissionOverwrites.edit(role, {
                        SendMessages: config.ClaimingSystem.UserPerms.SendMessages,
                        ViewChannel: config.ClaimingSystem.UserPerms.ViewChannel
                    })
                }
            })
        } else if(tButton === "TicketButton8") {
            await config.TicketButton8.SupportRoles.forEach(sRoles => {
                role = interaction.guild.roles.cache.get(sRoles);
                if(role) {
                    interaction.channel.permissionOverwrites.edit(role, {
                        SendMessages: config.ClaimingSystem.UserPerms.SendMessages,
                        ViewChannel: config.ClaimingSystem.UserPerms.ViewChannel
                    })
                }
            })
        }

        await interaction.channel.permissionOverwrites.edit(interaction.user, {
            SendMessages: true,
            ViewChannel: true,
            AttachFiles: true,
            EmbedLinks: true,
            ReadMessageHistory: true
        })

    client.tickets.set(interaction.channel.id, true, "claimed");
    client.tickets.set(interaction.channel.id, interaction.user.id, "claimUser");


    let logsChannel; 
    if(!config.claimTicket.ChannelID) logsChannel = interaction.guild.channels.cache.get(config.TicketSettings.LogsChannelID);
    if(config.claimTicket.ChannelID) logsChannel = interaction.guild.channels.cache.get(config.claimTicket.ChannelID);

    const log = new EmbedBuilder()
    .setColor("Green")
    .setTitle(config.Locale.ticketClaimedLog)
    .addFields([
        { name: `• ${config.Locale.logsExecutor}`, value: `> <@!${interaction.user.id}>\n> ${interaction.user.tag}` },
        { name: `• ${config.Locale.logsTicket}`, value: `> <#${interaction.channel.id}>\n> #${interaction.channel.name}\n> ${client.tickets.get(`${interaction.channel.id}`, "ticketType")}` },
      ])
    .setTimestamp()
    .setThumbnail(interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
    .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
    if (logsChannel && config.claimTicket.Enabled) logsChannel.send({ embeds: [log] })

    })
    }

    if(interaction.customId === 'ticketunclaim') {
        await interaction.deferReply({ ephemeral: true });

        let logMsg = `\n\n[${new Date().toLocaleString()}] [TICKET UNCLAIM] User: ${interaction.user.tag}`;
        fs.appendFile("./logs.txt", logMsg, (e) => { 
          if(e) console.log(e);
        });

        if(config.ClaimingSystem.Enabled === false) return interaction.editReply({ content: "Ticket claiming is disabled in the config!", ephemeral: true })
        if(client.tickets.get(`${interaction.channel.id}`, "claimed") === false) return interaction.editReply({ content: "This ticket has not been claimed!", ephemeral: true })
        let msgClaimUserVar = config.Locale.ticketDidntClaim.replace(/{user}/g, `<@!${client.tickets.get(`${interaction.channel.id}`, "claimUser")}>`);
        if(client.tickets.get(`${interaction.channel.id}`, "claimUser") !== interaction.user.id) return interaction.editReply({ content: msgClaimUserVar, ephemeral: true  })

        let tButton = client.tickets.get(`${interaction.channel.id}`, "button");
        if(tButton === "TicketButton1") {
            await config.TicketButton1.SupportRoles.forEach(sRoles => {
                role = interaction.guild.roles.cache.get(sRoles);
                if(role) {
                    interaction.channel.permissionOverwrites.edit(role, {
                        SendMessages: true,
                        ViewChannel: true
                    })
                }
            })
        } else if(tButton === "TicketButton2") {
        await config.TicketButton2.SupportRoles.forEach(sRoles => {
            role = interaction.guild.roles.cache.get(sRoles);
            if(role) {
                interaction.channel.permissionOverwrites.edit(role, {
                    SendMessages: true,
                    ViewChannel: true
                })
            }
        })
        } else if(tButton === "TicketButton3") {
            await config.TicketButton3.SupportRoles.forEach(sRoles => {
                role = interaction.guild.roles.cache.get(sRoles);
                if(role) {
                    interaction.channel.permissionOverwrites.edit(role, {
                        SendMessages: true,
                        ViewChannel: true
                    })
                }
            })
        } else if(tButton === "TicketButton4") {
            await config.TicketButton4.SupportRoles.forEach(sRoles => {
                role = interaction.guild.roles.cache.get(sRoles);
                if(role) {
                    interaction.channel.permissionOverwrites.edit(role, {
                        SendMessages: true,
                        ViewChannel: true
                    })
                }
            })
        } else if(tButton === "TicketButton5") {
            await config.TicketButton5.SupportRoles.forEach(sRoles => {
                role = interaction.guild.roles.cache.get(sRoles);
                if(role) {
                    interaction.channel.permissionOverwrites.edit(role, {
                        SendMessages: true,
                        ViewChannel: true
                    })
                }
            })
        } else if(tButton === "TicketButton6") {
            await config.TicketButton6.SupportRoles.forEach(sRoles => {
                role = interaction.guild.roles.cache.get(sRoles);
                if(role) {
                    interaction.channel.permissionOverwrites.edit(role, {
                        SendMessages: true,
                        ViewChannel: true
                    })
                }
            })
        } else if(tButton === "TicketButton7") {
            await config.TicketButton7.SupportRoles.forEach(sRoles => {
                role = interaction.guild.roles.cache.get(sRoles);
                if(role) {
                    interaction.channel.permissionOverwrites.edit(role, {
                        SendMessages: true,
                        ViewChannel: true
                    })
                }
            })
        } else if(tButton === "TicketButton8") {
            await config.TicketButton8.SupportRoles.forEach(sRoles => {
                role = interaction.guild.roles.cache.get(sRoles);
                if(role) {
                    interaction.channel.permissionOverwrites.edit(role, {
                        SendMessages: true,
                        ViewChannel: true
                    })
                }
            })
        }


        let embedClaimVar2 = config.Locale.ticketUnClaimed.replace(/{user}/g, `<@!${interaction.user.id}>`);
        const embed = new EmbedBuilder()
        .setTitle(config.Locale.ticketUnClaimedTitle)
        .setColor("Red")
        .setDescription(embedClaimVar2)
        .setTimestamp()
        .setFooter({ text: `${config.Locale.ticketUnClaimedBy} ${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ dynamic: true })}` })
        interaction.editReply({ content: config.Locale.unclaimTicketMsg, ephemeral: true })
        interaction.channel.send({ embeds: [embed] })
    
        interaction.channel.messages.fetch(client.tickets.get(`${interaction.channel.id}`, "msgID")).then(async msg => {
    
            const embed = msg.embeds[0]
            embed.fields[0] = { name: `${config.Locale.ticketClaimedBy}`, value: `> ${config.Locale.ticketNotClaimed}` }


            const ticketDeleteButton = new ButtonBuilder()
            .setCustomId('closeTicket')
            .setLabel(config.Locale.CloseTicketButton)
            .setStyle(config.ButtonColors.closeTicket)
            .setEmoji(config.ButtonEmojis.closeTicket)
    
            const ticketClaimButton = new ButtonBuilder()
            .setCustomId('ticketclaim')
            .setLabel(config.Locale.claimTicketButton)
            .setEmoji(config.ButtonEmojis.ticketClaim)
            .setStyle(config.ButtonColors.ticketClaim)
    
            let row3 = new ActionRowBuilder().addComponents(ticketDeleteButton, ticketClaimButton);
    
            msg.edit({ embeds: [embed], components: [row3] })


        client.tickets.set(interaction.channel.id, false, "claimed");
        client.tickets.set(interaction.channel.id, "", "claimUser");

        let logsChannel; 
        if(!config.unclaimTicket.ChannelID) logsChannel = interaction.guild.channels.cache.get(config.TicketSettings.LogsChannelID);
        if(config.unclaimTicket.ChannelID) logsChannel = interaction.guild.channels.cache.get(config.unclaimTicket.ChannelID);

        const log = new EmbedBuilder()
        .setColor("Red")
        .setTitle(config.Locale.ticketUnClaimedLog)
        .addFields([
            { name: `• ${config.Locale.logsExecutor}`, value: `> <@!${interaction.user.id}>\n> ${interaction.user.tag}` },
            { name: `• ${config.Locale.logsTicket}`, value: `> <#${interaction.channel.id}>\n> #${interaction.channel.name}\n> ${client.tickets.get(`${interaction.channel.id}`, "ticketType")}` },
          ])
        .setTimestamp()
        .setThumbnail(interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        if (logsChannel && config.unclaimTicket.Enabled) logsChannel.send({ embeds: [log] })
        })
    }



// SUGGESTION SYSTEM

// Upvote button
if (interaction.customId === 'upvote') {
    await interaction.deferReply({ ephemeral: true });

    let cantvoteVariable = config.Locale.suggestionCantVote.replace(/{link}/g, `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${client.suggestions.get(`${interaction.message.id}`, "msgID")}`);
    let cantVote = new EmbedBuilder()
    .setTitle(config.Locale.suggestionCantVoteTitle)
    .setColor("Red")
    .setDescription(cantvoteVariable)
    .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
    .setTimestamp();

    if(client.suggestions.get(`${interaction.message.id}`, "status") === "Accepted" || client.suggestions.get(`${interaction.message.id}`, "status") === "Denied") return interaction.editReply({ embeds: [cantVote], ephemeral: true })


    let alreadyvotedVariable = config.Locale.suggestionAlreadyVoted.replace(/{link}/g, `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${client.suggestions.get(`${interaction.message.id}`, "msgID")}`);
    let alreadyVoted = new EmbedBuilder()
    .setTitle(config.Locale.suggestionAlreadyVotedTitle)
    .setColor("Red")
    .setDescription(alreadyvotedVariable)
    .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
    .setTimestamp();

    if(client.suggestionUsers.has(`${interaction.message.id}_${interaction.user.id}`) && client.suggestionUsers.get(`${interaction.message.id}_${interaction.user.id}`, "userID") === interaction.user.id && client.suggestionUsers.get(`${interaction.message.id}_${interaction.user.id}`, "msgID") === interaction.message.id && client.suggestionUsers.get(`${interaction.message.id}_${interaction.user.id}`, "voted") === true) return interaction.editReply({ embeds: [alreadyVoted], ephemeral: true })

    client.suggestions.inc(interaction.message.id, "upVotes");

      client.suggestionUsers.ensure(`${interaction.message.id}_${interaction.user.id}`, {
        userID: interaction.user.id,
        voted: true,
        voteType: "upvote",
        msgID: interaction.message.id
      });


    if(client.suggestionUsers.get(`${interaction.message.id}_${interaction.user.id}`, "voted") === false) client.suggestionUsers.set(`${interaction.message.id}_${interaction.user.id}`, true, "voted");
    if(client.suggestionUsers.get(`${interaction.message.id}_${interaction.user.id}`, "voteType") === "downvote") client.suggestionUsers.set(`${interaction.message.id}_${interaction.user.id}`, "upvote", "voteType");

    interaction.channel.messages.fetch(client.suggestions.get(`${interaction.message.id}`, "msgID")).then(msg => {

        let upvotedVariable = config.Locale.suggestionUpvoted.replace(/{link}/g, `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${client.suggestions.get(`${interaction.message.id}`, "msgID")}`);
        let sugUpvoted = new EmbedBuilder()
        .setTitle(config.Locale.suggestionUpvotedTitle)
        .setColor("Green")
        .setDescription(upvotedVariable)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
    
        interaction.editReply({ embeds: [sugUpvoted], ephemeral: true })

        const embed = msg.embeds[0]
        if(config.SuggestionSettings.EnableAcceptDenySystem) embed.fields[1] = { name: `• ${config.Locale.suggestionInformation}`, value: `> **${config.Locale.suggestionFrom}** <@!${client.suggestions.get(`${interaction.message.id}`, "userID")}>\n> **${config.Locale.suggestionUpvotes}** ${client.suggestions.get(`${interaction.message.id}`, "upVotes")}\n> **${config.Locale.suggestionDownvotes}** ${client.suggestions.get(`${interaction.message.id}`, "downVotes")}\n> **${config.Locale.suggestionStatus}** ${config.SuggestionStatuses.Pending}` }
        if(config.SuggestionSettings.EnableAcceptDenySystem === false) embed.fields[1] = { name: `• ${config.Locale.suggestionInformation}`, value: `> **${config.Locale.suggestionFrom}** <@!${client.suggestions.get(`${interaction.message.id}`, "userID")}>\n> **${config.Locale.suggestionUpvotes}** ${client.suggestions.get(`${interaction.message.id}`, "upVotes")}\n> **${config.Locale.suggestionDownvotes}** ${client.suggestions.get(`${interaction.message.id}`, "downVotes")}` }
        
        let suggestionLogsChannel = interaction.guild.channels.cache.get(config.SuggestionSettings.LogsChannel);
        const upvoteLog = new EmbedBuilder()
        .setColor("Green")
        .setDescription(`${config.SuggestionUpvote.ButtonEmoji} | <@!${interaction.user.id}> (${interaction.user.tag}) has **upvoted** [this](https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${client.suggestions.get(`${interaction.message.id}`, "msgID")}) suggestion!`)
        if(config.SuggestionSettings.LogsChannel && suggestionLogsChannel) suggestionLogsChannel.send({ embeds: [upvoteLog] })

        msg.edit({ embeds: [embed] })
        client.globalStats.inc(interaction.guild.id, "totalSuggestionUpvotes");
    });

}


// Downvote button
if (interaction.customId === 'downvote') {
    await interaction.deferReply({ ephemeral: true });

    let cantvoteVariable = config.Locale.suggestionCantVote.replace(/{link}/g, `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${client.suggestions.get(`${interaction.message.id}`, "msgID")}`);
    let cantVote = new EmbedBuilder()
    .setTitle(config.Locale.suggestionCantVoteTitle)
    .setColor("Red")
    .setDescription(cantvoteVariable)
    .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
    .setTimestamp();

    if(client.suggestions.get(`${interaction.message.id}`, "status") === "Accepted" || client.suggestions.get(`${interaction.message.id}`, "status") === "Denied") return interaction.editReply({ embeds: [cantVote], ephemeral: true })

    let alreadyVotedVariable = config.Locale.suggestionAlreadyVoted.replace(/{link}/g, `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${client.suggestions.get(`${interaction.message.id}`, "msgID")}`);
    let alreadyVoted = new EmbedBuilder()
    .setTitle(config.Locale.suggestionAlreadyVotedTitle)
    .setColor("Red")
    .setDescription(alreadyVotedVariable)
    .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
    .setTimestamp();

    if(client.suggestionUsers.has(`${interaction.message.id}_${interaction.user.id}`) && client.suggestionUsers.get(`${interaction.message.id}_${interaction.user.id}`, "userID") === interaction.user.id && client.suggestionUsers.get(`${interaction.message.id}_${interaction.user.id}`, "msgID") === interaction.message.id && client.suggestionUsers.get(`${interaction.message.id}_${interaction.user.id}`, "voted") === true) return interaction.editReply({ embeds: [alreadyVoted], ephemeral: true })

    client.suggestions.inc(interaction.message.id, "downVotes");

      client.suggestionUsers.ensure(`${interaction.message.id}_${interaction.user.id}`, {
        userID: interaction.user.id,
        voted: true,
        voteType: "downvote",
        msgID: interaction.message.id
      });


      if(client.suggestionUsers.get(`${interaction.message.id}_${interaction.user.id}`, "voted") === false) client.suggestionUsers.set(`${interaction.message.id}_${interaction.user.id}`, true, "voted");
      if(client.suggestionUsers.get(`${interaction.message.id}_${interaction.user.id}`, "voteType") === "upvote") client.suggestionUsers.set(`${interaction.message.id}_${interaction.user.id}`, "downvote", "voteType");

    interaction.channel.messages.fetch(client.suggestions.get(`${interaction.message.id}`, "msgID")).then(msg => {

        let downvoteVariable = config.Locale.suggestionDownvoted.replace(/{link}/g, `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${client.suggestions.get(`${interaction.message.id}`, "msgID")}`);
        let sugDownvoted = new EmbedBuilder()
        .setTitle(config.Locale.suggestionDownvotedTitle)
        .setColor("Red")
        .setDescription(downvoteVariable)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();
    
        interaction.editReply({ embeds: [sugDownvoted], ephemeral: true })

        const embed = msg.embeds[0]
        if(config.SuggestionSettings.EnableAcceptDenySystem) embed.fields[1] = { name: `• ${config.Locale.suggestionInformation}`, value: `> **${config.Locale.suggestionFrom}** <@!${client.suggestions.get(`${interaction.message.id}`, "userID")}>\n> **${config.Locale.suggestionUpvotes}** ${client.suggestions.get(`${interaction.message.id}`, "upVotes")}\n> **${config.Locale.suggestionDownvotes}** ${client.suggestions.get(`${interaction.message.id}`, "downVotes")}\n> **${config.Locale.suggestionStatus}** ${config.SuggestionStatuses.Pending}` }
        if(config.SuggestionSettings.EnableAcceptDenySystem === false) embed.fields[1] = { name: `• ${config.Locale.suggestionInformation}`, value: `> **${config.Locale.suggestionFrom}** <@!${client.suggestions.get(`${interaction.message.id}`, "userID")}>\n> **${config.Locale.suggestionUpvotes}** ${client.suggestions.get(`${interaction.message.id}`, "upVotes")}\n> **${config.Locale.suggestionDownvotes}** ${client.suggestions.get(`${interaction.message.id}`, "downVotes")}` }
        
        let suggestionLogsChannel = interaction.guild.channels.cache.get(config.SuggestionSettings.LogsChannel);
        const upvoteLog = new EmbedBuilder()
        .setColor("Red")
        .setDescription(`${config.SuggestionDownvote.ButtonEmoji} | <@!${interaction.user.id}> (${interaction.user.tag}) has **downvoted** [this](https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${client.suggestions.get(`${interaction.message.id}`, "msgID")}) suggestion!`)
        if(config.SuggestionSettings.LogsChannel && suggestionLogsChannel) suggestionLogsChannel.send({ embeds: [upvoteLog] })

        msg.edit({ embeds: [embed] })
        client.globalStats.inc(interaction.guild.id, "totalSuggestionDownvotes");
    });

}

// Reset vote button
if (interaction.customId === 'resetvote') {
    await interaction.deferReply({ ephemeral: true });

    let noVoteVariable = config.Locale.suggestionNoVote.replace(/{link}/g, `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${client.suggestions.get(`${interaction.message.id}`, "msgID")}`);
    let noVote = new EmbedBuilder()
    .setTitle(config.Locale.suggestionNoVoteTitle)
    .setColor("Red")
    .setDescription(noVoteVariable)
    .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
    .setTimestamp();

    if(!client.suggestionUsers.has(`${interaction.message.id}_${interaction.user.id}`) || client.suggestionUsers.get(`${interaction.message.id}_${interaction.user.id}`, "voted") === false) return interaction.editReply({ embeds: [noVote], ephemeral: true })

    let cantvoteVariable = config.Locale.suggestionCantVote.replace(/{link}/g, `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${client.suggestions.get(`${interaction.message.id}`, "msgID")}`);
    let cantVote = new EmbedBuilder()
    .setTitle(config.Locale.suggestionCantVoteTitle)
    .setColor("Red")
    .setDescription(cantvoteVariable)
    .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
    .setTimestamp();

    if(client.suggestionUsers.get(`${interaction.message.id}_${interaction.user.id}`, "status") === "Accepted" || client.suggestionUsers.get(`${interaction.message.id}_${interaction.user.id}`, "status") === "Denied") return interaction.editReply({ embeds: [cantVote], ephemeral: true })

    client.suggestionUsers.set(`${interaction.message.id}_${interaction.user.id}`, false, "voted");
    if(client.suggestionUsers.get(`${interaction.message.id}_${interaction.user.id}`, "voteType") === "upvote") client.suggestions.dec(interaction.message.id, "upVotes");
    if(client.suggestionUsers.get(`${interaction.message.id}_${interaction.user.id}`, "voteType") === "downvote") client.suggestions.dec(interaction.message.id, "downVotes");
    

    interaction.channel.messages.fetch(client.suggestions.get(`${interaction.message.id}`, "msgID")).then(msg => {

        let voteResetVariable = config.Locale.suggestionVoteReset.replace(/{link}/g, `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${client.suggestions.get(`${interaction.message.id}`, "msgID")}`);
        let voteReset = new EmbedBuilder()
        .setTitle(config.Locale.suggestionVoteResetTitle)
        .setColor("Green")
        .setDescription(voteResetVariable)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();

        interaction.editReply({ embeds: [voteReset], ephemeral: true })

        const embed = msg.embeds[0]
        if(config.SuggestionSettings.EnableAcceptDenySystem) embed.fields[1] = { name: `• ${config.Locale.suggestionInformation}`, value: `> **${config.Locale.suggestionFrom}** <@!${client.suggestions.get(`${interaction.message.id}`, "userID")}>\n> **${config.Locale.suggestionUpvotes}** ${client.suggestions.get(`${interaction.message.id}`, "upVotes")}\n> **${config.Locale.suggestionDownvotes}** ${client.suggestions.get(`${interaction.message.id}`, "downVotes")}\n> **${config.Locale.suggestionStatus}** ${config.SuggestionStatuses.Pending}` }
        if(config.SuggestionSettings.EnableAcceptDenySystem === false) embed.fields[1] = { name: `• ${config.Locale.suggestionInformation}`, value: `> **${config.Locale.suggestionFrom}** <@!${client.suggestions.get(`${interaction.message.id}`, "userID")}>\n> **${config.Locale.suggestionUpvotes}** ${client.suggestions.get(`${interaction.message.id}`, "upVotes")}\n> **${config.Locale.suggestionDownvotes}** ${client.suggestions.get(`${interaction.message.id}`, "downVotes")}` }
        
        let suggestionLogsChannel = interaction.guild.channels.cache.get(config.SuggestionSettings.LogsChannel);
        const upvoteLog = new EmbedBuilder()
        .setColor("Orange")
        .setDescription(`${config.SuggestionResetvote.ButtonEmoji} | <@!${interaction.user.id}> (${interaction.user.tag}) has **reset their vote for** [this](https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${client.suggestions.get(`${interaction.message.id}`, "msgID")}) suggestion!`)
        if(config.SuggestionSettings.LogsChannel && suggestionLogsChannel) suggestionLogsChannel.send({ embeds: [upvoteLog] })

        msg.edit({ embeds: [embed] })
    });
}


// Accept button
if (interaction.customId === 'accept') {
    if(config.SuggestionSettings.EnableAcceptDenySystem === false) return;
    await interaction.deferReply({ ephemeral: true });
    
    let sRole = false
    await config.SuggestionSettings.AllowedRoles.forEach(r => {
        role = interaction.guild.roles.cache.get(r);
        if(role) {
            if(interaction.member.roles.cache.has(role.id)) {
                sRole = true
            }
        }
    })
    if(sRole === false) return interaction.editReply({ content: config.Locale.suggestionNoPerms, ephemeral: true })

    client.suggestionUsers.set(`${interaction.message.id}_${interaction.user.id}`, "Accepted", "status");

    interaction.channel.messages.fetch(client.suggestions.get(`${interaction.message.id}`, "msgID")).then(msg => {
        let acceptedVariable = config.Locale.suggestionAccepted.replace(/{link}/g, `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${client.suggestions.get(`${interaction.message.id}`, "msgID")}`);
        let sugAccepted = new EmbedBuilder()
        .setTitle(config.Locale.suggestionAcceptedTitle)
        .setColor("Green")
        .setDescription(acceptedVariable)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();

        interaction.editReply({ embeds: [sugAccepted], ephemeral: true })

        const embed = msg.embeds[0]
        if(config.SuggestionSettings.EnableAcceptDenySystem) embed.fields[1] = { name: `• ${config.Locale.suggestionInformation}`, value: `> **${config.Locale.suggestionFrom}** <@!${client.suggestions.get(`${interaction.message.id}`, "userID")}>\n> **${config.Locale.suggestionUpvotes}** ${client.suggestions.get(`${interaction.message.id}`, "upVotes")}\n> **${config.Locale.suggestionDownvotes}** ${client.suggestions.get(`${interaction.message.id}`, "downVotes")}\n> **${config.Locale.suggestionStatus}** ${config.SuggestionStatuses.Accepted}` }

        const embedColor = EmbedBuilder.from(embed)
        embedColor.setColor(config.SuggestionStatusesEmbedColors.Accepted)
        
        if(config.SuggestionSettings.RemoveAllButtonsIfAcceptedOrDenied === false) msg.edit({ embeds: [embedColor] })
        if(config.SuggestionSettings.RemoveAllButtonsIfAcceptedOrDenied) msg.edit({ embeds: [embedColor], components: [] })

        let suggestionLogsChannel = interaction.guild.channels.cache.get(config.SuggestionSettings.LogsChannel);
        const upvoteLog = new EmbedBuilder()
        .setColor("Green")
        .setDescription(`${config.SuggestionAccept.ButtonEmoji} | <@!${interaction.user.id}> (${interaction.user.tag}) has **accepted** [this](https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${client.suggestions.get(`${interaction.message.id}`, "msgID")}) suggestion!`)
        if(config.SuggestionSettings.LogsChannel && suggestionLogsChannel) suggestionLogsChannel.send({ embeds: [upvoteLog] })

    });
}


// Deny button
if (interaction.customId === 'deny') {
    if(config.SuggestionSettings.EnableAcceptDenySystem === false) return;
    await interaction.deferReply({ ephemeral: true });
    
    let sRole = false
    await config.SuggestionSettings.AllowedRoles.forEach(r => {
        role = interaction.guild.roles.cache.get(r);
        if(role) {
            if(interaction.member.roles.cache.has(role.id)) {
                sRole = true
            }
        }
    })
    if(sRole === false) return interaction.editReply({ content: config.Locale.suggestionNoPerms, ephemeral: true })

    client.suggestionUsers.set(`${interaction.message.id}_${interaction.user.id}`, "Denied", "status");

    interaction.channel.messages.fetch(client.suggestions.get(`${interaction.message.id}`, "msgID")).then(msg => {

        let deniedVariable = config.Locale.suggestionDenied.replace(/{link}/g, `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${client.suggestions.get(`${interaction.message.id}`, "msgID")}`);
        let sugAccepted = new EmbedBuilder()
        .setTitle(config.Locale.suggestionDeniedTitle)
        .setColor("Red")
        .setDescription(deniedVariable)
        .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}` })
        .setTimestamp();

        interaction.editReply({ embeds: [sugAccepted], ephemeral: true })

        const embed = msg.embeds[0]
        if(config.SuggestionSettings.EnableAcceptDenySystem) embed.fields[1] = { name: `• ${config.Locale.suggestionInformation}`, value: `> **${config.Locale.suggestionFrom}** <@!${client.suggestions.get(`${interaction.message.id}`, "userID")}>\n> **${config.Locale.suggestionUpvotes}** ${client.suggestions.get(`${interaction.message.id}`, "upVotes")}\n> **${config.Locale.suggestionDownvotes}** ${client.suggestions.get(`${interaction.message.id}`, "downVotes")}\n> **${config.Locale.suggestionStatus}** ${config.SuggestionStatuses.Denied}` }

        const embedColor = EmbedBuilder.from(embed)
        embedColor.setColor(config.SuggestionStatusesEmbedColors.Denied)
        
        if(config.SuggestionSettings.RemoveAllButtonsIfAcceptedOrDenied === false) msg.edit({ embeds: [embedColor] })
        if(config.SuggestionSettings.RemoveAllButtonsIfAcceptedOrDenied) msg.edit({ embeds: [embedColor], components: [] })

        let suggestionLogsChannel = interaction.guild.channels.cache.get(config.SuggestionSettings.LogsChannel);
        const upvoteLog = new EmbedBuilder()
        .setColor("Red")
        .setDescription(`${config.SuggestionDeny.ButtonEmoji} | <@!${interaction.user.id}> (${interaction.user.tag}) has **denied** [this](https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${client.suggestions.get(`${interaction.message.id}`, "msgID")}) suggestion!`)
        if(config.SuggestionSettings.LogsChannel && suggestionLogsChannel) suggestionLogsChannel.send({ embeds: [upvoteLog] })

    });
}


// Ticket Rating System
if (interaction.customId === 'ratingSelect' && (client.reviewsData.get(interaction.message.id, 'reviewDMUserMsgID') === interaction.message.id) && (client.reviewsData.get(interaction.message.id, 'userID') === interaction.user.id)) {

    const modal = new ModalBuilder()
    .setCustomId('modal-whyRating')
    .setTitle(config.Locale.ticketRating)

    const reviewInput = new TextInputBuilder()
    .setCustomId('textinput-whyRating')
    .setLabel(config.Locale.ticketRating)
    .setStyle('Paragraph')
    .setMinLength(config.TicketReviewSettings.MinimumWords)
    .setMaxLength(config.TicketReviewSettings.MaximumWords)
    .setPlaceholder(config.Locale.explainWhyRating)
    .setRequired(true)

    const modalActionRow = new ActionRowBuilder().addComponents(reviewInput);
    modal.addComponents(modalActionRow);

    if(interaction.values[0] === "one_star") {

    const arr = [
        {
            rating: 1,
            guildID: config.GuildID,
            userID: interaction.user.id,
        },
    ]

        client.reviews.push(config.GuildID, arr, 'ratings');
        if(config.TicketReviewSettings.AskWhyModal) await interaction.showModal(modal);
        client.reviewsData.set(interaction.message.id, 1, "rating")
        client.globalStats.inc(config.GuildID, "totalReviews");

        let guild = client.guilds.cache.get(config.GuildID)
        let logsChannel; 
        if(!config.ticketClose.ChannelID) logsChannel = guild.channels.cache.get(config.TicketSettings.LogsChannelID);
        if(config.ticketClose.ChannelID) logsChannel = guild.channels.cache.get(config.ticketClose.ChannelID);

        let star = ""
        for (var i = 0; i < client.reviewsData.get(interaction.message.id, 'rating'); i++) {
            star += "⭐"
        }

        if(config.TicketReviewSettings.AskWhyModal === false) logsChannel.messages.fetch(client.reviewsData.get(interaction.message.id, 'tCloseLogMsgID')).then(msg => {
            const embed = msg.embeds[0]
            embed.fields[3] = { name: `• ${config.Locale.ticketRating}`, value: `> ${star} \`\`(${client.reviewsData.get(interaction.message.id, 'rating')}/5)\`\`` }
            msg.edit({ embeds: [embed] })
      })

      if(config.TicketReviewSettings.AskWhyModal === false) interaction.channel.messages.fetch(client.reviewsData.get(interaction.message.id, 'reviewDMUserMsgID')).then(msg => {
        msg.edit({ components: [] })
        interaction.reply({ content: config.TicketReviewSettings.ReviewMsg, ephemeral: true })
        return
    })
}

if(interaction.values[0] === "two_star") {

    const arr = [
        {
            rating: 2,
            guildID: config.GuildID,
            userID: interaction.user.id,
        },
    ]

        client.reviews.push(config.GuildID, arr, 'ratings');
        if(config.TicketReviewSettings.AskWhyModal) await interaction.showModal(modal);
        client.reviewsData.set(interaction.message.id, 2, "rating")
        client.globalStats.inc(config.GuildID, "totalReviews");

        let guild = client.guilds.cache.get(config.GuildID)
        let logsChannel; 
        if(!config.ticketClose.ChannelID) logsChannel = guild.channels.cache.get(config.TicketSettings.LogsChannelID);
        if(config.ticketClose.ChannelID) logsChannel = guild.channels.cache.get(config.ticketClose.ChannelID);

        let star = ""
        for (var i = 0; i < client.reviewsData.get(interaction.message.id, 'rating'); i++) {
            star += "⭐"
        }

        if(config.TicketReviewSettings.AskWhyModal === false) logsChannel.messages.fetch(client.reviewsData.get(interaction.message.id, 'tCloseLogMsgID')).then(msg => {
            const embed = msg.embeds[0]
            embed.fields[3] = { name: `• ${config.Locale.ticketRating}`, value: `> ${star} \`\`(${client.reviewsData.get(interaction.message.id, 'rating')}/5)\`\`` }
            msg.edit({ embeds: [embed] })
      })

      if(config.TicketReviewSettings.AskWhyModal === false) interaction.channel.messages.fetch(client.reviewsData.get(interaction.message.id, 'reviewDMUserMsgID')).then(msg => {
        msg.edit({ components: [] })
        interaction.reply({ content: config.TicketReviewSettings.ReviewMsg, ephemeral: true })
        return
    })
}

if(interaction.values[0] === "three_star") {

    const arr = [
        {
            rating: 3,
            guildID: config.GuildID,
            userID: interaction.user.id,
        },
    ]

        client.reviews.push(config.GuildID, arr, 'ratings');
        if(config.TicketReviewSettings.AskWhyModal) await interaction.showModal(modal);
        client.reviewsData.set(interaction.message.id, 3, "rating")
        client.globalStats.inc(config.GuildID, "totalReviews");

        let guild = client.guilds.cache.get(config.GuildID)
        let logsChannel; 
        if(!config.ticketClose.ChannelID) logsChannel = guild.channels.cache.get(config.TicketSettings.LogsChannelID);
        if(config.ticketClose.ChannelID) logsChannel = guild.channels.cache.get(config.ticketClose.ChannelID);

        let star = ""
        for (var i = 0; i < client.reviewsData.get(interaction.message.id, 'rating'); i++) {
            star += "⭐"
        }

        if(config.TicketReviewSettings.AskWhyModal === false) logsChannel.messages.fetch(client.reviewsData.get(interaction.message.id, 'tCloseLogMsgID')).then(msg => {
            const embed = msg.embeds[0]
            embed.fields[3] = { name: `• ${config.Locale.ticketRating}`, value: `> ${star} \`\`(${client.reviewsData.get(interaction.message.id, 'rating')}/5)\`\`` }
            msg.edit({ embeds: [embed] })
      })

      if(config.TicketReviewSettings.AskWhyModal === false) interaction.channel.messages.fetch(client.reviewsData.get(interaction.message.id, 'reviewDMUserMsgID')).then(msg => {
        msg.edit({ components: [] })
        interaction.reply({ content: config.TicketReviewSettings.ReviewMsg, ephemeral: true })
        return
    })
}

if(interaction.values[0] === "four_star") {

    const arr = [
        {
            rating: 4,
            guildID: config.GuildID,
            userID: interaction.user.id,
        },
    ]

        client.reviews.push(config.GuildID, arr, 'ratings');
        if(config.TicketReviewSettings.AskWhyModal) await interaction.showModal(modal);
        client.reviewsData.set(interaction.message.id, 4, "rating")
        client.globalStats.inc(config.GuildID, "totalReviews");

        let guild = client.guilds.cache.get(config.GuildID)
        let logsChannel; 
        if(!config.ticketClose.ChannelID) logsChannel = guild.channels.cache.get(config.TicketSettings.LogsChannelID);
        if(config.ticketClose.ChannelID) logsChannel = guild.channels.cache.get(config.ticketClose.ChannelID);

        let star = ""
        for (var i = 0; i < client.reviewsData.get(interaction.message.id, 'rating'); i++) {
            star += "⭐"
        }

        if(config.TicketReviewSettings.AskWhyModal === false) logsChannel.messages.fetch(client.reviewsData.get(interaction.message.id, 'tCloseLogMsgID')).then(msg => {
            const embed = msg.embeds[0]
            embed.fields[3] = { name: `• ${config.Locale.ticketRating}`, value: `> ${star} \`\`(${client.reviewsData.get(interaction.message.id, 'rating')}/5)\`\`` }
            msg.edit({ embeds: [embed] })
      })

      if(config.TicketReviewSettings.AskWhyModal === false) interaction.channel.messages.fetch(client.reviewsData.get(interaction.message.id, 'reviewDMUserMsgID')).then(msg => {
        msg.edit({ components: [] })
        interaction.reply({ content: config.TicketReviewSettings.ReviewMsg, ephemeral: true })
        return
    })
}

if(interaction.values[0] === "five_star") {

    const arr = [
        {
            rating: 5,
            guildID: config.GuildID,
            userID: interaction.user.id,
        },
    ]

        client.reviews.push(config.GuildID, arr, 'ratings');
        if(config.TicketReviewSettings.AskWhyModal) await interaction.showModal(modal);
        client.reviewsData.set(interaction.message.id, 5, "rating")
        client.globalStats.inc(config.GuildID, "totalReviews");

        let guild = client.guilds.cache.get(config.GuildID)
        let logsChannel; 
        if(!config.ticketClose.ChannelID) logsChannel = guild.channels.cache.get(config.TicketSettings.LogsChannelID);
        if(config.ticketClose.ChannelID) logsChannel = guild.channels.cache.get(config.ticketClose.ChannelID);

        let star = ""
        for (var i = 0; i < client.reviewsData.get(interaction.message.id, 'rating'); i++) {
            star += "⭐"
        }

        if(config.TicketReviewSettings.AskWhyModal === false) logsChannel.messages.fetch(client.reviewsData.get(interaction.message.id, 'tCloseLogMsgID')).then(msg => {
            const embed = msg.embeds[0]
            embed.fields[3] = { name: `• ${config.Locale.ticketRating}`, value: `> ${star} \`\`(${client.reviewsData.get(interaction.message.id, 'rating')}/5)\`\`` }
            msg.edit({ embeds: [embed] })
      })

      if(config.TicketReviewSettings.AskWhyModal === false) interaction.channel.messages.fetch(client.reviewsData.get(interaction.message.id, 'reviewDMUserMsgID')).then(msg => {
        msg.edit({ components: [] })
        interaction.reply({ content: config.TicketReviewSettings.ReviewMsg, ephemeral: true })
        return
    })
}
}

if (interaction.type === InteractionType.ModalSubmit && config.TicketReviewSettings.AskWhyModal) {
    await interaction.deferReply({ ephemeral: true });
    if(interaction.customId === 'modal-whyRating' && client.reviewsData.get(interaction.message.id, 'reviewDMUserMsgID') === interaction.message.id && client.reviewsData.get(interaction.message.id, 'userID') === interaction.user.id) {
    const firstResponse = interaction.fields.getTextInputValue('textinput-whyRating');

    let guild = client.guilds.cache.get(config.GuildID)
    let logsChannel; 
    if(!config.ticketClose.ChannelID) logsChannel = guild.channels.cache.get(config.TicketSettings.LogsChannelID);
    if(config.ticketClose.ChannelID) logsChannel = guild.channels.cache.get(config.ticketClose.ChannelID);

    await interaction.channel.messages.fetch(client.reviewsData.get(interaction.message.id, 'reviewDMUserMsgID')).then(msg => {
        msg.edit({ components: [] })
  })

    await interaction.editReply({ content: config.TicketReviewSettings.ReviewMsg, ephemeral: true })

    let star = ""
    for (var i = 0; i < client.reviewsData.get(interaction.message.id, 'rating'); i++) {
        star += "⭐"
    }

    let ticketAuthor = client.users.cache.get(client.reviewsData.get(interaction.message.id, 'ticketCreatorID'))
    let reviewChannel = guild.channels.cache.get(config.TicketReviewSettings.ReviewChannelID);
    const embed = new EmbedBuilder()
    .setTitle(`${config.Locale.newTicketReview} (#${client.globalStats.get(`${guild.id}`, "totalReviews")})`)
    .setColor(config.EmbedColors)
    .setThumbnail(interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
    .addFields([
        { name: `${config.Locale.ticketInformationCloseDM}`, value: `> ${config.Locale.logsTicketAuthor}: <@!${ticketAuthor.id}> (${ticketAuthor.tag})\n> ${config.Locale.categoryCloseDM} ${client.reviewsData.get(`${interaction.message.id}`, "category")}\n> ${config.Locale.totalMessagesLog} ${client.reviewsData.get(`${interaction.message.id}`, "totalMessages")}` },
        { name: `${config.Locale.ticketReview}`, value: `> ${star}\n> ${firstResponse}` },
      ])
    .setTimestamp()
    .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL({ dynamic: true })}` })
    if(reviewChannel) reviewChannel.send({ embeds: [embed] })

    await logsChannel.messages.fetch(client.reviewsData.get(interaction.message.id, 'tCloseLogMsgID')).then(async (msg) => {
      const embed = msg.embeds[0]
      embed.fields[3] = { name: `• ${config.Locale.ticketRating}`, value: `> ${star} \`\`(${client.reviewsData.get(interaction.message.id, 'rating')}/5)\`\`\n> ${firstResponse}` }
      await msg.edit({ embeds: [embed] })
})

}
}

// Delete ticket button
if (interaction.customId === 'deleteTicket') {

    let supportRole = false
    let tButton = client.tickets.get(`${interaction.channel.id}`, "button");
    if(tButton === "TicketButton1") {
      for(let i = 0; i < config.TicketButton1.SupportRoles.length; i++) {
          if(interaction.member.roles.cache.has(config.TicketButton1.SupportRoles[i])) supportRole = true;
      }
  } else if(tButton === "TicketButton2") {
      for(let i = 0; i < config.TicketButton2.SupportRoles.length; i++) {
          if(interaction.member.roles.cache.has(config.TicketButton2.SupportRoles[i])) supportRole = true;
        }
  } else if(tButton === "TicketButton3") {
      for(let i = 0; i < config.TicketButton3.SupportRoles.length; i++) {
          if(interaction.member.roles.cache.has(config.TicketButton3.SupportRoles[i])) supportRole = true;
        }
  } else if(tButton === "TicketButton4") {
      for(let i = 0; i < config.TicketButton4.SupportRoles.length; i++) {
          if(interaction.member.roles.cache.has(config.TicketButton4.SupportRoles[i])) supportRole = true;
        }
  } else if(tButton === "TicketButton5") {
      for(let i = 0; i < config.TicketButton5.SupportRoles.length; i++) {
          if(interaction.member.roles.cache.has(config.TicketButton5.SupportRoles[i])) supportRole = true;
        }
  } else if(tButton === "TicketButton6") {
      for(let i = 0; i < config.TicketButton6.SupportRoles.length; i++) {
          if(interaction.member.roles.cache.has(config.TicketButton6.SupportRoles[i])) supportRole = true;
        }
  } else if(tButton === "TicketButton7") {
      for(let i = 0; i < config.TicketButton7.SupportRoles.length; i++) {
          if(interaction.member.roles.cache.has(config.TicketButton7.SupportRoles[i])) supportRole = true;
        }
  } else if(tButton === "TicketButton8") {
      for(let i = 0; i < config.TicketButton8.SupportRoles.length; i++) {
          if(interaction.member.roles.cache.has(config.TicketButton8.SupportRoles[i])) supportRole = true;
        }
  }
    if(supportRole === false) return interaction.reply({ content: config.Locale.notAllowedDelete, ephemeral: true })


    interaction.channel.messages.fetch(client.tickets.get(interaction.channel.id, 'archiveMsgID')).then(msg => {
        msg.delete()
    })

    if(config.ArchiveTickets.Enabled === false) await client.tickets.set(interaction.channel.id, interaction.user.id, "closeUserID");
    await client.emit('ticketClose', interaction);
}


// Re-Open ticket button
if (interaction.customId === 'reOpen') {
    await interaction.deferReply();
    let tButton = client.tickets.get(`${interaction.channel.id}`, "button");
    let ticketAuthor = client.users.cache.get(client.tickets.get(`${interaction.channel.id}`, "userID"))
    let ticketChannel = interaction.guild.channels.cache.get(interaction.channel.id);

    let ticketReOpenedLocale = config.Locale.ticketReOpenedBy.replace(/{user}/g, `<@!${interaction.user.id}>`).replace(/{user-tag}/g, `${interaction.user.tag}`);
    const embed = new EmbedBuilder()
    .setColor("Green")
    .setDescription(ticketReOpenedLocale)

    if(tButton === "TicketButton1") {
        if(config.TicketButton1.ClosedCategoryID && ticketChannel.parentId !== config.TicketButton1.TicketCategoryID) await ticketChannel.setParent(config.TicketButton1.TicketCategoryID, {lockPermissions: false})
        await config.TicketButton1.SupportRoles.forEach(sRoles => {
          role = interaction.guild.roles.cache.get(sRoles);
          if(role) {
            interaction.channel.permissionOverwrites.create(role.id, { ViewChannel: true, SendMessages: true, AttachFiles: true, EmbedLinks: true, ReadMessageHistory: true })
        }
      })
      let tChannelName = config.TicketButton1.ChannelName.replace(/{username}/g, `${ticketAuthor.username}`).replace(/{total-tickets}/g, `${client.globalStats.get(`${interaction.guild.id}`, "totalTickets")}`).replace(/{user-tag}/g, `${ticketAuthor.tag}`).replace(/{user-id}/g, `${ticketAuthor.id}`)
      if(config.ArchiveTickets.RenameClosedTicket) interaction.channel.setName(`${tChannelName}`)

      } else if(tButton === "TicketButton2") {
        if(config.TicketButton2.ClosedCategoryID && ticketChannel.parentId !== config.TicketButton2.TicketCategoryID) await ticketChannel.setParent(config.TicketButton2.TicketCategoryID, {lockPermissions: false})
        await config.TicketButton2.SupportRoles.forEach(sRoles => {
          role = interaction.guild.roles.cache.get(sRoles);
          if(role) {
            interaction.channel.permissionOverwrites.create(role.id, { ViewChannel: true, SendMessages: true, AttachFiles: true, EmbedLinks: true, ReadMessageHistory: true })
        }
      })
      let tChannelName = config.TicketButton2.ChannelName.replace(/{username}/g, `${ticketAuthor.username}`).replace(/{total-tickets}/g, `${client.globalStats.get(`${interaction.guild.id}`, "totalTickets")}`).replace(/{user-tag}/g, `${ticketAuthor.tag}`).replace(/{user-id}/g, `${ticketAuthor.id}`)
      if(config.ArchiveTickets.RenameClosedTicket) interaction.channel.setName(`${tChannelName}`)

      } else if(tButton === "TicketButton3") {
        if(config.TicketButton3.ClosedCategoryID && ticketChannel.parentId !== config.TicketButton3.TicketCategoryID) await ticketChannel.setParent(config.TicketButton3.TicketCategoryID, {lockPermissions: false})
        await config.TicketButton3.SupportRoles.forEach(sRoles => {
            role = interaction.guild.roles.cache.get(sRoles);
            if(role) {
                interaction.channel.permissionOverwrites.create(role.id, { ViewChannel: true, SendMessages: true, AttachFiles: true, EmbedLinks: true, ReadMessageHistory: true })
            }
        })
        let tChannelName = config.TicketButton3.ChannelName.replace(/{username}/g, `${ticketAuthor.username}`).replace(/{total-tickets}/g, `${client.globalStats.get(`${interaction.guild.id}`, "totalTickets")}`).replace(/{user-tag}/g, `${ticketAuthor.tag}`).replace(/{user-id}/g, `${ticketAuthor.id}`)
        if(config.ArchiveTickets.RenameClosedTicket) interaction.channel.setName(`${tChannelName}`)

      } else if(tButton === "TicketButton4") {
        if(config.TicketButton4.ClosedCategoryID && ticketChannel.parentId !== config.TicketButton4.TicketCategoryID) await ticketChannel.setParent(config.TicketButton4.TicketCategoryID, {lockPermissions: false})
        await config.TicketButton4.SupportRoles.forEach(sRoles => {
            role = interaction.guild.roles.cache.get(sRoles);
            if(role) {
                interaction.channel.permissionOverwrites.create(role.id, { ViewChannel: true, SendMessages: true, AttachFiles: true, EmbedLinks: true, ReadMessageHistory: true })
            }
        })
        let tChannelName = config.TicketButton4.ChannelName.replace(/{username}/g, `${ticketAuthor.username}`).replace(/{total-tickets}/g, `${client.globalStats.get(`${interaction.guild.id}`, "totalTickets")}`).replace(/{user-tag}/g, `${ticketAuthor.tag}`).replace(/{user-id}/g, `${ticketAuthor.id}`)
        if(config.ArchiveTickets.RenameClosedTicket) interaction.channel.setName(`${tChannelName}`)

      } else if(tButton === "TicketButton5") {
        if(config.TicketButton5.ClosedCategoryID && ticketChannel.parentId !== config.TicketButton5.TicketCategoryID) await ticketChannel.setParent(config.TicketButton5.TicketCategoryID, {lockPermissions: false})
        await config.TicketButton5.SupportRoles.forEach(sRoles => {
            role = interaction.guild.roles.cache.get(sRoles);
            if(role) {
              interaction.channel.permissionOverwrites.create(role.id, { ViewChannel: true, SendMessages: true, AttachFiles: true, EmbedLinks: true, ReadMessageHistory: true })
          }
        })
        let tChannelName = config.TicketButton5.ChannelName.replace(/{username}/g, `${ticketAuthor.username}`).replace(/{total-tickets}/g, `${client.globalStats.get(`${interaction.guild.id}`, "totalTickets")}`).replace(/{user-tag}/g, `${ticketAuthor.tag}`).replace(/{user-id}/g, `${ticketAuthor.id}`)
        if(config.ArchiveTickets.RenameClosedTicket) interaction.channel.setName(`${tChannelName}`)
      } else if(tButton === "TicketButton6") {
        if(config.TicketButton6.ClosedCategoryID && ticketChannel.parentId !== config.TicketButton6.TicketCategoryID) await ticketChannel.setParent(config.TicketButton6.TicketCategoryID, {lockPermissions: false})
        await config.TicketButton6.SupportRoles.forEach(sRoles => {
            role = interaction.guild.roles.cache.get(sRoles);
            if(role) {
              interaction.channel.permissionOverwrites.create(role.id, { ViewChannel: true, SendMessages: true, AttachFiles: true, EmbedLinks: true, ReadMessageHistory: true })
          }
        })
        let tChannelName = config.TicketButton6.ChannelName.replace(/{username}/g, `${ticketAuthor.username}`).replace(/{total-tickets}/g, `${client.globalStats.get(`${interaction.guild.id}`, "totalTickets")}`).replace(/{user-tag}/g, `${ticketAuthor.tag}`).replace(/{user-id}/g, `${ticketAuthor.id}`)
        if(config.ArchiveTickets.RenameClosedTicket) interaction.channel.setName(`${tChannelName}`)
      } else if(tButton === "TicketButton7") {
        if(config.TicketButton7.ClosedCategoryID && ticketChannel.parentId !== config.TicketButton7.TicketCategoryID) await ticketChannel.setParent(config.TicketButton7.TicketCategoryID, {lockPermissions: false})
        await config.TicketButton7.SupportRoles.forEach(sRoles => {
            role = interaction.guild.roles.cache.get(sRoles);
            if(role) {
              interaction.channel.permissionOverwrites.create(role.id, { ViewChannel: true, SendMessages: true, AttachFiles: true, EmbedLinks: true, ReadMessageHistory: true })
          }
        })
        let tChannelName = config.TicketButton7.ChannelName.replace(/{username}/g, `${ticketAuthor.username}`).replace(/{total-tickets}/g, `${client.globalStats.get(`${interaction.guild.id}`, "totalTickets")}`).replace(/{user-tag}/g, `${ticketAuthor.tag}`).replace(/{user-id}/g, `${ticketAuthor.id}`)
        if(config.ArchiveTickets.RenameClosedTicket) interaction.channel.setName(`${tChannelName}`)
      } else if(tButton === "TicketButton8") {
        if(config.TicketButton8.ClosedCategoryID && ticketChannel.parentId !== config.TicketButton8.TicketCategoryID) await ticketChannel.setParent(config.TicketButton8.TicketCategoryID, {lockPermissions: false})
        await config.TicketButton8.SupportRoles.forEach(sRoles => {
            role = interaction.guild.roles.cache.get(sRoles);
            if(role) {
              interaction.channel.permissionOverwrites.create(role.id, { ViewChannel: true, SendMessages: true, AttachFiles: true, EmbedLinks: true, ReadMessageHistory: true })
          }
        })
        let tChannelName = config.TicketButton8.ChannelName.replace(/{username}/g, `${ticketAuthor.username}`).replace(/{total-tickets}/g, `${client.globalStats.get(`${interaction.guild.id}`, "totalTickets")}`).replace(/{user-tag}/g, `${ticketAuthor.tag}`).replace(/{user-id}/g, `${ticketAuthor.id}`)
        if(config.ArchiveTickets.RenameClosedTicket) interaction.channel.setName(`${tChannelName}`)
      }

    let claimUser = await client.users.cache.get(client.tickets.get(`${interaction.channel.id}`, "claimUser"))

    await interaction.channel.permissionOverwrites.create(ticketAuthor.id, { ViewChannel: true, SendMessages: true, AttachFiles: true, EmbedLinks: true, ReadMessageHistory: true })
    if(claimUser && config.ClaimingSystem.Enabled) await interaction.channel.permissionOverwrites.create(claimUser.id, { ViewChannel: true, SendMessages: true, AttachFiles: true, EmbedLinks: true, ReadMessageHistory: true })

    await interaction.channel.messages.fetch(client.tickets.get(interaction.channel.id, 'archiveMsgID')).then(msg => {
        msg.delete()
    })

    await client.tickets.set(interaction.channel.id, "Open", "status");
    await interaction.followUp({ embeds: [embed] })
}

// Create transcript button
if (interaction.customId === 'createTranscript') {

    let supportRole = false
    let tButton = client.tickets.get(`${interaction.channel.id}`, "button");
    if(tButton === "TicketButton1") {
      for(let i = 0; i < config.TicketButton1.SupportRoles.length; i++) {
          if(interaction.member.roles.cache.has(config.TicketButton1.SupportRoles[i])) supportRole = true;
      }
  } else if(tButton === "TicketButton2") {
      for(let i = 0; i < config.TicketButton2.SupportRoles.length; i++) {
          if(interaction.member.roles.cache.has(config.TicketButton2.SupportRoles[i])) supportRole = true;
        }
  } else if(tButton === "TicketButton3") {
      for(let i = 0; i < config.TicketButton3.SupportRoles.length; i++) {
          if(interaction.member.roles.cache.has(config.TicketButton3.SupportRoles[i])) supportRole = true;
        }
  } else if(tButton === "TicketButton4") {
      for(let i = 0; i < config.TicketButton4.SupportRoles.length; i++) {
          if(interaction.member.roles.cache.has(config.TicketButton4.SupportRoles[i])) supportRole = true;
        }
  } else if(tButton === "TicketButton5") {
      for(let i = 0; i < config.TicketButton5.SupportRoles.length; i++) {
          if(interaction.member.roles.cache.has(config.TicketButton5.SupportRoles[i])) supportRole = true;
        }
  } else if(tButton === "TicketButton6") {
      for(let i = 0; i < config.TicketButton6.SupportRoles.length; i++) {
          if(interaction.member.roles.cache.has(config.TicketButton6.SupportRoles[i])) supportRole = true;
        }
  } else if(tButton === "TicketButton7") {
      for(let i = 0; i < config.TicketButton7.SupportRoles.length; i++) {
          if(interaction.member.roles.cache.has(config.TicketButton7.SupportRoles[i])) supportRole = true;
        }
  } else if(tButton === "TicketButton8") {
      for(let i = 0; i < config.TicketButton8.SupportRoles.length; i++) {
          if(interaction.member.roles.cache.has(config.TicketButton8.SupportRoles[i])) supportRole = true;
        }
  }
    if(supportRole === false) return interaction.reply({ content: config.Locale.notAllowedTranscript, ephemeral: true })

    let ticketAuthor = client.users.cache.get(client.tickets.get(`${interaction.channel.id}`, "userID"))

    let attachment = await utils.saveTranscript(interaction)

    let transcriptSavedByLocale = config.Locale.transcriptSavedBy.replace(/{user}/g, `<@!${interaction.user.id}>`);
    const embed = new EmbedBuilder()
    .setColor(config.EmbedColors)
    .setTitle(config.Locale.ticketTranscript)
    .setDescription(transcriptSavedByLocale)
    .addFields([
        { name: `${config.Locale.logsTicketAuthor}`, value: `<@!${ticketAuthor.id}>\n${ticketAuthor.tag}`, inline: true },
        { name: `${config.Locale.ticketName}`, value: `<#${interaction.channel.id}>\n${interaction.channel.name}`, inline: true },
        { name: `${config.Locale.ticketTranscriptCategory}`, value: `${client.tickets.get(`${interaction.channel.id}`, "ticketType")}`, inline: true },
      ])
    .setFooter({ text: `${ticketAuthor.tag}`, iconURL: `${ticketAuthor.displayAvatarURL({ dynamic: true })}` })
    .setTimestamp()

    let transcriptChannel = interaction.guild.channels.cache.get(config.ArchiveTickets.TranscriptChannelID);
    if(!transcriptChannel) return interaction.reply({ content: `Transcript channel has not been setup in the config!`, ephemeral: true })
    if(transcriptChannel) transcriptChannel.send({ embeds: [embed], files: [attachment] })
    let transcriptSavedLocale = config.Locale.transcriptSaved.replace(/{channel}/g, `<#${transcriptChannel.id}>`);
    interaction.reply({ content: transcriptSavedLocale, ephemeral: true })
}



// Ticket close reason modal
if (config.TicketSettings.TicketCloseReason && interaction.isModalSubmit() && interaction.customId === "closeReason") {

    const reasonForClose = interaction.fields.getTextInputValue('reasonForClose');
    
    await client.tickets.set(interaction.channel.id, reasonForClose, 'closeReason');
    await client.emit('ticketClose', interaction);
}
}