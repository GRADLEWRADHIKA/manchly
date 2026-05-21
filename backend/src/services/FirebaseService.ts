import admin from "firebase-admin";
import path from "path";

// Initialize Firebase Admin SDK
const serviceAccountPath = path.resolve(__dirname, "../../manchly-firebase-adminsdk-fbsvc-93e48ccd3f.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  });
}

interface CallNotificationData {
  callId: string;
  sessionId: string;
  mode: string;
  callerName: string;
  callerImage?: string;
  callerId: string;
}

class FirebaseService {
  async sendCallNotification(fcmToken: string, data: CallNotificationData) {
    try {
      await admin.messaging().send({
        token: fcmToken,
        data: {
          type: "incoming_call",
          callId: data.callId,
          sessionId: data.sessionId,
          mode: data.mode,
          callerName: data.callerName,
          callerImage: data.callerImage || "",
          callerId: data.callerId,
        },
        android: {
          priority: "high",
          notification: {
            channelId: "incoming_calls",
            title: "Incoming Video Call",
            body: `${data.callerName} is calling you`,
            sound: "ringtone",
            priority: "max",
          },
        },
        apns: {
          headers: {
            "apns-priority": "10",
            "apns-push-type": "alert",
          },
          payload: {
            aps: {
              alert: {
                title: "Incoming Video Call",
                body: `${data.callerName} is calling you`,
              },
              sound: "ringtone.mp3",
              "content-available": 1,
              "mutable-content": 1,
              category: "INCOMING_CALL",
            },
          },
        },
      });
      console.log(`[FCM] Call notification sent to token: ${fcmToken.slice(0, 10)}...`);
    } catch (error: any) {
      console.error("[FCM] Failed to send call notification:", error.message);
    }
  }
}

export const firebaseService = new FirebaseService();
export default FirebaseService;
