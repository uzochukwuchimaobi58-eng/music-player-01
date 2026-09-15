package com.sonance.musicplayer.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sonance.musicplayer.model.ThemeConfig

@Composable
fun HeaderBar(
    title: String,
    isHome: Boolean,
    onOpenSidebar: () -> Unit,
    onBack: () -> Unit,
    searchQuery: String,
    onSearchChange: (String) -> Unit,
    theme: ThemeConfig
) {
    var isSearchActive by remember { mutableStateOf(false) }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(theme.headerBg)
            .statusBarsPadding()
            .height(56.dp)
            .padding(horizontal = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        // Left side: Menu / Back
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.weight(1f, fill = !isSearchActive)
        ) {
            if (isHome) {
                IconButton(
                    onClick = onOpenSidebar,
                    modifier = Modifier.testTag("btn_sidebar_toggle")
                ) {
                    Icon(
                        imageVector = Icons.Default.Menu,
                        contentDescription = "Open navigation menu",
                        tint = theme.textPrimary
                    )
                }
            } else {
                IconButton(
                    onClick = onBack,
                    modifier = Modifier.testTag("btn_back_to_home")
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = theme.textPrimary
                    )
                }
            }

            Spacer(modifier = Modifier.width(4.dp))

            if (!isSearchActive) {
                Text(
                    text = title,
                    color = theme.textPrimary,
                    fontSize = 19.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }

        // Right side: Search bar
        AnimatedVisibility(
            visible = isSearchActive,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(theme.bgCanvas.copy(alpha = 0.85f))
                    .padding(horizontal = 10.dp, vertical = 6.dp)
                    .widthIn(min = 180.dp, max = 260.dp)
            ) {
                BasicTextField(
                    value = searchQuery,
                    onValueChange = onSearchChange,
                    singleLine = true,
                    textStyle = TextStyle(
                        color = theme.textPrimary,
                        fontSize = 14.sp
                    ),
                    cursorBrush = SolidColor(theme.accentColor),
                    modifier = Modifier
                        .weight(1f)
                        .testTag("search_tracks_input"),
                    decorationBox = { innerTextField ->
                        if (searchQuery.isEmpty()) {
                            Text(
                                "Search songs, artists...",
                                color = theme.textSecondary.copy(alpha = 0.6f),
                                fontSize = 13.sp
                            )
                        }
                        innerTextField()
                    }
                )

                Spacer(modifier = Modifier.width(6.dp))

                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Clear search",
                    tint = theme.textSecondary,
                    modifier = Modifier
                        .size(18.dp)
                        .clickable {
                            if (searchQuery.isNotEmpty()) {
                                onSearchChange("")
                            } else {
                                isSearchActive = false
                            }
                        }
                        .testTag("btn_clear_search")
                )
            }
        }

        if (!isSearchActive) {
            IconButton(
                onClick = { isSearchActive = true },
                modifier = Modifier.testTag("btn_search_toggle")
            ) {
                Icon(
                    imageVector = Icons.Default.Search,
                    contentDescription = "Search music",
                    tint = theme.textPrimary
                )
            }
        }
    }
}
