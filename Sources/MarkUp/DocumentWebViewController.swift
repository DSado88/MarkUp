import AppKit
import WebKit

final class DocumentWebViewController: NSViewController, WKNavigationDelegate, WKScriptMessageHandler {
    private weak var markdownDocument: MarkdownDocument?
    private var webView: WKWebView!
    private var didLoadWebApp = false

    init(markdownDocument: MarkdownDocument) {
        self.markdownDocument = markdownDocument
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        nil
    }

    override func loadView() {
        let configuration = WKWebViewConfiguration()
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = false
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.userContentController.add(WeakScriptMessageDelegate(self), name: "markUp")

        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.allowsBackForwardNavigationGestures = false
        view = webView
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        loadWebApp()
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        didLoadWebApp = true
        if let payload = markdownDocument?.payload() {
            loadDocument(payload)
        }
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard
            let body = message.body as? [String: Any],
            let type = body["type"] as? String
        else {
            return
        }

        switch type {
        case "ready":
            if let payload = markdownDocument?.payload() {
                loadDocument(payload)
            }
        case "textChanged":
            if let text = body["text"] as? String {
                markdownDocument?.updateTextFromWeb(text)
            }
        case "save":
            markdownDocument?.save(nil)
        case "reload":
            markdownDocument?.reloadFromDisk(nil)
        case "reveal":
            markdownDocument?.revealInFinder(nil)
        case "copyPath":
            markdownDocument?.copyPathToPasteboard()
        case "openExternal":
            if let rawURL = body["url"] as? String {
                openExternalURL(rawURL)
            }
        default:
            break
        }
    }

    func loadDocument(_ payload: DocumentPayload) {
        guard didLoadWebApp else { return }
        sendToWeb(type: "loadDocument", payload: payload)
    }

    func markSaved(text: String) {
        sendToWeb(type: "saved", payload: ["text": text])
    }

    func showExternalChangeConflict() {
        sendToWeb(type: "externalChange", payload: [:] as [String: String])
    }

    private func loadWebApp() {
        guard let indexURL = webAppIndexURL() else {
            let html = "<html><body><h1>MarkUp web app not found</h1><p>Run scripts/build_app.sh first.</p></body></html>"
            webView.loadHTMLString(html, baseURL: nil)
            return
        }

        webView.loadFileURL(indexURL, allowingReadAccessTo: indexURL.deletingLastPathComponent())
    }

    private func webAppIndexURL() -> URL? {
        if let resourceURL = Bundle.main.resourceURL {
            let bundled = resourceURL.appendingPathComponent("Web/index.html")
            if FileManager.default.fileExists(atPath: bundled.path) {
                return bundled
            }
        }

        if let override = ProcessInfo.processInfo.environment["MARKUP_WEB_ROOT"] {
            let index = URL(fileURLWithPath: override).appendingPathComponent("index.html")
            if FileManager.default.fileExists(atPath: index.path) {
                return index
            }
        }

        return nil
    }

    private func sendToWeb<T: Encodable>(type: String, payload: T) {
        do {
            let envelope = NativeEnvelope(type: type, payload: payload)
            let data = try JSONEncoder().encode(envelope)
            guard let json = String(data: data, encoding: .utf8) else { return }
            webView.evaluateJavaScript("window.markUpNativeReceive(\(json));")
        } catch {
            NSLog("Failed to encode message for web view: \(error)")
        }
    }

    private func openExternalURL(_ rawURL: String) {
        guard let url = URL(string: rawURL), let scheme = url.scheme?.lowercased() else {
            return
        }

        switch scheme {
        case "http", "https", "mailto":
            NSWorkspace.shared.open(url)
        case "file":
            if markdownDocument?.allowsLocalLinkedFile(url) == true {
                NSWorkspace.shared.open(url)
            }
        default:
            return
        }
    }
}

private struct NativeEnvelope<T: Encodable>: Encodable {
    let type: String
    let payload: T
}

private final class WeakScriptMessageDelegate: NSObject, WKScriptMessageHandler {
    weak var delegate: WKScriptMessageHandler?

    init(_ delegate: WKScriptMessageHandler) {
        self.delegate = delegate
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        delegate?.userContentController(userContentController, didReceive: message)
    }
}
