package com.sonance.musicplayer

import android.Manifest
import android.content.ContentUris
import android.content.pm.PackageManager
import android.os.Build
import android.provider.MediaStore
import androidx.core.content.ContextCompat
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback

@CapacitorPlugin(
    name = "MusicLibrary",
    permissions = [
        Permission(
            alias = "audio",
            strings = [
                Manifest.permission.READ_MEDIA_AUDIO,
                Manifest.permission.READ_EXTERNAL_STORAGE
            ]
        )
    ]
)
class MusicLibraryPlugin : Plugin() {

    private var playbackManager: PlaybackManager? = null
    private var currentTitle: String = "Sonance Music"
    private var currentArtist: String = "Music Player"
    private var currentAlbum: String = "Music"
    private var currentSongId: Long = 0L
    private var currentCoverArt: String? = null
    private var isFavorite: Boolean = false

    override fun load() {
        super.load()

        MusicPlaybackService.actionListener = { type, position ->
            when (type) {
                "next" -> {
                    playbackManager?.playNext()
                }
                "previous" -> {
                    playbackManager?.playPrevious()
                }
                "toggle" -> {
                    if (playbackManager?.isPlaying == true) {
                        playbackManager?.pause()
                    } else {
                        playbackManager?.resume()
                    }
                }
            }
            val data = JSObject().apply {
                put("type", type)
                put("position", position)
            }
            notifyListeners("mediaAction", data)
        }

        playbackManager = PlaybackManager(context).apply {
            onTrackAutoAdvancedCallback = { track, index ->
                currentTitle = track.title
                currentArtist = track.artist
                currentAlbum = track.album
                currentSongId = track.id.toLongOrNull() ?: 0L
                currentCoverArt = track.coverArt
                this@MusicLibraryPlugin.isFavorite = track.isFavorite

                MusicPlaybackService.update(
                    context,
                    title = track.title,
                    artist = track.artist,
                    album = track.album,
                    songId = currentSongId,
                    albumId = 0L,
                    coverArt = track.coverArt,
                    isPlaying = true,
                    positionMs = 0L,
                    durationMs = track.duration,
                    isFavorite = track.isFavorite
                )

                val data = JSObject().apply {
                    put("id", track.id)
                    put("index", index)
                    put("title", track.title)
                    put("artist", track.artist)
                }
                notifyListeners("trackAutoAdvanced", data)
            }
            onPreparedCallback = { durationMs, positionMs ->
                val data = JSObject().apply {
                    put("status", "playing")
                    put("duration", durationMs)
                    put("position", positionMs)
                }
                notifyListeners("playbackStateChange", data)

                MusicPlaybackService.update(
                    context,
                    title = currentTitle,
                    artist = currentArtist,
                    album = currentAlbum,
                    songId = currentSongId,
                    albumId = 0L,
                    coverArt = currentCoverArt,
                    isPlaying = true,
                    positionMs = positionMs.toLong(),
                    durationMs = durationMs.toLong(),
                    isFavorite = isFavorite
                )
            }
            onCompletionCallback = {
                val data = JSObject().apply {
                    put("status", "completed")
                }
                notifyListeners("playbackCompleted", data)

                MusicPlaybackService.update(
                    context,
                    title = currentTitle,
                    artist = currentArtist,
                    album = currentAlbum,
                    songId = currentSongId,
                    albumId = 0L,
                    coverArt = currentCoverArt,
                    isPlaying = false,
                    positionMs = 0L,
                    durationMs = 0L,
                    isFavorite = isFavorite
                )
            }
            onErrorCallback = { what, extra, message ->
                val data = JSObject().apply {
                    put("status", "error")
                    put("what", what)
                    put("extra", extra)
                    put("message", message)
                }
                notifyListeners("playbackError", data)
            }
            onProgressCallback = { positionMs, durationMs ->
                val data = JSObject().apply {
                    put("currentPosition", positionMs)
                    put("duration", durationMs)
                }
                notifyListeners("playbackProgress", data)
            }
            onStateChangeCallback = { isPlaying ->
                val data = JSObject().apply {
                    put("status", if (isPlaying) "playing" else "paused")
                }
                notifyListeners("playbackStateChange", data)

                MusicPlaybackService.update(
                    context,
                    title = currentTitle,
                    artist = currentArtist,
                    album = currentAlbum,
                    songId = currentSongId,
                    albumId = 0L,
                    coverArt = currentCoverArt,
                    isPlaying = isPlaying,
                    positionMs = (playbackManager?.currentPosition ?: 0).toLong(),
                    durationMs = (playbackManager?.duration ?: 0).toLong(),
                    isFavorite = isFavorite
                )
            }
        }
    }

