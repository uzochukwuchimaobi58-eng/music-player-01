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

    override fun load() {
        super.load()
        playbackManager = PlaybackManager(context).apply {
            onPreparedCallback = { durationMs, positionMs ->
                val data = JSObject().apply {
                    put("status", "playing")
                    put("duration", durationMs)
                    put("position", positionMs)
                }
                notifyListeners("playbackStateChange", data)
            }
            onCompletionCallback = {
                val data = JSObject().apply {
                    put("status", "completed")
                }
                notifyListeners("playbackCompleted", data)
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
            }
        }
    }

    override fun handleOnDestroy() {
        playbackManager?.release()
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

        if (uri.isNullOrBlank() && id.isNullOrBlank()) {
            call.reject("Missing required parameter: uri or id", "INVALID_PARAMS")
            return
        }

        playbackManager?.playTrack(uri, id)

        val ret = JSObject().apply {
            put("status", "preparing")
        }
        call.resolve(ret)
    }

    @PluginMethod
    fun pause(call: PluginCall) {
        playbackManager?.pause()
        call.resolve(JSObject().apply { put("status", "paused") })
    }

    @PluginMethod
    fun resume(call: PluginCall) {
        playbackManager?.resume()
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
            val sortOrder = "${MediaStore.Audio.Media.TITLE} ASC"

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
