package com.sonance.musicplayer

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(MusicLibraryPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
