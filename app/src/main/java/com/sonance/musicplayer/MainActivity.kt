package com.sonance.musicplayer

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import com.sonance.musicplayer.data.MusicRepository
import com.sonance.musicplayer.model.*
import com.sonance.musicplayer.player.PlaybackManager
import com.sonance.musicplayer.ui.components.*
import com.sonance.musicplayer.ui.screens.*
import com.sonance.musicplayer.ui.theme.SonanceTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private lateinit var repository: MusicRepository
    private lateinit var playbackManager: PlaybackManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        repository = MusicRepository.getInstance(applicationContext)
        playbackManager = PlaybackManager.getInstance(applicationContext, repository)

        setContent {
            val scope = rememberCoroutineScope()

            // State from repository & playback manager
            val tracks by repository.tracksFlow.collectAsState()
            val playlists by repository.playlistsFlow.collectAsState()
            val appTheme by repository.themeFlow.collectAsState()
            val eqSettings by repository.equalizerFlow.collectAsState()
            val playerSettings by repository.settingsFlow.collectAsState()

            val currentTrack by playbackManager.currentTrack.collectAsState()
            val isPlaying by playbackManager.isPlaying.collectAsState()
            val currentPosMs by playbackManager.currentPositionMs.collectAsState()
            val durationMs by playbackManager.durationMs.collectAsState()
            val repeatMode by playbackManager.repeatMode.collectAsState()
            val isShuffle by playbackManager.isShuffle.collectAsState()
            val playbackSpeed by playbackManager.playbackSpeed.collectAsState()
            val audioEffect by playbackManager.activeEffect.collectAsState()
            val isKaraokeMode by playbackManager.isKaraokeMode.collectAsState()
            val sleepTimerSec by playbackManager.sleepTimerSeconds.collectAsState()
            val playQueue by playbackManager.playQueue.collectAsState()

            // Navigation state
            var activeView by remember { mutableStateOf(ActiveView.HOME) }
            var activePlaylistId by remember { mutableStateOf<String?>(null) }
            var searchQuery by remember { mutableStateOf("") }

            // Modals and dialogs
            var isSidebarOpen by remember { mutableStateOf(false) }
            var isFullPlayerOpen by remember { mutableStateOf(false) }
            var isQueueOpen by remember { mutableStateOf(false) }
            var isEqualizerOpen by remember { mutableStateOf(false) }
            var isSleepTimerOpen by remember { mutableStateOf(false) }
            var isThemePickerOpen by remember { mutableStateOf(false) }
            var isSettingsOpen by remember { mutableStateOf(false) }
            var isScanModalOpen by remember { mutableStateOf(false) }
            var isWebBrowserOpen by remember { mutableStateOf(false) }
            var isCreatePlaylistOpen by remember { mutableStateOf(false) }
            var isDriveModeOpen by remember { mutableStateOf(false) }
            var isLyricsModeOpen by remember { mutableStateOf(false) }
            var trimmingTrack by remember { mutableStateOf<Track?>(null) }
            var isKaraokeStudioOpen by remember { mutableStateOf(false) }
            var isBeatInstrumentalOpen by remember { mutableStateOf(false) }

            // Keep screen on setting
            LaunchedEffect(playerSettings.keepScreenOn) {
                if (playerSettings.keepScreenOn) {
                    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                } else {
                    window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                }
            }

            // Permissions request
            val permissionsToRequest = remember {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    arrayOf(
                        Manifest.permission.READ_MEDIA_AUDIO,
                        Manifest.permission.POST_NOTIFICATIONS
                    )
                } else {
                    arrayOf(
                        Manifest.permission.READ_EXTERNAL_STORAGE
                    )
                }
            }

            val permissionLauncher = rememberLauncherForActivityResult(
                ActivityResultContracts.RequestMultiplePermissions()
            ) { perms ->
                val granted = perms.values.any { it }
                if (granted) {
                    scope.launch {
                        repository.scanMediaStore()
                    }
                }
            }

            LaunchedEffect(Unit) {
                val hasAudioPerm = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    ContextCompat.checkSelfPermission(
                        this@MainActivity,
                        Manifest.permission.READ_MEDIA_AUDIO
                    ) == PackageManager.PERMISSION_GRANTED
                } else {
                    ContextCompat.checkSelfPermission(
                        this@MainActivity,
                        Manifest.permission.READ_EXTERNAL_STORAGE
                    ) == PackageManager.PERMISSION_GRANTED
                }

                if (!hasAudioPerm) {
                    permissionLauncher.launch(permissionsToRequest)
                }
            }

            SonanceTheme(appTheme = appTheme) { theme ->
                val activeViewTitle: String = remember(activeView, activePlaylistId, playlists) {
                    when (activeView) {
                        ActiveView.HOME -> "Music Player"
                        ActiveView.LIBRARY -> "Library"
                        ActiveView.FOLDER -> "Folder View"
                        ActiveView.FAVORITE -> "Favorite Tracks"
                        ActiveView.RECENT_PLAY -> "Recent Play"
                        ActiveView.RECENT_ADD -> "Recent Add"
                        ActiveView.MOST_PLAY -> "Most Played"
                        ActiveView.DRIVE_MODE -> "Drive Mode"
                        ActiveView.LYRICS_MODE -> "Lyrics"
                        ActiveView.PLAYLIST_DETAIL -> {
                            val pl = playlists.find { it.id == activePlaylistId }
                            pl?.name ?: "Playlist"
                        }
                    }
                }

                // Filtered tracks for current view & search query
                val viewTracks: List<Track> = remember(tracks, activeView, activePlaylistId, playlists, searchQuery) {
                    val base: List<Track> = when (activeView) {
                        ActiveView.HOME -> tracks
                        ActiveView.LIBRARY -> tracks
                        ActiveView.FOLDER -> tracks
                        ActiveView.DRIVE_MODE -> tracks
                        ActiveView.LYRICS_MODE -> tracks
                        ActiveView.FAVORITE -> tracks.filter { it.isFavorite }
                        ActiveView.RECENT_PLAY -> tracks.filter { it.playCount > 0 || it.lastPlayed > 0 }
                            .sortedByDescending { it.lastPlayed }
                        ActiveView.RECENT_ADD -> tracks.sortedByDescending { it.addedDate }
                        ActiveView.MOST_PLAY -> tracks.filter { it.playCount > 0 }
                            .sortedByDescending { it.playCount }
                        ActiveView.PLAYLIST_DETAIL -> {
                            val pl = playlists.find { it.id == activePlaylistId }
                            if (pl != null) {
                                tracks.filter { pl.trackIds.contains(it.id) }
                            } else emptyList()
                        }
                    }

                    if (searchQuery.isBlank()) {
                        base
                    } else {
                        val q = searchQuery.trim().lowercase()
                        base.filter {
                            it.title.lowercase().contains(q) ||
                                    it.artist.lowercase().contains(q) ||
                                    it.album.lowercase().contains(q)
                        }
                    }
                }

                // Drive mode screen replaces the normal UI
                if (isDriveModeOpen) {
                    DriveModeScreen(
                        track = currentTrack,
                        isPlaying = isPlaying,
                        onTogglePlay = { playbackManager.togglePlayPause() },
                        onPrev = { playbackManager.skipToPrevious() },
                        onNext = { playbackManager.skipToNext() },
                        onExit = { isDriveModeOpen = false },
                        theme = theme
                    )
                } else if (isLyricsModeOpen) {
                    LyricsModeScreen(
                        track = currentTrack,
                        currentPosMs = currentPosMs,
                        onSeek = { playbackManager.seekTo(it) },
                        onClose = { isLyricsModeOpen = false },
                        theme = theme
                    )
                } else {
                    Scaffold(
                        topBar = {
                            HeaderBar(
                                title = activeViewTitle,
                                isHome = activeView == ActiveView.HOME,
                                onOpenSidebar = { isSidebarOpen = true },
                                onBack = {
                                    activeView = ActiveView.HOME
                                    activePlaylistId = null
                                    searchQuery = ""
                                },
                                searchQuery = searchQuery,
                                onSearchChange = { searchQuery = it },
                                theme = theme
                            )
                        },
                        bottomBar = {
                            // Mini Player
                            AnimatedVisibility(
                                visible = currentTrack != null,
                                enter = slideInVertically(initialOffsetY = { it }),
                                exit = slideOutVertically(targetOffsetY = { it })
                            ) {
                                MiniPlayerBar(
                                    track = currentTrack,
                                    isPlaying = isPlaying,
                                    currentPosMs = currentPosMs,
                                    durationMs = durationMs,
                                    onTogglePlay = { playbackManager.togglePlayPause() },
                                    onNext = { playbackManager.skipToNext() },
                                    onOpenQueue = { isQueueOpen = true },
                                    onOpenFullPlayer = { isFullPlayerOpen = true },
                                    theme = theme
                                )
                            }
                        },
                        containerColor = theme.bgCanvas
                    ) { innerPadding ->
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(innerPadding)
                        ) {
                            if (activeView == ActiveView.HOME && searchQuery.isEmpty()) {
                                HomeScreen(
                                    tracks = tracks,
                                    playlists = playlists,
                                    theme = theme,
                                    onSelectView = { selected ->
                                        activeView = selected
                                    },
                                    onSelectPlaylist = { plId ->
                                        activePlaylistId = plId
                                        activeView = ActiveView.PLAYLIST_DETAIL
                                    },
                                    onOpenCreatePlaylist = { isCreatePlaylistOpen = true },
                                    onShuffleAll = {
                                        if (tracks.isNotEmpty()) {
                                            playbackManager.setQueue(tracks.shuffled(), 0)
                                        }
                                    },
                                    onOpenMusicTrim = {
                                        trimmingTrack = currentTrack ?: tracks.firstOrNull()
                                    },
                                    onOpenKaraoke = { isKaraokeStudioOpen = true },
                                    onOpenBeatInstrumental = { isBeatInstrumentalOpen = true },
                                    onOpenEqualizer = { isEqualizerOpen = true }
                                )
                            } else {
                                TrackListScreen(
                                    view = activeView,
                                    title = activeViewTitle,
                                    tracks = viewTracks,
                                    allPlaylists = playlists,
                                    currentTrackId = currentTrack?.id,
                                    isPlaying = isPlaying,
                                    theme = theme,
                                    onPlayTrack = { track, list ->
                                        val idx = list.indexOfFirst { it.id == track.id }.coerceAtLeast(0)
                                        playbackManager.setQueue(list, idx)
                                    },
                                    onToggleFavorite = { trId ->
                                        repository.toggleFavorite(trId)
                                    },
                                    onAddToPlaylist = { trId, plId ->
                                        repository.addTrackToPlaylist(trId, plId)
                                    },
                                    onDeleteTrack = { trId ->
                                        repository.deleteTrack(trId)
                                    },
                                    onOpenMusicTrim = { tr ->
                                        trimmingTrack = tr
                                    },
                                    onOpenLyrics = { tr ->
                                        isLyricsModeOpen = true
                                    },
                                    onShuffleAll = { list ->
                                        if (list.isNotEmpty()) {
                                            playbackManager.setQueue(list.shuffled(), 0)
                                        }
                                    }
                                )
                            }
                        }
                    }
                }

                // Sidebar Navigation Drawer
                SidebarDrawer(
                    isOpen = isSidebarOpen,
                    onClose = { isSidebarOpen = false },
                    playlists = playlists,
                    repeatMode = repeatMode,
                    sleepTimerSec = sleepTimerSec,
                    onSelectPlaylist = { plId ->
                        activePlaylistId = plId
                        activeView = ActiveView.PLAYLIST_DETAIL
                    },
                    onOpenCreatePlaylist = { isCreatePlaylistOpen = true },
                    onOpenScanModal = { isScanModalOpen = true },
                    onOpenEqualizer = { isEqualizerOpen = true },
                    onToggleRepeat = { playbackManager.cycleRepeatMode() },
                    onOpenThemes = { isThemePickerOpen = true },
                    onOpenSleepTimer = { isSleepTimerOpen = true },
                    onEnterDriveMode = { isDriveModeOpen = true },
                    onEnterLyricsMode = { isLyricsModeOpen = true },
                    onOpenWebBrowser = { isWebBrowserOpen = true },
                    onOpenSettings = { isSettingsOpen = true },
                    theme = theme
                )

                // Full Screen Player Sheet
                FullPlayerSheet(
                    isOpen = isFullPlayerOpen,
                    onClose = { isFullPlayerOpen = false },
                    track = currentTrack,
                    isPlaying = isPlaying,
                    currentPosMs = currentPosMs,
                    durationMs = durationMs,
                    repeatMode = repeatMode,
                    isShuffle = isShuffle,
                    playbackSpeed = playbackSpeed,
                    activeEffect = audioEffect,
                    isKaraokeMode = isKaraokeMode,
                    theme = theme,
                    onTogglePlay = { playbackManager.togglePlayPause() },
                    onPrev = { playbackManager.skipToPrevious() },
                    onNext = { playbackManager.skipToNext() },
                    onSeek = { playbackManager.seekTo(it) },
                    onToggleRepeat = { playbackManager.cycleRepeatMode() },
                    onToggleShuffle = { playbackManager.toggleShuffle() },
                    onToggleFavorite = { trId -> repository.toggleFavorite(trId) },
                    onSetSpeed = { playbackManager.setSpeed(it) },
                    onSetAudioEffect = { playbackManager.setAudioEffect(it) },
                    onToggleKaraoke = { playbackManager.toggleKaraokeMode() },
                    onOpenEqualizer = { isEqualizerOpen = true },
                    onOpenSleepTimer = { isSleepTimerOpen = true },
                    onOpenLyrics = {
                        isFullPlayerOpen = false
                        isLyricsModeOpen = true
                    },
                    onOpenQueue = { isQueueOpen = true },
                    onOpenMusicTrim = { tr -> trimmingTrack = tr }
                )

                // Queue Sheet
                QueueBottomSheet(
                    isOpen = isQueueOpen,
                    onDismiss = { isQueueOpen = false },
                    queue = playQueue,
                    currentTrackId = currentTrack?.id,
                    onSelectTrack = { tr ->
                        val idx = playQueue.indexOfFirst { it.id == tr.id }.coerceAtLeast(0)
                        playbackManager.setQueue(playQueue, idx)
                    },
                    theme = theme
                )

                // Equalizer Dialog
                EqualizerDialog(
                    isOpen = isEqualizerOpen,
                    onClose = { isEqualizerOpen = false },
                    settings = eqSettings,
                    onApplySettings = { newSettings ->
                        repository.saveEqualizer(newSettings)
                        playbackManager.applyEqualizerSettings(newSettings)
                    },
                    theme = theme
                )

                // Ringtone Trimmer Dialog
                RingtoneTrimmerDialog(
                    isOpen = trimmingTrack != null,
                    onClose = { trimmingTrack = null },
                    track = trimmingTrack,
                    theme = theme
                )

                // Karaoke Studio Dialog
                KaraokeStudioDialog(
                    isOpen = isKaraokeStudioOpen,
                    onClose = { isKaraokeStudioOpen = false },
                    track = currentTrack,
                    isKaraokeActive = isKaraokeMode,
                    onToggleKaraoke = { playbackManager.toggleKaraokeMode() },
                    theme = theme
                )

                // Beat Instrumental Dialog
                BeatInstrumentalDialog(
                    isOpen = isBeatInstrumentalOpen,
                    onClose = { isBeatInstrumentalOpen = false },
                    track = currentTrack,
                    theme = theme
                )

                // Sleep Timer Dialog
                SleepTimerDialog(
                    isOpen = isSleepTimerOpen,
                    onClose = { isSleepTimerOpen = false },
                    sleepTimerSec = sleepTimerSec,
                    onSetTimerMinutes = { minutes ->
                        playbackManager.setSleepTimer(minutes)
                    },
                    theme = theme
                )

                // Theme Dialog
                ThemeDialog(
                    isOpen = isThemePickerOpen,
                    onClose = { isThemePickerOpen = false },
                    currentTheme = appTheme,
                    onSelectTheme = { repository.saveTheme(it) },
                    theme = theme
                )

                // Settings Dialog
                SettingsDialog(
                    isOpen = isSettingsOpen,
                    onClose = { isSettingsOpen = false },
                    settings = playerSettings,
                    onUpdateSettings = { repository.saveSettings(it) },
                    theme = theme
                )

                // Scan Library Dialog
                ScanLibraryDialog(
                    isOpen = isScanModalOpen,
                    onClose = { isScanModalOpen = false },
                    totalTrackCount = tracks.size,
                    onScan = { repository.scanMediaStore() },
                    theme = theme
                )

                // Web Browser Dialog
                WebBrowserDialog(
                    isOpen = isWebBrowserOpen,
                    onClose = { isWebBrowserOpen = false },
                    theme = theme
                )

                // Create Playlist Dialog
                CreatePlaylistDialog(
                    isOpen = isCreatePlaylistOpen,
                    onClose = { isCreatePlaylistOpen = false },
                    onCreate = { name -> repository.createPlaylist(name) },
                    theme = theme
                )
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        playbackManager.release()
    }
}
