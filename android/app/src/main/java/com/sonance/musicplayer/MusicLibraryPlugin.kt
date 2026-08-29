package com.sonance.musicplayer

import android.Manifest
import android.content.ContentUris
import android.os.Build
import android.provider.MediaStore
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
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

    @PluginMethod
    fun scan(call: PluginCall) {
        if (hasAudioPermission()) {
            performScan(call)
        } else {
            requestPermissionForAlias("audio", call, "audioPermissionCallback")
        }
    }

    @PluginMethod
    fun scanSongs(call: PluginCall) {
        scan(call)
    }

    @PermissionCallback
    private fun audioPermissionCallback(call: PluginCall) {
        if (hasAudioPermission()) {
            performScan(call)
        } else {
            call.reject("Permission is required to scan local songs on your device", "PERMISSION_DENIED")
        }
    }

    private fun hasAudioPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getPermissionState("audio") == PermissionState.GRANTED ||
                context.checkSelfPermission(Manifest.permission.READ_MEDIA_AUDIO) == android.content.pm.PackageManager.PERMISSION_GRANTED
        } else {
            getPermissionState("audio") == PermissionState.GRANTED ||
                context.checkSelfPermission(Manifest.permission.READ_EXTERNAL_STORAGE) == android.content.pm.PackageManager.PERMISSION_GRANTED
        }
    }

    private fun performScan(call: PluginCall) {
        try {
            val songsArray = JSArray()
            val uri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI

            // Projection: Only fetch required fields
            val projection = arrayOf(
                MediaStore.Audio.Media._ID,
                MediaStore.Audio.Media.TITLE,
                MediaStore.Audio.Media.ARTIST,
                MediaStore.Audio.Media.ALBUM,
                MediaStore.Audio.Media.DURATION,
                MediaStore.Audio.Media.ALBUM_ID,
                MediaStore.Audio.Media.IS_MUSIC
            )

            // Filter: IS_MUSIC != 0 and duration > 1000ms to ignore ringtones/short audio clips
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

                    // Skip empty or invalid entries
                    if (rawTitle.isNullOrBlank()) {
                        continue
                    }

                    val title = rawTitle.trim()
                    val artist = if (!rawArtist.isNullOrBlank() && rawArtist != "<unknown>") rawArtist.trim() else "Unknown Artist"
                    val album = if (!rawAlbum.isNullOrBlank() && rawAlbum != "<unknown>") rawAlbum.trim() else "Unknown Album"
                    val songUri = ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, id).toString()

                    val songObj = JSObject()
                    songObj.put("id", id.toString())
                    songObj.put("title", title)
                    songObj.put("artist", artist)
                    songObj.put("album", album)
                    songObj.put("duration", duration) // in milliseconds
                    songObj.put("uri", songUri)
                    songObj.put("albumId", albumId.toString())

                    songsArray.put(songObj)
                }
            }

            val result = JSObject()
            result.put("songs", songsArray)
            result.put("count", songsArray.length())
            call.resolve(result)
        } catch (e: Exception) {
            call.reject("Failed to scan device music: ${e.localizedMessage ?: "Unknown error"}", "SCAN_ERROR", e)
        }
    }
}
