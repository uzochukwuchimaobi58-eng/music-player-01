package com.sonance.musicplayer.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sonance.musicplayer.model.PlayerSettings
import com.sonance.musicplayer.model.ThemeConfig

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsDialog(
    isOpen: Boolean,
    onClose: () -> Unit,
    settings: PlayerSettings,
    onUpdateSettings: (PlayerSettings) -> Unit,
    theme: ThemeConfig
) {
    if (!isOpen) return

    ModalBottomSheet(
        onDismissRequest = onClose,
        containerColor = theme.sidebarBg,
        modifier = Modifier.testTag("settings_dialog")
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 12.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Settings,
                    contentDescription = null,
                    tint = theme.accentColor,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = "Player Settings",
                    color = theme.textPrimary,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Setting 1: 10 Bands Equalizer
            SettingSwitchRow(
                title = "10 Bands Equalizer",
                subtitle = "Enable high-precision 10-band audio frequency control",
                checked = settings.use10BandsEqualizer,
                onCheckedChange = { onUpdateSettings(settings.copy(use10BandsEqualizer = it)) },
                theme = theme
            )

            // Setting 2: Keep Screen On
            SettingSwitchRow(
                title = "Keep Screen On",
                subtitle = "Prevent display from sleeping during playback",
                checked = settings.keepScreenOn,
                onCheckedChange = { onUpdateSettings(settings.copy(keepScreenOn = it)) },
                theme = theme
            )

            // Setting 3: Gapless Playback
            SettingSwitchRow(
                title = "Gapless Playback",
                subtitle = "Eliminate silent buffer pauses between sequential tracks",
                checked = settings.gaplessPlayback,
                onCheckedChange = { onUpdateSettings(settings.copy(gaplessPlayback = it)) },
                theme = theme
            )

            // Setting 4: Forward & Backward controls
            SettingSwitchRow(
                title = "Fast Forward & Rewind",
                subtitle = "Show secondary 10-second skip buttons in expanded player",
                checked = settings.forwardAndBackward,
                onCheckedChange = { onUpdateSettings(settings.copy(forwardAndBackward = it)) },
                theme = theme
            )

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = onClose,
                colors = ButtonDefaults.buttonColors(containerColor = theme.accentColor),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
            ) {
                Text("Close", color = Color.Black, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun SettingSwitchRow(
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    theme: ThemeConfig
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(text = title, color = theme.textPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            Text(text = subtitle, color = theme.textSecondary, fontSize = 12.sp)
        }
        Spacer(modifier = Modifier.width(12.dp))
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = theme.accentColor,
                checkedTrackColor = theme.accentColor.copy(alpha = 0.5f)
            )
        )
    }
}
