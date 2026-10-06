// Dibs · Night Tab design tokens (Jetpack Compose)
// v1.0 · generated from one source; do not hand-edit values.
// UNVERIFIED: written without a Kotlin compiler in the generating environment. Compile it in Android Studio first.
//
// Usage: wrap your app in DibsTheme(), then read DibsTheme.colors.accent etc.
// Fonts: Sora and JetBrains Mono via androidx.compose.ui.text.googlefonts (downloadable fonts).

package app.dibs.ui.theme

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.TextUnit

data class DibsColors(
    val bg: Color,
    val surface: Color,
    val border: Color,
    val text: Color,
    val textMuted: Color,
    val accent: Color,
    val accentEdge: Color,
    val onAccent: Color,
    val accentText: Color,
    val link: Color,
    val friend1: Color,
    val friend2: Color,
    val friend3: Color,
    val onFriend: Color,
    val me: Color,
    val onMe: Color,
    val warn: Color,
    val warnBg: Color,
    val success: Color,
    val glow: Color,
)

val DibsLightColors = DibsColors(
    bg = Color(0xFFF5F4FB),
    surface = Color(0xFFFFFFFF),
    border = Color(0xFFDCDCF0),
    text = Color(0xFF14152B),
    textMuted = Color(0xFF5B5F80),
    accent = Color(0xFFFF6B4A),
    accentEdge = Color(0xFFD9431A),
    onAccent = Color(0xFFFFFFFF),
    accentText = Color(0xFFC2371A),
    link = Color(0xFF4A5FD0),
    friend1 = Color(0xFF4A5FD0),
    friend2 = Color(0xFF7C4FE0),
    friend3 = Color(0xFF0E7F6D),
    onFriend = Color(0xFFFFFFFF),
    me = Color(0xFFFF6B4A),
    onMe = Color(0xFF1B1020),
    warn = Color(0xFFB42318),
    warnBg = Color(0xFFFDECEA),
    success = Color(0xFF0E7F6D),
    glow = Color(0x2EFF6B4A),
)

val DibsDarkColors = DibsColors(
    bg = Color(0xFF0C0D1C),
    surface = Color(0xFF171A30),
    border = Color(0xFF2B2F55),
    text = Color(0xFFECEBF8),
    textMuted = Color(0xFF8E92B3),
    accent = Color(0xFFFFB59A),
    accentEdge = Color(0xFFFFB59A),
    onAccent = Color(0xFF1B1020),
    accentText = Color(0xFFFFB59A),
    link = Color(0xFF8FA4FF),
    friend1 = Color(0xFF8FA4FF),
    friend2 = Color(0xFFC6A7FF),
    friend3 = Color(0xFF7FE3D0),
    onFriend = Color(0xFF0C0D1C),
    me = Color(0xFFFFB59A),
    onMe = Color(0xFF1B1020),
    warn = Color(0xFFFFB4A8),
    warnBg = Color(0xFF3A1620),
    success = Color(0xFF7FE3D0),
    glow = Color(0x45FFB59A),
)

enum class ThemeMode { Light, Dark, System }

data class DibsTextStyle(
    val size: TextUnit,
    val lineHeight: TextUnit,
    val weight: Int,
    val trackingEm: Float,
    val mono: Boolean,
    val uppercase: Boolean = false,
)

object DibsType {
    val amount = DibsTextStyle(size = 42.sp, lineHeight = 44.1.sp, weight = 600, trackingEm = -0.06f, mono = true)
    val amountSm = DibsTextStyle(size = 24.sp, lineHeight = 24.0.sp, weight = 600, trackingEm = -0.04f, mono = true)
    val h1 = DibsTextStyle(size = 28.sp, lineHeight = 30.8.sp, weight = 700, trackingEm = -0.03f, mono = false)
    val h2 = DibsTextStyle(size = 20.sp, lineHeight = 24.0.sp, weight = 700, trackingEm = -0.02f, mono = false)
    val h3 = DibsTextStyle(size = 16.sp, lineHeight = 20.8.sp, weight = 600, trackingEm = -0.01f, mono = false)
    val body = DibsTextStyle(size = 14.sp, lineHeight = 21.0.sp, weight = 400, trackingEm = 0f, mono = false)
    val caption = DibsTextStyle(size = 12.sp, lineHeight = 16.8.sp, weight = 500, trackingEm = 0f, mono = false)
    val label = DibsTextStyle(size = 10.sp, lineHeight = 10.0.sp, weight = 500, trackingEm = 0.1f, mono = true, uppercase = true)
}

object DibsSpacing {
    val xxs = 4.dp
    val xs = 8.dp
    val sm = 12.dp
    val md = 16.dp
    val lg = 24.dp
    val xl = 32.dp
    val xxl = 48.dp
    val xxxl = 64.dp
}

object DibsRadius {
    val xs = 8.dp
    val sm = 10.dp
    val md = 14.dp
    val lg = 16.dp
    val xl = 22.dp
    val phone = 44.dp
    val pill = 9999.dp
}

object DibsMotion {
    /** Durations in milliseconds. Exit runs at about 75% of enter. */
    const val press = 140
    const val hover = 150
    const val popover = 180
    const val toast = 220
    const val modal = 240
    const val sheet = 320
    const val exitRatio = 0.75f

    val out = CubicBezierEasing(0.23f, 1f, 0.32f, 1f)
    val inOut = CubicBezierEasing(0.77f, 0f, 0.175f, 1f)
    val sheet = CubicBezierEasing(0.32f, 0.72f, 0f, 1f)
}

val LocalDibsColors = staticCompositionLocalOf { DibsLightColors }

object DibsTheme {
    val colors: DibsColors
        @Composable @ReadOnlyComposable get() = LocalDibsColors.current
}

@Composable
fun DibsTheme(mode: ThemeMode = ThemeMode.System, content: @Composable () -> Unit) {
    val dark = when (mode) {
        ThemeMode.Light -> false
        ThemeMode.Dark -> true
        ThemeMode.System -> isSystemInDarkTheme()
    }
    CompositionLocalProvider(LocalDibsColors provides (if (dark) DibsDarkColors else DibsLightColors)) { content() }
}
