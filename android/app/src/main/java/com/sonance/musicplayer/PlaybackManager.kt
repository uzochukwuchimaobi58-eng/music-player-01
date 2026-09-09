package com.sonance.musicplayer

import android.content.ContentUris
import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.provider.MediaStore
import java.io.File

/**
 * Robust Native Android MediaPlayer Playback Manager
 * - Handles MediaStore Content URIs (ContentUris / MediaStore.Audio.Media)
 * - Safe asynchronous preparation (prepareAsync)
 * - Guarantees player.start() only executes inside setOnPreparedListener callback
 * - Emits periodic progress updates so playback timers never freeze at 0:00
 */
class PlaybackManager(private val context: Context) {

    private var mediaPlayer: MediaPlayer? = null
    private var isPrepared: Boolean = false
    private val handler = Handler(Looper.getMainLooper())
    private var progressRunnable: Runnable? = null

    var onPreparedCallback: ((durationMs: Int, positionMs: Int) -> Unit)? = null
    var onCompletionCallback: (() -> Unit)? = null
    var onErrorCallback: ((what: Int, extra: Int, message: String) -> Unit)? = null
    var onProgressCallback: ((positionMs: Int, durationMs: Int) -> Unit)? = null
    var onStateChangeCallback: ((isPlaying: Boolean) -> Unit)? = null

    val isPlaying: Boolean
        get() = try {
            mediaPlayer?.isPlaying == true
        } catch (_: Exception) {
            false
        }

    val currentPosition: Int
        get() = try {
            if (isPrepared) mediaPlayer?.currentPosition ?: 0 else 0
        } catch (_: Exception) {
            0
        }

    val duration: Int
        get() = try {
            if (isPrepared) mediaPlayer?.duration ?: 0 else 0
        } catch (_: Exception) {
            0
        }

    /**
     * Resolves valid content URI or file path and loads it into MediaPlayer
     */
    fun playTrack(uriString: String?, idString: String?) {
        stopProgressUpdates()
        isPrepared = false

        // Clean up any existing playback instance safely
        mediaPlayer?.let {
            try {
                if (it.isPlaying) {
                    it.stop()
                }
                it.reset()
                it.release()
            } catch (_: Exception) {}
        }
        mediaPlayer = null

        // 1. Ensure track passes a valid content URI (using ContentUris & MediaStore) or correct absolute file path
        val mediaUri: Uri? = when {
            !uriString.isNullOrBlank() && uriString.startsWith("content://") -> {
                Uri.parse(uriString)
            }
            !uriString.isNullOrBlank() && uriString.startsWith("file://") -> {
                Uri.parse(uriString)
            }
            !uriString.isNullOrBlank() && (uriString.startsWith("/") || File(uriString).exists()) -> {
                Uri.fromFile(File(uriString))
            }
            !idString.isNullOrBlank() -> {
                try {
                    ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, idString.toLong())
                } catch (_: Exception) {
                    null
                }
            }
            else -> null
        }

        if (mediaUri == null) {
            onErrorCallback?.invoke(-1, -1, "Invalid or missing audio URI: $uriString")
            return
        }

        try {
            val player = MediaPlayer().apply {
                setWakeMode(context, PowerManager.PARTIAL_WAKE_LOCK)
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .build()
                )

                // Set data source with context and valid content URI
                setDataSource(context, mediaUri)

                // 2. Ensure prepareAsync() is used correctly, and player.start() is ONLY called
                // inside setOnPreparedListener callback rather than immediately after setDataSource
                setOnPreparedListener { mp ->
                    isPrepared = true
                    try {
                        mp.start()
                        onStateChangeCallback?.invoke(true)
                        onPreparedCallback?.invoke(mp.duration, mp.currentPosition)
                        startProgressUpdates()
                    } catch (e: Exception) {
                        onErrorCallback?.invoke(-1, -1, "Failed to start after prepare: ${e.message}")
                    }
                }

                setOnCompletionListener {
                    stopProgressUpdates()
                    onStateChangeCallback?.invoke(false)
                    onCompletionCallback?.invoke()
                }

                setOnErrorListener { _, what, extra ->
                    stopProgressUpdates()
                    isPrepared = false
                    onStateChangeCallback?.invoke(false)
                    onErrorCallback?.invoke(what, extra, "MediaPlayer error: what=$what, extra=$extra")
                    true // Return true to signify error has been handled
                }
            }

            mediaPlayer = player
            // Prepare asynchronously without blocking the UI main thread
            player.prepareAsync()

        } catch (e: Exception) {
            onErrorCallback?.invoke(-1, -1, "Failed to initialize MediaPlayer: ${e.localizedMessage ?: e.message}")
        }
    }

    fun pause() {
        try {
            if (mediaPlayer?.isPlaying == true) {
                mediaPlayer?.pause()
                stopProgressUpdates()
                onStateChangeCallback?.invoke(false)
            }
        } catch (_: Exception) {}
    }

    fun resume() {
        try {
            if (isPrepared && mediaPlayer != null && mediaPlayer?.isPlaying == false) {
                mediaPlayer?.start()
                startProgressUpdates()
                onStateChangeCallback?.invoke(true)
            }
        } catch (_: Exception) {}
    }

    fun seekTo(positionMs: Int) {
        try {
            if (isPrepared && mediaPlayer != null) {
                mediaPlayer?.seekTo(positionMs)
            }
        } catch (_: Exception) {}
    }

    fun setVolume(volume: Float) {
        try {
            val vol = volume.coerceIn(0f, 1f)
            mediaPlayer?.setVolume(vol, vol)
        } catch (_: Exception) {}
    }

    fun release() {
        stopProgressUpdates()
        try {
            mediaPlayer?.apply {
                if (isPlaying) {
                    stop()
                }
                reset()
                release()
            }
        } catch (_: Exception) {}
        mediaPlayer = null
        isPrepared = false
    }

    private fun startProgressUpdates() {
        stopProgressUpdates()
        progressRunnable = object : Runnable {
            override fun run() {
                try {
                    if (isPrepared && mediaPlayer?.isPlaying == true) {
                        val pos = mediaPlayer?.currentPosition ?: 0
                        val dur = mediaPlayer?.duration ?: 0
                        onProgressCallback?.invoke(pos, dur)
                        handler.postDelayed(this, 250)
                    }
                } catch (_: Exception) {
                    stopProgressUpdates()
                }
            }
        }
        handler.post(progressRunnable!!)
    }

    private fun stopProgressUpdates() {
        progressRunnable?.let { handler.removeCallbacks(it) }
        progressRunnable = null
    }
}
