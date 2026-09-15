package com.sonance.musicplayer.player

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.audiofx.BassBoost
import android.media.audiofx.Equalizer
import android.media.audiofx.Virtualizer
import android.media.audiofx.Visualizer
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.sonance.musicplayer.model.EqualizerSettings
import com.sonance.musicplayer.model.RepeatMode
import com.sonance.musicplayer.model.Track
import com.sonance.musicplayer.model.TrendingAudioEffect
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class PlaybackManager(
    private val context: Context,
    private val onTrackCompletedCallback: ((Track) -> Unit)? = null
) {
    private val tag = "PlaybackManager"

    private var mediaPlayer: MediaPlayer? = null
    private var equalizer: Equalizer? = null
    private var bassBoost: BassBoost? = null
    private var virtualizer: Virtualizer? = null
    private var visualizer: Visualizer? = null

    private val scope = CoroutineScope(Dispatchers.Main)
    private var progressJob: Job? = null
    private var sleepTimerJob: Job? = null

    private val _currentTrack = MutableStateFlow<Track?>(null)
    val currentTrack: StateFlow<Track?> = _currentTrack.asStateFlow()

    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying.asStateFlow()

    private val _currentPositionMs = MutableStateFlow(0L)
    val currentPositionMs: StateFlow<Long> = _currentPositionMs.asStateFlow()

    private val _durationMs = MutableStateFlow(0L)
    val durationMs: StateFlow<Long> = _durationMs.asStateFlow()

    private val _repeatMode = MutableStateFlow(RepeatMode.ALL)
    val repeatMode: StateFlow<RepeatMode> = _repeatMode.asStateFlow()

    private val _isShuffle = MutableStateFlow(false)
    val isShuffle: StateFlow<Boolean> = _isShuffle.asStateFlow()

    private val _volume = MutableStateFlow(1.0f)
    val volume: StateFlow<Float> = _volume.asStateFlow()

    private val _playbackSpeed = MutableStateFlow(1.0f)
    val playbackSpeed: StateFlow<Float> = _playbackSpeed.asStateFlow()

    private val _queue = MutableStateFlow<List<Track>>(emptyList())
    val queue: StateFlow<List<Track>> = _queue.asStateFlow()

    private val _queueIndex = MutableStateFlow(0)
    val queueIndex: StateFlow<Int> = _queueIndex.asStateFlow()

    private val _activeEffect = MutableStateFlow(TrendingAudioEffect.OFF)
    val activeEffect: StateFlow<TrendingAudioEffect> = _activeEffect.asStateFlow()

    private val _isKaraokeMode = MutableStateFlow(false)
    val isKaraokeMode: StateFlow<Boolean> = _isKaraokeMode.asStateFlow()

    private val _sleepTimerRemainingSec = MutableStateFlow<Int?>(null)
    val sleepTimerRemainingSec: StateFlow<Int?> = _sleepTimerRemainingSec.asStateFlow()
    val sleepTimerSeconds: StateFlow<Int?> get() = sleepTimerRemainingSec
    val playQueue: StateFlow<List<Track>> get() = queue

    private val _visualizerFft = MutableStateFlow(ByteArray(64))
    val visualizerFft: StateFlow<ByteArray> = _visualizerFft.asStateFlow()

    private var currentEqSettings: EqualizerSettings = EqualizerSettings()

    init {
        startProgressTracker()
    }

    fun setQueue(newQueue: List<Track>, startIndex: Int = 0) {
        if (newQueue.isEmpty()) return
        _queue.value = newQueue
        val safeIndex = startIndex.coerceIn(0, newQueue.size - 1)
        _queueIndex.value = safeIndex
        playTrack(newQueue[safeIndex], newQueue)
    }

    fun skipToNext() = next()
    fun skipToPrevious() = previous()
    fun cycleRepeatMode() = toggleRepeat()
    fun toggleKaraokeMode() = toggleKaraoke()

    fun playTrack(track: Track, newQueue: List<Track>? = null) {
        if (newQueue != null && newQueue.isNotEmpty()) {
            _queue.value = newQueue
            val idx = newQueue.indexOfFirst { it.id == track.id }
            _queueIndex.value = if (idx >= 0) idx else 0
        } else if (!_queue.value.any { it.id == track.id }) {
            _queue.value = listOf(track) + _queue.value
            _queueIndex.value = 0
        } else {
            val idx = _queue.value.indexOfFirst { it.id == track.id }
            if (idx >= 0) _queueIndex.value = idx
        }

        _currentTrack.value = track
        loadAndPlay(track)
    }

    private fun loadAndPlay(track: Track) {
        releasePlayer()
        try {
            val mp = MediaPlayer()
            mp.setAudioAttributes(
                AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .build()
            )

            if (track.url.startsWith("http://") || track.url.startsWith("https://") || track.url.startsWith("content://")) {
                mp.setDataSource(context, Uri.parse(track.url))
            } else if (track.url.isNotEmpty()) {
                mp.setDataSource(track.url)
            } else {
                // Fallback default url if empty
                mp.setDataSource(context, Uri.parse("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"))
            }

            mp.setOnPreparedListener { player ->
                _durationMs.value = player.duration.toLong().coerceAtLeast(track.duration * 1000L)
                attachAudioEffects(player.audioSessionId)
                applySpeedInternal(player, _playbackSpeed.value)
                applyVolumeInternal(player, _volume.value)
                player.start()
                _isPlaying.value = true
                onTrackCompletedCallback?.invoke(track)
            }

            mp.setOnCompletionListener {
                handleTrackCompletion()
            }

            mp.setOnErrorListener { _, what, extra ->
                Log.e(tag, "MediaPlayer error: what=$what extra=$extra")
                _isPlaying.value = false
                false
            }

            mediaPlayer = mp
            mp.prepareAsync()
        } catch (e: Exception) {
            Log.e(tag, "Error loading track ${track.title}", e)
            _isPlaying.value = false
        }
    }

    private fun handleTrackCompletion() {
        when (_repeatMode.value) {
            RepeatMode.ONE -> {
                _currentTrack.value?.let { loadAndPlay(it) }
            }
            RepeatMode.ALL -> {
                next()
            }
            RepeatMode.OFF -> {
                if (_queueIndex.value < _queue.value.size - 1) {
                    next()
                } else {
                    _isPlaying.value = false
                    _currentPositionMs.value = 0L
                }
            }
        }
    }

    fun togglePlayPause() {
        val mp = mediaPlayer
        if (mp != null) {
            if (mp.isPlaying) {
                mp.pause()
                _isPlaying.value = false
            } else {
                mp.start()
                _isPlaying.value = true
            }
        } else {
            val track = _currentTrack.value ?: _queue.value.firstOrNull()
            if (track != null) {
                playTrack(track)
            }
        }
    }

    fun pause() {
        mediaPlayer?.let {
            if (it.isPlaying) {
                it.pause()
                _isPlaying.value = false
            }
        }
    }

    fun resume() {
        mediaPlayer?.let {
            if (!it.isPlaying) {
                it.start()
                _isPlaying.value = true
            }
        }
    }

    fun next() {
        val q = _queue.value
        if (q.isEmpty()) return

        val nextIndex = if (_isShuffle.value) {
            (0 until q.size).random()
        } else {
            (_queueIndex.value + 1) % q.size
        }
        _queueIndex.value = nextIndex
        val nextTrack = q[nextIndex]
        _currentTrack.value = nextTrack
        loadAndPlay(nextTrack)
    }

    fun previous() {
        val q = _queue.value
        if (q.isEmpty()) return

        // If played more than 3 seconds, restart current track
        if (_currentPositionMs.value > 3000L) {
            seekTo(0L)
            return
        }

        val prevIndex = if (_queueIndex.value > 0) _queueIndex.value - 1 else q.size - 1
        _queueIndex.value = prevIndex
        val prevTrack = q[prevIndex]
        _currentTrack.value = prevTrack
        loadAndPlay(prevTrack)
    }

    fun seekTo(positionMs: Long) {
        mediaPlayer?.let {
            val clamped = positionMs.coerceIn(0L, _durationMs.value.coerceAtLeast(1000L))
            it.seekTo(clamped.toInt())
            _currentPositionMs.value = clamped
        }
    }

    fun setRepeatMode(mode: RepeatMode) {
        _repeatMode.value = mode
    }

    fun toggleRepeat() {
        _repeatMode.value = when (_repeatMode.value) {
            RepeatMode.OFF -> RepeatMode.ALL
            RepeatMode.ALL -> RepeatMode.ONE
            RepeatMode.ONE -> RepeatMode.OFF
        }
    }

    fun toggleShuffle() {
        _isShuffle.value = !_isShuffle.value
    }

    fun setVolume(vol: Float) {
        val clamped = vol.coerceIn(0f, 1f)
        _volume.value = clamped
        mediaPlayer?.let { applyVolumeInternal(it, clamped) }
    }

    fun setSpeed(speed: Float) {
        val clamped = speed.coerceIn(0.5f, 2.0f)
        _playbackSpeed.value = clamped
        mediaPlayer?.let { applySpeedInternal(it, clamped) }
    }

    fun setAudioEffect(effect: TrendingAudioEffect) {
        _activeEffect.value = effect
        when (effect) {
            TrendingAudioEffect.OFF -> {
                setSpeed(1.0f)
                bassBoost?.setStrength(currentEqSettings.bassBoost.toShort())
                virtualizer?.setStrength(currentEqSettings.spatialReverb.toShort())
            }
            TrendingAudioEffect.BASS_BOOST -> {
                setSpeed(1.0f)
                bassBoost?.setStrength(1000.toShort())
            }
            TrendingAudioEffect.SLOWED_REVERB -> {
                setSpeed(0.85f)
                virtualizer?.setStrength(800.toShort())
            }
            TrendingAudioEffect.NIGHTCORE -> {
                setSpeed(1.25f)
                bassBoost?.setStrength(400.toShort())
            }
            TrendingAudioEffect.HIFI_STUDIO -> {
                setSpeed(1.0f)
                bassBoost?.setStrength(300.toShort())
                virtualizer?.setStrength(400.toShort())
            }
        }
    }

    fun toggleKaraoke() {
        _isKaraokeMode.value = !_isKaraokeMode.value
        // Attenuate vocals or apply voice filter via Equalizer center frequencies (1kHz - 3kHz)
        equalizer?.let { eq ->
            val numBands = eq.numberOfBands
            for (i in 0 until numBands) {
                val centerFreq = eq.getCenterFreq(i.toShort()) / 1000
                if (centerFreq in 800..3500) {
                    val bandLevel: Short = if (_isKaraokeMode.value) (-1200).toShort() else (0).toShort()
                    eq.setBandLevel(i.toShort(), bandLevel)
                }
            }
        }
    }

    fun setSleepTimer(minutes: Int?) {
        sleepTimerJob?.cancel()
        if (minutes == null || minutes <= 0) {
            _sleepTimerRemainingSec.value = null
            return
        }

        var remainingSeconds = minutes * 60
        _sleepTimerRemainingSec.value = remainingSeconds

        sleepTimerJob = scope.launch {
            while (remainingSeconds > 0 && isActive) {
                delay(1000L)
                remainingSeconds -= 1
                _sleepTimerRemainingSec.value = remainingSeconds
            }
            if (remainingSeconds <= 0) {
                pause()
                _sleepTimerRemainingSec.value = null
            }
        }
    }

    fun applyEqualizerSettings(settings: EqualizerSettings) {
        currentEqSettings = settings
        equalizer?.let { eq ->
            eq.enabled = settings.enabled
            if (settings.enabled) {
                val numBands = eq.numberOfBands
                val levelRange = eq.bandLevelRange
                val minLevel = levelRange[0]
                val maxLevel = levelRange[1]

                for (i in 0 until numBands) {
                    val centerFreqHz = eq.getCenterFreq(i.toShort()) / 1000
                    // Find closest band in settings
                    val targetGain = settings.bands.minByOrNull { Math.abs(it.key - centerFreqHz) }?.value ?: 0
                    // Scale -12..12 dB to minLevel..maxLevel (usually -1500..1500 millibels)
                    val scaledLevel = ((targetGain / 12f) * maxLevel).toInt().coerceIn(minLevel.toInt(), maxLevel.toInt())
                    eq.setBandLevel(i.toShort(), scaledLevel.toShort())
                }
            }
        }

        bassBoost?.let { bb ->
            bb.enabled = settings.bassBoost > 0
            val strength = ((settings.bassBoost / 100f) * 1000).toInt().coerceIn(0, 1000)
            bb.setStrength(strength.toShort())
        }

        virtualizer?.let { vz ->
            vz.enabled = settings.spatialReverb > 0
            val strength = ((settings.spatialReverb / 100f) * 1000).toInt().coerceIn(0, 1000)
            vz.setStrength(strength.toShort())
        }
    }

    private fun attachAudioEffects(audioSessionId: Int) {
        try {
            equalizer?.release()
            bassBoost?.release()
            virtualizer?.release()
            visualizer?.release()

            equalizer = Equalizer(0, audioSessionId).apply {
                enabled = currentEqSettings.enabled
            }
            bassBoost = BassBoost(0, audioSessionId).apply {
                enabled = true
            }
            virtualizer = Virtualizer(0, audioSessionId).apply {
                enabled = true
            }

            applyEqualizerSettings(currentEqSettings)

            try {
                val capRate = Visualizer.getMaxCaptureRate()
                visualizer = Visualizer(audioSessionId).apply {
                    captureSize = 64
                    setDataCaptureListener(object : Visualizer.OnDataCaptureListener {
                        override fun onWaveFormDataCapture(vis: Visualizer?, waveform: ByteArray?, samplingRate: Int) {
                            waveform?.let { _visualizerFft.value = it }
                        }
                        override fun onFftDataCapture(vis: Visualizer?, fft: ByteArray?, samplingRate: Int) {}
                    }, capRate / 2, true, false)
                    enabled = true
                }
            } catch (e: Exception) {
                Log.w(tag, "Visualizer initialization skipped: ${e.message}")
            }
        } catch (e: Exception) {
            Log.e(tag, "Failed to attach audio effects", e)
        }
    }

    private fun applyVolumeInternal(player: MediaPlayer, vol: Float) {
        player.setVolume(vol, vol)
    }

    private fun applySpeedInternal(player: MediaPlayer, speed: Float) {
        try {
            val params = player.playbackParams
            params.speed = speed
            player.playbackParams = params
        } catch (e: Exception) {
            Log.w(tag, "Speed change not supported on this device/file", e)
        }
    }

    private fun startProgressTracker() {
        progressJob?.cancel()
        progressJob = scope.launch {
            while (isActive) {
                mediaPlayer?.let { mp ->
                    if (_isPlaying.value && mp.isPlaying) {
                        _currentPositionMs.value = mp.currentPosition.toLong()
                    }
                }
                delay(200L)
            }
        }
    }

    private fun releasePlayer() {
        try {
            equalizer?.release()
            equalizer = null
            bassBoost?.release()
            bassBoost = null
            virtualizer?.release()
            virtualizer = null
            visualizer?.release()
            visualizer = null

            mediaPlayer?.stop()
            mediaPlayer?.release()
            mediaPlayer = null
        } catch (e: Exception) {
            Log.e(tag, "Error releasing player", e)
        }
    }

    fun release() {
        progressJob?.cancel()
        sleepTimerJob?.cancel()
        releasePlayer()
    }

    companion object {
        @Volatile
        private var instance: PlaybackManager? = null

        fun getInstance(
            context: Context,
            repository: com.sonance.musicplayer.data.MusicRepository? = null
        ): PlaybackManager {
            return instance ?: synchronized(this) {
                instance ?: PlaybackManager(context.applicationContext) { completedTrack ->
                    repository?.incrementPlayCount(completedTrack.id)
                }.also { instance = it }
            }
        }
    }
}
