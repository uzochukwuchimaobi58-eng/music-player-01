package com.sonance.musicplayer

import android.content.ContentUris
import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.audiofx.BassBoost
import android.media.audiofx.Equalizer
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
 * - Integrates hardware AudioEffects (Equalizer & BassBoost) for live Karaoke and Beat Instrumental
 */
class PlaybackManager(private val context: Context) {

    data class NativeQueueTrack(
        val id: String,
        val uri: String?,
        val title: String,
        val artist: String,
        val album: String?,
        val coverArt: String?,
        val duration: Long,
        val isFavorite: Boolean
    )

    private var mediaPlayer: MediaPlayer? = null
    private var isPrepared: Boolean = false
    private val handler = Handler(Looper.getMainLooper())
    private var progressRunnable: Runnable? = null

    // Native Audio Effects for Karaoke & Beat Instrumental
    private var equalizer: Equalizer? = null
    private var bassBoost: BassBoost? = null

    private var isKaraokeActive: Boolean = false
    private var isStemMixActive: Boolean = false
    private var vocalAttenuationPct: Int = 100
    private var currentVocalLevel: Int = 100 // 0-100
    private var currentBeatBoost: Int = 50   // 0-100
    private var currentBassLevel: Int = 50   // 0-100
    private var currentInstLevel: Int = 50   // 0-100

    private var isEqEnabled: Boolean = false
    private var eqBandsMap: Map<Int, Int> = emptyMap()
    private var eqBassBoostPct: Int = 0
    private var eqTrebleBoostPct: Int = 0

    val nativeQueue = mutableListOf<NativeQueueTrack>()
    var currentQueueIndex: Int = -1
    var repeatMode: String = "all" // "off", "all", "one"
    var isShuffle: Boolean = false

    var onPreparedCallback: ((durationMs: Int, positionMs: Int) -> Unit)? = null
    var onCompletionCallback: (() -> Unit)? = null
    var onErrorCallback: ((what: Int, extra: Int, message: String) -> Unit)? = null
    var onProgressCallback: ((positionMs: Int, durationMs: Int) -> Unit)? = null
    var onStateChangeCallback: ((isPlaying: Boolean) -> Unit)? = null
    var onTrackAutoAdvancedCallback: ((track: NativeQueueTrack, index: Int) -> Unit)? = null

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
        releaseAudioEffects()
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
                        setupAudioEffects(mp.audioSessionId)
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

                    // 1. Repeat single track: loop immediately
                    if (repeatMode == "one" && isPrepared) {
                        try {
                            mediaPlayer?.seekTo(0)
                            mediaPlayer?.start()
                            onStateChangeCallback?.invoke(true)
                            startProgressUpdates()
                            return@setOnCompletionListener
                        } catch (_: Exception) {}
                    }

                    // 2. Continuous playback: seamlessly advance to next track in native queue
                    if (nativeQueue.isNotEmpty()) {
                        val nextIdx = getNextIndex()
                        if (nextIdx != -1) {
                            playQueueItemAt(nextIdx)
                            return@setOnCompletionListener
                        }
                    }

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
        releaseAudioEffects()
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

    private fun setupAudioEffects(sessionId: Int) {
        try {
            releaseAudioEffects()
            equalizer = Equalizer(0, sessionId).apply {
                enabled = true
            }
            bassBoost = BassBoost(0, sessionId).apply {
                enabled = true
            }
            applyAudioEffects()
        } catch (e: Exception) {
            android.util.Log.w("PlaybackManager", "setupAudioEffects on session $sessionId failed, trying fallback to session 0: $e")
            try {
                equalizer = Equalizer(0, 0).apply { enabled = true }
                bassBoost = BassBoost(0, 0).apply { enabled = true }
                applyAudioEffects()
            } catch (e2: Exception) {
                android.util.Log.e("PlaybackManager", "Fallback AudioEffects failed: $e2")
            }
        }
    }

    private fun releaseAudioEffects() {
        try {
            equalizer?.release()
        } catch (_: Exception) {}
        equalizer = null

        try {
            bassBoost?.release()
        } catch (_: Exception) {}
        bassBoost = null
    }

