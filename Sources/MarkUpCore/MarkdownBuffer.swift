import Foundation

public enum MarkdownBufferError: Error, Equatable {
    case unsupportedEncoding
}

public struct MarkdownBuffer: Equatable {
    public private(set) var originalData: Data
    public private(set) var originalText: String
    public var currentText: String

    public init(data: Data) throws {
        guard let text = String(data: data, encoding: .utf8) else {
            throw MarkdownBufferError.unsupportedEncoding
        }

        self.originalData = data
        self.originalText = text
        self.currentText = text
    }

    public init(text: String) {
        let data = Data(text.utf8)
        self.originalData = data
        self.originalText = text
        self.currentText = text
    }

    public var isDirty: Bool {
        currentText != originalText
    }

    public func dataForSave() throws -> Data {
        if !isDirty {
            return originalData
        }

        return Data(currentText.utf8)
    }

    public func dataForSaveSnapshot(_ snapshot: String) -> Data {
        if snapshot == originalText {
            return originalData
        }

        return Data(snapshot.utf8)
    }

    public mutating func markSaved() {
        originalData = Data(currentText.utf8)
        originalText = currentText
    }

    public mutating func markSaved(snapshot: String) {
        originalData = Data(snapshot.utf8)
        originalText = snapshot
    }

    public mutating func replaceFromDisk(_ data: Data) throws {
        guard let text = String(data: data, encoding: .utf8) else {
            throw MarkdownBufferError.unsupportedEncoding
        }

        originalData = data
        originalText = text
        currentText = text
    }
}
