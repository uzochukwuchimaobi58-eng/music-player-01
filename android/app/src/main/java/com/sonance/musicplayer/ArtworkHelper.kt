package com.sonance.musicplayer

import android.content.ContentUris
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.util.Base64
import android.util.Size
import java.io.ByteArrayOutputStream

/**
 * Helper to safely extract and cache music artwork thumbnails from MediaStore,
 * content URIs, or embedded ID3 tags, and encode them as standard base64 data URIs
 * for seamless rendering in Android WebView.
 */
object ArtworkHelper {
    // Cache artwork by albumId so repeated tracks in the same album resolve instantaneously
    private val cache = mutableMapOf<Long, String?>()

    fun getArtworkForSong(context: Context, songId: Long, albumId: Long): String? {
        if (albumId > 0 && cache.containsKey(albumId)) {
            return cache[albumId]
        }

        var result: String? = null

        // 1. Android 10+ (API 29+) official ContentResolver loadThumbnail
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                val songUri = ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, songId)
                val bitmap = context.contentResolver.loadThumbnail(songUri, Size(256, 256), null)
                if (bitmap != null) {
                    result = bitmapToBase64(bitmap)
                }
            } catch (_: Exception) {}
        }

        // 2. MediaStore album art URI: content://media/external/audio/albumart/<albumId>
        if (result == null && albumId > 0) {
            try {
                val albumArtUri = ContentUris.withAppendedId(Uri.parse("content://media/external/audio/albumart"), albumId)
                context.contentResolver.openInputStream(albumArtUri)?.use { stream ->
                    val bitmap = BitmapFactory.decodeStream(stream)
                    if (bitmap != null) {
                        result = bitmapToBase64(bitmap)
                    }
                }
            } catch (_: Exception) {}
        }

        // 3. Fallback: MediaMetadataRetriever embedded picture from the audio file itself
        if (result == null) {
            try {
                val songUri = ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, songId)
                val mmr = MediaMetadataRetriever()
                mmr.setDataSource(context, songUri)
                val artBytes = mmr.embeddedPicture
                mmr.release()
                if (artBytes != null && artBytes.isNotEmpty()) {
                    val bitmap = BitmapFactory.decodeByteArray(artBytes, 0, artBytes.size)
                    if (bitmap != null) {
                        result = bitmapToBase64(bitmap)
                    }
                }
            } catch (_: Exception) {}
        }

        if (albumId > 0) {
            cache[albumId] = result
        }

        return result
    }

    private fun bitmapToBase64(bitmap: Bitmap): String {
        // Downscale slightly if larger than 256x256 to ensure fast IPC transfer and optimal memory
        val scaled = if (bitmap.width > 256 || bitmap.height > 256) {
            val scale = 256f / Math.max(bitmap.width, bitmap.height)
            val w = Math.max(1, (bitmap.width * scale).toInt())
            val h = Math.max(1, (bitmap.height * scale).toInt())
            Bitmap.createScaledBitmap(bitmap, w, h, true)
        } else {
            bitmap
        }
        val outputStream = ByteArrayOutputStream()
        scaled.compress(Bitmap.CompressFormat.JPEG, 75, outputStream)
        val bytes = outputStream.toByteArray()
        return "data:image/jpeg;base64," + Base64.encodeToString(bytes, Base64.NO_WRAP)
    }
}
