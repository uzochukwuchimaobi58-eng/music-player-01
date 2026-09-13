package com.sonance.musicplayer

import android.content.ContentUris
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Shader
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.util.Base64
import android.util.Size
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL

/**
 * Robust helper to extract, persist to device INTERNAL STORAGE, and cache music artwork.
 * Saves artwork permanently in app internal storage (context.filesDir/music_artwork/)
 * so that artwork survives across reboots and app launches without IPC or memory limits.
 */
object ArtworkHelper {
    private const val ARTWORK_DIR_NAME = "music_artwork"
    private val memoryCache = mutableMapOf<Long, String?>()

    fun getArtworkDirectory(context: Context): File {
        val dir = File(context.filesDir, ARTWORK_DIR_NAME)
        if (!dir.exists()) {
            dir.mkdirs()
        }
        return dir
    }

    /**
     * Finds or extracts music artwork, saves it to device internal storage,
     * and returns the local file path or data URI for rendering.
     */
    fun getArtworkForSong(context: Context, songId: Long, albumId: Long): String? {
        if (albumId > 0 && memoryCache.containsKey(albumId)) {
            val cached = memoryCache[albumId]
            if (!cached.isNullOrBlank()) return cached
        }

        val artworkDir = getArtworkDirectory(context)
        val albumFile = if (albumId > 0) File(artworkDir, "album_${albumId}.jpg") else null
        val songFile = if (songId > 0) File(artworkDir, "song_${songId}.jpg") else null

        // 1. Check if already saved in internal storage
        if (albumFile != null && albumFile.exists() && albumFile.length() > 0) {
            val path = albumFile.absolutePath
            memoryCache[albumId] = path
            return path
        }
        if (songFile != null && songFile.exists() && songFile.length() > 0) {
            val path = songFile.absolutePath
            if (albumId > 0) memoryCache[albumId] = path
            return path
        }

        var extractedBitmap: Bitmap? = null

        // 2. Android 10+ (API 29+) official ContentResolver loadThumbnail
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && songId > 0) {
            try {
                val songUri = ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, songId)
                extractedBitmap = context.contentResolver.loadThumbnail(songUri, Size(512, 512), null)
            } catch (_: Throwable) {}
        }

        // 3. MediaStore album art URI: content://media/external/audio/albumart/<albumId>
        if (extractedBitmap == null && albumId > 0) {
            try {
                val albumArtUri = ContentUris.withAppendedId(Uri.parse("content://media/external/audio/albumart"), albumId)
                context.contentResolver.openInputStream(albumArtUri)?.use { stream ->
                    extractedBitmap = BitmapFactory.decodeStream(stream)
                }
            } catch (_: Throwable) {}
        }

        // 4. Fallback: MediaMetadataRetriever embedded picture from audio file
        if (extractedBitmap == null && songId > 0) {
            try {
                val songUri = ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, songId)
                val mmr = MediaMetadataRetriever()
                mmr.setDataSource(context, songUri)
                val artBytes = mmr.embeddedPicture
                mmr.release()
                if (artBytes != null && artBytes.isNotEmpty()) {
                    extractedBitmap = BitmapFactory.decodeByteArray(artBytes, 0, artBytes.size)
                }
            } catch (_: Throwable) {}
        }

        // 5. If bitmap was extracted, SAVE TO INTERNAL STORAGE!
        if (extractedBitmap != null) {
            val targetFile = albumFile ?: songFile ?: File(artworkDir, "track_${System.currentTimeMillis()}.jpg")
            saveBitmapToInternalStorage(extractedBitmap, targetFile)
            val filePath = targetFile.absolutePath
            if (albumId > 0) {
                memoryCache[albumId] = filePath
            }
            return filePath
        }

        return null
    }

    /**
     * Saves a Bitmap directly to a destination File in internal storage
     */
    fun saveBitmapToInternalStorage(bitmap: Bitmap, file: File): Boolean {
        return try {
            if (!file.parentFile!!.exists()) {
                file.parentFile!!.mkdirs()
            }
            FileOutputStream(file).use { out ->
                bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
                out.flush()
            }
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    /**
     * Saves user uploaded or external artwork string (base64, file path, or remote URL)
     * to internal storage for permanent offline availability.
     */
    fun saveArtworkDataToInternalStorage(context: Context, songId: Long, albumId: Long, data: String): String? {
        val artworkDir = getArtworkDirectory(context)
        val targetFile = if (albumId > 0) File(artworkDir, "album_${albumId}.jpg") else File(artworkDir, "song_${songId}.jpg")

        try {
            if (data.startsWith("data:image")) {
                val base64Part = data.substringAfter("base64,")
                val decodedBytes = Base64.decode(base64Part, Base64.DEFAULT)
                val bmp = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
                if (bmp != null) {
                    saveBitmapToInternalStorage(bmp, targetFile)
                    if (albumId > 0) memoryCache[albumId] = targetFile.absolutePath
                    return targetFile.absolutePath
                }
            } else if (data.startsWith("http://") || data.startsWith("https://")) {
                val url = URL(data)
                val conn = (url.openConnection() as HttpURLConnection).apply {
                    connectTimeout = 5000
                    readTimeout = 5000
                    doInput = true
                }
                conn.connect()
                conn.inputStream.use { input ->
                    val bmp = BitmapFactory.decodeStream(input)
                    if (bmp != null) {
                        saveBitmapToInternalStorage(bmp, targetFile)
                        if (albumId > 0) memoryCache[albumId] = targetFile.absolutePath
                        return targetFile.absolutePath
                    }
                }
            } else if (data.startsWith("/") || data.startsWith("file://")) {
                val srcPath = data.removePrefix("file://")
                val srcFile = File(srcPath)
                if (srcFile.exists()) {
                    srcFile.copyTo(targetFile, overwrite = true)
                    if (albumId > 0) memoryCache[albumId] = targetFile.absolutePath
                    return targetFile.absolutePath
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return null
    }

    /**
     * Resolves a non-null high quality Bitmap for notification, lock screen, and system media controls.
     * Looks through internal storage first, then parses data, and falls back to a sleek generated music art.
     */
    fun getArtworkBitmap(context: Context, songId: Long, albumId: Long, coverArtData: String? = null, title: String? = null): Bitmap {
        val artworkDir = getArtworkDirectory(context)

        // 1. Check internal storage files
        if (albumId > 0) {
            val albumFile = File(artworkDir, "album_${albumId}.jpg")
            if (albumFile.exists() && albumFile.length() > 0) {
                val bmp = BitmapFactory.decodeFile(albumFile.absolutePath)
                if (bmp != null) return bmp
            }
        }
        if (songId > 0) {
            val songFile = File(artworkDir, "song_${songId}.jpg")
            if (songFile.exists() && songFile.length() > 0) {
                val bmp = BitmapFactory.decodeFile(songFile.absolutePath)
                if (bmp != null) return bmp
            }
        }

        // 2. Parse coverArtData if provided
        if (!coverArtData.isNullOrBlank()) {
            try {
                if (coverArtData.startsWith("data:image")) {
                    val base64Part = coverArtData.substringAfter("base64,")
                    val decodedBytes = Base64.decode(base64Part, Base64.DEFAULT)
                    val bmp = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
                    if (bmp != null) {
                        // Persist to internal storage for next time
                        val target = if (albumId > 0) File(artworkDir, "album_${albumId}.jpg") else File(artworkDir, "song_${songId}.jpg")
                        saveBitmapToInternalStorage(bmp, target)
                        return bmp
                    }
                } else if (coverArtData.startsWith("/") || coverArtData.startsWith("file://")) {
                    val filePath = coverArtData.removePrefix("file://")
                    val file = File(filePath)
                    if (file.exists()) {
                        val bmp = BitmapFactory.decodeFile(file.absolutePath)
                        if (bmp != null) return bmp
                    }
                }
            } catch (_: Throwable) {}
        }

        // 3. Fallback extraction from MediaStore
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && songId > 0) {
            try {
                val songUri = ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, songId)
                val bmp = context.contentResolver.loadThumbnail(songUri, Size(512, 512), null)
                if (bmp != null) {
                    val target = if (albumId > 0) File(artworkDir, "album_${albumId}.jpg") else File(artworkDir, "song_${songId}.jpg")
                    saveBitmapToInternalStorage(bmp, target)
                    return bmp
                }
            } catch (_: Throwable) {}
        }

        if (albumId > 0) {
            try {
                val albumArtUri = ContentUris.withAppendedId(Uri.parse("content://media/external/audio/albumart"), albumId)
                context.contentResolver.openInputStream(albumArtUri)?.use { stream ->
                    val bmp = BitmapFactory.decodeStream(stream)
                    if (bmp != null) {
                        val target = File(artworkDir, "album_${albumId}.jpg")
                        saveBitmapToInternalStorage(bmp, target)
                        return bmp
                    }
                }
            } catch (_: Throwable) {}
        }

        if (songId > 0) {
            try {
                val songUri = ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, songId)
                val mmr = MediaMetadataRetriever()
                mmr.setDataSource(context, songUri)
                val artBytes = mmr.embeddedPicture
                mmr.release()
                if (artBytes != null && artBytes.isNotEmpty()) {
                    val bmp = BitmapFactory.decodeByteArray(artBytes, 0, artBytes.size)
                    if (bmp != null) {
                        val target = File(artworkDir, "song_${songId}.jpg")
                        saveBitmapToInternalStorage(bmp, target)
                        return bmp
                    }
                }
            } catch (_: Throwable) {}
        }

        // 4. Default high-resolution branded music artwork generator
        return generateFallbackArtwork(title ?: "Sonance Music")
    }

    /**
     * Generates a sleek, high-contrast dark musical vinyl artwork bitmap
     * with golden amber accents, musical note, and initials.
     */
    private fun generateFallbackArtwork(title: String): Bitmap {
        val size = 512
        val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        // Gradient dark background
        val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            shader = LinearGradient(
                0f, 0f, size.toFloat(), size.toFloat(),
                intArrayOf(Color.rgb(20, 20, 25), Color.rgb(10, 10, 12), Color.rgb(28, 20, 15)),
                null, Shader.TileMode.CLAMP
            )
        }
        canvas.drawRect(0f, 0f, size.toFloat(), size.toFloat(), bgPaint)

        // Vinyl outer ring
        val ringPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeWidth = 3f
            color = Color.argb(40, 255, 255, 255)
        }
        val center = size / 2f
        canvas.drawCircle(center, center, center * 0.90f, ringPaint)
        canvas.drawCircle(center, center, center * 0.75f, ringPaint)
        canvas.drawCircle(center, center, center * 0.60f, ringPaint)

        // Center vinyl label
        val labelPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.FILL
            shader = LinearGradient(
                center - 120f, center - 120f, center + 120f, center + 120f,
                Color.rgb(217, 119, 6), Color.rgb(180, 83, 9),
                Shader.TileMode.CLAMP
            )
        }
        canvas.drawCircle(center, center, 110f, labelPaint)

        // Center spindle hole
        val spindlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.FILL
            color = Color.rgb(15, 15, 18)
        }
        canvas.drawCircle(center, center, 24f, spindlePaint)

        // Title initial
        val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            textSize = 48f
            textAlign = Paint.Align.CENTER
            isFakeBoldText = true
        }
        val letter = title.trim().firstOrNull()?.uppercase() ?: "S"
        canvas.drawText(letter, center, center + 65f, textPaint)

        return bitmap
    }
}
