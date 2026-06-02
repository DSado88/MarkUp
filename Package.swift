// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "MarkUp",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .library(name: "MarkUpCore", targets: ["MarkUpCore"]),
        .executable(name: "MarkUp", targets: ["MarkUp"])
    ],
    targets: [
        .target(name: "MarkUpCore", path: "Sources/MarkUpCore"),
        .executableTarget(
            name: "MarkUp",
            dependencies: ["MarkUpCore"],
            path: "Sources/MarkUp"
        ),
        .testTarget(
            name: "MarkUpTests",
            dependencies: ["MarkUpCore"],
            path: "Tests/MarkUpTests"
        )
    ]
)
