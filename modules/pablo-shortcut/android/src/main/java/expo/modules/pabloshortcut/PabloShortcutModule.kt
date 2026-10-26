package expo.modules.pabloshortcut

import android.content.Intent
import android.content.pm.ShortcutInfo
import android.content.pm.ShortcutManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.drawable.Icon
import android.net.Uri
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.util.UUID

/** All icons originate in the app's private files; no remote URL is accepted. */
class PabloShortcutModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PabloShortcut")

    AsyncFunction("isAvailable") {
      val context = appContext.reactContext
      if (context == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.O) false
      else context.getSystemService(ShortcutManager::class.java)?.isRequestPinShortcutSupported == true
    }

    AsyncFunction("requestPinShortcut") { localFileUri: String ->
      val context = appContext.reactContext ?: throw IllegalStateException("Android context unavailable")
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return@AsyncFunction false
      val manager = context.getSystemService(ShortcutManager::class.java) ?: return@AsyncFunction false
      if (!manager.isRequestPinShortcutSupported) return@AsyncFunction false
      val uri = Uri.parse(localFileUri)
      require(uri.scheme == "file" && uri.host.isNullOrEmpty()) { "Only private local files are accepted" }
      val file = File(uri.path ?: throw IllegalArgumentException("Missing local file path")).canonicalFile
      val roots = listOf(context.filesDir.canonicalFile, context.cacheDir.canonicalFile)
      require(roots.any { file.path.startsWith(it.path + File.separator) }) { "Icon must be in app private storage" }
      require(file.isFile && file.length() in 33L..8L * 1024L * 1024L) { "PNG must be at most 8 MB" }
      val signature = ByteArray(8)
      file.inputStream().use { require(it.read(signature) == 8) { "Truncated PNG" } }
      require(signature.contentEquals(byteArrayOf(137.toByte(), 80, 78, 71, 13, 10, 26, 10))) { "PNG signature required" }
      val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
      BitmapFactory.decodeFile(file.path, bounds)
      require(bounds.outMimeType == "image/png") { "PNG MIME required" }
      require(bounds.outWidth in 1..4096 && bounds.outHeight in 1..4096 && bounds.outWidth.toLong() * bounds.outHeight <= 16L * 1024L * 1024L) { "PNG dimensions exceed 4096 pixels" }
      val target = minOf(manager.iconMaxWidth.coerceAtLeast(48), manager.iconMaxHeight.coerceAtLeast(48), 512)
      var sample = 1
      while (maxOf(bounds.outWidth / sample, bounds.outHeight / sample) > target * 2) sample *= 2
      val options = BitmapFactory.Options().apply { inSampleSize = sample; inPreferredConfig = Bitmap.Config.ARGB_8888 }
      val decoded = BitmapFactory.decodeFile(file.path, options) ?: throw IllegalArgumentException("Could not decode PNG")
      val ratio = minOf(target.toFloat() / decoded.width, target.toFloat() / decoded.height, 1f)
      val bitmap = Bitmap.createScaledBitmap(decoded, maxOf(1, (decoded.width * ratio).toInt()), maxOf(1, (decoded.height * ratio).toInt()), true)
      val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        ?: throw IllegalStateException("App launch activity unavailable")
      intent.action = Intent.ACTION_VIEW
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      // Each user action gets a new ID so a previous pinned icon cannot silently override the chosen PNG.
      val shortcut = ShortcutInfo.Builder(context, "pabloooo.quick-open-" + UUID.randomUUID().toString())
        .setShortLabel("Pabloooo")
        .setLongLabel("Open Pabloooo")
        .setIcon(Icon.createWithBitmap(bitmap))
        .setIntent(intent)
        .build()
      // True means Android accepted a request. Only the launcher user can confirm pinning.
      manager.requestPinShortcut(shortcut, null)
    }
  }
}
