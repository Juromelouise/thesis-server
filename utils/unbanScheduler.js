const cron = require("node-cron");
const Ban = require("../model/Ban");
const User = require("../model/User");

cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    if (isNaN(now)) {
      console.error("Invalid date at cron execution:", now);
      return;
    }
    const expiredBans = await Ban.find({
      endDate: { $ne: null, $lte: new Date() },
    });

    const userIds = expiredBans.map((ban) => ban.user.toString());
    const users = await User.findWithDeleted({
      _id: { $in: userIds },
    });

    for (const user of users) {
      if (user) {
        await user.unbanUser();
      }
    }
  } catch (err) {
    console.error("Error in unban scheduler:", err);
  }
});
