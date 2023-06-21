const {getTypeFromCommandName, MessageType} = require('./GptMessenger');
const {encode, decode} = require("gpt-3-encoder");
const {EmbedBuilder} = require("discord.js");

class InteractionsHandler {

    constructor(cooldownManager, messenger) {
        this.cooldownManager = cooldownManager;
        this.messenger = messenger;
    }

    async handleInteraction(interaction) {
        if (!interaction.isCommand() && !interaction.isMessageContextMenuCommand()) return;

        const {commandName, options} = interaction;

        const type = getTypeFromCommandName(commandName);
        if (type == null) return;

        let messageUserId = interaction.user.id;
        let interactionUserId = interaction.user.id;
        let message = null;

        if (interaction.isMessageContextMenuCommand()) {
            message = interaction.targetMessage.content;
            interactionUserId = interaction.user.id;
            messageUserId = interaction.targetMessage.author.id;
        } else if (interaction.isCommand()) {
            message = options.getString('message');
        }

        if (message == null || message.trim().length === 0) {
            interaction.reply({content: "I failed to perform this action on the provided message since the message is empty.", ephemeral: true});
            return;
        }

        message = this.limitMessageTokens(message);

        const cooldown = this.cooldownManager.getCooldown(interactionUserId, type);
        if (cooldown > 0) {
            const displayName = this.cooldownManager.getCooldownDisplayName(cooldown);

            await interaction.deferReply({ephemeral: true});
            await interaction.editReply(`Please don't spam the command. You must wait another ${displayName} to use the command again.`);
            return;
        } else {
            this.cooldownManager.setCooldown(interactionUserId, type);
            await interaction.deferReply();
        }

        await this.handleResponse(interaction, type, message, messageUserId, interactionUserId);
    }

    async handleResponse(interaction, type, message, messageUserId, interactionUserId) {
        let response = null;
        if (type === MessageType.AGGRESSIVENESS) {
            response = await this.messenger.measureAggressiveness(message);
        } else if (type === MessageType.ANALYZE) {
            response = await this.messenger.analyzeMessage(message);
        }

        if (response == null) {
            await interaction.editReply("I couldn't connect to the OpenAI API, sorry.");
            return;
        }

        try {
            response = JSON.parse(response);

            if (type === MessageType.AGGRESSIVENESS) {
                await this.handleAggressionResponse(interaction, message, response, messageUserId, interactionUserId);
            } else if (type === MessageType.ANALYZE) {
                await this.handleAnalyzeResponse(interaction, message, response, messageUserId, interactionUserId);
            }
        } catch (e) {
            console.error(e);
            await interaction.editReply(`I did not receive a valid response from ChatGPT. Here is the response I received: \`\`\`\n${response}\n\`\`\``);
        }
    }

    async handleAggressionResponse(interaction, message, response, messageUserId, interactionUserId) {
        if (!response?.rating || !response?.explanation) {
            await interaction.editReply("I couldn't understand ChatGPT's response. Please try again.");
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('Aggressiveness Analysis')
            .setDescription(`An analysis of the aggressiveness of the message that was submitted by <@${interactionUserId}>${interactionUserId !== messageUserId ? ` about <@${messageUserId}>'s message` : ''}.`)
            .setColor(this.generateColor(response.rating))
            .addFields(
                {name: 'Message', value: this.getOriginalMessage(message)},
                {name: 'Score', value: `${parseFloat(response.rating).toFixed(1)}`},
                {name: 'Explanation', value: response.explanation}
            );

        await interaction.editReply({embeds: [embed]});
    }

    async handleAnalyzeResponse(interaction, message, response, messageUserId, interactionUserId) {
        if (!response?.tone || !response?.sarcasm || !response?.intent || !response?.sentiment|| !response?.explanation) {
            await interaction.editReply("I couldn't understand ChatGPT's response. Please try again.");
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('Message Analysis')
            .setDescription(`An analysis of the message that was submitted by <@${interactionUserId}>${interactionUserId !== messageUserId ? ` about <@${messageUserId}>'s message` : ''}.`)
            .setColor("#5764ef")
            .addFields(
                {name: 'Message', value: this.getOriginalMessage(message)},
                {name: 'Tone', value: response.tone, inline: true},
                {name: 'Sarcasm', value: `${parseFloat(response.sarcasm).toFixed(1)}`, inline: true},
                {name: 'Intent', value: response.intent, inline: true},
                {name: 'Sentiment', value: response.sentiment, inline: true},
                {name: 'Explanation', value: response.explanation}
            );

        await interaction.editReply({embeds: [embed]});
    }

    limitMessageTokens(message, maxTokens = 750) {
        const encoded = encode(message);

        if (encoded.length <= maxTokens) return message;

        encoded.length = maxTokens;
        return decode(encoded);
    }

    getOriginalMessage(message) {
        const len = message.length;
        if (len >= 1500) {
            return message.substring(0, 1500) + '...';
        }

        return message;
    }

    generateColor(aggressiveness) {
        const colors = [
            "#05ff00",
            "#2cff00",
            "#73ff00",
            "#cdff00",
            "#ffbc00",
            "#ff6e00",
            "#ff4000",
            "#ff1e00",
            "#ff0500",
            "#ff000d",
        ];

        const index = Math.max(Math.min(aggressiveness - 1, colors.length - 1), 0);
        return colors[index];
    }

}

module.exports = InteractionsHandler;