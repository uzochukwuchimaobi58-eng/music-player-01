package com.sonance.musicplayer

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.media.MediaMetadata
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.os.Binder
import android.os.Build
import android.os.IBinder

/**
 * Android Foreground Service with MediaSession and MediaStyle Notification
 * Ensures that when users lock their phone or pull down the notification shade:
 * - The active song appears with cover artwork, title, artist, and timeline scrubber
 * - Previous, Play/Pause, Next, Favorite, and Close buttons respond immediately
 * - Audio continues playing reliably in the background without Android OS killing it
 */
class MusicPlaybackService : Service() {

    private val binder = LocalBinder()
    private var mediaSession: MediaSession? = null
    private var notificationManager: NotificationManager? = null

    // Track current state
    private var currentTitle: String = "Playing Music"
    private var currentArtist: String = "Sonance Player"
    private var currentAlbum: String = "Music"
    private var currentSongId: Long = 0L
    private var currentAlbumId: Long = 0L
    private var currentCoverArt: String? = null
    private var isPlaying: Boolean = false
    private var currentPositionMs: Long = 0L
    private var durationMs: Long = 0L
    private var isFavorite: Boolean = false

    inner class LocalBinder : Binder() {
        fun getService(): MusicPlaybackService = this@MusicPlaybackService
    }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onCreate() {
        super.onCreate()
        instance = this
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createNotificationChannel()
        initMediaSession()
    }

