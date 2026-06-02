import Foundation

struct DocumentPayload: Encodable {
    let fileName: String
    let path: String
    let baseURL: String
    let text: String
    let dirty: Bool
}
