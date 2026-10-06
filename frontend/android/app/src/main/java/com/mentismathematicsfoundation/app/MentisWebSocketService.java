package com.mentismathematicsfoundation.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import org.json.JSONObject;

import java.util.concurrent.TimeUnit;

public class MentisWebSocketService extends Service {
    private static final String TAG = "MentisWSService";
    public static final String ACTION_START = "com.mentis.action.START_SYNC";
    public static final String ACTION_STOP = "com.mentis.action.STOP_SYNC";
    public static final String EXTRA_USER_ID = "extra_user_id";
    public static final String EXTRA_AUTH_TOKEN = "extra_auth_token";
    public static final String EXTRA_WS_URL = "extra_ws_url";

    private static final String SERVICE_CHANNEL_ID = "mentis_background_sync_channel";
    private static final int SERVICE_NOTIFICATION_ID = 9001;

    private OkHttpClient client;
    private WebSocket webSocket;
    private String currentUserId;
    private String currentAuthToken;
    private String currentWsUrl;
    private boolean isRunning = false;
    private boolean shouldReconnect = true;
    private int reconnectAttempts = 0;

    @Override
    public void onCreate() {
        super.onCreate();
        client = new OkHttpClient.Builder()
            .readTimeout(0, TimeUnit.MILLISECONDS)
            .pingInterval(15, TimeUnit.SECONDS) // Keep TCP connection alive & avoid carrier/NAT timeouts
            .retryOnConnectionFailure(true)
            .build();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            if (ACTION_START.equals(action)) {
                String userId = intent.getStringExtra(EXTRA_USER_ID);
                String token = intent.getStringExtra(EXTRA_AUTH_TOKEN);
                String wsUrl = intent.getStringExtra(EXTRA_WS_URL);
                startForegroundSync(userId, token, wsUrl);
            } else if (ACTION_STOP.equals(action)) {
                stopForegroundSync();
            }
        }
        return START_STICKY;
    }

    private void startForegroundSync(String userId, String token, String wsUrl) {
        if ((userId == null || userId.isEmpty()) && (token == null || token.isEmpty())) {
            return;
        }

        this.currentUserId = (userId != null && !userId.isEmpty()) ? userId : token;
        this.currentAuthToken = (token != null && !token.isEmpty()) ? token : userId;
        this.currentWsUrl = wsUrl;
        this.shouldReconnect = true;
        this.reconnectAttempts = 0;

        createServiceChannel();
        Notification notification = new NotificationCompat.Builder(this, SERVICE_CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("Mentis")
            .setContentText("Live messaging active")
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setVisibility(NotificationCompat.VISIBILITY_SECRET)
            .build();

        try {
            startForeground(SERVICE_NOTIFICATION_ID, notification);
        } catch (Exception e) {
            Log.w(TAG, "Could not start foreground: " + e.getMessage());
        }

        connectWebSocket();
    }

    private void stopForegroundSync() {
        shouldReconnect = false;
        if (webSocket != null) {
            try {
                webSocket.close(1000, "Service stopped");
            } catch (Exception ignored) {}
            webSocket = null;
        }
        stopForeground(true);
        stopSelf();
    }

    private synchronized void connectWebSocket() {
        if (!shouldReconnect) return;

        if (webSocket != null) {
            try { webSocket.close(1000, "Reconnecting"); } catch (Exception ignored) {}
            webSocket = null;
        }

        String targetUrl = currentWsUrl;
        if (targetUrl == null || targetUrl.isEmpty()) {
            targetUrl = "wss://mentismathematicsfoundation.com";
        }
        if (targetUrl.endsWith("/")) {
            targetUrl = targetUrl.substring(0, targetUrl.length() - 1);
        }

        // Use authToken or userId to connect to backend endpoint
        String identifier = (currentAuthToken != null && !currentAuthToken.isEmpty()) 
            ? currentAuthToken 
            : currentUserId;

        if (!targetUrl.contains("/ws/")) {
            targetUrl = targetUrl + "/ws/" + identifier;
        }

        Log.d(TAG, "Connecting background WebSocket to: " + targetUrl);
        Request request = new Request.Builder()
            .url(targetUrl)
            .build();

        webSocket = client.newWebSocket(request, new WebSocketListener() {
            @Override
            public void onOpen(WebSocket ws, Response response) {
                Log.d(TAG, "Background WebSocket connected successfully!");
                isRunning = true;
                reconnectAttempts = 0;
            }

            @Override
            public void onMessage(WebSocket ws, String text) {
                acquireWakeLock(); // Wake CPU immediately so zero time-lag on Pixel/Android
                handleIncomingMessage(text);
            }

            @Override
            public void onClosed(WebSocket ws, int code, String reason) {
                Log.d(TAG, "Background WebSocket closed: " + reason);
                isRunning = false;
                scheduleReconnect();
            }

            @Override
            public void onFailure(WebSocket ws, Throwable t, Response response) {
                Log.w(TAG, "Background WebSocket failure: " + t.getMessage());
                isRunning = false;
                scheduleReconnect();
            }
        });
    }

    private void scheduleReconnect() {
        if (!shouldReconnect) return;
        reconnectAttempts++;
        // Fast exponential retry: 1s, 2s, 4s (max 8s)
        long delayMs = Math.min(1000L * (1L << Math.min(reconnectAttempts, 3)), 8000L);
        new Thread(() -> {
            try {
                Thread.sleep(delayMs);
                if (shouldReconnect) {
                    connectWebSocket();
                }
            } catch (InterruptedException ignored) {}
        }).start();
    }

    private void acquireWakeLock() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                PowerManager.WakeLock wakeLock = pm.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                    "Mentis:NotificationWakeLock"
                );
                wakeLock.acquire(3000); // 3 seconds is plenty for notification posting
            }
        } catch (Exception e) {
            Log.w(TAG, "WakeLock error: " + e.getMessage());
        }
    }

    private void handleIncomingMessage(String text) {
        try {
            JSONObject json = new JSONObject(text);
            String type = json.optString("type", "");

            // 1. One-on-one Chat Message
            if ("new_message".equals(type) || "private_message".equals(type)) {
                JSONObject msgObj = json.optJSONObject("message");
                if (msgObj != null) {
                    String senderId = msgObj.optString("sender_id", "");
                    // Do not notify for user's own sent messages
                    if (currentUserId != null && currentUserId.equals(senderId)) {
                        return;
                    }

                    String senderName = msgObj.optString("sender_name", "Mathmate");
                    String content = msgObj.optString("content", "");
                    if (content == null || content.isEmpty()) {
                        JSONObject attachment = msgObj.optJSONObject("attachment");
                        content = attachment != null ? "📎 Attachment" : "Sent a new message";
                    }

                    String connectionId = msgObj.optString("connection_id", "");
                    String route = connectionId.isEmpty() ? "/connect" : ("/connect?chat=" + connectionId);
                    String title = "Mathmate • " + senderName;

                    MentisNotificationHelper.showNotification(getApplicationContext(), title, content, route);
                }
            } 
            // 2. Group Chat Message
            else if ("group_message".equals(type)) {
                JSONObject msgObj = json.optJSONObject("message");
                if (msgObj != null) {
                    String senderId = msgObj.optString("sender_id", "");
                    if (currentUserId != null && currentUserId.equals(senderId)) {
                        return;
                    }

                    String groupName = json.optString("group_name", "Study Group");
                    String senderName = msgObj.optString("sender_name", "Member");
                    String content = msgObj.optString("content", "Sent a file");
                    String groupId = json.optString("group_id", "");

                    String title = "Group: " + groupName;
                    String body = senderName + ": " + content;
                    String route = "/connect?tab=groups&group=" + groupId;

                    MentisNotificationHelper.showNotification(getApplicationContext(), title, body, route);
                }
            }
            // 3. New Connection Request
            else if ("connection_request".equals(type)) {
                JSONObject fromUser = json.optJSONObject("from_user");
                String name = fromUser != null ? fromUser.optString("name", "A student") : "A student";
                MentisNotificationHelper.showNotification(
                    getApplicationContext(),
                    "New Connection Request",
                    name + " wants to connect with you on Mathmate!",
                    "/connect"
                );
            }
            // 4. Connection Accepted
            else if ("connection_accepted".equals(type)) {
                JSONObject fromUser = json.optJSONObject("from_user");
                String name = fromUser != null ? fromUser.optString("name", "Your peer") : "Your peer";
                String connId = json.optString("connection_id", "");
                MentisNotificationHelper.showNotification(
                    getApplicationContext(),
                    "Connection Accepted! 🎉",
                    name + " accepted your request. Start chatting now!",
                    connId.isEmpty() ? "/connect" : ("/connect?chat=" + connId)
                );
            }
            // 5. Ping Keep-Alive
            else if ("ping".equals(type)) {
                if (webSocket != null) {
                    webSocket.send("{\"type\":\"pong\"}");
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error handling WS message: " + e.getMessage());
        }
    }

    private void createServiceChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                SERVICE_CHANNEL_ID,
                "Mentis Live Sync",
                NotificationManager.IMPORTANCE_MIN
            );
            channel.setDescription("Maintains instant live connection for Mathmate messages");
            channel.setShowBadge(false);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public void onDestroy() {
        shouldReconnect = false;
        if (webSocket != null) {
            try { webSocket.close(1000, "Destroyed"); } catch (Exception ignored) {}
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
