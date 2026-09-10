package com.sonance.musicplayer

import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.capacitorjs.plugins.app.AppPlugin

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(MusicLibraryPlugin::class.java)
        registerPlugin(AppPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}

