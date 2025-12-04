export const sendPushNotification = (deviceTokens: string[], title: string, message: string, data?: any) => {
  try {
    // Push notification payload
    const payload = {
      notification: {
        title: title,
        body: message,
      },
      data: data || {},
    };

    // Log for demonstration (integrate with FCM, OneSignal, or similar service)
    console.log("Push notification sent:", {
      deviceTokens,
      payload,
    });

    return true;
  } catch (error) {
    console.error("Error sending push notification:", error);
    throw error;
  }
};