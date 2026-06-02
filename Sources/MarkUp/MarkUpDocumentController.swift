import AppKit

final class MarkUpDocumentController: NSDocumentController {
    override var defaultType: String? {
        "net.daringfireball.markdown"
    }

    override func documentClass(forType typeName: String) -> AnyClass? {
        MarkdownDocument.self
    }
}
