import AppKit

final class DocumentWindowController: NSWindowController {
    let webController: DocumentWebViewController

    init(markdownDocument: MarkdownDocument) {
        webController = DocumentWebViewController(markdownDocument: markdownDocument)

        let window = NSWindow(contentViewController: webController)
        window.title = markdownDocument.fileURL?.lastPathComponent ?? "MarkUp"
        window.setContentSize(NSSize(width: 980, height: 760))
        window.minSize = NSSize(width: 720, height: 480)
        window.styleMask = [.titled, .closable, .miniaturizable, .resizable]
        window.titleVisibility = .hidden
        window.titlebarAppearsTransparent = true

        super.init(window: window)
        shouldCascadeWindows = true
    }

    required init?(coder: NSCoder) {
        nil
    }
}
