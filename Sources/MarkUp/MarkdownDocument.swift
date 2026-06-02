import AppKit
import Foundation
import MarkUpCore

final class MarkdownDocument: NSDocument {
    nonisolated(unsafe) private var buffer = MarkdownBuffer(text: "")
    nonisolated(unsafe) private var knownDirty = false
    private var watcher: FileWatcher?
    private var suppressExternalChangesUntil = Date.distantPast
    private var saveSnapshotText: String?
    weak var webController: DocumentWebViewController?

    override init() {
        super.init()
        hasUndoManager = true
    }

    override class var autosavesInPlace: Bool {
        false
    }

    override func makeWindowControllers() {
        let controller = DocumentWindowController(markdownDocument: self)
        addWindowController(controller)
        webController = controller.webController
        configureWatcher()
    }

    override func read(from data: Data, ofType typeName: String) throws {
        buffer = try MarkdownBuffer(data: data)
        knownDirty = false
    }

    override func data(ofType typeName: String) throws -> Data {
        if let saveSnapshotText {
            return buffer.dataForSaveSnapshot(saveSnapshotText)
        }

        return try buffer.dataForSave()
    }

    override func save(
        to url: URL,
        ofType typeName: String,
        for saveOperation: NSDocument.SaveOperationType,
        completionHandler: @escaping (Error?) -> Void
    ) {
        let snapshot = buffer.currentText
        saveSnapshotText = snapshot
        suppressExternalChangesUntil = Date().addingTimeInterval(1.0)
        super.save(to: url, ofType: typeName, for: saveOperation) { [weak self] error in
            guard let self else {
                completionHandler(error)
                return
            }

            self.saveSnapshotText = nil

            if error == nil {
                self.buffer.markSaved(snapshot: snapshot)
                self.forceKnownDirty(self.buffer.isDirty)

                if !self.buffer.isDirty {
                    self.webController?.markSaved(text: snapshot)
                }

                self.configureWatcher()
            }

            completionHandler(error)
        }
    }

    func payload() -> DocumentPayload {
        DocumentPayload(
            fileName: fileURL?.lastPathComponent ?? displayName,
            path: fileURL?.path ?? "",
            baseURL: fileURL?.deletingLastPathComponent().absoluteString ?? "",
            text: buffer.currentText,
            dirty: knownDirty
        )
    }

    func updateTextFromWeb(_ text: String) {
        buffer.currentText = text
        setKnownDirty(buffer.isDirty)
    }

    @objc func reloadFromDisk(_ sender: Any?) {
        guard let fileURL else { return }

        do {
            let data = try Data(contentsOf: fileURL)
            try buffer.replaceFromDisk(data)
            forceKnownDirty(false)
            suppressExternalChangesUntil = Date().addingTimeInterval(0.5)
            webController?.loadDocument(payload())
            configureWatcher()
        } catch {
            presentError(error)
        }
    }

    @objc func revealInFinder(_ sender: Any?) {
        guard let fileURL else { return }
        NSWorkspace.shared.activateFileViewerSelecting([fileURL])
    }

    func copyPathToPasteboard() {
        guard let fileURL else { return }
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(fileURL.path, forType: .string)
    }

    func allowsLocalLinkedFile(_ url: URL) -> Bool {
        guard url.isFileURL, let fileURL else { return false }

        let documentDirectory = fileURL
            .deletingLastPathComponent()
            .standardizedFileURL
            .resolvingSymlinksInPath()
        let target = url.standardizedFileURL.resolvingSymlinksInPath()
        let directoryPath = documentDirectory.path.hasSuffix("/")
            ? documentDirectory.path
            : "\(documentDirectory.path)/"

        guard target.path.hasPrefix(directoryPath) else {
            return false
        }

        do {
            let values = try target.resourceValues(forKeys: [.isDirectoryKey, .isPackageKey])
            guard values.isDirectory != true, values.isPackage != true else {
                return false
            }
        } catch {
            return false
        }

        let allowedExtensions: Set<String> = [
            "md", "markdown", "mdown", "mkd", "txt",
            "png", "jpg", "jpeg", "gif", "webp", "svg", "pdf"
        ]
        return allowedExtensions.contains(target.pathExtension.lowercased())
    }

    private func setKnownDirty(_ isDirty: Bool) {
        guard isDirty != knownDirty else { return }
        knownDirty = isDirty
        updateChangeCount(isDirty ? .changeDone : .changeCleared)
    }

    private func forceKnownDirty(_ isDirty: Bool) {
        knownDirty = !isDirty
        setKnownDirty(isDirty)
    }

    private func configureWatcher() {
        watcher = nil
        guard let fileURL else { return }

        watcher = FileWatcher(url: fileURL) { [weak self] in
            DispatchQueue.main.async {
                self?.handleExternalChange()
            }
        }
        watcher?.start()
    }

    private func handleExternalChange() {
        guard Date() > suppressExternalChangesUntil else { return }

        if knownDirty {
            webController?.showExternalChangeConflict()
            configureWatcher()
        } else {
            reloadFromDisk(nil)
        }
    }
}
