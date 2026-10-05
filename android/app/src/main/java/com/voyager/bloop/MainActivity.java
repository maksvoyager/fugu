package com.voyager.bloop;

import android.os.Bundle;
import android.os.Build;
import android.view.WindowManager;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {
    private Insets safeInsets = Insets.NONE;
    private Insets publishedInsets = null;
    private float publishedDensity = 0;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = getBridge().getWebView();
        // Только настройка WebView: Phaser pointer input и scroll в Атласе остаются web-коду.
        webView.getSettings().setSupportZoom(false);
        webView.getSettings().setBuiltInZoomControls(false);
        webView.getSettings().setDisplayZoomControls(false);
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        webView.setLongClickable(false);
        webView.setOnLongClickListener(view -> true);
        // Safe area относится только к HTML UI, не к размеру WebView/фона.
        ViewCompat.setOnApplyWindowInsetsListener(getWindow().getDecorView(), (view, insets) -> {
            if (view.getPaddingLeft() != 0 || view.getPaddingTop() != 0
                || view.getPaddingRight() != 0 || view.getPaddingBottom() != 0) view.setPadding(0, 0, 0, 0);
            safeInsets = insets.getInsets(WindowInsetsCompat.Type.displayCutout()
                | WindowInsetsCompat.Type.systemBars());
            updateSafeArea(false);
            return new WindowInsetsCompat.Builder(insets)
                .setInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout(), Insets.NONE)
                .build();
        });
        getBridge().addWebViewListener(new WebViewListener() {
            @Override public void onPageLoaded(WebView view) {
                updateSafeArea(true);
                applyImmersiveMode();
            }
        });
        applyImmersiveMode();
    }

    private void applyImmersiveMode() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams attributes = getWindow().getAttributes();
            int cutoutMode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                ? WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
                : WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            if (attributes.layoutInDisplayCutoutMode != cutoutMode) {
                attributes.layoutInDisplayCutoutMode = cutoutMode;
                getWindow().setAttributes(attributes);
            }
        }
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.systemBars());
        ViewCompat.requestApplyInsets(getWindow().getDecorView());
    }

    private void updateSafeArea(boolean force) {
        if (getBridge() == null) return;
        float density = getResources().getDisplayMetrics().density;
        // Повторные dispatch одинаковых insets не запускают JS и CSS/layout повторно.
        if (!force && safeInsets.equals(publishedInsets) && density == publishedDensity) return;
        publishedInsets = safeInsets;
        publishedDensity = density;
        String script = "(() => { const s = document.documentElement.style;"
            + "s.setProperty('--safe-area-inset-top','" + safeInsets.top / density + "px');"
            + "s.setProperty('--safe-area-inset-right','" + safeInsets.right / density + "px');"
            + "s.setProperty('--safe-area-inset-bottom','" + safeInsets.bottom / density + "px');"
            + "s.setProperty('--safe-area-inset-left','" + safeInsets.left / density + "px'); })();";
        // Только события WindowInsets/page load: никаких вызовов каждый кадр.
        getBridge().getWebView().evaluateJavascript(script, null);
    }

    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && getBridge() != null) applyImmersiveMode();
    }

    @Override public void onResume() {
        super.onResume();
        if (getBridge() != null) applyImmersiveMode();
    }
}
