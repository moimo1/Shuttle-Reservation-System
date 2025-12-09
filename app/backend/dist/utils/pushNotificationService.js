export const sendPushNotification = (deviceTokens, title, message, data) => {
    try {
        const payload = {
            notification: {
                title: title,
                body: message,
            },
            data: data || {},
        };
        console.log("Push notification sent:", {
            deviceTokens,
            payload,
        });
        return true;
    }
    catch (error) {
        console.error("Error sending push notification:", error);
        throw error;
    }
};
//# sourceMappingURL=pushNotificationService.js.map