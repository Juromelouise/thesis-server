const { Expo } = require("expo-server-sdk");
exports.pushNotification = async (data, pushToken) => {
  const expo = new Expo();

  try {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error("Invalid Expo push token:", pushToken);
      return { success: false, message: "Invalid Expo push token" };
    }

    const messages = [
      {
        to: pushToken,
        sound: "default",
        title: data.title,
        body: data.message,
        data: data.data || {},
      },
    ];

    const ticket = await expo.sendPushNotificationsAsync(messages);

    console.log("Push notification sent successfully:", ticket);
  } catch (error) {
    console.error("Error sending push notification:", error);
    return {
      success: false,
      message: "Error sending push notification",
      error,
    };
  }
};
