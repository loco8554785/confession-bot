const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const CHANNEL_IDS = {
    confession: "1557907584416219146",
    approve: "1557907666687500318",
    log: "1557907628556943430"
};

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    const data = [{
        name: 'confession',
        description: 'إرسال اعتراف سرّي',
    }];

    await client.application.commands.set(data);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'confession') {
            const modal = new ModalBuilder()
                .setCustomId('confession_modal')
                .setTitle('إرسال اعتراف جديد');

            const confessionInput = new TextInputBuilder()
                .setCustomId('confession_text')
                .setLabel('اكتب اعترافك هنا:')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(confessionInput);
            modal.addComponents(row);

            await interaction.showModal(modal);
        }
    } else if (interaction.isModalSubmit()) {
        if (interaction.customId === 'confession_modal') {
            const confessionText = interaction.fields.getTextInputValue('confession_text');
            
            await interaction.reply({ content: 'تم إرسال اعترافك للإدارة للمراجعة بنجاح!', ephemeral: true });

            const approveChannel = await client.channels.fetch(CHANNEL_IDS.approve);
            if (!approveChannel) return;

            const embed = new EmbedBuilder()
                .setTitle('اعتراف جديد قيد المراجعة')
                .setDescription(confessionText)
                .setColor(0xFFAA00)
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('accept_confession')
                    .setLabel('قبول')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('reject_confession')
                    .setLabel('رفض')
                    .setStyle(ButtonStyle.Danger)
            );

            await approveChannel.send({ embeds: [embed], components: [row] });
        }
    } else if (interaction.isButton()) {
        if (interaction.customId === 'accept_confession' || interaction.customId === 'reject_confession') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({ content: 'ليس لديك صلاحية للقيام بذلك!', ephemeral: true });
            }

            const message = interaction.message;
            const embed = message.embeds[0];
            const confessionText = embed.description;

            if (interaction.customId === 'accept_confession') {
                const confessionChannel = await client.channels.fetch(CHANNEL_IDS.confession);
                if (confessionChannel) {
                    const finalEmbed = new EmbedBuilder()
                        .setTitle('اعتراف جديد 🤍')
                        .setDescription(confessionText)
                        .setColor(0x00FF00)
                        .setTimestamp();

                    await confessionChannel.send({ embeds: [finalEmbed] });
                }

                const logChannel = await client.channels.fetch(CHANNEL_IDS.log);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('تم قبول اعتراف')
                        .setDescription(`بواسطة: ${interaction.user.tag}\n\n${confessionText}`)
                        .setColor(0x00FF00)
                        .setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] });
                }

                await message.update({ content: `تم القبول بواسطة ${interaction.user.tag}`, components: [] });
            } else {
                const logChannel = await client.channels.fetch(CHANNEL_IDS.log);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('تم رفض اعتراف')
                        .setDescription(`بواسطة: ${interaction.user.tag}\n\n${confessionText}`)
                        .setColor(0xFF0000)
                        .setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] });
                }

                await message.update({ content: `تم الرفض بواسطة ${interaction.user.tag}`, components: [] });
            }
        }
    }
});

client.login('MTU1Nzg1MzkyMjIxNzk1MTI5Mw.Gvpr8i.gaxTWrccjB-PwhArOX42YSXV7go43rSuHQ1TKk');