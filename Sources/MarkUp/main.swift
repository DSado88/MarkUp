import AppKit

let documentController = MarkUpDocumentController()
let appDelegate = AppDelegate(documentController: documentController)

let app = NSApplication.shared
app.setActivationPolicy(.regular)
app.delegate = appDelegate
app.run()