    override fun onDestroy() {
        mediaSession?.isActive = false
        mediaSession?.release()
        mediaSession = null
        instance = null
        super.onDestroy()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent != null) {
            when (intent.action) {
                ACTION_PREVIOUS -> onMediaAction("previous", 0)
                ACTION_PLAY -> {
                    isPlaying = true
                    updatePlaybackState()
                    updateNotification()
                    onMediaAction("play", 0)
                }
                ACTION_PAUSE -> {
                    isPlaying = false
                    updatePlaybackState()
                    updateNotification()
                    onMediaAction("pause", 0)
                }
                ACTION_TOGGLE -> {
                    val nextPlay = !isPlaying
                    isPlaying = nextPlay
                    updatePlaybackState()
                    updateNotification()
                    onMediaAction(if (nextPlay) "play" else "pause", 0)
                }
                ACTION_NEXT -> onMediaAction("next", 0)
                ACTION_CLOSE -> {
                    isPlaying = false
                    updatePlaybackState()
                    onMediaAction("close", 0)
                    stopForeground(STOP_FOREGROUND_REMOVE)
                    stopSelf()
                    return START_NOT_STICKY
                }
                ACTION_FAVORITE -> onMediaAction("favorite", 0)
                ACTION_UPDATE -> {
                    currentTitle = intent.getStringExtra(EXTRA_TITLE) ?: currentTitle
                    currentArtist = intent.getStringExtra(EXTRA_ARTIST) ?: currentArtist
                    currentAlbum = intent.getStringExtra(EXTRA_ALBUM) ?: currentAlbum
                    currentSongId = intent.getLongExtra(EXTRA_SONG_ID, currentSongId)
                    currentAlbumId = intent.getLongExtra(EXTRA_ALBUM_ID, currentAlbumId)
                    currentCoverArt = intent.getStringExtra(EXTRA_COVER_ART) ?: currentCoverArt
                    isPlaying = intent.getBooleanExtra(EXTRA_IS_PLAYING, isPlaying)
                    currentPositionMs = intent.getLongExtra(EXTRA_POSITION, currentPositionMs)
                    durationMs = intent.getLongExtra(EXTRA_DURATION, durationMs)
                    isFavorite = intent.getBooleanExtra(EXTRA_IS_FAVORITE, isFavorite)

                    updatePlaybackState()
                    updateNotification()
                }
            }
        }
        return START_STICKY
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Sonance Music Playback",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Active music playback controls on lock screen and notification bar"
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            notificationManager?.createNotificationChannel(channel)
        }
    }

    private fun initMediaSession() {
        mediaSession = MediaSession(this, "SonanceMediaSession").apply {
            setCallback(object : MediaSession.Callback() {
                override fun onPlay() {
                    isPlaying = true
                    updatePlaybackState()
                    updateNotification()
                    onMediaAction("play", 0)
                }

                override fun onPause() {
                    isPlaying = false
                    updatePlaybackState()
                    updateNotification()
                    onMediaAction("pause", 0)
                }

                override fun onSkipToNext() {
                    onMediaAction("next", 0)
                }

                override fun onSkipToPrevious() {
                    onMediaAction("previous", 0)
                }

                override fun onSeekTo(pos: Long) {
                    currentPositionMs = pos
                    updatePlaybackState()
                    onMediaAction("seekTo", pos)
                }

                override fun onStop() {
                    isPlaying = false
                    updatePlaybackState()
                    onMediaAction("close", 0)
                    stopForeground(STOP_FOREGROUND_REMOVE)
                    stopSelf()
                }
            })
            isActive = true
        }
    }

    private fun updatePlaybackState() {
        val session = mediaSession ?: return
        val state = if (isPlaying) PlaybackState.STATE_PLAYING else PlaybackState.STATE_PAUSED
        val actions = PlaybackState.ACTION_PLAY or
                PlaybackState.ACTION_PAUSE or
                PlaybackState.ACTION_PLAY_PAUSE or
                PlaybackState.ACTION_SKIP_TO_NEXT or
                PlaybackState.ACTION_SKIP_TO_PREVIOUS or
                PlaybackState.ACTION_SEEK_TO or
                PlaybackState.ACTION_STOP

        val playbackState = PlaybackState.Builder()
            .setActions(actions)
            .setState(state, currentPositionMs, if (isPlaying) 1.0f else 0.0f)
            .build()
        session.setPlaybackState(playbackState)

        // Metadata for Android lock screen widget (title, artist, album, duration, and artwork)
        val artworkBitmap = ArtworkHelper.getArtworkBitmap(this, currentSongId, currentAlbumId, currentCoverArt)
        val metadataBuilder = MediaMetadata.Builder()
            .putString(MediaMetadata.METADATA_KEY_TITLE, currentTitle)
            .putString(MediaMetadata.METADATA_KEY_ARTIST, currentArtist)
            .putString(MediaMetadata.METADATA_KEY_ALBUM, currentAlbum)
            .putLong(MediaMetadata.METADATA_KEY_DURATION, if (durationMs > 0) durationMs else 0L)

        if (artworkBitmap != null) {
            metadataBuilder.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, artworkBitmap)
            metadataBuilder.putBitmap(MediaMetadata.METADATA_KEY_ART, artworkBitmap)
        }

        session.setMetadata(metadataBuilder.build())
    }

    private fun updateNotification() {
        val session = mediaSession ?: return

        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingOpenApp = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action intents
        val prevPending = createActionPendingIntent(ACTION_PREVIOUS, 1)
        val togglePending = createActionPendingIntent(ACTION_TOGGLE, 2)
        val nextPending = createActionPendingIntent(ACTION_NEXT, 3)
        val closePending = createActionPendingIntent(ACTION_CLOSE, 4)
        val favoritePending = createActionPendingIntent(ACTION_FAVORITE, 5)

        val playPauseIcon = if (isPlaying) {
            android.R.drawable.ic_media_pause
        } else {
            android.R.drawable.ic_media_play
        }
        val playPauseTitle = if (isPlaying) "Pause" else "Play"

        val artworkBitmap: Bitmap? = ArtworkHelper.getArtworkBitmap(this, currentSongId, currentAlbumId, currentCoverArt)

        val mediaStyle = Notification.MediaStyle()
            .setMediaSession(session.sessionToken)
            // Compact view shows Favorite (0), Play/Pause (2), Next (3)
            .setShowActionsInCompactView(1, 2, 3)

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }

        builder
            .setStyle(mediaStyle)
            .setContentTitle(currentTitle)
            .setContentText(currentArtist)
            .setSubText(currentAlbum)
            .setSmallIcon(if (isPlaying) android.R.drawable.ic_media_play else android.R.drawable.ic_media_pause)
            .setContentIntent(pendingOpenApp)
            .setDeleteIntent(closePending)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setOngoing(isPlaying)
            .setShowWhen(false)

        if (artworkBitmap != null) {
            builder.setLargeIcon(artworkBitmap)
        }

        // Action 0: Favorite (Heart)
        builder.addAction(
            Notification.Action.Builder(
                android.R.drawable.btn_star_big_on,
                if (isFavorite) "Favorited" else "Favorite",
                favoritePending
            ).build()
        )

        // Action 1: Previous Track
        builder.addAction(
            Notification.Action.Builder(
                android.R.drawable.ic_media_previous,
                "Previous",
                prevPending
            ).build()
        )

        // Action 2: Play/Pause
        builder.addAction(
            Notification.Action.Builder(
                playPauseIcon,
                playPauseTitle,
                togglePending
            ).build()
        )

        // Action 3: Next Track
        builder.addAction(
            Notification.Action.Builder(
                android.R.drawable.ic_media_next,
                "Next",
                nextPending
            ).build()
        )

        // Action 4: Close / Dismiss
        builder.addAction(
            Notification.Action.Builder(
                android.R.drawable.ic_menu_close_clear_cancel,
                "Close",
                closePending
            ).build()
        )

        val notification = builder.build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun createActionPendingIntent(action: String, requestCode: Int): PendingIntent {
        val intent = Intent(this, MusicPlaybackService::class.java).apply {
            this.action = action
        }
        return PendingIntent.getService(
            this,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    private fun onMediaAction(type: String, position: Long) {
        actionListener?.invoke(type, position)
    }

    companion object {
        const val CHANNEL_ID = "sonance_music_playback_v2"
        const val NOTIFICATION_ID = 2026

        const val ACTION_PLAY = "com.sonance.musicplayer.ACTION_PLAY"
        const val ACTION_PAUSE = "com.sonance.musicplayer.ACTION_PAUSE"
        const val ACTION_TOGGLE = "com.sonance.musicplayer.ACTION_TOGGLE"
        const val ACTION_NEXT = "com.sonance.musicplayer.ACTION_NEXT"
        const val ACTION_PREVIOUS = "com.sonance.musicplayer.ACTION_PREVIOUS"
        const val ACTION_CLOSE = "com.sonance.musicplayer.ACTION_CLOSE"
        const val ACTION_FAVORITE = "com.sonance.musicplayer.ACTION_FAVORITE"
        const val ACTION_UPDATE = "com.sonance.musicplayer.ACTION_UPDATE"

        const val EXTRA_TITLE = "extra_title"
        const val EXTRA_ARTIST = "extra_artist"
        const val EXTRA_ALBUM = "extra_album"
        const val EXTRA_SONG_ID = "extra_song_id"
        const val EXTRA_ALBUM_ID = "extra_album_id"
        const val EXTRA_COVER_ART = "extra_cover_art"
        const val EXTRA_IS_PLAYING = "extra_is_playing"
        const val EXTRA_POSITION = "extra_position"
        const val EXTRA_DURATION = "extra_duration"
        const val EXTRA_IS_FAVORITE = "extra_is_favorite"

        var instance: MusicPlaybackService? = null
        var actionListener: ((type: String, position: Long) -> Unit)? = null

        fun update(
            context: Context,
            title: String,
            artist: String,
            album: String?,
            songId: Long,
            albumId: Long,
            coverArt: String?,
            isPlaying: Boolean,
            positionMs: Long,
            durationMs: Long,
            isFavorite: Boolean
        ) {
            val intent = Intent(context, MusicPlaybackService::class.java).apply {
                action = ACTION_UPDATE
                putExtra(EXTRA_TITLE, title)
                putExtra(EXTRA_ARTIST, artist)
                putExtra(EXTRA_ALBUM, album ?: "Music")
                putExtra(EXTRA_SONG_ID, songId)
                putExtra(EXTRA_ALBUM_ID, albumId)
                putExtra(EXTRA_COVER_ART, coverArt)
                putExtra(EXTRA_IS_PLAYING, isPlaying)
                putExtra(EXTRA_POSITION, positionMs)
                putExtra(EXTRA_DURATION, durationMs)
                putExtra(EXTRA_IS_FAVORITE, isFavorite)
            }
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            } catch (e: Exception) {
                // Ignore service start limitations when app in background
            }
        }

        fun stop(context: Context) {
            try {
                val intent = Intent(context, MusicPlaybackService::class.java).apply {
                    action = ACTION_CLOSE
                }
                context.startService(intent)
            } catch (_: Exception) {}
        }
    }
}
