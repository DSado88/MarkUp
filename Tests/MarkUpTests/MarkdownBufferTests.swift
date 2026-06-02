import Foundation
import Testing
@testable import MarkUpCore

@Test func noEditSaveReturnsOriginalBytes() throws {
    let bytes = Data("# Title\r\n\r\n| A | B |\r\n|---|---|\r\n| 1 | 2 |\r\n".utf8)
    let buffer = try MarkdownBuffer(data: bytes)

    #expect(try buffer.dataForSave() == bytes)
}

@Test func editedSaveReturnsCurrentTextBytes() throws {
    var buffer = try MarkdownBuffer(data: Data("# Title\n\nBody\n".utf8))
    buffer.currentText = "# Title\n\nChanged\n"

    #expect(try String(data: buffer.dataForSave(), encoding: .utf8) == "# Title\n\nChanged\n")
}

@Test func markSavedResetsDirtyState() throws {
    var buffer = try MarkdownBuffer(data: Data("Before\n".utf8))
    buffer.currentText = "After\n"

    #expect(buffer.isDirty)
    buffer.markSaved()

    #expect(!buffer.isDirty)
    #expect(try buffer.dataForSave() == Data("After\n".utf8))
}

@Test func markSavedSnapshotDoesNotDiscardNewerCurrentText() throws {
    var buffer = try MarkdownBuffer(data: Data("Before\n".utf8))
    let snapshot = "Saved\n"
    buffer.currentText = snapshot
    let data = buffer.dataForSaveSnapshot(snapshot)

    buffer.currentText = "Saved\nNew edit\n"
    buffer.markSaved(snapshot: snapshot)

    #expect(data == Data(snapshot.utf8))
    #expect(buffer.currentText == "Saved\nNew edit\n")
    #expect(buffer.isDirty)
}

@Test func unsupportedEncodingIsRejected() throws {
    let invalid = Data([0xff, 0xfe, 0xfd])

    #expect(throws: MarkdownBufferError.unsupportedEncoding) {
        _ = try MarkdownBuffer(data: invalid)
    }
}