    override fun handleOnDestroy() {
        playbackManager?.release()
        MusicPlaybackService.stop(context)
        super.handleOnDestroy()
    }

    /**
     * 3. Verify that proper runtime audio read permissions
     * (READ_MEDIA_AUDIO for Android 13+, READ_EXTERNAL_STORAGE for older)
     * are checked and requested before scanning or streaming.
     */
    private fun hasAudioPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(context, Manifest.permission.READ_MEDIA_AUDIO) == PackageManager.PERMISSION_GRANTED
        } else {
            ContextCompat.checkSelfPermission(context, Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED
        }
    }

    @PluginMethod
    fun checkAudioPermission(call: PluginCall) {
        val granted = hasAudioPermission()
        val ret = JSObject().apply {
            put("granted", granted)
        }
        call.resolve(ret)
    }

    @PluginMethod
    fun requestAudioPermission(call: PluginCall) {
        if (hasAudioPermission()) {
            val ret = JSObject().apply {
                put("granted", true)
            }
            call.resolve(ret)
        } else {
            requestPermissionForAlias("audio", call, "requestAudioPermissionCallback")
        }
    }

    @PermissionCallback
    private fun requestAudioPermissionCallback(call: PluginCall) {
        val granted = hasAudioPermission()
        val ret = JSObject().apply {
            put("granted", granted)
        }
        call.resolve(ret)
    }

    @PluginMethod
    fun playTrack(call: PluginCall) {
        if (!hasAudioPermission()) {
            requestPermissionForAlias("audio", call, "playPermissionCallback")
            return
        }
        executePlayTrack(call)
    }

    @PermissionCallback
    private fun playPermissionCallback(call: PluginCall) {
        if (hasAudioPermission()) {
            executePlayTrack(call)
        } else {
            call.reject("Permission is required to play local audio files", "PERMISSION_DENIED")
        }
    }

    private fun executePlayTrack(call: PluginCall) {
        val uri = call.getString("uri")
        val id = call.getString("id")
        val title = call.getString("title") ?: "Unknown Title"
        val artist = call.getString("artist") ?: "Unknown Artist"
        val album = call.getString("album") ?: "Music"
        val coverArt = call.getString("coverArt")
        val duration = call.getInt("duration") ?: 0
        val isFav = call.getBoolean("isFavorite") ?: false

        currentTitle = title
        currentArtist = artist
        currentAlbum = album
        currentSongId = id?.toLongOrNull() ?: 0L
        currentCoverArt = coverArt
        this.isFavorite = isFav

        if (uri.isNullOrBlank() && id.isNullOrBlank()) {
            call.reject("Missing required parameter: uri or id", "INVALID_PARAMS")
            return
        }

        // Parse optional queue to enable instant background playback and lock-screen progression
        val queueArray = call.getArray("queue")
        if (queueArray != null && queueArray.length() > 0) {
            val items = mutableListOf<PlaybackManager.NativeQueueTrack>()
            for (i in 0 until queueArray.length()) {
                val obj = queueArray.getJSONObject(i)
                items.add(
                    PlaybackManager.NativeQueueTrack(
                        id = obj.optString("id", ""),
                        uri = if (obj.has("uri") && !obj.isNull("uri")) obj.optString("uri") else null,
                        title = obj.optString("title", "Unknown Title"),
                        artist = obj.optString("artist", "Unknown Artist"),
                        album = if (obj.has("album") && !obj.isNull("album")) obj.optString("album") else null,
                        coverArt = if (obj.has("coverArt") && !obj.isNull("coverArt")) obj.optString("coverArt") else null,
                        duration = obj.optLong("duration", 0L),
                        isFavorite = obj.optBoolean("isFavorite", false)
                    )
                )
            }
            var startIndex = call.getInt("currentIndex") ?: -1
            if (startIndex == -1 && !id.isNullOrBlank()) {
                startIndex = items.indexOfFirst { it.id == id }
            }
            val repeat = call.getString("repeatMode")
            val shuffle = call.getBoolean("isShuffle")
            playbackManager?.setQueue(items, startIndex, repeat, shuffle)
        }

        playbackManager?.playTrack(uri, id)

        MusicPlaybackService.update(
            context,
            title = title,
            artist = artist,
            album = album,
            songId = currentSongId,
            albumId = 0L,
            coverArt = coverArt,
            isPlaying = true,
            positionMs = 0L,
            durationMs = duration.toLong(),
            isFavorite = isFav
        )

        val ret = JSObject().apply {
            put("status", "preparing")
        }
        call.resolve(ret)
    }

    @PluginMethod
    fun setQueue(call: PluginCall) {
        val queueArray = call.getArray("queue")
        if (queueArray != null) {
            val items = mutableListOf<PlaybackManager.NativeQueueTrack>()
            for (i in 0 until queueArray.length()) {
                val obj = queueArray.getJSONObject(i)
                items.add(
                    PlaybackManager.NativeQueueTrack(
                        id = obj.optString("id", ""),
                        uri = if (obj.has("uri") && !obj.isNull("uri")) obj.optString("uri") else null,
                        title = obj.optString("title", "Unknown Title"),
                        artist = obj.optString("artist", "Unknown Artist"),
                        album = if (obj.has("album") && !obj.isNull("album")) obj.optString("album") else null,
                        coverArt = if (obj.has("coverArt") && !obj.isNull("coverArt")) obj.optString("coverArt") else null,
                        duration = obj.optLong("duration", 0L),
                        isFavorite = obj.optBoolean("isFavorite", false)
                    )
                )
            }
            val currentId = call.getString("currentId")
            var startIndex = call.getInt("currentIndex") ?: -1
            if (startIndex == -1 && !currentId.isNullOrBlank()) {
                startIndex = items.indexOfFirst { it.id == currentId }
            }
            val repeat = call.getString("repeatMode")
            val shuffle = call.getBoolean("isShuffle")
            playbackManager?.setQueue(items, startIndex, repeat, shuffle)
        }
        call.resolve()
    }

    @PluginMethod
    fun setPlaybackMode(call: PluginCall) {
        val repeat = call.getString("repeatMode")
        val shuffle = call.getBoolean("isShuffle")
        playbackManager?.setPlaybackMode(repeat, shuffle)
        call.resolve()
    }

    @PluginMethod
    fun playNext(call: PluginCall) {
        val success = playbackManager?.playNext() ?: false
        val ret = JSObject().apply {
            put("success", success)
        }
        call.resolve(ret)
    }

    @PluginMethod
    fun playPrevious(call: PluginCall) {
        val success = playbackManager?.playPrevious() ?: false
        val ret = JSObject().apply {
            put("success", success)
        }
        call.resolve(ret)
    }

    @PluginMethod
    fun updateNotification(call: PluginCall) {
        val title = call.getString("title") ?: currentTitle
        val artist = call.getString("artist") ?: currentArtist
        val album = call.getString("album") ?: currentAlbum
        val coverArt = call.getString("coverArt") ?: currentCoverArt
        val isPlaying = call.getBoolean("isPlaying") ?: (playbackManager?.isPlaying == true)
        val durationMs = (call.getDouble("duration") ?: (playbackManager?.duration?.toDouble() ?: 0.0)).toLong()
        val currentPositionMs = (call.getDouble("currentTime") ?: (playbackManager?.currentPosition?.toDouble() ?: 0.0)).toLong()
        val isFav = call.getBoolean("isFavorite") ?: this.isFavorite

        currentTitle = title
        currentArtist = artist
        currentAlbum = album
        currentCoverArt = coverArt
        this.isFavorite = isFav

        MusicPlaybackService.update(
            context,
            title = title,
            artist = artist,
            album = album,
            songId = currentSongId,
            albumId = 0L,
            coverArt = coverArt,
            isPlaying = isPlaying,
            positionMs = currentPositionMs,
            durationMs = durationMs,
            isFavorite = isFav
        )
        call.resolve()
    }

    @PluginMethod
    fun hideNotification(call: PluginCall) {
        MusicPlaybackService.stop(context)
        call.resolve()
    }

    @PluginMethod
    fun pause(call: PluginCall) {
        playbackManager?.pause()
        MusicPlaybackService.update(
            context,
            title = currentTitle,
            artist = currentArtist,
            album = currentAlbum,
            songId = currentSongId,
            albumId = 0L,
            coverArt = currentCoverArt,
            isPlaying = false,
            positionMs = (playbackManager?.currentPosition ?: 0).toLong(),
            durationMs = (playbackManager?.duration ?: 0).toLong(),
            isFavorite = isFavorite
        )
        call.resolve(JSObject().apply { put("status", "paused") })
    }

    @PluginMethod
    fun resume(call: PluginCall) {
        playbackManager?.resume()
        MusicPlaybackService.update(
            context,
            title = currentTitle,
            artist = currentArtist,
            album = currentAlbum,
            songId = currentSongId,
            albumId = 0L,
            coverArt = currentCoverArt,
            isPlaying = true,
            positionMs = (playbackManager?.currentPosition ?: 0).toLong(),
            durationMs = (playbackManager?.duration ?: 0).toLong(),
            isFavorite = isFavorite
        )
        call.resolve(JSObject().apply { put("status", "playing") })
    }

    @PluginMethod
    fun seekTo(call: PluginCall) {
        val position = call.getInt("position") ?: 0
        playbackManager?.seekTo(position)
        call.resolve(JSObject().apply { put("position", position) })
    }

    @PluginMethod
    fun setVolume(call: PluginCall) {
        val volume = call.getFloat("volume") ?: 1.0f
        playbackManager?.setVolume(volume)
        call.resolve()
    }

    @PluginMethod
    fun getPlaybackStatus(call: PluginCall) {
        val mgr = playbackManager
        val ret = JSObject().apply {
            put("isPlaying", mgr?.isPlaying ?: false)
            put("currentPosition", mgr?.currentPosition ?: 0)
            put("duration", mgr?.duration ?: 0)
        }
        call.resolve(ret)
    }

    @PluginMethod
    fun getArtwork(call: PluginCall) {
        val songId = call.getString("songId")?.toLongOrNull() ?: 0L
        val albumId = call.getString("albumId")?.toLongOrNull() ?: 0L
        val artwork = ArtworkHelper.getArtworkForSong(context, songId, albumId)
        val ret = JSObject().apply {
            put("artwork", artwork)
        }
        call.resolve(ret)
    }

    @PluginMethod
    fun scan(call: PluginCall) {
        if (hasAudioPermission()) {
            performScan(call)
        } else {
            requestPermissionForAlias("audio", call, "scanPermissionCallback")
        }
    }

    @PluginMethod
    fun scanSongs(call: PluginCall) {
        scan(call)
    }

    @PermissionCallback
    private fun scanPermissionCallback(call: PluginCall) {
        if (hasAudioPermission()) {
            performScan(call)
        } else {
            call.reject("Permission is required to scan local songs on your device", "PERMISSION_DENIED")
        }
    }

    private fun performScan(call: PluginCall) {
        try {
            val songsArray = JSArray()
            val uri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI

            val projection = arrayOf(
                MediaStore.Audio.Media._ID,
                MediaStore.Audio.Media.TITLE,
                MediaStore.Audio.Media.ARTIST,
                MediaStore.Audio.Media.ALBUM,
                MediaStore.Audio.Media.DURATION,
                MediaStore.Audio.Media.ALBUM_ID,
                MediaStore.Audio.Media.IS_MUSIC
            )

            val selection = "${MediaStore.Audio.Media.IS_MUSIC} != 0 AND ${MediaStore.Audio.Media.DURATION} > 1000"
            val sortOrder = "${MediaStore.Audio.Media.TITLE} COLLATE NOCASE ASC"

            val contentResolver = context.contentResolver
            val cursor = contentResolver.query(
                uri,
                projection,
                selection,
                null,
                sortOrder
            )

            cursor?.use {
                val idColumn = it.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
                val titleColumn = it.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE)
                val artistColumn = it.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST)
                val albumColumn = it.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM)
                val durationColumn = it.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION)
                val albumIdColumn = it.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM_ID)

                while (it.moveToNext()) {
                    val id = it.getLong(idColumn)
                    val rawTitle = it.getString(titleColumn)
                    val rawArtist = it.getString(artistColumn)
                    val rawAlbum = it.getString(albumColumn)
                    val duration = it.getLong(durationColumn)
                    val albumId = it.getLong(albumIdColumn)

                    if (rawTitle.isNullOrBlank()) {
                        continue
                    }

                    val title = rawTitle.trim()
                    val artist = if (!rawArtist.isNullOrBlank() && rawArtist != "<unknown>") rawArtist.trim() else "Unknown Artist"
                    val album = if (!rawAlbum.isNullOrBlank() && rawAlbum != "<unknown>") rawAlbum.trim() else "Unknown Album"
                    val songUri = ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, id).toString()

                    // Extract actual music artwork for each song (cached per album for speed)
                    val artworkBase64 = ArtworkHelper.getArtworkForSong(context, id, albumId)

                    val songObj = JSObject().apply {
                        put("id", id.toString())
                        put("title", title)
                        put("artist", artist)
                        put("album", album)
                        put("duration", duration)
                        put("uri", songUri)
                        put("albumId", albumId.toString())
                        put("artwork", artworkBase64)
                    }

                    songsArray.put(songObj)
                }
            }

            val result = JSObject().apply {
                put("songs", songsArray)
                put("count", songsArray.length())
            }
            call.resolve(result)
        } catch (e: Exception) {
            call.reject("Failed to scan device music: ${e.localizedMessage ?: "Unknown error"}", "SCAN_ERROR", e)
        }
    }
}
