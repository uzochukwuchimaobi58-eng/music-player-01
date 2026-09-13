package com.sonance.musicplayer

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Universal BroadcastReceiver for notification and media controls.
 * Uses explicit in-app broadcasts which are 100% reliable across all Android versions
 * and OEM custom ROMs (Xiaomi MIUI / HyperOS, Redmi, Samsung OneUI, Transsion HiOS, ColorOS, etc.)
 * bypassing aggressive background service execution limits.
 */
class MediaActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        MusicPlaybackService.handleAction(context, action)
    }
}
