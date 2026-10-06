package com.mentismathematicsfoundation.app;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MentisNativeBridge {
    private final Activity activity;
    private boolean permissionRequestedOnce = false;

    public MentisNativeBridge(Activity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public boolean isNativeApp() {
        return true;
    }

    @JavascriptInterface
    public boolean hasNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return ContextCompat.checkSelfPermission(activity, Manifest.permission.POST_NOTIFICATIONS) 
                == PackageManager.PERMISSION_GRANTED;
        }
        return true;
    }

    @JavascriptInterface
    public void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            activity.runOnUiThread(() -> {
                if (ContextCompat.checkSelfPermission(activity, Manifest.permission.POST_NOTIFICATIONS) 
                    != PackageManager.PERMISSION_GRANTED) {
                    permissionRequestedOnce = true;
                    ActivityCompat.requestPermissions(
                        activity, 
                        new String[]{Manifest.permission.POST_NOTIFICATIONS}, 
                        1001
                    );
                } else {
                    if (activity instanceof MainActivity) {
                        ((MainActivity) activity).checkAndNotifyPermissionStatus();
                    }
                }
            });
        }
    }

    @JavascriptInterface
    public void promptOrOpenSettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            activity.runOnUiThread(() -> {
                if (ContextCompat.checkSelfPermission(activity, Manifest.permission.POST_NOTIFICATIONS) 
                    != PackageManager.PERMISSION_GRANTED) {
                    
                    boolean shouldShowRationale = ActivityCompat.shouldShowRequestPermissionRationale(
                        activity, Manifest.permission.POST_NOTIFICATIONS
                    );

                    // If Android suppresses the prompt (rationale not shown and already requested once), open settings
                    if (permissionRequestedOnce && !shouldShowRationale) {
                        openNotificationSettings();
                    } else {
                        permissionRequestedOnce = true;
                        ActivityCompat.requestPermissions(
                            activity, 
                            new String[]{Manifest.permission.POST_NOTIFICATIONS}, 
                            1001
                        );
                    }
                } else {
                    if (activity instanceof MainActivity) {
                        ((MainActivity) activity).checkAndNotifyPermissionStatus();
                    }
                }
            });
        }
    }

    @JavascriptInterface
    public void openNotificationSettings() {
        activity.runOnUiThread(() -> {
            try {
                Intent intent = new Intent();
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    intent.setAction(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                    intent.putExtra(Settings.EXTRA_APP_PACKAGE, activity.getPackageName());
                } else {
                    intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                    intent.setData(Uri.fromParts("package", activity.getPackageName(), null));
                }
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activity.startActivity(intent);
            } catch (Exception e) {
                try {
                    Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                    intent.setData(Uri.fromParts("package", activity.getPackageName(), null));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    activity.startActivity(intent);
                } catch (Exception ex) {
                    ex.printStackTrace();
                }
            }
        });
    }

    @JavascriptInterface
    public void showNotification(String title, String body, String route) {
        MentisNotificationHelper.showNotification(activity, title, body, route);
    }

    @JavascriptInterface
    public void startBackgroundSync(String userIdOrToken, String wsUrl) {
        startBackgroundSyncWithToken(userIdOrToken, userIdOrToken, wsUrl);
    }

    @JavascriptInterface
    public void startBackgroundSyncWithToken(String token, String userId, String wsUrl) {
        try {
            Intent intent = new Intent(activity, MentisWebSocketService.class);
            intent.setAction(MentisWebSocketService.ACTION_START);
            intent.putExtra(MentisWebSocketService.EXTRA_USER_ID, userId);
            intent.putExtra(MentisWebSocketService.EXTRA_AUTH_TOKEN, token);
            intent.putExtra(MentisWebSocketService.EXTRA_WS_URL, wsUrl);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                activity.startForegroundService(intent);
            } else {
                activity.startService(intent);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @JavascriptInterface
    public void stopBackgroundSync() {
        try {
            Intent intent = new Intent(activity, MentisWebSocketService.class);
            intent.setAction(MentisWebSocketService.ACTION_STOP);
            activity.startService(intent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
