require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "AppDiscoveryReactNative"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/appdiscoverysdk/appdiscovery-react-native"
  s.license      = "MIT"
  s.authors      = { "AppDiscovery SDK" => "noreply@users.noreply.github.com" }
  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => "https://github.com/appdiscoverysdk/appdiscovery-react-native.git", :tag => "#{s.version}" }

  s.source_files = "ios/*.{h,m,mm,swift}"
  s.requires_arc = true

  s.dependency "React-Core"

  # The native iOS SDK (AppDiscoverySDK.xcframework) is vendored in ios/Frameworks/.
  # scripts/fetch_ios_xcframework.sh places it there (checksum pinned) when the
  # release is assembled, so the published package is complete.
  s.vendored_frameworks = "ios/Frameworks/AppDiscoverySDK.xcframework"
  s.preserve_paths = "ios/Frameworks/**/*"

  s.pod_target_xcconfig = { "DEFINES_MODULE" => "YES" }
  s.swift_version = "5.0"
end
