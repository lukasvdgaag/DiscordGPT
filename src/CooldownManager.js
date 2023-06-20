class CooldownManager {

    // map with maps of cooldowns
    // command: map<userId, lastUsed>
    cooldowns = new Map();

    getCooldown(userId, command) {
        if (!this.cooldowns.has(command)) return 0;

        const userCooldowns = this.cooldowns.get(command);
        if (!userCooldowns.has(userId)) return 0;

        // return the time left
        return Math.max(0, userCooldowns.get(userId) - Date.now());
    }

    setCooldown(userId, command) {
        const newCooldown = Date.now() + (1000 * 60 * 3); // 3 minutes
        if (!this.cooldowns.has(command)) {
            this.cooldowns.set(command, new Map([[userId, newCooldown]]));
            console.log(this.cooldowns)
            return;
        }

        this.cooldowns.get(command).set(userId, newCooldown);
    }

    getCooldownDisplayName(cooldown) {
        // convert the cooldown in milliseconds to possible minutes / seconds.
        const seconds = Math.floor(cooldown / 1000);
        const minutes = Math.floor(seconds / 60);

        if (minutes > 0) {
            return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        }

        return `${seconds} second${seconds > 1 ? 's' : ''}`;
    }

    flushExpiredCooldowns() {
        for (const [command, userCooldowns] of this.cooldowns.entries()) {
            for (const [userId, cooldown] of userCooldowns.entries()) {
                if (cooldown <= Date.now()) {
                    userCooldowns.delete(userId);
                }
            }
        }
    }

}

module.exports = CooldownManager;