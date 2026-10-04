package com.mentismathematicsfoundation.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
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
    public static final String EXTRA_WS_URL = "extra_ws_url";

    private static final String SERVICE_CHANNEL_ID = "mentis_background_sync_channel";
    private static final int SERVICE_NOTIFICATION_ID = 9001;

    private OkHttpClient client;
    private WebSocket webSocket;
    private String currentUserId;
    private String currentWsUrl;
    private boolean isRunning = false;
    private boolean shouldReconnect = true;

    @Override
    public void onCreate() {
        super.onCreate();
        client = new OkHttpClient.Builder()
            .readTimeout(0, TimeUnit.MILLISECONDS)
            .pingInterval(30, TimeUnit.SECONDS)
            .build();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            if (ACTION_START.equals(action)) {
                String userId = intent.getStringExtra(EXTRA_USER_ID);
                String wsUrl = intent.getStringExtra(EXTRA_WS_URL);
                startForegroundSync(userId, wsUrl);
            } else if (ACTION_STOP.equals(action)) {
                stopForegroundSync();
            }
        }
        return START_STICKY;
    }

    private void startForegroundSync(String userId, String wsUrl) {
        if (userId == null || userId.isEmpty()) return;

        this.currentUserId = userId;
        this.currentWsUrl = wsUrl;
        this.shouldReconnect = true;

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
            } catch (Exception e) {}
            webSocket = null;
        }
        stopForeground(true);
        stopSelf();
    }

    private synchronized void connectWebSocket() {
        if (webSocket != null) {
            try { webSocket.close(1000, "Reconnecting"); } catch (Exception e) {}
            webSocket = null;
        }

        String targetUrl = currentWsUrl;
        if (targetUrl == null || targetUrl.isEmpty()) {
            targetUrl = "wss://mentismathematicsfoundation.com/ws/" + currentUserId;
        } else if (!targetUrl.endsWith("/ws/" + currentUserId)) {
            if (targetUrl.endsWith("/")) {
                targetUrl += "ws/" + currentUserId;
            } else {
                targetUrl += "/ws/" + currentUserId;
            }
        }

        Log.d(TAG, "Connecting background WebSocket to: " + targetUrl);
        Request request = new Request.Builder()
            .url(targetUrl)
            .build();

        webSocket = client.newWebSocket(request, new WebSocketListener() {
            @Override
            public void onOpen(WebSocket ws, Response response) {
                Log.d(TAG, "Background WebSocket connected!");
                isRunning = true;
            }

            @Override
            public void onMessage(WebSocket ws, String text) {
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
        new Thread(() -> {
            try {
                Thread.sleep(5000);
                if (shouldReconnect) {
                    connectWebSocket();
                }
            } catch (InterruptedException ignored) {}
        }).start();
    }

    private void handleIncomingMessage(String text) {
        try {
            JSONObject json = new JSONObject(text);
            String type = json.optString("type", "");

            if ("new_message".equals(type) || "private_message".equals(type)) {
                JSONObject msgObj = json.optJSONObject("message");
                if (msgObj != null) {
                    String senderId = msgObj.optString("sender_id", "");
                    // Do not notify for user's own sent messages
                    if (currentUserId != null && currentUserId.equals(senderId)) {
                        return;
                    }

                    String senderName = msgObj.optString("sender_name", "Mentis Mathmate");
                    String content = msgObj.optString("content", "Sent a new message");

                    String title = "Mathmate • " + senderName;
                    MentisNotificationHelper.showNotification(getApplicationContext(), title, content, "/connect");
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
                "Mentis Background Service",
                NotificationManager.IMPORTANCE_MIN
            );
            channel.setDescription("Maintains live connection for Mathmate messages");
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
            try { webSocket.close(1000, "Destroyed"); } catch (Exception e) {}
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