    fun applyAudioEffects() {
        val eq = equalizer ?: return
        try {
            val range = eq.bandLevelRange
            val minLevel = range[0].toInt()
            val maxLevel = range[1].toInt()
            val numBands = eq.numberOfBands.toInt()

            // 1. If custom stem mix or karaoke mode is explicitly active
            if (isKaraokeActive || isStemMixActive) {
                if (!eq.enabled) eq.enabled = true
                val cutFactor = if (isKaraokeActive) {
                    (vocalAttenuationPct / 100.0).coerceIn(0.0, 1.0)
                } else {
                    ((100 - currentVocalLevel) / 100.0).coerceIn(0.0, 1.0)
                }

                for (b in 0 until numBands) {
                    val centerFreqHz = eq.getCenterFreq(b.toShort()) / 1000
                    if (centerFreqHz in 400..4500) {
                        // Mid/speech band: attenuate center vocal frequencies
                        val cut = (minLevel * cutFactor * 0.95).toInt().coerceIn(minLevel, maxLevel)
                        eq.setBandLevel(b.toShort(), cut.toShort())
                    } else if (centerFreqHz < 300) {
                        // Bass band
                        val bassFactor = ((currentBassLevel - 50) / 50.0).coerceIn(-1.0, 1.0)
                        val bassVal = (maxLevel * bassFactor * 0.7).toInt().coerceIn(minLevel, maxLevel)
                        eq.setBandLevel(b.toShort(), bassVal.toShort())
                    } else {
                        eq.setBandLevel(b.toShort(), 0)
                    }
                }

                bassBoost?.let { bb ->
                    if (!bb.enabled) bb.enabled = true
                    val strength = ((currentBeatBoost.coerceIn(0, 100) / 100.0) * 1000).toInt().toShort()
                    bb.setStrength(strength)
                }
                return
            }

            // 2. Custom Equalizer Settings if user enabled Equalizer Modal
            if (isEqEnabled && eqBandsMap.isNotEmpty()) {
                if (!eq.enabled) eq.enabled = true
                for (b in 0 until numBands) {
                    val centerFreqHz = eq.getCenterFreq(b.toShort()) / 1000
                    var closestFreq = 1000
                    var minDiff = Int.MAX_VALUE
                    for (targetFreq in eqBandsMap.keys) {
                        val diff = Math.abs(targetFreq - centerFreqHz)
                        if (diff < minDiff) {
                            minDiff = diff
                            closestFreq = targetFreq
                        }
                    }
                    val dbGain = eqBandsMap[closestFreq] ?: 0
                    val mbGain = (dbGain * 100).coerceIn(minLevel, maxLevel)
                    eq.setBandLevel(b.toShort(), mbGain.toShort())
                }

                bassBoost?.let { bb ->
                    val hasBass = eqBassBoostPct > 0
                    if (bb.enabled != hasBass) bb.enabled = hasBass
                    if (hasBass) {
                        val strength = ((eqBassBoostPct.coerceIn(0, 100) / 100.0) * 1000).toInt().toShort()
                        bb.setStrength(strength)
                    } else {
                        bb.setStrength(0)
                    }
                }
                return
            }

            // 3. Normal / Flat / Disabled: reset bands and disable effect to save battery and preserve natural sound
            for (b in 0 until numBands) {
                eq.setBandLevel(b.toShort(), 0)
            }
            if (eq.enabled) eq.enabled = false
            bassBoost?.let { bb ->
                bb.setStrength(0)
                if (bb.enabled) bb.enabled = false
            }
        } catch (e: Exception) {
            android.util.Log.w("PlaybackManager", "Error applying audio effects: $e")
        }
    }

    fun setKaraokeMode(enabled: Boolean, attenuationPercent: Int = 100) {
        isKaraokeActive = enabled
        vocalAttenuationPct = attenuationPercent
        applyAudioEffects()
    }

    fun setStemMix(vocalLevel: Int, beatBoost: Int, bassLevel: Int, instrumentalLevel: Int) {
        currentVocalLevel = vocalLevel
        currentBeatBoost = beatBoost
        currentBassLevel = bassLevel
        currentInstLevel = instrumentalLevel
        isStemMixActive = (vocalLevel != 100 || beatBoost != 50 || bassLevel != 50 || instrumentalLevel != 50)
        applyAudioEffects()
    }

    fun applyEqualizer(enabled: Boolean, bands: Map<Int, Int>, bassBoostPct: Int, trebleBoostPct: Int) {
        isEqEnabled = enabled
        eqBandsMap = bands
        eqBassBoostPct = bassBoostPct
        eqTrebleBoostPct = trebleBoostPct
        applyAudioEffects()
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

    fun setQueue(items: List<NativeQueueTrack>, startIndex: Int, repeat: String?, shuffle: Boolean?) {
        nativeQueue.clear()
        nativeQueue.addAll(items)
        currentQueueIndex = startIndex
        if (!repeat.isNullOrBlank()) repeatMode = repeat
        if (shuffle != null) isShuffle = shuffle
    }

    fun setPlaybackMode(repeat: String?, shuffle: Boolean?) {
        if (!repeat.isNullOrBlank()) repeatMode = repeat
        if (shuffle != null) isShuffle = shuffle
    }

    fun getNextIndex(): Int {
        if (nativeQueue.isEmpty()) return -1
        if (isShuffle) {
            if (nativeQueue.size > 1) {
                var rand = (0 until (nativeQueue.size - 1)).random()
                if (currentQueueIndex != -1 && rand >= currentQueueIndex) {
                    rand += 1
                }
                return rand
            }
            return 0
        }
        // Strict, sequential next order (0 -> 1 -> 2 -> 3 ...)
        if (currentQueueIndex == -1) return 0
        val next = currentQueueIndex + 1
        if (next >= nativeQueue.size) {
            return if (repeatMode == "all") 0 else -1
        }
        return next
    }

    fun getPreviousIndex(): Int {
        if (nativeQueue.isEmpty()) return -1
        if (currentQueueIndex <= 0) {
            return nativeQueue.size - 1
        }
        return currentQueueIndex - 1
    }

    fun playNext(): Boolean {
        if (nativeQueue.isEmpty()) return false
        val nextIdx = getNextIndex()
        if (nextIdx != -1) {
            playQueueItemAt(nextIdx)
            return true
        }
        return false
    }

    fun playPrevious(): Boolean {
        if (nativeQueue.isEmpty()) return false
        val prevIdx = getPreviousIndex()
        if (prevIdx != -1) {
            playQueueItemAt(prevIdx)
            return true
        }
        return false
    }

    fun playQueueItemAt(index: Int) {
        if (index < 0 || index >= nativeQueue.size) return
        currentQueueIndex = index
        val item = nativeQueue[index]
        playTrack(item.uri, item.id)
        onTrackAutoAdvancedCallback?.invoke(item, index)
    }
}
