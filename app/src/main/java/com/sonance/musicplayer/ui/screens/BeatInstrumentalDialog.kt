package com.sonance.musicplayer.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoFixHigh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sonance.musicplayer.model.ThemeConfig
import com.sonance.musicplayer.model.Track

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BeatInstrumentalDialog(
    isOpen: Boolean,
    onClose: () -> Unit,
    track: Track?,
    theme: ThemeConfig
) {
    if (!isOpen) return

    var vocalLevel by remember { mutableFloatStateOf(0f) }
    var drumsLevel by remember { mutableFloatStateOf(100f) }
    var bassLevel by remember { mutableFloatStateOf(95f) }
    var melodyLevel by remember { mutableFloatStateOf(100f) }

    ModalBottomSheet(
        onDismissRequest = onClose,
        containerColor = theme.sidebarBg,
        modifier = Modifier.testTag("beat_instrumental_dialog")
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
                    imageVector = Icons.Default.AutoFixHigh,
                    contentDescription = null,
                    tint = Color(0xFFFBBF24),
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = "Convert to Beat Instrumental",
                    color = theme.textPrimary,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            Text(
                text = "ISOLATE 4 AUDIO STEMS IN REAL TIME",
                color = theme.textSecondary,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )

            Spacer(modifier = Modifier.height(16.dp))

            StemSlider("Vocals", vocalLevel, { vocalLevel = it }, Color(0xFFF43F5E), theme)
            StemSlider("Beat & Drums", drumsLevel, { drumsLevel = it }, Color(0xFFFBBF24), theme)
            StemSlider("Sub Bass & 808", bassLevel, { bassLevel = it }, Color(0xFF38BDF8), theme)
            StemSlider("Melodic Instruments", melodyLevel, { melodyLevel = it }, Color(0xFF10B981), theme)

            Spacer(modifier = Modifier.height(20.dp))

            Button(
                onClick = onClose,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFBBF24)),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
            ) {
                Text("Generate Instrumental", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            }
        }
    }
}

@Composable
private fun StemSlider(
    title: String,
    value: Float,
    onValueChange: (Float) -> Unit,
    accentColor: Color,
    theme: ThemeConfig
) {
    Column(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = title, color = theme.textPrimary, fontSize = 13.sp)
            Text(text = "${value.toInt()}%", color = accentColor, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        }
        Slider(
            value = value,
            onValueChange = onValueChange,
            valueRange = 0f..100f,
            colors = SliderDefaults.colors(
                thumbColor = accentColor,
                activeTrackColor = accentColor
            )
        )
    }
}
